export const dynamic = "force-dynamic"; // MUST HAVE: Stops Next.js from caching!

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  return withAuth(req, async (req) => {
    try {
      const user = req.user!;
      const { searchParams } = new URL(req.url);
      
      const view = searchParams.get("view"); 
      const isProviderView = view === "provider";

      const limit = parseInt(searchParams.get("limit") || "20");
      const offset = parseInt(searchParams.get("offset") || "0");

      // Studio Bookings
      const studioBookingsWhere = isProviderView
        ? { studio: { owner: { userId: user.id } } }
        : { userId: user.id };

      const studioBookings = await prisma.booking.findMany({
        where: studioBookingsWhere,
        select: {
          id: true, studioId: true, userId: true, startTime: true, endTime: true,
          status: true, totalAmount: true, notes: true, paymentStatus: true,
          checkedInAt: true, checkedOutAt: true, qrCode: true, overtimeMinutes: true,
          overtimeAmount: true, bookerConfirmedCheckIn: true, createdAt: true,
          studio: {
            select: { id: true, name: true, location: true, hourlyRate: true, imageUrl: true,
              owner: { select: { id: true, user: { select: { id: true, username: true, fullName: true, avatar: true } } } } }
          },
          user: { select: { id: true, username: true, fullName: true, avatar: true } },
        },
        orderBy: { startTime: "desc" },
        take: limit, skip: offset,
      });

      // Service Requests
      let serviceRequests: any[] = [];
      try {
        const serviceRequestsWhere = isProviderView
          ? { producerId: user.id }
          : { clientId: user.id };

        serviceRequests = await prisma.serviceRequest.findMany({
          where: serviceRequestsWhere,
          include: {
            client: { select: { id: true, username: true, fullName: true, avatar: true } },
            producer: { select: { id: true, username: true, fullName: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
        });
      } catch (error) {
        console.log("ServiceRequest model not available", error);
      }

      const now = new Date();
      const allBookings = {
        studioBookings: studioBookings.map(booking => {
          const startTime = new Date(booking.startTime);
          const endTime = new Date(booking.endTime);
          const isActive = booking.status === "ACTIVE";
          const checkedInAt = booking.checkedInAt ? new Date(booking.checkedInAt) : null;
          let timeRemaining = null; let isOvertime = false; let overtimeMinutes = 0;

          if (isActive && checkedInAt) {
            const minutesUntilEnd = Math.round((endTime.getTime() - now.getTime()) / (1000 * 60));
            if (minutesUntilEnd > 0) timeRemaining = minutesUntilEnd;
            else { isOvertime = true; overtimeMinutes = Math.abs(minutesUntilEnd); }
          }

          return {
            ...booking,
            type: "STUDIO_BOOKING",
            itemName: booking.studio.name,
            providerName: booking.studio.owner?.user?.fullName || booking.studio.owner?.user?.username || "Unknown",
            customerName: booking.user?.fullName || booking.user?.username || "Unknown",
            sessionInfo: { isActive, checkedInAt: booking.checkedInAt, checkedOutAt: booking.checkedOutAt, qrCode: booking.qrCode, paymentStatus: booking.paymentStatus, overtimeMinutes: booking.overtimeMinutes, overtimeAmount: booking.overtimeAmount, timeRemaining, isOvertime, currentOvertimeMinutes: overtimeMinutes, bookerConfirmedCheckIn: booking.bookerConfirmedCheckIn },
          };
        }),
        equipmentRentals: [],
        serviceRequests: serviceRequests.map(request => ({
          ...request,
          type: "SERVICE_REQUEST",
          itemName: request.projectTitle,
          providerName: request.producer?.fullName || request.producer?.username || "Unknown",
          customerName: request.client?.fullName || request.client?.username || "Unknown",
        })),
        beatPurchases: [],
      };

      return NextResponse.json(allBookings);
    } catch (error: any) {
      console.error("Error fetching all bookings:", error);
      return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
    }
  });
}