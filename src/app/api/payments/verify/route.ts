import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { verifyTransaction } from "@/lib/paystack";
import crypto from "crypto";
import type { ApiResponse } from "@/types";

/**
 * POST /api/payments/verify
 * Verify a Paystack payment after redirect/callback
 * Body: { reference, bookingId }
 *
 * Stripe payments are verified via webhook (see webhook/stripe/route.ts)
 */
export async function POST(req: NextRequest) {
  return withAuth(req, async (req) => {
    const user = req.user!;

    try {
      const body = await req.json();
      const { reference, bookingId } = body;

      if (!reference || !bookingId) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "reference and bookingId are required", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          studio: {
            include: {
              owner: {
                select: { userId: true, user: { select: { id: true, fullName: true, username: true } } },
              },
            },
          },
          user: { select: { id: true, email: true, username: true, fullName: true } },
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
          { success: false, error: { message: "Unauthorized", code: "FORBIDDEN" } },
          { status: 403 }
        );
      }

      // Already paid — idempotent
      if (booking.paymentStatus === "PAYMENT_HELD") {
        return NextResponse.json<ApiResponse>({
          success: true,
          data: { alreadyVerified: true, booking },
        });
      }

      if (booking.paymentProvider !== "PAYSTACK") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "This endpoint is for Paystack payments only", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      // Verify with Paystack API
      const verification = await verifyTransaction(reference);

      if (verification.status !== "success") {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              message: `Payment verification failed: ${verification.status}`,
              code: "PAYMENT_FAILED",
            },
          },
          { status: 400 }
        );
      }

      // Verify amount matches (in smallest unit)
      const expectedAmount = Math.round(parseFloat(booking.totalAmount.toString()) * 100);
      if (verification.amount < expectedAmount * 0.99) {
        // Allow 1% tolerance for minor float differences
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Payment amount mismatch", code: "PAYMENT_AMOUNT_MISMATCH" } },
          { status: 400 }
        );
      }

      // Generate QR code for check-in
      const qrCode = `BEEPS-${booking.id.slice(0, 8)}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
      const platformFeeRate = 0.10;
      const totalAmount = parseFloat(booking.totalAmount.toString());
      const platformFee = Math.round(totalAmount * platformFeeRate * 100) / 100;

      // Update booking — mark as paid
      const updatedBooking = await prisma.$transaction(async (tx) => {
        const updated = await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: "CONFIRMED",
            paymentStatus: "PAYMENT_HELD",
            qrCode,
            platformFee,
            paystackReference: reference,
          },
          include: {
            studio: {
              include: {
                owner: {
                  include: {
                    user: { select: { id: true, username: true, fullName: true, avatar: true } },
                  },
                },
              },
            },
            user: { select: { id: true, username: true, fullName: true, avatar: true } },
          },
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            userId: user.id,
            type: "STUDIO_BOOKING",
            status: "PENDING",
            amount: totalAmount,
            referenceId: bookingId,
            referenceType: "booking",
            paymentMethod: "paystack",
          },
        });

        return updated;
      });

      const sessionDate = booking.startTime.toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric",
      });
      const sessionTime = booking.startTime.toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit", hour12: true,
      });

      // Notify studio owner
      await prisma.notification.create({
        data: {
          userId: booking.studio.owner.userId,
          type: "PAYMENT_HELD",
          title: "Session Payment Secured",
          message: `${user.fullName || user.username} has paid for their session at ${booking.studio.name} on ${sessionDate} at ${sessionTime}. Payment is held in escrow.`,
          referenceId: bookingId,
          referenceType: "BOOKING",
        },
      });

      // Notify customer
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "PAYMENT_HELD",
          title: "Payment Secured",
          message: `Your payment for ${booking.studio.name} on ${sessionDate} at ${sessionTime} is secured. Show your QR code at the studio to check in.`,
          referenceId: bookingId,
          referenceType: "BOOKING",
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          booking: updatedBooking,
          qrCode,
          verified: true,
          escrow: {
            totalAmount,
            platformFee,
            studioOwnerPayout: totalAmount - platformFee,
            currency: booking.currency,
          },
          message: "Payment verified and secured. Show your QR code at the studio.",
        },
      });
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: "Failed to verify payment",
            code: "SERVER_ERROR",
            details: process.env.NODE_ENV === "development" ? error.message : undefined,
          },
        },
        { status: 500 }
      );
    }
  });
}
