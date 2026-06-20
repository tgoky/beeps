import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import type { ApiResponse } from "@/types";
// ❌ REMOVE THIS LINE:
// import { emitToUser } from "@/lib/session-emitter";

// POST /api/bookings/[id]/check-in - Studio owner initiates check-in (requires artist confirmation)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req: AuthenticatedRequest) => {
    const user = req.user!;

    try {
      const { id } = params;
      const body = await req.json().catch(() => ({}));
      const { qrCode } = body;

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

      const isStudioOwner = booking.studio.owner.userId === user.id;
      if (!isStudioOwner) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Only the studio owner can initiate check-in", code: "FORBIDDEN" } },
          { status: 403 }
        );
      }

      if (booking.status !== "CONFIRMED") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: `Cannot check in a booking with status: ${booking.status}. Booking must be CONFIRMED.`, code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

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

      const now = new Date();
      const scheduledStart = new Date(booking.startTime);
      const earliestCheckIn = new Date(scheduledStart.getTime() - 30 * 60 * 1000);
      const latestCheckIn = new Date(scheduledStart.getTime() + 15 * 60 * 1000);

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

      const confirmationCode = crypto.randomBytes(3).toString("hex").toUpperCase();
      const confirmationExpiresAt = new Date(now.getTime() + 10 * 60 * 1000);

      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          status: "ACTIVE",
          checkedInAt: now,
          confirmationCode,
          confirmationExpiresAt,
          bookerConfirmedCheckIn: false,
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

      // ❌ REMOVE THESE 3 LINES:
      // const sessionPayload = { bookingId: id, status: "ACTIVE", checkedInAt: now.toISOString() };
      // emitToUser(user.id, "session_updated", sessionPayload);
      // emitToUser(booking.userId, "session_updated", sessionPayload);

      // Notifications - these can be parallel
      await Promise.all([
        prisma.notification.create({
          data: {
            userId: booking.userId,
            type: "SESSION_CONFIRM_REQUIRED",
            title: "Confirm Your Presence",
            message: `Your session at ${booking.studio.name} is starting. Please confirm your presence with code: ${confirmationCode}. This code expires in 10 minutes.`,
            referenceId: booking.id,
            referenceType: "BOOKING",
          },
        }),
        prisma.notification.create({
          data: {
            userId: booking.userId,
            type: "SESSION_CHECKED_IN",
            title: "Session Started",
            message: `Your session at ${booking.studio.name} has started. Please confirm your presence to secure your payment protection.`,
            referenceId: booking.id,
            referenceType: "BOOKING",
          },
        }),
        prisma.activity.create({
          data: {
            userId: user.id,
            type: "SESSION_STARTED",
            title: `Started session at ${booking.studio.name}`,
            description: `${booking.user.fullName || booking.user.username} checked in for their session. Awaiting artist confirmation.`,
            referenceId: booking.id,
            referenceType: "booking",
          },
        }),
      ]);

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