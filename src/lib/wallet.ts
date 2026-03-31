/**
 * Wallet Service
 * Manages virtual wallet operations: credit, debit, hold, release
 * All wallet operations must be performed inside a Prisma transaction
 * for atomicity and consistency.
 */

import { Prisma } from "@prisma/client";

type PrismaTx = Omit<
  Prisma.TransactionClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

// ─── Wallet Retrieval / Creation ──────────────────────────────────────────────

/**
 * Get or create a wallet for a user inside a transaction
 */
export async function getOrCreateWallet(
  tx: PrismaTx,
  userId: string,
  currency: string = "USD"
) {
  const existing = await tx.wallet.findUnique({ where: { userId } });
  if (existing) return existing;

  return tx.wallet.create({
    data: { userId, currency },
  });
}

// ─── Hold (Escrow) ────────────────────────────────────────────────────────────

/**
 * Record an escrow hold on the wallet
 * Called when a booking payment is initialized (funds en route / held)
 * Increases pendingBalance; availableBalance is unaffected until session completes
 */
export async function holdFunds(
  tx: PrismaTx,
  userId: string,
  amount: number,
  currency: string,
  referenceId: string,
  description: string,
  providerReference?: string
) {
  const wallet = await getOrCreateWallet(tx, userId, currency);
  const newPending = Number(wallet.pendingBalance) + amount;

  const updated = await tx.wallet.update({
    where: { id: wallet.id },
    data: { pendingBalance: newPending },
  });

  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: "HOLD",
      amount,
      currency,
      description,
      balanceAfter: Number(updated.availableBalance),
      pendingAfter: newPending,
      referenceId,
      referenceType: "booking",
      providerReference,
    },
  });

  return updated;
}

// ─── Release (Escrow → Available) ────────────────────────────────────────────

/**
 * Release escrowed funds to the studio owner's available balance
 * Called when a session completes and payment is approved
 * Decreases pendingBalance, increases availableBalance and totalEarned
 */
export async function releaseFunds(
  tx: PrismaTx,
  userId: string,
  amount: number,
  platformFee: number,
  currency: string,
  referenceId: string,
  description: string,
  providerReference?: string
) {
  const wallet = await getOrCreateWallet(tx, userId, currency);
  const payout = amount - platformFee;
  const newAvailable = Number(wallet.availableBalance) + payout;
  const newPending = Math.max(0, Number(wallet.pendingBalance) - amount);
  const newTotalEarned = Number(wallet.totalEarned) + payout;

  const updated = await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      availableBalance: newAvailable,
      pendingBalance: newPending,
      totalEarned: newTotalEarned,
    },
  });

  // Record the release
  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: "RELEASE",
      amount: payout,
      currency,
      description,
      balanceAfter: newAvailable,
      pendingAfter: newPending,
      referenceId,
      referenceType: "booking",
      providerReference,
    },
  });

  // Record platform fee separately for transparency
  if (platformFee > 0) {
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "PLATFORM_FEE",
        amount: platformFee,
        currency,
        description: `Platform fee (10%) for booking ${referenceId}`,
        balanceAfter: newAvailable,
        pendingAfter: newPending,
        referenceId,
        referenceType: "booking",
      },
    });
  }

  return updated;
}

// ─── Refund Hold ──────────────────────────────────────────────────────────────

/**
 * Reverse an escrow hold when a booking is cancelled before the session
 * Decreases pendingBalance (no effect on availableBalance)
 */
export async function refundHold(
  tx: PrismaTx,
  userId: string,
  amount: number,
  currency: string,
  referenceId: string,
  description: string
) {
  const wallet = await getOrCreateWallet(tx, userId, currency);
  const newPending = Math.max(0, Number(wallet.pendingBalance) - amount);

  const updated = await tx.wallet.update({
    where: { id: wallet.id },
    data: { pendingBalance: newPending },
  });

  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: "REFUND_RECEIVED",
      amount,
      currency,
      description,
      balanceAfter: Number(updated.availableBalance),
      pendingAfter: newPending,
      referenceId,
      referenceType: "booking",
    },
  });

  return updated;
}

// ─── Withdrawal ───────────────────────────────────────────────────────────────

/**
 * Debit the wallet for a withdrawal request
 * Called when a studio owner requests a withdrawal
 */
export async function debitForWithdrawal(
  tx: PrismaTx,
  userId: string,
  amount: number,
  currency: string,
  withdrawalRequestId: string,
  description: string
) {
  const wallet = await getOrCreateWallet(tx, userId, currency);

  if (Number(wallet.availableBalance) < amount) {
    throw new Error(
      `Insufficient wallet balance. Available: ${wallet.availableBalance} ${currency}`
    );
  }

  const newAvailable = Number(wallet.availableBalance) - amount;
  const newTotalWithdrawn = Number(wallet.totalWithdrawn) + amount;

  const updated = await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      availableBalance: newAvailable,
      totalWithdrawn: newTotalWithdrawn,
    },
  });

  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: "WITHDRAWAL",
      amount,
      currency,
      description,
      balanceAfter: newAvailable,
      pendingAfter: Number(updated.pendingBalance),
      referenceId: withdrawalRequestId,
      referenceType: "withdrawal",
    },
  });

  return updated;
}
