import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

// GET /api/transactions/[id] - Fetch a transaction by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req) => {
    const user = req.user!;
    
    try {
      const { id } = params;

      const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              verified: true,
            },
          },
        },
      });

      if (!transaction) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Transaction not found",
            code: "NOT_FOUND",
          },
        }, { status: 404 });
      }

      // Check authorization - user must be the transaction owner
      if (transaction.userId !== user.id) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Unauthorized to view this transaction",
            code: "FORBIDDEN",
          },
        }, { status: 403 });
      }

      // Fetch related resource based on referenceType
      let relatedResource = null;

      if (transaction.referenceId && transaction.referenceType) {
        try {
          switch (transaction.referenceType) {
            case "beat":
              relatedResource = await prisma.beat.findUnique({
                where: { id: transaction.referenceId },
                select: {
                  id: true,
                  title: true,
                  imageUrl: true,
                  audioUrl: true,
                  bpm: true,
                  price: true,
                  producer: {
                    select: {
                      id: true,
                      username: true,
                      avatar: true,
                    },
                  },
                },
              });
              break;

            case "equipment":
              relatedResource = await prisma.equipment.findUnique({
                where: { id: transaction.referenceId },
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  category: true,
                  condition: true,
                  price: true,
                  seller: {
                    select: {
                      id: true,
                      businessName: true,
                      user: {
                        select: {
                          id: true,
                          username: true,
                          avatar: true,
                        },
                      },
                    },
                  },
                },
              });
              break;

            case "booking":
              relatedResource = await prisma.booking.findUnique({
                where: { id: transaction.referenceId },
                select: {
                  id: true,
                  startTime: true,
                  endTime: true,
                  totalAmount: true,
                  status: true,
                  studio: {
                    select: {
                      id: true,
                      name: true,
                      imageUrl: true,
                      location: true,
                      hourlyRate: true,
                    },
                  },
                },
              });
              break;

            case "service":
              relatedResource = await prisma.service.findUnique({
                where: { id: transaction.referenceId },
                select: {
                  id: true,
                  title: true,
                  description: true,
                  category: true,
                  price: true,
                  imageUrl: true,
                  provider: {
                    select: {
                      id: true,
                      username: true,
                      avatar: true,
                    },
                  },
                },
              });
              break;

            default:
              // Unknown reference type
              break;
          }
        } catch (error) {
          console.error("Error fetching related resource:", error);
          // Continue without related resource
        }
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          transaction,
          relatedResource,
        },
      });
    } catch (error: any) {
      console.error("Error fetching transaction:", error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: "Failed to fetch transaction",
          code: "SERVER_ERROR",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
      }, { status: 500 });
    }
  });
}

// PATCH /api/transactions/[id] - Update transaction status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req) => {
    const user = req.user!;
    
    try {
      const { id } = params;
      const body = await req.json();
      const { status } = body;

      // Validate status
      const validStatuses = ["PENDING", "COMPLETED", "FAILED", "REFUNDED"];
      if (status && !validStatuses.includes(status)) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: `Status must be one of: ${validStatuses.join(", ")}`,
            code: "VALIDATION_ERROR",
          },
        }, { status: 400 });
      }

      const transaction = await prisma.transaction.findUnique({
        where: { id },
        select: {
          id: true,
          userId: true,
          status: true,
        },
      });

      if (!transaction) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Transaction not found",
            code: "NOT_FOUND",
          },
        }, { status: 404 });
      }

      // Only transaction owner can update
      if (transaction.userId !== user.id) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Unauthorized to update this transaction",
            code: "FORBIDDEN",
          },
        }, { status: 403 });
      }

      // Don't allow updating completed or refunded transactions
      if (transaction.status === "COMPLETED" || transaction.status === "REFUNDED") {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: `Cannot update ${transaction.status.toLowerCase()} transaction`,
            code: "INVALID_STATUS_TRANSITION",
          },
        }, { status: 400 });
      }

      const updatedTransaction = await prisma.transaction.update({
        where: { id },
        data: {
          ...(status && { status }),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
        },
      });

      // Create notification on status change
      if (status && status !== transaction.status) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: status === "COMPLETED" ? "TRANSACTION_COMPLETED" : "JOB_UPDATED",
            title: "Transaction Updated",
            message: `Your transaction status has been updated to ${status.toLowerCase()}`,
            referenceId: id,
            referenceType: "transaction",
          },
        });
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        data: { transaction: updatedTransaction },
      });
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: "Failed to update transaction",
          code: "SERVER_ERROR",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
      }, { status: 500 });
    }
  });
}