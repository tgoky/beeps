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

      // Service Requests (if they exist in your schema)
      let serviceRequests: any[] = [];
      try {
        const serviceRequestsWhere = view === "provider"
          ? { producerId: user.id }
          : { clientId: user.id };

        serviceRequests = await prisma.serviceRequest.findMany({
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
      } catch (error) {
        // ServiceRequest model might not exist yet, that's okay
        console.log("ServiceRequest model not available");
      }

      // Combine and format all bookings
      const allBookings = {
        studioBookings: studioBookings.map(booking => ({
          ...booking,
          type: "STUDIO_BOOKING",
          itemName: booking.studio.name,
          providerName: booking.studio.owner.user.fullName || booking.studio.owner.user.username,
          customerName: booking.user.fullName || booking.user.username,
        })),
        equipmentRentals: [], // Removed - Transaction model doesn't support buyer/seller queries
        serviceRequests: serviceRequests.map(request => ({
          ...request,
          type: "SERVICE_REQUEST",
          itemName: request.projectTitle,
          providerName: request.producer.fullName || request.producer.username,
          customerName: request.client.fullName || request.client.username,
        })),
        beatPurchases: [], // Removed - Transaction model doesn't support buyer/seller queries
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
