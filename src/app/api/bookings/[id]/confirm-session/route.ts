import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

// POST /api/bookings/[id]/confirm-session - Artist confirms session was satisfactory and approves payment
// SECURITY: This is the artist's way to approve payment release after a session completes.
// Acts as a shortcut that both confirms checkout AND releases payment in one step.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req) => {
    const user = req.user!;

    try {
      const { id } = params;
      const body = await req.json().catch(() => ({}));
      const { rating, feedback } = body; // Optional session rating

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

      // Only the booking artist can confirm the session
      if (booking.userId !== user.id) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Only the booking artist can confirm a session", code: "FORBIDDEN" } },
          { status: 403 }
        );
      }

      // Session must be COMPLETED
      if (booking.status !== "COMPLETED") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Session must be completed before it can be confirmed", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      // Check for active disputes
      if (booking.disputeStatus === "OPEN" || booking.disputeStatus === "UNDER_REVIEW") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Cannot confirm session while a dispute is active", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      // Check if payment is already released
      if (booking.paymentStatus === "PAYMENT_RELEASED") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Payment has already been released for this session", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      // Payment must be in HELD or CAPTURED state
      if (booking.paymentStatus !== "PAYMENT_HELD" && booking.paymentStatus !== "PAYMENT_CAPTURED") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: `Cannot confirm session with payment status: ${booking.paymentStatus}`, code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      // Calculate final amounts (same as release-payment)
      const totalAmount = parseFloat(booking.totalAmount.toString());
      const overtimeAmount = parseFloat(booking.overtimeAmount.toString());
      const platformFee = parseFloat(booking.platformFee.toString());
      const proRataAmount = booking.proRataAmount ? parseFloat(booking.proRataAmount.toString()) : null;
      const baseAmount = proRataAmount !== null ? proRataAmount : totalAmount;
      const finalAmount = baseAmount + overtimeAmount;
      const actualPlatformFee = proRataAmount !== null
        ? Math.round(finalAmount * 0.10 * 100) / 100
        : platformFee;
      const studioOwnerPayout = finalAmount - actualPlatformFee;

      // Update booking: confirm checkout and release payment
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          bookerConfirmedCheckOut: true,
          bookerApprovedPayment: true,
          paymentStatus: "PAYMENT_RELEASED",
          platformFee: actualPlatformFee,
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

      // Update transaction
      await prisma.transaction.updateMany({
        where: {
          referenceId: booking.id,
          referenceType: "booking",
          userId: booking.userId,
        },
        data: {
          status: "COMPLETED",
          amount: finalAmount,
        },
      });

      // Notify studio owner
      await prisma.notification.create({
        data: {
          userId: booking.studio.owner.userId,
          type: "PAYMENT_RELEASED",
          title: "Session Confirmed & Payment Released!",
          message: `${user.fullName || user.username} confirmed their session and approved payment. $${studioOwnerPayout.toFixed(2)} has been released to your account.`,
          referenceId: booking.id,
          referenceType: "BOOKING",
        },
      });

      // Notify artist about confirmation
      await prisma.notification.create({
        data: {
          userId: booking.userId,
          type: "PAYMENT_RELEASED",
          title: "Session Confirmed",
          message: `You confirmed your session at ${booking.studio.name}. Payment of $${finalAmount.toFixed(2)} has been released.`,
          referenceId: booking.id,
          referenceType: "BOOKING",
        },
      });

      // Activity log
      await prisma.activity.create({
        data: {
          userId: booking.studio.owner.userId,
          type: "PAYMENT_RECEIVED",
          title: `Payment received for ${booking.studio.name}`,
          description: `$${studioOwnerPayout.toFixed(2)} released. Session confirmed by ${user.fullName || user.username}.`,
          referenceId: booking.id,
          referenceType: "booking",
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          booking: updatedBooking,
          payment: {
            finalAmount,
            studioOwnerPayout,
            platformFee: actualPlatformFee,
          },
          message: "Session confirmed and payment released. Thank you!",
        },
      });
    } catch (error: any) {
      console.error("Error confirming session:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: "Failed to confirm session", code: "SERVER_ERROR", details: process.env.NODE_ENV === "development" ? error.message : undefined } },
        { status: 500 }
      );
    }
  });
}
