import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

// GET /api/transactions/[id] - Fetch a transaction by ID
export async function GET(req: NextRequest, { params }: { params: any }) {
  return withAuth(req, async (req) => {
    const user = req.user!;
    try {
      const { id } = params;

      const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
          buyer: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
          seller: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
          beat: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              audioUrl: true,
            },
          },
          equipment: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              category: true,
            },
          },
          booking: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
              studio: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  location: true,
                },
              },
            },
          },
          serviceRequest: {
            select: {
              id: true,
              projectTitle: true,
              projectDescription: true,
            },
          },
        },
      });

      if (!transaction) {
        return NextResponse.json(
          { error: "Transaction not found" },
          { status: 404 }
        );
      }

      // Check authorization
      if (transaction.buyerId !== user.id && transaction.sellerId !== user.id) {
        return NextResponse.json(
          { error: "Unauthorized to view this transaction" },
          { status: 403 }
        );
      }

      return NextResponse.json({ transaction });
    } catch (error: any) {
      console.error("Error fetching transaction:", error);
      return NextResponse.json(
        { error: "Failed to fetch transaction" },
        { status: 500 }
      );
    }
  }
);
