import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

// POST /api/bookings/[id]/confirm-check-in - Artist confirms they are present at the studio
// SECURITY: Two-party confirmation prevents producers from starting sessions without the artist
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req) => {
    const user = req.user!;

    try {
      const { id } = params;
      const body = await req.json().catch(() => ({}));
      const { confirmationCode } = body;

      if (!confirmationCode) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Confirmation code is required", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          studio: {
            include: {
              owner: {
                include: {
                  user: {
                    select: { id: true, username: true, fullName: true },
                  },
                },
              },
            },
          },
          user: {
            select: { id: true, username: true, fullName: true },
          },
        },
      });

      if (!booking) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Booking not found", code: "NOT_FOUND" } },
          { status: 404 }
        );
      }

      // Only the booking artist can confirm check-in
      if (booking.userId !== user.id) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Only the booking artist can confirm check-in", code: "FORBIDDEN" } },
          { status: 403 }
        );
      }

      // Session must be ACTIVE (studio owner already initiated check-in)
      if (booking.status !== "ACTIVE") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Session must be active to confirm check-in. The studio owner needs to initiate check-in first.", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      // Check if already confirmed
      if (booking.bookerConfirmedCheckIn) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "You have already confirmed your presence for this session", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      // Verify confirmation code
      if (!booking.confirmationCode || confirmationCode !== booking.confirmationCode) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Invalid confirmation code", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      // Check if confirmation code has expired
      const now = new Date();
      if (booking.confirmationExpiresAt && now > new Date(booking.confirmationExpiresAt)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Confirmation code has expired. Please ask the studio owner to re-initiate check-in.", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      // Confirm the artist's presence
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          bookerConfirmedCheckIn: true,
          confirmationCode: null, // Clear the code after use
          confirmationExpiresAt: null,
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

      // Notify studio owner that artist confirmed
      await prisma.notification.create({
        data: {
          userId: booking.studio.owner.userId,
          type: "SESSION_CONFIRMED_BY_BOOKER",
          title: "Artist Confirmed Presence",
          message: `${user.fullName || user.username} has confirmed their presence at ${booking.studio.name}. Session is now fully verified.`,
          referenceId: booking.id,
          referenceType: "BOOKING",
        },
      });

      // Activity log
      await prisma.activity.create({
        data: {
          userId: user.id,
          type: "SESSION_STARTED",
          title: `Confirmed presence at ${booking.studio.name}`,
          description: `Artist confirmed their presence for the session. Two-party verification complete.`,
          referenceId: booking.id,
          referenceType: "booking",
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          booking: updatedBooking,
          message: "Presence confirmed! Your session is now fully verified and your payment is protected.",
        },
      });
    } catch (error: any) {
      console.error("Error confirming check-in:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: "Failed to confirm check-in", code: "SERVER_ERROR", details: process.env.NODE_ENV === "development" ? error.message : undefined } },
        { status: 500 }
      );
    }
  });
}