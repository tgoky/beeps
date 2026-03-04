import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

// POST /api/bookings/[id]/check-out - End a session (studio owner or artist)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req) => {
    const user = req.user!;

    try {
      const { id } = params;

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

      // Only studio owner can check out
      const isStudioOwner = booking.studio.owner.userId === user.id;
      if (!isStudioOwner) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Only the studio owner can end a session", code: "FORBIDDEN" } },
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

      // Calculate overtime if session ran past scheduled end
      let overtimeMinutes = 0;
      let overtimeAmount = 0;

      if (now > scheduledEnd) {
        overtimeMinutes = Math.ceil((now.getTime() - scheduledEnd.getTime()) / (1000 * 60));
        const hourlyRate = parseFloat(booking.studio.hourlyRate.toString());
        overtimeAmount = (overtimeMinutes / 60) * hourlyRate;
      }

      const totalWithOvertime = parseFloat(booking.totalAmount.toString()) + overtimeAmount;

      // Update booking to COMPLETED with check-out time and overtime
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          status: "COMPLETED",
          checkedOutAt: now,
          overtimeMinutes,
          overtimeAmount,
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

      // Notify the artist that their session has ended
      const overtimeMsg = overtimeMinutes > 0
        ? ` You went ${overtimeMinutes} minutes overtime ($${overtimeAmount.toFixed(2)} additional).`
        : "";

      await prisma.notification.create({
        data: {
          userId: booking.userId,
          type: "SESSION_CHECKED_OUT",
          title: "Session Ended",
          message: `Your session at ${booking.studio.name} has ended.${overtimeMsg} Total: $${totalWithOvertime.toFixed(2)}`,
          referenceId: booking.id,
          referenceType: "BOOKING",
        },
      });

      // If overtime, also notify studio owner about the extra charges
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
          description: overtimeMinutes > 0
            ? `Session completed with ${overtimeMinutes} min overtime. Total: $${totalWithOvertime.toFixed(2)}`
            : `Session completed on time. Total: $${parseFloat(booking.totalAmount.toString()).toFixed(2)}`,
          referenceId: booking.id,
          referenceType: "booking",
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          booking: updatedBooking,
          overtime: {
            minutes: overtimeMinutes,
            amount: overtimeAmount,
          },
          totalAmount: totalWithOvertime,
          message: overtimeMinutes > 0
            ? `Session ended with ${overtimeMinutes} minutes overtime`
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