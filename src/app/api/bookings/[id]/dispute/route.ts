import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

// POST /api/bookings/[id]/dispute - Raise a dispute on a completed session
// SECURITY: Either party can dispute within 24 hours of session end.
// Disputes freeze the escrow payment until resolved by platform.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req) => {
    const user = req.user!;

    try {
      const { id } = params;
      const body = await req.json().catch(() => ({}));
      const { reason } = body;

      if (!reason || reason.trim().length < 10) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "A detailed dispute reason is required (at least 10 characters)", code: "VALIDATION_ERROR" } },
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

      // Only the booker or studio owner can raise a dispute
      const isBooker = booking.userId === user.id;
      const isStudioOwner = booking.studio.owner.userId === user.id;

      if (!isBooker && !isStudioOwner) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Only the booking artist or studio owner can raise a dispute", code: "FORBIDDEN" } },
          { status: 403 }
        );
      }

      // Session must be COMPLETED or ACTIVE (allow dispute during active session too - e.g., artist not present)
      if (booking.status !== "COMPLETED" && booking.status !== "ACTIVE") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Disputes can only be raised on active or completed sessions", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      // Check if there's already an active dispute
      if (booking.disputeStatus === "OPEN" || booking.disputeStatus === "UNDER_REVIEW") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "A dispute is already active for this booking", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      // Check if payment is already released - cannot dispute after payment release
      if (booking.paymentStatus === "PAYMENT_RELEASED") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Cannot raise a dispute after payment has been released. Please contact support for post-payment issues.", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      // SECURITY: For completed sessions, enforce 24-hour dispute window
      if (booking.status === "COMPLETED" && booking.checkedOutAt) {
        const checkedOutAt = new Date(booking.checkedOutAt);
        const disputeDeadline = new Date(checkedOutAt.getTime() + 24 * 60 * 60 * 1000);
        const now = new Date();

        if (now > disputeDeadline) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: { message: "The 24-hour dispute window has expired for this session. Please contact support for further assistance.", code: "VALIDATION_ERROR" } },
            { status: 400 }
          );
        }
      }

      const now = new Date();

      // Open the dispute and freeze payment
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          disputeStatus: "OPEN",
          disputeReason: reason.trim(),
          disputedAt: now,
          disputedBy: user.id,
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

      const disputeRaiserRole = isBooker ? "artist" : "studio owner";
      const otherPartyId = isBooker ? booking.studio.owner.userId : booking.userId;
      const otherPartyRole = isBooker ? "studio owner" : "artist";

      // Notify the other party about the dispute
      await prisma.notification.create({
        data: {
          userId: otherPartyId,
          type: "SESSION_DISPUTE_OPENED",
          title: "Dispute Raised on Session",
          message: `The ${disputeRaiserRole} has raised a dispute on the session at ${booking.studio.name}. Reason: "${reason.trim().substring(0, 100)}${reason.trim().length > 100 ? "..." : ""}". Payment is frozen until resolved.`,
          referenceId: booking.id,
          referenceType: "BOOKING",
        },
      });

      // Notify the disputer of confirmation
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "SESSION_DISPUTE_OPENED",
          title: "Dispute Submitted",
          message: `Your dispute for the session at ${booking.studio.name} has been submitted. Payment is frozen until the dispute is resolved by our team.`,
          referenceId: booking.id,
          referenceType: "BOOKING",
        },
      });

      // Activity log
      await prisma.activity.create({
        data: {
          userId: user.id,
          type: "SESSION_ENDED",
          title: `Dispute raised for ${booking.studio.name}`,
          description: `${disputeRaiserRole} raised dispute: ${reason.trim().substring(0, 200)}`,
          referenceId: booking.id,
          referenceType: "booking",
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          booking: updatedBooking,
          dispute: {
            status: "OPEN",
            raisedBy: disputeRaiserRole,
            reason: reason.trim(),
            raisedAt: now,
            paymentFrozen: true,
          },
          message: "Dispute submitted. Payment has been frozen and our team will review the case.",
        },
      });
    } catch (error: any) {
      console.error("Error raising dispute:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: "Failed to raise dispute", code: "SERVER_ERROR", details: process.env.NODE_ENV === "development" ? error.message : undefined } },
        { status: 500 }
      );
    }
  });
}

// GET /api/bookings/[id]/dispute - Get dispute status for a booking
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req) => {
    const user = req.user!;

    try {
      const { id } = params;

      const booking = await prisma.booking.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          disputeStatus: true,
          disputeReason: true,
          disputedAt: true,
          disputeResolvedAt: true,
          disputedBy: true,
          totalAmount: true,
          proRataAmount: true,
          overtimeAmount: true,
          checkedOutAt: true,
          paymentReleaseEligibleAt: true,
          userId: true,
          studio: {
            select: {
              name: true,
              owner: {
                select: { userId: true },
              },
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

      // Only parties involved can view dispute details
      const isBooker = booking.userId === user.id;
      const isStudioOwner = booking.studio.owner.userId === user.id;

      if (!isBooker && !isStudioOwner) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: { message: "Unauthorized to view dispute details", code: "FORBIDDEN" } },
          { status: 403 }
        );
      }

      // Calculate if dispute window is still open
      let disputeWindowOpen = false;
      if (booking.checkedOutAt && !booking.disputeStatus) {
        const checkedOutAt = new Date(booking.checkedOutAt);
        const disputeDeadline = new Date(checkedOutAt.getTime() + 24 * 60 * 60 * 1000);
        disputeWindowOpen = new Date() < disputeDeadline;
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          dispute: {
            status: booking.disputeStatus || "NONE",
            reason: booking.disputeReason,
            raisedAt: booking.disputedAt,
            resolvedAt: booking.disputeResolvedAt,
            raisedBy: booking.disputedBy,
            disputeWindowOpen,
            paymentReleaseEligibleAt: booking.paymentReleaseEligibleAt,
          },
        },
      });
    } catch (error: any) {
      console.error("Error fetching dispute:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: "Failed to fetch dispute details", code: "SERVER_ERROR", details: process.env.NODE_ENV === "development" ? error.message : undefined } },
        { status: 500 }
      );
    }
  });
}
