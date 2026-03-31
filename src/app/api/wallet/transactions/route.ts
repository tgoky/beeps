import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

/**
 * GET /api/wallet/transactions?page=1&limit=20&type=RELEASE
 * List wallet transactions with pagination
 */
export async function GET(req: NextRequest) {
  return withAuth(req, async (req) => {
    const user = req.user!;

    try {
      const { searchParams } = new URL(req.url);
      const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
      const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
      const type = searchParams.get("type");
      const skip = (page - 1) * limit;

      const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });

      if (!wallet) {
        return NextResponse.json<ApiResponse>({
          success: true,
          data: { transactions: [], pagination: { total: 0, page, limit, pages: 0 } },
        });
      }

      const where: any = { walletId: wallet.id };
      if (type) where.type = type;

      const [transactions, total] = await Promise.all([
        prisma.walletTransaction.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.walletTransaction.count({ where }),
      ]);

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          transactions: transactions.map((t) => ({
            id: t.id,
            type: t.type,
            amount: Number(t.amount),
            currency: t.currency,
            description: t.description,
            balanceAfter: Number(t.balanceAfter),
            pendingAfter: Number(t.pendingAfter),
            referenceId: t.referenceId,
            referenceType: t.referenceType,
            paymentProvider: t.paymentProvider,
            providerReference: t.providerReference,
            createdAt: t.createdAt,
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
      console.error("Error fetching wallet transactions:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: "Failed to fetch transactions", code: "SERVER_ERROR" } },
        { status: 500 }
      );
    }
  });
}
