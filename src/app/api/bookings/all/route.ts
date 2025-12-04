import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

// GET /api/bookings/all - Fetch all user bookings (studios, equipment, services)
export async function GET(req: NextRequest) {
  return withAuth(req, async (req) => {
    try {
      const user = req.user!;
      const { searchParams } = new URL(req.url);
      const view = searchParams.get("view"); // "customer" or "provider"

      // Studio Bookings
      const studioBookingsWhere = view === "provider"
        ? { studio: { owner: { userId: user.id } } }
        : { userId: user.id };

      const studioBookings = await prisma.booking.findMany({
        where: studioBookingsWhere,
        include: {
          studio: {
            include: {
              owner: {
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
              },
            },
          },
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
          startTime: "desc",
        },
      });

      // Equipment Rentals/Purchases (via transactions)
      const equipmentTransactionsWhere = view === "provider"
        ? { sellerId: user.id, type: "EQUIPMENT" }
        : { buyerId: user.id, type: "EQUIPMENT" };

      const equipmentTransactions = await prisma.transaction.findMany({
        where: equipmentTransactionsWhere,
        include: {
          equipment: {
            include: {
              seller: {
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
              },
            },
          },
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
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Service Requests
      const serviceRequestsWhere = view === "provider"
        ? { producerId: user.id }
        : { clientId: user.id };

      const serviceRequests = await prisma.serviceRequest.findMany({
        where: serviceRequestsWhere,
        include: {
          client: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
          producer: {
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
      });

      // Beat Purchases (via transactions)
      const beatTransactionsWhere = view === "provider"
        ? { sellerId: user.id, type: "BEAT" }
        : { buyerId: user.id, type: "BEAT" };

      const beatTransactions = await prisma.transaction.findMany({
        where: beatTransactionsWhere,
        include: {
          beat: {
            include: {
              producer: {
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
              },
            },
          },
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
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Combine and format all bookings
      const allBookings = {
        studioBookings: studioBookings.map(booking => ({
          ...booking,
          type: "STUDIO_BOOKING",
          itemName: booking.studio.name,
          providerName: booking.studio.owner.user.fullName || booking.studio.owner.user.username,
          customerName: booking.user.fullName || booking.user.username,
        })),
        equipmentRentals: equipmentTransactions.map(transaction => ({
          ...transaction,
          type: "EQUIPMENT_RENTAL",
          itemName: transaction.equipment?.name || "Equipment",
          providerName: transaction.seller.fullName || transaction.seller.username,
          customerName: transaction.buyer.fullName || transaction.buyer.username,
        })),
        serviceRequests: serviceRequests.map(request => ({
          ...request,
          type: "SERVICE_REQUEST",
          itemName: request.projectTitle,
          providerName: request.producer.fullName || request.producer.username,
          customerName: request.client.fullName || request.client.username,
        })),
        beatPurchases: beatTransactions.map(transaction => ({
          ...transaction,
          type: "BEAT_PURCHASE",
          itemName: transaction.beat?.title || "Beat",
          providerName: transaction.seller.fullName || transaction.seller.username,
          customerName: transaction.buyer.fullName || transaction.buyer.username,
        })),
      };

      return NextResponse.json(allBookings);
    } catch (error: any) {
      console.error("Error fetching all bookings:", error);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }
  });
}
