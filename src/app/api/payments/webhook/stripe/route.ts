import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { constructWebhookEvent } from "@/lib/stripe";
import crypto from "crypto";

/**
 * POST /api/payments/webhook/stripe
 * Handles Stripe webhook events
 * Configure in Stripe Dashboard → Developers → Webhooks
 *
 * Events handled:
 *   - payment_intent.succeeded: Payment captured
 *   - payment_intent.payment_failed: Payment failed
 *   - payment_intent.canceled: Payment canceled (refund scenario)
 *   - transfer.created: Transfer to studio owner created
 *   - payout.paid: Platform payout processed
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature") ?? "";

    let event;
    try {
      event = constructWebhookEvent(rawBody, signature);
    } catch (err: any) {
      console.warn("[Stripe Webhook] Invalid signature:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log(`[Stripe Webhook] Event: ${event.type}`, event.id);

    switch (event.type) {
      case "payment_intent.amount_capturable_updated": {
        // PaymentIntent is authorized/held — ready for manual capture (escrow active)
        await handlePaymentIntentAuthorized(event.data.object as any);
        break;
      }
      case "payment_intent.succeeded": {
        // Payment was captured (session completed + released)
        await handlePaymentIntentSucceeded(event.data.object as any);
        break;
      }
      case "payment_intent.payment_failed": {
        await handlePaymentIntentFailed(event.data.object as any);
        break;
      }
      case "payment_intent.canceled": {
        await handlePaymentIntentCanceled(event.data.object as any);
        break;
      }
      case "charge.refunded": {
        await handleChargeRefunded(event.data.object as any);
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Stripe Webhook] Error:", error);
    // Always return 200 — Stripe will retry on non-2xx
    return NextResponse.json({ received: true });
  }
}

async function handlePaymentIntentAuthorized(paymentIntent: any) {
  const bookingId = paymentIntent.metadata?.bookingId as string | undefined;
  if (!bookingId) return;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.paymentStatus !== "UNPAID") return;

  const totalAmount = parseFloat(booking.totalAmount.toString());
  const platformFee = Math.round(totalAmount * 0.10 * 100) / 100;
  const qrCode = `BEEPS-${booking.id.slice(0, 8)}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "CONFIRMED",
        paymentStatus: "PAYMENT_HELD",
        qrCode,
        platformFee,
        paymentIntentId: paymentIntent.id,
      },
    });

    await tx.transaction.create({
      data: {
        userId: booking.userId,
        type: "STUDIO_BOOKING",
        status: "PENDING",
        amount: totalAmount,
        referenceId: bookingId,
        referenceType: "booking",
        paymentMethod: "stripe",
      },
    });
  });
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  const bookingId = paymentIntent.metadata?.bookingId as string | undefined;
  if (!bookingId) return;

  await prisma.transaction.updateMany({
    where: { referenceId: bookingId, referenceType: "booking" },
    data: { status: "COMPLETED" },
  });
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  const bookingId = paymentIntent.metadata?.bookingId as string | undefined;
  if (!bookingId) return;

  await prisma.transaction.updateMany({
    where: { referenceId: bookingId, referenceType: "booking", status: "PENDING" },
    data: { status: "FAILED" },
  });
}

async function handlePaymentIntentCanceled(paymentIntent: any) {
  const bookingId = paymentIntent.metadata?.bookingId as string | undefined;
  if (!bookingId) return;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return;

  // If booking isn't already cancelled/refunded, update payment status
  if (booking.paymentStatus === "PAYMENT_HELD") {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: "REFUNDED" },
    });
    await prisma.transaction.updateMany({
      where: { referenceId: bookingId, referenceType: "booking" },
      data: { status: "REFUNDED" },
    });
  }
}

async function handleChargeRefunded(charge: any) {
  const paymentIntentId = charge.payment_intent as string | undefined;
  if (!paymentIntentId) return;

  const booking = await prisma.booking.findFirst({
    where: { paymentIntentId },
  });

  if (!booking) return;

  await prisma.booking.update({
    where: { id: booking.id },
    data: { paymentStatus: "REFUNDED" },
  });

  await prisma.transaction.updateMany({
    where: { referenceId: booking.id, referenceType: "booking" },
    data: { status: "REFUNDED" },
  });
}