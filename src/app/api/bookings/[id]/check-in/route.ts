import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

// POST /api/bookings/[id]/check-in - Studio owner checks in an artist (starts session)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req) => {
    const user = req.user!;

    try {
      const { id } = params;
      const body = await req.json().catch(() => ({}));
      const { qrCode } = body;

      // Fetch booking with studio owner info
      const booking = await prisma.booking.findUnique({
        where: { id },
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
            },
          },
        },
      });

      if (!booking) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Booking not found", code: "NOT_FOUND" } },
          { status: 404 }
        );
      }

      // Only studio owner can check in
      const isStudioOwner = booking.studio.owner.userId === user.id;
      if (!isStudioOwner) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Only the studio owner can check in a session", code: "FORBIDDEN" } },
          { status: 403 }
        );
      }

      // Booking must be CONFIRMED to check in
      if (booking.status !== "CONFIRMED") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: `Cannot check in a booking with status: ${booking.status}. Booking must be CONFIRMED.`, code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      // If QR code provided, verify it matches
      if (qrCode && booking.qrCode && qrCode !== booking.qrCode) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Invalid QR code", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      // Update booking to ACTIVE with check-in time
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          status: "ACTIVE",
          checkedInAt: new Date(),
        },
        include: {
          studio: {
            include: {
              owner: {
                include: {
                  user: {
                    select: { id: true, username: true, fullName: true, avatar: true },
                  },
                },
              },
            },
          },
          user: {
            select: { id: true, username: true, fullName: true, avatar: true },
          },
        },
      });

      // Notify the artist that their session has started
      await prisma.notification.create({
        data: {
          userId: booking.userId,
          type: "SESSION_CHECKED_IN",
          title: "Session Started",
          message: `Your session at ${booking.studio.name} has started. Enjoy your recording time!`,
          referenceId: booking.id,
          referenceType: "BOOKING",
        },
      });

      // Create activity log
      await prisma.activity.create({
        data: {
          userId: user.id,
          type: "SESSION_STARTED",
          title: `Started session at ${booking.studio.name}`,
          description: `${booking.user.fullName || booking.user.username} checked in for their session`,
          referenceId: booking.id,
          referenceType: "booking",
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          booking: updatedBooking,
          message: "Session started successfully",
        },
      });
    } catch (error: any) {
      console.error("Error checking in booking:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: "Failed to check in", code: "SERVER_ERROR", details: process.env.NODE_ENV === "development" ? error.message : undefined } },
        { status: 500 }
      );
    }
  });
}