import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import type { ApiResponse } from "@/types";

// POST /api/bookings/[id]/pay - Hold payment in escrow for a booking
// In production, this would create a Stripe PaymentIntent with capture_method: manual
// For now, simulates the escrow hold and generates a QR code for check-in
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req) => {
    const user = req.user!;

    try {
      const { id } = params;
      const body = await req.json().catch(() => ({}));
      const { paymentMethod } = body;

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

      // Only the booking customer can pay
      if (booking.userId !== user.id) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Only the booking customer can make a payment", code: "FORBIDDEN" } },
          { status: 403 }
        );
      }

      // Must be PENDING to pay (owner confirms after payment hold)
      if (booking.status !== "PENDING") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: `Cannot pay for a booking with status: ${booking.status}`, code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      if (booking.paymentStatus !== "UNPAID") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Payment has already been processed for this booking", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      // Generate a unique QR code for check-in
      const qrCode = `BEEPS-${booking.id.slice(0, 8)}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

      // Calculate platform fee (e.g., 10%)
      const totalAmount = parseFloat(booking.totalAmount.toString());
      const platformFeeRate = 0.10;
      const platformFee = Math.round(totalAmount * platformFeeRate * 100) / 100;

      // In production: Create Stripe PaymentIntent with capture_method: "manual"
      // const paymentIntent = await stripe.paymentIntents.create({
      //   amount: Math.round(totalAmount * 100), // cents
      //   currency: 'usd',
      //   capture_method: 'manual', // Don't capture yet - hold in escrow
      //   transfer_data: { destination: studioOwner.stripeConnectId },
      //   application_fee_amount: Math.round(platformFee * 100),
      //   metadata: { bookingId: booking.id },
      // });

      // Simulate a payment intent ID
      const simulatedPaymentIntentId = `pi_simulated_${crypto.randomBytes(12).toString("hex")}`;

      // Update booking with payment hold and QR code
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          status: "CONFIRMED",
          paymentStatus: "PAYMENT_HELD",
          paymentIntentId: simulatedPaymentIntentId,
          platformFee,
          qrCode,
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

      // Create transaction record
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "STUDIO_BOOKING",
          status: "PENDING", // Pending until session completes and payment is captured
          amount: totalAmount,
          referenceId: booking.id,
          referenceType: "booking",
          paymentMethod: paymentMethod || "card",
        },
      });

      // Notify studio owner about the confirmed booking + payment
      await prisma.notification.create({
        data: {
          userId: booking.studio.owner.userId,
          type: "PAYMENT_HELD",
          title: "Booking Paid & Confirmed",
          message: `${user.fullName || user.username} has paid $${totalAmount.toFixed(2)} for their session at ${booking.studio.name}. Payment is held in escrow until the session completes.`,
          referenceId: booking.id,
          referenceType: "BOOKING",
        },
      });

      // Notify customer about successful payment hold
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "PAYMENT_HELD",
          title: "Payment Held Successfully",
          message: `Your payment of $${totalAmount.toFixed(2)} for ${booking.studio.name} is held securely. It will be released to the studio after your session completes.`,
          referenceId: booking.id,
          referenceType: "BOOKING",
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          booking: updatedBooking,
          qrCode,
          paymentIntentId: simulatedPaymentIntentId,
          escrow: {
            totalAmount,
            platformFee,
            studioOwnerPayout: totalAmount - platformFee,
          },
          message: "Payment held in escrow. Show your QR code at the studio to check in.",
        },
      }, { status: 201 });
    } catch (error: any) {
      console.error("Error processing payment:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: "Failed to process payment", code: "SERVER_ERROR", details: process.env.NODE_ENV === "development" ? error.message : undefined } },
        { status: 500 }
      );
    }
  });
}