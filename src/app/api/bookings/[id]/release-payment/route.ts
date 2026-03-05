import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

// POST /api/bookings/[id]/release-payment - Release escrow payment to studio owner
// SECURITY: Studio owner can NO LONGER release their own payment.
// Payment can only be released by:
// 1. The artist (booker) approving the payment after session
// 2. Auto-release after 24-hour grace period with no dispute
// 3. Platform admin (for dispute resolution)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req) => {
    const user = req.user!;

    try {
      const { id } = params;
      const body = await req.json().catch(() => ({}));
      const { autoRelease } = body; // Flag for system auto-release

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

      // SECURITY: Determine who is requesting payment release
      const isBooker = booking.userId === user.id;
      const isStudioOwner = booking.studio.owner.userId === user.id;

      // SECURITY: Studio owner CANNOT release their own payment (conflict of interest)
      if (isStudioOwner && !isBooker) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Studio owners cannot release their own payment. The booking artist must approve payment release, or it will auto-release after the 24-hour review period.", code: "FORBIDDEN" } },
          { status: 403 }
        );
      }

      // Only the booker can manually release payment
      if (!isBooker) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Only the booking artist can approve payment release", code: "FORBIDDEN" } },
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

      // SECURITY: Check for active disputes - cannot release payment during dispute
      if (booking.disputeStatus === "OPEN" || booking.disputeStatus === "UNDER_REVIEW") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Cannot release payment while a dispute is active. Please wait for dispute resolution.", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      // Calculate final amounts
      const totalAmount = parseFloat(booking.totalAmount.toString());
      const overtimeAmount = parseFloat(booking.overtimeAmount.toString());
      const platformFee = parseFloat(booking.platformFee.toString());

      // SECURITY: Use pro-rata amount if session ended early
      const proRataAmount = booking.proRataAmount ? parseFloat(booking.proRataAmount.toString()) : null;
      const baseAmount = proRataAmount !== null ? proRataAmount : totalAmount;
      const finalAmount = baseAmount + overtimeAmount;

      // Recalculate platform fee on actual amount if pro-rata
      const actualPlatformFee = proRataAmount !== null
        ? Math.round(finalAmount * 0.10 * 100) / 100
        : platformFee;

      const studioOwnerPayout = finalAmount - actualPlatformFee;

      // In production: Capture the PaymentIntent via Stripe with adjusted amount
      // if (booking.paymentIntentId) {
      //   await stripe.paymentIntents.capture(booking.paymentIntentId, {
      //     amount_to_capture: Math.round(finalAmount * 100),
      //   });
      //   await stripe.transfers.create({
      //     amount: Math.round(studioOwnerPayout * 100),
      //     currency: 'usd',
      //     destination: studioOwner.stripeConnectId,
      //     metadata: { bookingId: booking.id },
      //   });
      //   // If pro-rata, refund the difference to the customer
      //   if (proRataAmount !== null) {
      //     const refundAmount = totalAmount - proRataAmount;
      //     await stripe.refunds.create({
      //       payment_intent: booking.paymentIntentId,
      //       amount: Math.round(refundAmount * 100),
      //     });
      //   }
      // }

      // Update booking payment status
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          paymentStatus: "PAYMENT_RELEASED",
          bookerApprovedPayment: true,
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

      // Update the transaction to COMPLETED with actual amount
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
          message: `$${studioOwnerPayout.toFixed(2)} has been released to your account for ${booking.user.fullName || booking.user.username}'s session at ${booking.studio.name}.${proRataAmount !== null ? ` (Pro-rata adjusted from $${totalAmount.toFixed(2)} to $${proRataAmount.toFixed(2)} due to early session end)` : ""}`,
          referenceId: booking.id,
          referenceType: "BOOKING",
        },
      });

      // Notify customer about payment completion
      const refundInfo = proRataAmount !== null
        ? ` You were only charged $${finalAmount.toFixed(2)} (pro-rata) instead of the full $${totalAmount.toFixed(2)}. The difference will be refunded.`
        : "";

      await prisma.notification.create({
        data: {
          userId: booking.userId,
          type: "PAYMENT_RELEASED",
          title: "Payment Approved & Completed",
          message: `Your payment of $${finalAmount.toFixed(2)} for ${booking.studio.name} has been completed.${overtimeAmount > 0 ? ` Includes $${overtimeAmount.toFixed(2)} overtime.` : ""}${refundInfo}`,
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
          description: `$${studioOwnerPayout.toFixed(2)} released after session with ${booking.user.fullName || booking.user.username}. Approved by artist.`,
          referenceId: booking.id,
          referenceType: "booking",
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          booking: updatedBooking,
          payment: {
            originalAmount: totalAmount,
            proRataAmount,
            overtimeAmount,
            finalAmount,
            platformFee: actualPlatformFee,
            studioOwnerPayout,
            refundAmount: proRataAmount !== null ? totalAmount - proRataAmount : 0,
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