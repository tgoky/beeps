import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

// POST /api/bookings/[id]/release-payment - Release escrow payment to studio owner
// Called automatically after session checkout, or manually by platform admin
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

      // Only studio owner can release payment (or the system after checkout)
      const isStudioOwner = booking.studio.owner.userId === user.id;
      if (!isStudioOwner) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Only the studio owner can release payment", code: "FORBIDDEN" } },
          { status: 403 }
        );
      }

      // Session must be COMPLETED to release payment
      if (booking.status !== "COMPLETED") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Session must be completed before payment can be released", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      // Payment must be in HELD or CAPTURED state
      if (booking.paymentStatus !== "PAYMENT_HELD" && booking.paymentStatus !== "PAYMENT_CAPTURED") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: `Cannot release payment with status: ${booking.paymentStatus}`, code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      const totalAmount = parseFloat(booking.totalAmount.toString());
      const overtimeAmount = parseFloat(booking.overtimeAmount.toString());
      const platformFee = parseFloat(booking.platformFee.toString());
      const finalAmount = totalAmount + overtimeAmount;
      const studioOwnerPayout = finalAmount - platformFee;

      // In production: Capture the PaymentIntent via Stripe
      // if (booking.paymentIntentId) {
      //   await stripe.paymentIntents.capture(booking.paymentIntentId, {
      //     amount_to_capture: Math.round(finalAmount * 100),
      //   });
      //   // Transfer to studio owner's connected account
      //   await stripe.transfers.create({
      //     amount: Math.round(studioOwnerPayout * 100),
      //     currency: 'usd',
      //     destination: studioOwner.stripeConnectId,
      //     metadata: { bookingId: booking.id },
      //   });
      // }

      // Update booking payment status
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          paymentStatus: "PAYMENT_RELEASED",
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

      // Update the transaction to COMPLETED
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

      // Notify studio owner about payment release
      await prisma.notification.create({
        data: {
          userId: booking.studio.owner.userId,
          type: "PAYMENT_RELEASED",
          title: "Payment Released!",
          message: `$${studioOwnerPayout.toFixed(2)} has been released to your account for ${booking.user.fullName || booking.user.username}'s session at ${booking.studio.name}.`,
          referenceId: booking.id,
          referenceType: "BOOKING",
        },
      });

      // Notify customer about payment completion
      await prisma.notification.create({
        data: {
          userId: booking.userId,
          type: "PAYMENT_RELEASED",
          title: "Payment Completed",
          message: `Your payment of $${finalAmount.toFixed(2)} for ${booking.studio.name} has been completed.${overtimeAmount > 0 ? ` Includes $${overtimeAmount.toFixed(2)} overtime.` : ""}`,
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
          description: `$${studioOwnerPayout.toFixed(2)} released after session with ${booking.user.fullName || booking.user.username}`,
          referenceId: booking.id,
          referenceType: "booking",
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          booking: updatedBooking,
          payment: {
            totalAmount: finalAmount,
            overtimeAmount,
            platformFee,
            studioOwnerPayout,
          },
          message: `Payment of $${studioOwnerPayout.toFixed(2)} released to studio owner`,
        },
      });
    } catch (error: any) {
      console.error("Error releasing payment:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: "Failed to release payment", code: "SERVER_ERROR", details: process.env.NODE_ENV === "development" ? error.message : undefined } },
        { status: 500 }
      );
    }
  });
}
