import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

// GET /api/transactions - Fetch user transactions
export async function GET(req: NextRequest) {
  return withAuth(req, async (req) => {
    const user = req.user!;
    
    try {
      const { searchParams } = new URL(req.url);
      const type = searchParams.get("type"); // BEAT_PURCHASE, EQUIPMENT_PURCHASE, etc.
      const status = searchParams.get("status"); // PENDING, COMPLETED, FAILED, REFUNDED
      const limit = searchParams.get("limit");
      const offset = searchParams.get("offset");

      const where: any = {
        userId: user.id, // Transactions belong to the buyer/user
      };

      if (type) {
        where.type = type;
      }

      if (status) {
        where.status = status;
      }

      const transactions = await prisma.transaction.findMany({
        where,
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
        orderBy: {
          createdAt: "desc",
        },
        ...(limit && { take: parseInt(limit) }),
        ...(offset && { skip: parseInt(offset) }),
      });

      // Fetch related resources for each transaction
      const transactionsWithResources = await Promise.all(
        transactions.map(async (transaction) => {
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
                      seller: {
                        select: {
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
                      studio: {
                        select: {
                          id: true,
                          name: true,
                          imageUrl: true,
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
              }
            } catch (error) {
              console.error("Error fetching related resource:", error);
            }
          }

          return {
            ...transaction,
            relatedResource,
          };
        })
      );

      // Get total count for pagination
      const totalCount = await prisma.transaction.count({ where });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          transactions: transactionsWithResources,
          pagination: {
            total: totalCount,
            limit: limit ? parseInt(limit) : transactions.length,
            offset: offset ? parseInt(offset) : 0,
          },
        },
      });
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: "Failed to fetch transactions",
          code: "SERVER_ERROR",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
      }, { status: 500 });
    }
  });
}

// POST /api/transactions - Create a transaction (purchase)
export async function POST(req: NextRequest) {
  return withAuth(req, async (req) => {
    const user = req.user!;
    
    try {
      const body = await req.json();
      const { type, referenceId, referenceType, amount, paymentMethod } = body;

      // Validate required fields
      if (!type || !referenceId || !referenceType || !amount) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Missing required fields: type, referenceId, referenceType, amount",
            code: "VALIDATION_ERROR",
          },
        }, { status: 400 });
      }

      // Validate transaction type
      const validTypes = ["BEAT_PURCHASE", "EQUIPMENT_PURCHASE", "EQUIPMENT_RENTAL", "STUDIO_BOOKING", "SERVICE_PAYMENT"];
      if (!validTypes.includes(type)) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: `Invalid transaction type. Must be one of: ${validTypes.join(", ")}`,
            code: "VALIDATION_ERROR",
          },
        }, { status: 400 });
      }

      // Validate amount
      const amountNum = parseFloat(amount);
      if (amountNum <= 0) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Amount must be greater than 0",
            code: "VALIDATION_ERROR",
          },
        }, { status: 400 });
      }

      // Verify the referenced resource exists and get seller info
      let sellerId: string | null = null;

      switch (referenceType) {
        case "beat":
          const beat = await prisma.beat.findUnique({
            where: { id: referenceId },
            select: {
              id: true,
              producerId: true,
              price: true,
              isActive: true,
            },
          });
          if (!beat || !beat.isActive) {
            return NextResponse.json<ApiResponse>({
              success: false,
              error: {
                message: "Beat not found or no longer available",
                code: "NOT_FOUND",
              },
            }, { status: 404 });
          }
          sellerId = beat.producerId;
          break;

        case "equipment":
          const equipment = await prisma.equipment.findUnique({
            where: { id: referenceId },
            select: {
              id: true,
              seller: {
                select: {
                  userId: true,
                },
              },
              price: true,
              isActive: true,
            },
          });
          if (!equipment || !equipment.isActive) {
            return NextResponse.json<ApiResponse>({
              success: false,
              error: {
                message: "Equipment not found or no longer available",
                code: "NOT_FOUND",
              },
            }, { status: 404 });
          }
          sellerId = equipment.seller.userId;
          break;

        case "booking":
          const booking = await prisma.booking.findUnique({
            where: { id: referenceId },
            select: {
              id: true,
              userId: true,
              status: true,
              totalAmount: true,
              studio: {
                select: {
                  owner: {
                    select: {
                      userId: true,
                    },
                  },
                },
              },
            },
          });
          if (!booking) {
            return NextResponse.json<ApiResponse>({
              success: false,
              error: {
                message: "Booking not found",
                code: "NOT_FOUND",
              },
            }, { status: 404 });
          }
          if (booking.userId !== user.id) {
            return NextResponse.json<ApiResponse>({
              success: false,
              error: {
                message: "Unauthorized to pay for this booking",
                code: "FORBIDDEN",
              },
            }, { status: 403 });
          }
          sellerId = booking.studio.owner.userId;

          // Update booking status to CONFIRMED
          await prisma.booking.update({
            where: { id: referenceId },
            data: { status: "CONFIRMED" },
          });
          break;

        case "service":
          const service = await prisma.service.findUnique({
            where: { id: referenceId },
            select: {
              id: true,
              providerId: true,
              price: true,
              isActive: true,
            },
          });
          if (!service || !service.isActive) {
            return NextResponse.json<ApiResponse>({
              success: false,
              error: {
                message: "Service not found or no longer available",
                code: "NOT_FOUND",
              },
            }, { status: 404 });
          }
          sellerId = service.providerId;
          break;

        default:
          return NextResponse.json<ApiResponse>({
            success: false,
            error: {
              message: "Invalid reference type",
              code: "VALIDATION_ERROR",
            },
          }, { status: 400 });
      }

      // Don't allow buying from yourself
      if (sellerId === user.id) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "You cannot purchase from yourself",
            code: "INVALID_TRANSACTION",
          },
        }, { status: 400 });
      }

      // Create transaction
      const transaction = await prisma.transaction.create({
        data: {
          userId: user.id,
          type,
          status: "COMPLETED", // In production, would be PENDING until payment confirmed
          amount: amountNum,
          referenceId,
          referenceType,
          paymentMethod: paymentMethod || "card",
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

      // Create notifications
      if (sellerId) {
        const itemName = referenceType === "beat" ? "beat" 
          : referenceType === "equipment" ? "equipment" 
          : referenceType === "booking" ? "studio booking" 
          : "service";

        // Notify seller
        await prisma.notification.create({
          data: {
            userId: sellerId,
            type: "TRANSACTION_COMPLETED",
            title: "New Purchase!",
            message: `${user.username} purchased your ${itemName} for $${amountNum}`,
            referenceId: transaction.id,
            referenceType: "transaction",
          },
        });
      }

      // Notify buyer
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "TRANSACTION_COMPLETED",
          title: "Purchase Confirmed",
          message: `Your purchase for $${amountNum} has been confirmed`,
          referenceId: transaction.id,
          referenceType: "transaction",
        },
      });

      // Create activity
      await prisma.activity.create({
        data: {
          userId: user.id,
          type: "COMPLETE",
          title: `Purchased ${referenceType}`,
          description: `Transaction completed for $${amountNum}`,
          referenceId: transaction.id,
          referenceType: "transaction",
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: { transaction },
      }, { status: 201 });
    } catch (error: any) {
      console.error("Error creating transaction:", error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: "Failed to create transaction",
          code: "SERVER_ERROR",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
      }, { status: 500 });
    }
  });
}