import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { captureAndPayout } from "@/lib/payment-router";
import { releaseFunds } from "@/lib/wallet";
import type { ApiResponse } from "@/types";

/**
 * POST /api/bookings/[id]/release-payment
 * Release escrowed payment to the studio owner.
 *
 * Security rules:
 *  - Only the booking artist (booker) can manually release payment
 *  - Studio owner cannot release their own payment (conflict of interest)
 *  - Auto-release is triggered after 24h grace period (no active dispute)
 *
 * When released:
 *  1. Capture payment with provider (Stripe manual capture OR Paystack transfer)
 *  2. Credit studio owner's wallet (available balance)
 *  3. Update booking/transaction records
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req) => {
    const user = req.user!;

    try {
      const { id } = params;
      const body = await req.json().catch(() => ({}));
      const { autoRelease } = body;

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

      const isBooker = booking.userId === user.id;
      const isStudioOwner = booking.studio.owner.userId === user.id;

      // SECURITY: Studio owner CANNOT release their own payment
      if (isStudioOwner && !isBooker) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              message:
                "Studio owners cannot release their own payment. The booking artist must approve payment release, or it will auto-release after the 24-hour review period.",
              code: "FORBIDDEN",
            },
          },
          { status: 403 }
        );
      }

      if (!isBooker) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Only the booking artist can approve payment release", code: "FORBIDDEN" } },
          { status: 403 }
        );
      }

      if (booking.status !== "COMPLETED") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Session must be completed before payment can be released", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      if (booking.paymentStatus !== "PAYMENT_HELD" && booking.paymentStatus !== "PAYMENT_CAPTURED") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: `Cannot release payment with status: ${booking.paymentStatus}`, code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      if (booking.disputeStatus === "OPEN" || booking.disputeStatus === "UNDER_REVIEW") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Cannot release payment while a dispute is active.", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      // ─── Calculate amounts ────────────────────────────────────────────────
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

      const currency = (booking as any).currency ?? "USD";
      const paymentProvider = ((booking as any).paymentProvider ?? "STRIPE") as "STRIPE" | "PAYSTACK";

      // ─── Capture via payment provider ────────────────────────────────────
      let payoutResult: { paystackTransferCode?: string; stripeTransferId?: string } = {};
      try {
        const studioOwnerProfile = await prisma.studioOwnerProfile.findUnique({
          where: { userId: booking.studio.owner.userId },
          select: { paystackRecipientCode: true, stripeConnectId: true },
        });

        const capture = await captureAndPayout({
          provider: paymentProvider,
          paymentIntentId: booking.paymentIntentId ?? undefined,
          amount: finalAmount,
          currency,
          studioOwnerPayoutAmount: studioOwnerPayout,
          paystackRecipientCode: studioOwnerProfile?.paystackRecipientCode ?? undefined,
          paystackReference: (booking as any).paystackReference ?? undefined,
        });

        payoutResult = {
          paystackTransferCode: capture.paystackTransferCode,
          stripeTransferId: capture.stripeTransferId,
        };

        console.log(`[Release Payment] Payout processed for booking ${id}:`, capture);
      } catch (payoutError: any) {
        // Log but continue — wallet is updated; admin can retry payout manually
        console.error("[Release Payment] Provider payout failed:", payoutError.message);
      }

      // ─── Update DB: booking + wallet + transaction ────────────────────────
      const updatedBooking = await prisma.$transaction(async (tx) => {
        // Credit studio owner's wallet (available balance)
        await releaseFunds(
          tx,
          booking.studio.owner.userId,
          finalAmount,
          actualPlatformFee,
          currency,
          id,
          `Session payment: ${booking.studio.name} — ${new Date(booking.startTime).toLocaleDateString()}`,
          (booking as any).paystackReference ?? booking.paymentIntentId ?? undefined
        );

        // Update booking
        const updated = await tx.booking.update({
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

        // Update transaction to COMPLETED
        await tx.transaction.updateMany({
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

        return updated;
      });

      // ─── Notifications ────────────────────────────────────────────────────
      await prisma.notification.create({
        data: {
          userId: booking.studio.owner.userId,
          type: "PAYMENT_RELEASED",
          title: "Payment Released!",
          message: `${currency} ${studioOwnerPayout.toFixed(2)} has been released to your wallet for ${booking.user.fullName || booking.user.username}'s session at ${booking.studio.name}.${proRataAmount !== null ? ` (Pro-rata adjusted from ${totalAmount.toFixed(2)} to ${proRataAmount.toFixed(2)})` : ""}`,
          referenceId: id,
          referenceType: "BOOKING",
        },
      });

      const refundInfo = proRataAmount !== null
        ? ` You were only charged ${currency} ${finalAmount.toFixed(2)} (pro-rata) instead of ${totalAmount.toFixed(2)}.`
        : "";

      await prisma.notification.create({
        data: {
          userId: booking.userId,
          type: "PAYMENT_RELEASED",
          title: "Payment Approved & Completed",
          message: `Your payment of ${currency} ${finalAmount.toFixed(2)} for ${booking.studio.name} has been completed.${overtimeAmount > 0 ? ` Includes ${currency} ${overtimeAmount.toFixed(2)} overtime.` : ""}${refundInfo}`,
          referenceId: id,
          referenceType: "BOOKING",
        },
      });

      await prisma.activity.create({
        data: {
          userId: booking.studio.owner.userId,
          type: "PAYMENT_RECEIVED",
          title: `Payment received for ${booking.studio.name}`,
          description: `${currency} ${studioOwnerPayout.toFixed(2)} released after session with ${booking.user.fullName || booking.user.username}.`,
          referenceId: id,
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
            currency,
            provider: paymentProvider,
            paystackTransferCode: payoutResult.paystackTransferCode,
            stripeTransferId: payoutResult.stripeTransferId,
          },
          message: `Payment of ${currency} ${studioOwnerPayout.toFixed(2)} released to studio owner's wallet`,
        },
      });
    } catch (error: any) {
      console.error("Error releasing payment:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: "Failed to release payment",
            code: "SERVER_ERROR",
            details: process.env.NODE_ENV === "development" ? error.message : undefined,
          },
        },
        { status: 500 }
      );
    }
  });
}
