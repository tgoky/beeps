import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/paystack";
import crypto from "crypto";

/**
 * POST /api/payments/webhook/paystack
 * Handles Paystack webhook events
 * Configure in Paystack Dashboard → Settings → API Keys & Webhooks
 *
 * Events handled:
 *   - charge.success: Payment completed
 *   - transfer.success: Payout to studio owner succeeded
 *   - transfer.failed: Payout failed
 *   - refund.processed: Refund completed
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature") ?? "";

    // Verify webhook authenticity
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.warn("[Paystack Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const { event: eventType, data } = event;

    console.log(`[Paystack Webhook] Event: ${eventType}`, data?.reference);

    switch (eventType) {
      case "charge.success": {
        await handleChargeSuccess(data);
        break;
      }
      case "transfer.success": {
        await handleTransferSuccess(data);
        break;
      }
      case "transfer.failed":
      case "transfer.reversed": {
        await handleTransferFailed(data);
        break;
      }
      case "refund.processed": {
        await handleRefundProcessed(data);
        break;
      }
      default:
        // Unhandled event — acknowledge and ignore
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Paystack Webhook] Error:", error);
    // Always return 200 so Paystack doesn't retry
    return NextResponse.json({ received: true });
  }
}

async function handleChargeSuccess(data: any) {
  const reference = data.reference as string;
  const metadata = data.metadata as Record<string, any>;
  const bookingId = metadata?.bookingId as string | undefined;

  if (!bookingId) return;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      studio: { include: { owner: { select: { userId: true } } } },
      user: { select: { id: true, username: true, fullName: true } },
    },
  });

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
        paystackReference: reference,
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
        paymentMethod: "paystack",
      },
    });
  });

  // Notify studio owner
  await prisma.notification.create({
    data: {
      userId: booking.studio.owner.userId,
      type: "PAYMENT_HELD",
      title: "Session Payment Secured",
      message: `${booking.user.fullName || booking.user.username} has paid. Payment held in escrow.`,
      referenceId: bookingId,
      referenceType: "BOOKING",
    },
  });
}

async function handleTransferSuccess(data: any) {
  const transferCode = data.transfer_code as string;

  // Find the withdrawal request linked to this transfer
  const withdrawal = await prisma.withdrawalRequest.findFirst({
    where: { paystackTransferCode: transferCode },
  });

  if (!withdrawal) return;

  await prisma.withdrawalRequest.update({
    where: { id: withdrawal.id },
    data: { status: "COMPLETED", processedAt: new Date() },
  });

  // Notify wallet owner
  const wallet = await prisma.wallet.findUnique({ where: { id: withdrawal.walletId } });
  if (wallet) {
    await prisma.notification.create({
      data: {
        userId: wallet.userId,
        type: "PAYMENT_RELEASED",
        title: "Withdrawal Processed",
        message: `Your withdrawal of ${withdrawal.currency} ${Number(withdrawal.amount).toLocaleString()} has been sent to your bank account.`,
        referenceId: withdrawal.id,
        referenceType: "WITHDRAWAL",
      },
    });
  }
}

async function handleTransferFailed(data: any) {
  const transferCode = data.transfer_code as string;

  const withdrawal = await prisma.withdrawalRequest.findFirst({
    where: { paystackTransferCode: transferCode },
  });

  if (!withdrawal) return;

  await prisma.$transaction(async (tx) => {
    // Mark withdrawal as failed
    await tx.withdrawalRequest.update({
      where: { id: withdrawal.id },
      data: {
        status: "FAILED",
        failureReason: data.reason || "Transfer failed",
      },
    });

    // Reverse the wallet debit
    const wallet = await tx.wallet.findUnique({ where: { id: withdrawal.walletId } });
    if (wallet) {
      const restored = Number(wallet.availableBalance) + Number(withdrawal.amount);
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: restored,
          totalWithdrawn: Math.max(0, Number(wallet.totalWithdrawn) - Number(withdrawal.amount)),
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "CREDIT",
          amount: Number(withdrawal.amount),
          currency: withdrawal.currency,
          description: `Withdrawal reversal: transfer ${transferCode} failed`,
          balanceAfter: restored,
          pendingAfter: Number(wallet.pendingBalance),
          referenceId: withdrawal.id,
          referenceType: "withdrawal",
        },
      });

      await prisma.notification.create({
        data: {
          userId: wallet.userId,
          type: "PAYMENT_REFUNDED",
          title: "Withdrawal Failed",
          message: `Your withdrawal of ${withdrawal.currency} ${Number(withdrawal.amount).toLocaleString()} failed and has been returned to your wallet.`,
          referenceId: withdrawal.id,
          referenceType: "WITHDRAWAL",
        },
      });
    }
  });
}

async function handleRefundProcessed(data: any) {
  // Find the booking by paystack reference
  const reference = data.transaction?.reference as string | undefined;
  if (!reference) return;

  const booking = await prisma.booking.findFirst({
    where: { paystackReference: reference },
  });

  if (!booking) return;

  if (booking.paymentStatus !== "REFUNDED") {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { paymentStatus: "REFUNDED" },
    });
  }
}
