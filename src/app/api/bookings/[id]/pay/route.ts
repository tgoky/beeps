import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { initializePayment, getPaymentConfig } from "@/lib/payment-router";
import { holdFunds, getOrCreateWallet } from "@/lib/wallet";
import crypto from "crypto";
import type { ApiResponse } from "@/types";

/**
 * POST /api/bookings/[id]/pay
 * Initiate payment for a booking using Paystack (NGN/GHS) or Stripe (international).
 *
 * Flow:
 *   1. Resolve payment provider from user's country
 *   2. Initialize payment with provider → get redirect URL or client_secret
 *   3. Store payment intent/reference on booking
 *   4. Record escrow hold in wallet
 *
 * The booking status transitions to CONFIRMED only after:
 *   - Paystack: webhook charge.success OR /api/payments/verify confirmation
 *   - Stripe:   webhook payment_intent.amount_capturable_updated
 *
 * For Paystack: return { authorizationUrl, accessCode } → frontend redirects/pops up
 * For Stripe:   return { clientSecret } → frontend uses Stripe.js to complete payment
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
      const { callbackUrl } = body;

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          studio: {
            include: {
              owner: {
                include: {
                  user: { select: { id: true, username: true, fullName: true } },
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              fullName: true,
              countryCode: true,
              currency: true,
              paymentProvider: true,
            },
          },
        },
      });

      if (!booking) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Booking not found", code: "NOT_FOUND" } },
          { status: 404 }
        );
      }

      if (booking.userId !== user.id) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Only the booking customer can make a payment", code: "FORBIDDEN" } },
          { status: 403 }
        );
      }

      if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              message: `Cannot pay for a booking with status: ${booking.status}. Booking must be PENDING or CONFIRMED.`,
              code: "VALIDATION_ERROR",
            },
          },
          { status: 400 }
        );
      }

      if (booking.paymentStatus !== "UNPAID") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Payment has already been processed for this booking", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      // Determine payment config based on user's country
      const paymentConfig = getPaymentConfig(booking.user.countryCode);
      const totalAmount = parseFloat(booking.totalAmount.toString());
      const platformFeeRate = 0.10;
      const platformFee = Math.round(totalAmount * platformFeeRate * 100) / 100;

      // Initialize payment with provider
      const paymentResult = await initializePayment({
        provider: paymentConfig.provider,
        amount: totalAmount,
        currency: paymentConfig.currency,
        email: user.email,
        bookingId: id,
        callbackUrl:
          callbackUrl ??
          `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/bookings/${id}/payment-callback`,
        metadata: {
          bookingId: id,
          userId: user.id,
          studioId: booking.studioId,
        },
        studioSubaccountCode:
          booking.studio.owner.paystackSubaccountCode ?? undefined,
        platformFeePercent: 10,
      });

      // For Paystack: booking is updated when payment is confirmed via webhook/verify
      // For Stripe with manual capture: booking is updated when PaymentIntent is authorized
      // We persist the references now so we can verify later
      await prisma.booking.update({
        where: { id },
        data: {
          currency: paymentConfig.currency,
          paymentProvider: paymentConfig.provider,
          platformFee,
          ...(paymentResult.paystackReference && {
            paystackReference: paymentResult.paystackReference,
            paystackAccessCode: paymentResult.accessCode,
          }),
          ...(paymentResult.paymentIntentId && {
            paymentIntentId: paymentResult.paymentIntentId,
          }),
        },
      });

      // For Stripe with manual capture, we generate the QR code now
      // (the booking will be confirmed after the PaymentIntent is authorized)
      // For Paystack, QR code is generated in the verify/webhook handler
      let qrCode: string | undefined;
      if (paymentConfig.provider === "STRIPE") {
        qrCode = `BEEPS-${id.slice(0, 8)}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
        await prisma.booking.update({
          where: { id },
          data: { qrCode },
        });
      }

      const sessionDate = booking.startTime.toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric",
      });
      const sessionTime = booking.startTime.toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit", hour12: true,
      });

      // Notify studio owner payment is in progress
      await prisma.notification.create({
        data: {
          userId: booking.studio.owner.userId,
          type: "PAYMENT_HELD",
          title: "Payment In Progress",
          message: `${user.fullName || user.username} is paying for their session at ${booking.studio.name} on ${sessionDate} at ${sessionTime}.`,
          referenceId: id,
          referenceType: "BOOKING",
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          provider: paymentConfig.provider,
          currency: paymentConfig.currency,
          currencySymbol: paymentConfig.currencySymbol,
          amount: totalAmount,
          platformFee,
          studioOwnerPayout: totalAmount - platformFee,

          // Paystack fields (redirect or inline popup)
          authorizationUrl: paymentResult.authorizationUrl,
          accessCode: paymentResult.accessCode,
          paystackReference: paymentResult.paystackReference,

          // Stripe fields (complete with Stripe.js on frontend)
          clientSecret: paymentResult.clientSecret,
          paymentIntentId: paymentResult.paymentIntentId,

          // QR code (Stripe only — already set; Paystack set after webhook)
          qrCode,

          message:
            paymentConfig.provider === "PAYSTACK"
              ? "Redirect to Paystack to complete payment. After payment, your session will be confirmed automatically."
              : "Use the clientSecret to complete payment with Stripe.js. Your session will be confirmed once payment is authorized.",
        },
      });
    } catch (error: any) {
      console.error("Error initiating payment:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: "Failed to initiate payment",
            code: "SERVER_ERROR",
            details: process.env.NODE_ENV === "development" ? error.message : undefined,
          },
        },
        { status: 500 }
      );
    }
  });
}