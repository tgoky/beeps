import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { initializePayment, getPaymentConfig } from "@/lib/payment-router";
import type { ApiResponse } from "@/types";

/**
 * POST /api/payments/initialize
 * Initialize a payment for a booking with the appropriate provider (Paystack or Stripe)
 * Body: { bookingId, callbackUrl? }
 */
export async function POST(req: NextRequest) {
  return withAuth(req, async (req) => {
    const user = req.user!;

    try {
      const body = await req.json();
      const { bookingId, callbackUrl } = body;

      if (!bookingId) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "bookingId is required", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          studio: {
            include: {
              owner: {
                select: {
                  id: true,
                  userId: true,
                  paystackSubaccountCode: true,
                  stripeConnectId: true,
                  user: { select: { id: true, email: true, currency: true, paymentProvider: true } },
                },
              },
            },
          },
          user: {
            select: { id: true, email: true, countryCode: true, currency: true, paymentProvider: true },
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
          { success: false, error: { message: "Only the booking customer can initiate payment", code: "FORBIDDEN" } },
          { status: 403 }
        );
      }

      if (booking.paymentStatus !== "UNPAID") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Payment has already been processed for this booking", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: `Cannot pay for a booking with status: ${booking.status}`, code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      // Determine payment config from user's country
      const paymentConfig = getPaymentConfig(booking.user.countryCode);
      const totalAmount = parseFloat(booking.totalAmount.toString());

      const result = await initializePayment({
        provider: paymentConfig.provider,
        amount: totalAmount,
        currency: paymentConfig.currency,
        email: user.email,
        bookingId,
        callbackUrl:
          callbackUrl ??
          `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${bookingId}/payment-callback`,
        metadata: {
          bookingId,
          userId: user.id,
          studioId: booking.studioId,
        },
        studioSubaccountCode: booking.studio.owner.paystackSubaccountCode ?? undefined,
        platformFeePercent: 10,
      });

      // Persist the payment references on the booking
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          currency: paymentConfig.currency,
          paymentProvider: paymentConfig.provider,
          ...(result.paystackReference && { paystackReference: result.paystackReference }),
          ...(result.paystackReference && { paystackAccessCode: result.accessCode }),
          ...(result.paymentIntentId && { paymentIntentId: result.paymentIntentId }),
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          provider: result.provider,
          currency: paymentConfig.currency,
          currencySymbol: paymentConfig.currencySymbol,
          amount: totalAmount,
          // Paystack
          authorizationUrl: result.authorizationUrl,
          accessCode: result.accessCode,
          paystackReference: result.paystackReference,
          // Stripe
          clientSecret: result.clientSecret,
          paymentIntentId: result.paymentIntentId,
          // Universal
          reference: result.reference,
        },
      });
    } catch (error: any) {
      console.error("Error initializing payment:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: "Failed to initialize payment",
            code: "SERVER_ERROR",
            details: process.env.NODE_ENV === "development" ? error.message : undefined,
          },
        },
        { status: 500 }
      );
    }
  });
}
