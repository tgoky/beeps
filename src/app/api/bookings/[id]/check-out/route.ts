import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

// POST /api/bookings/[id]/check-out - End a session (studio owner OR artist)
// SECURITY: Both parties can end session. Early end = pro-rata payment. Reason required for early end.
// Payment is NOT released immediately - enters 24h grace period for disputes.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req) => {
    const user = req.user!;

    try {
      const { id } = params;
      const body = await req.json().catch(() => ({}));
      const { reason } = body; // Required for early end

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          studio: {
            include: {
              owner: {
                include: {
                  user: {
                    select: { id: true, username: true, fullName: true },
                  },
                },
              },
            },
          },
          user: {
            select: { id: true, username: true, fullName: true },
          },
        },
      });

      if (!booking) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Booking not found", code: "NOT_FOUND" } },
          { status: 404 }
        );
      }

      // SECURITY: Both studio owner AND artist can end the session
      const isStudioOwner = booking.studio.owner.userId === user.id;
      const isBooker = booking.userId === user.id;

      if (!isStudioOwner && !isBooker) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Only the studio owner or the booking artist can end a session", code: "FORBIDDEN" } },
          { status: 403 }
        );
      }

      // Booking must be ACTIVE to check out
      if (booking.status !== "ACTIVE") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: `Cannot check out a booking with status: ${booking.status}. Session must be ACTIVE.`, code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      const now = new Date();
      const scheduledEnd = new Date(booking.endTime);
      const scheduledStart = new Date(booking.startTime);
      const checkedInAt = booking.checkedInAt ? new Date(booking.checkedInAt) : scheduledStart;

      // Calculate total scheduled minutes and actual session minutes
      const totalScheduledMinutes = Math.round((scheduledEnd.getTime() - scheduledStart.getTime()) / (1000 * 60));
      const actualSessionMinutes = Math.max(1, Math.round((now.getTime() - checkedInAt.getTime()) / (1000 * 60)));

      const isEarlyEnd = now < scheduledEnd;
      const endedBy = isStudioOwner ? "STUDIO_OWNER" : "BOOKER";

      // SECURITY: If ending early, require a reason
      if (isEarlyEnd && !reason) {
        const remainingMinutes = Math.ceil((scheduledEnd.getTime() - now.getTime()) / (1000 * 60));
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: `Session is ending ${remainingMinutes} minutes early. A reason is required for early session termination.`, code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      // Calculate overtime if session ran past scheduled end
      let overtimeMinutes = 0;
      let overtimeAmount = 0;

      if (now > scheduledEnd) {
        overtimeMinutes = Math.ceil((now.getTime() - scheduledEnd.getTime()) / (1000 * 60));
        const hourlyRate = parseFloat(booking.studio.hourlyRate.toString());
        overtimeAmount = (overtimeMinutes / 60) * hourlyRate;
      }

      // SECURITY: Pro-rata calculation for early session end
      // If studio owner ends early: artist only pays for actual time used
      // If artist ends early: artist pays for actual time (they chose to leave)
      const totalAmount = parseFloat(booking.totalAmount.toString());
      let proRataAmount: number | null = null;
      let finalPayableAmount = totalAmount;

      if (isEarlyEnd) {
        // Calculate pro-rata based on actual minutes used vs scheduled minutes
        const usageRatio = Math.min(actualSessionMinutes / totalScheduledMinutes, 1);
        proRataAmount = Math.round(totalAmount * usageRatio * 100) / 100;
        finalPayableAmount = proRataAmount;
      } else {
        finalPayableAmount = totalAmount + overtimeAmount;
      }

      // SECURITY: Set 24-hour grace period before payment can be released
      const paymentReleaseEligibleAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Update booking to COMPLETED with all security fields
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          status: "COMPLETED",
          checkedOutAt: now,
          overtimeMinutes,
          overtimeAmount,
          actualSessionMinutes,
          proRataAmount: isEarlyEnd ? proRataAmount : null,
          earlyEndReason: isEarlyEnd ? reason : null,
          endedBy,
          paymentReleaseEligibleAt,
          bookerConfirmedCheckOut: isBooker, // If booker ended it, they implicitly confirm
        },
        include: {
          studio: {
            include: {
              owner: {
                include: {
                  user: {
                    select: { id: true, username: true, fullName: true, avatar: true },
                  },
                },
              },
            },
          },
          user: {
            select: { id: true, username: true, fullName: true, avatar: true },
          },
        },
      });

      // Build notification messages
      const earlyEndInfo = isEarlyEnd
        ? ` Session ended ${Math.ceil((scheduledEnd.getTime() - now.getTime()) / (1000 * 60))} minutes early by ${endedBy === "STUDIO_OWNER" ? "studio owner" : "artist"}. Pro-rata amount: $${proRataAmount!.toFixed(2)}.`
        : "";
      const overtimeInfo = overtimeMinutes > 0
        ? ` Session went ${overtimeMinutes} minutes overtime ($${overtimeAmount.toFixed(2)} additional).`
        : "";

      // Notify the artist
      await prisma.notification.create({
        data: {
          userId: booking.userId,
          type: isEarlyEnd ? "SESSION_EARLY_END" : "SESSION_CHECKED_OUT",
          title: isEarlyEnd ? "Session Ended Early" : "Session Ended",
          message: `Your session at ${booking.studio.name} has ended.${earlyEndInfo}${overtimeInfo} Final amount: $${finalPayableAmount.toFixed(2)}. You have 24 hours to review and approve payment or raise a dispute.`,
          referenceId: booking.id,
          referenceType: "BOOKING",
        },
      });

      // Notify the studio owner
      await prisma.notification.create({
        data: {
          userId: booking.studio.owner.userId,
          type: isEarlyEnd ? "SESSION_EARLY_END" : "SESSION_CHECKED_OUT",
          title: isEarlyEnd ? "Session Ended Early" : "Session Completed",
          message: `${booking.user.fullName || booking.user.username}'s session at ${booking.studio.name} has ended.${earlyEndInfo}${overtimeInfo} Final amount: $${finalPayableAmount.toFixed(2)}. Payment will be released after the 24-hour review period.`,
          referenceId: booking.id,
          referenceType: "BOOKING",
        },
      });

      // Notify artist to approve payment release
      await prisma.notification.create({
        data: {
          userId: booking.userId,
          type: "PAYMENT_APPROVAL_REQUIRED",
          title: "Approve Payment Release",
          message: `Please review your session at ${booking.studio.name} and approve the payment of $${finalPayableAmount.toFixed(2)}. Payment will auto-release in 24 hours if no dispute is raised.`,
          referenceId: booking.id,
          referenceType: "BOOKING",
        },
      });

      // If overtime, extra notification to studio owner
      if (overtimeMinutes > 0) {
        await prisma.notification.create({
          data: {
            userId: booking.studio.owner.userId,
            type: "SESSION_OVERTIME",
            title: "Session Overtime Recorded",
            message: `${booking.user.fullName || booking.user.username}'s session went ${overtimeMinutes} minutes overtime. Additional charge: $${overtimeAmount.toFixed(2)}`,
            referenceId: booking.id,
            referenceType: "BOOKING",
          },
        });
      }

      // Create activity log
      await prisma.activity.create({
        data: {
          userId: user.id,
          type: "SESSION_ENDED",
          title: `Session ended at ${booking.studio.name}`,
          description: isEarlyEnd
            ? `Session ended early by ${endedBy === "STUDIO_OWNER" ? "studio owner" : "artist"}. Actual: ${actualSessionMinutes} min of ${totalScheduledMinutes} min. Pro-rata: $${proRataAmount!.toFixed(2)}`
            : overtimeMinutes > 0
              ? `Session completed with ${overtimeMinutes} min overtime. Total: $${finalPayableAmount.toFixed(2)}`
              : `Session completed on time. Total: $${totalAmount.toFixed(2)}`,
          referenceId: booking.id,
          referenceType: "booking",
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          booking: updatedBooking,
          sessionSummary: {
            scheduledMinutes: totalScheduledMinutes,
            actualMinutes: actualSessionMinutes,
            isEarlyEnd,
            endedBy,
            earlyEndReason: isEarlyEnd ? reason : null,
          },
          overtime: {
            minutes: overtimeMinutes,
            amount: overtimeAmount,
          },
          payment: {
            originalAmount: totalAmount,
            proRataAmount: isEarlyEnd ? proRataAmount : null,
            overtimeAmount,
            finalAmount: finalPayableAmount,
            paymentReleaseEligibleAt,
            note: "Payment enters 24-hour review period. Artist can approve immediately or raise a dispute.",
          },
          message: isEarlyEnd
            ? `Session ended early. Pro-rata amount: $${proRataAmount!.toFixed(2)} for ${actualSessionMinutes} minutes.`
            : overtimeMinutes > 0
              ? `Session ended with ${overtimeMinutes} minutes overtime. Total: $${finalPayableAmount.toFixed(2)}`
              : "Session ended successfully",
        },
      });
    } catch (error: any) {
      console.error("Error checking out booking:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: "Failed to check out", code: "SERVER_ERROR", details: process.env.NODE_ENV === "development" ? error.message : undefined } },
        { status: 500 }
      );
    }
  });
}