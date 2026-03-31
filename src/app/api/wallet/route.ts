import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { getOrCreateWallet } from "@/lib/wallet";
import type { ApiResponse } from "@/types";

/**
 * GET /api/wallet
 * Retrieve the current user's wallet balance and summary
 */
export async function GET(req: NextRequest) {
  return withAuth(req, async (req) => {
    const user = req.user!;

    try {
      // Get wallet inside a read transaction for consistency
      const wallet = await prisma.$transaction(async (tx) => {
        return getOrCreateWallet(tx, user.id, user.currency ?? "USD");
      });

      // Count pending withdrawals
      const pendingWithdrawals = await prisma.withdrawalRequest.aggregate({
        where: { wallet: { userId: user.id }, status: "PENDING" },
        _sum: { amount: true },
        _count: true,
      });

      // Recent transaction summary (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentEarnings = await prisma.walletTransaction.aggregate({
        where: {
          walletId: wallet.id,
          type: "RELEASE",
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { amount: true },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          wallet: {
            id: wallet.id,
            availableBalance: Number(wallet.availableBalance),
            pendingBalance: Number(wallet.pendingBalance),
            totalEarned: Number(wallet.totalEarned),
            totalWithdrawn: Number(wallet.totalWithdrawn),
            currency: wallet.currency,
          },
          summary: {
            pendingWithdrawalAmount: Number(pendingWithdrawals._sum.amount ?? 0),
            pendingWithdrawalCount: pendingWithdrawals._count,
            last30DaysEarnings: Number(recentEarnings._sum.amount ?? 0),
          },
        },
      });
    } catch (error: any) {
      console.error("Error fetching wallet:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: "Failed to fetch wallet", code: "SERVER_ERROR" } },
        { status: 500 }
      );
    }
  });
}
