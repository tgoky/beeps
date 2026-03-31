import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { debitForWithdrawal } from "@/lib/wallet";
import { initiateTransfer, toSmallestUnit } from "@/lib/paystack";
import type { ApiResponse } from "@/types";

const MIN_WITHDRAWAL_AMOUNT = 5; // Minimum withdrawal in wallet currency units

/**
 * POST /api/wallet/withdraw
 * Request a withdrawal from wallet to linked bank account
 * Body: { amount }
 *
 * GET /api/wallet/withdraw
 * List withdrawal history
 */
export async function GET(req: NextRequest) {
  return withAuth(req, async (req) => {
    const user = req.user!;

    try {
      const { searchParams } = new URL(req.url);
      const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
      const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "10"));
      const skip = (page - 1) * limit;

      const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
      if (!wallet) {
        return NextResponse.json<ApiResponse>({
          success: true,
          data: { withdrawals: [], pagination: { total: 0, page, limit, pages: 0 } },
        });
      }

      const [withdrawals, total] = await Promise.all([
        prisma.withdrawalRequest.findMany({
          where: { walletId: wallet.id },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.withdrawalRequest.count({ where: { walletId: wallet.id } }),
      ]);

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          withdrawals: withdrawals.map((w) => ({
            id: w.id,
            amount: Number(w.amount),
            currency: w.currency,
            status: w.status,
            bankName: w.bankName,
            accountNumber: w.accountNumber ? `****${w.accountNumber.slice(-4)}` : null,
            accountName: w.accountName,
            paymentProvider: w.paymentProvider,
            paystackTransferCode: w.paystackTransferCode,
            stripePayoutId: w.stripePayoutId,
            processedAt: w.processedAt,
            createdAt: w.createdAt,
            failureReason: w.failureReason,
          })),
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      console.error("Error fetching withdrawals:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: "Failed to fetch withdrawals", code: "SERVER_ERROR" } },
        { status: 500 }
      );
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, async (req) => {
    const user = req.user!;

    try {
      const body = await req.json();
      const { amount } = body;

      if (!amount || typeof amount !== "number" || amount <= 0) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "amount must be a positive number", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      if (amount < MIN_WITHDRAWAL_AMOUNT) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              message: `Minimum withdrawal amount is ${MIN_WITHDRAWAL_AMOUNT} ${user.currency}`,
              code: "BELOW_MINIMUM",
            },
          },
          { status: 400 }
        );
      }

      const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });

      if (!wallet) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Wallet not found", code: "NOT_FOUND" } },
          { status: 404 }
        );
      }

      if (Number(wallet.availableBalance) < amount) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              message: `Insufficient balance. Available: ${wallet.currency} ${Number(wallet.availableBalance).toFixed(2)}`,
              code: "INSUFFICIENT_BALANCE",
            },
          },
          { status: 400 }
        );
      }

      // Check for pending withdrawal (max 1 pending at a time to prevent abuse)
      const existingPending = await prisma.withdrawalRequest.findFirst({
        where: { walletId: wallet.id, status: { in: ["PENDING", "PROCESSING"] } },
      });

      if (existingPending) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              message: "You already have a pending withdrawal. Please wait for it to complete.",
              code: "WITHDRAWAL_PENDING",
            },
          },
          { status: 400 }
        );
      }

      // Get studio owner profile for payout details
      const studioProfile = await prisma.studioOwnerProfile.findUnique({
        where: { userId: user.id },
      });

      const paymentProvider = user.paymentProvider ?? "STRIPE";

      // Validate payout method is configured
      if (paymentProvider === "PAYSTACK" && !studioProfile?.paystackRecipientCode) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              message: "Please add your bank account before withdrawing",
              code: "NO_PAYOUT_METHOD",
            },
          },
          { status: 400 }
        );
      }

      if (paymentProvider === "STRIPE" && (!studioProfile?.stripeConnectId || !studioProfile.stripeOnboarded)) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              message: "Please complete Stripe Connect onboarding before withdrawing",
              code: "STRIPE_NOT_ONBOARDED",
            },
          },
          { status: 400 }
        );
      }

      // Process withdrawal in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create withdrawal record first (to get the ID for the wallet transaction)
        const withdrawal = await tx.withdrawalRequest.create({
          data: {
            walletId: wallet.id,
            amount,
            currency: wallet.currency,
            status: "PROCESSING",
            paymentProvider,
            bankName: studioProfile?.paystackBankCode ?? undefined,
            accountNumber: studioProfile?.paystackAccountNumber ?? undefined,
            accountName: studioProfile?.paystackAccountName ?? undefined,
            bankCode: studioProfile?.paystackBankCode ?? undefined,
          },
        });

        // Debit wallet
        await debitForWithdrawal(
          tx,
          user.id,
          amount,
          wallet.currency,
          withdrawal.id,
          `Withdrawal to ${
            studioProfile?.paystackAccountName ??
            studioProfile?.paystackAccountNumber?.slice(-4) ??
            "bank account"
          }`
        );

        return withdrawal;
      });

      // Initiate actual transfer (outside DB transaction for resilience)
      let transferCode: string | undefined;
      let failureReason: string | undefined;

      try {
        if (paymentProvider === "PAYSTACK" && studioProfile?.paystackRecipientCode) {
          const transfer = await initiateTransfer({
            source: "balance",
            amount: toSmallestUnit(amount),
            recipient: studioProfile.paystackRecipientCode,
            reason: `Beeps wallet withdrawal`,
            currency: wallet.currency,
            reference: `BEEPS-WD-${result.id.slice(0, 8)}`,
          });
          transferCode = transfer.transfer_code;
        }
        // Stripe payouts are handled via Stripe Connect's automatic schedule
        // or via the Stripe Dashboard; we mark PROCESSING and let webhooks handle completion
      } catch (transferError: any) {
        console.error("Transfer initiation failed:", transferError);
        failureReason = transferError.message;
      }

      // Update withdrawal with transfer details or failure
      const updateData: any = transferCode
        ? { paystackTransferCode: transferCode }
        : failureReason
        ? { status: "FAILED", failureReason }
        : {};

      const updated = await prisma.withdrawalRequest.update({
        where: { id: result.id },
        data: updateData,
      });

      // If transfer failed, reverse the wallet debit
      if (failureReason && !transferCode) {
        await prisma.$transaction(async (tx) => {
          const currentWallet = await tx.wallet.findUnique({ where: { id: wallet.id } });
          if (currentWallet) {
            await tx.wallet.update({
              where: { id: wallet.id },
              data: {
                availableBalance: Number(currentWallet.availableBalance) + amount,
                totalWithdrawn: Math.max(0, Number(currentWallet.totalWithdrawn) - amount),
              },
            });
          }
        });

        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              message: `Withdrawal failed: ${failureReason}`,
              code: "TRANSFER_FAILED",
            },
          },
          { status: 502 }
        );
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          withdrawal: {
            id: updated.id,
            amount,
            currency: wallet.currency,
            status: updated.status,
            paystackTransferCode: updated.paystackTransferCode,
            message:
              paymentProvider === "PAYSTACK"
                ? "Withdrawal initiated. Funds will arrive in your bank account within 1-2 business days."
                : "Withdrawal processing. Stripe payouts typically arrive within 2-5 business days.",
          },
        },
      }, { status: 201 });
    } catch (error: any) {
      console.error("Error processing withdrawal:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            message: error.message || "Failed to process withdrawal",
            code: "SERVER_ERROR",
          },
        },
        { status: 500 }
      );
    }
  });
}
