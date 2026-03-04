import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import type { ApiResponse } from "@/types";

// POST /api/bookings/[id]/check-in - Studio owner initiates check-in (requires artist confirmation)
// SECURITY: QR code is MANDATORY, time window enforced, two-party confirmation required
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

      // Only studio owner can initiate check-in
      const isStudioOwner = booking.studio.owner.userId === user.id;
      if (!isStudioOwner) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Only the studio owner can initiate check-in", code: "FORBIDDEN" } },
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

      // SECURITY: QR code is MANDATORY - prevents starting session without the booker's QR code
      if (!qrCode) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "QR code is required for check-in. The artist must present their booking QR code.", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      if (!booking.qrCode || qrCode !== booking.qrCode) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Invalid QR code. Please verify the artist's booking QR code.", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      // SECURITY: Time window validation - can only check in within 30 minutes before scheduled start
      // and up to 15 minutes after (grace period for late arrivals)
      const now = new Date();
      const scheduledStart = new Date(booking.startTime);
      const earliestCheckIn = new Date(scheduledStart.getTime() - 30 * 60 * 1000); // 30 min before
      const latestCheckIn = new Date(scheduledStart.getTime() + 15 * 60 * 1000);   // 15 min after

      if (now < earliestCheckIn) {
        const minutesEarly = Math.ceil((earliestCheckIn.getTime() - now.getTime()) / (1000 * 60));
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: `Too early to check in. Check-in opens ${minutesEarly} minutes before the scheduled start time.`, code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      if (now > latestCheckIn) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Check-in window has expired. The session was scheduled to start more than 15 minutes ago. Please contact support or create a new booking.", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      // SECURITY: Generate a confirmation code that the artist must enter to confirm presence
      const confirmationCode = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6-char code
      const confirmationExpiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 min to confirm

      // Update booking: set to ACTIVE but require booker confirmation
      // Session timer starts but payment is protected until artist confirms
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          status: "ACTIVE",
          checkedInAt: now,
          confirmationCode,
          confirmationExpiresAt,
          bookerConfirmedCheckIn: false, // Artist hasn't confirmed yet
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

      // Notify the artist that they need to confirm their presence
      await prisma.notification.create({
        data: {
          userId: booking.userId,
          type: "SESSION_CONFIRM_REQUIRED",
          title: "Confirm Your Presence",
          message: `Your session at ${booking.studio.name} is starting. Please confirm your presence with code: ${confirmationCode}. This code expires in 10 minutes.`,
          referenceId: booking.id,
          referenceType: "BOOKING",
        },
      });

      // Also notify about session start
      await prisma.notification.create({
        data: {
          userId: booking.userId,
          type: "SESSION_CHECKED_IN",
          title: "Session Started",
          message: `Your session at ${booking.studio.name} has started. Please confirm your presence to secure your payment protection.`,
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
          description: `${booking.user.fullName || booking.user.username} checked in for their session. Awaiting artist confirmation.`,
          referenceId: booking.id,
          referenceType: "booking",
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          booking: updatedBooking,
          confirmationRequired: true,
          confirmationExpiresAt,
          message: "Session started. Artist must confirm their presence within 10 minutes using the confirmation code sent to them.",
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
