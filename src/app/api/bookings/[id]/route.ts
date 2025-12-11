import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";
import { NotificationType } from "@prisma/client";

// GET /api/bookings/[id] - Fetch a booking by ID
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
        include: {
          studio: {
            include: {
              owner: {
                select: {
                  id: true,
                  userId: true,
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

      // Check if user is authorized to view this booking
      const isBookingOwner = booking.userId === user.id;
      const isStudioOwner = booking.studio.owner.userId === user.id;

      if (!isBookingOwner && !isStudioOwner) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Unauthorized to view this booking",
            code: "FORBIDDEN",
          },
        }, { status: 403 });
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        data: { booking },
      });
    } catch (error: any) {
      console.error("Error fetching booking:", error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: "Failed to fetch booking",
          code: "SERVER_ERROR",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
      }, { status: 500 });
    }
  });
}

// PATCH /api/bookings/[id] - Update a booking
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req) => {
    const user = req.user!;
    
    try {
      const { id } = params;
      const body = await req.json();

      // Verify booking exists
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          studio: {
            select: {
              id: true,
              name: true,
              ownerId: true,
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

      // Check authorization
      const isBookingOwner = booking.userId === user.id;
      const isStudioOwner = booking.studio.owner.userId === user.id;

      if (!isBookingOwner && !isStudioOwner) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Unauthorized to update this booking",
            code: "FORBIDDEN",
          },
        }, { status: 403 });
      }

      // Validate status if provided
      if (body.status && !["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].includes(body.status)) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Invalid booking status",
            code: "VALIDATION_ERROR",
          },
        }, { status: 400 });
      }

      // Update booking
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          ...(body.status && { status: body.status }),
          ...(body.notes !== undefined && { notes: body.notes }),
          ...(body.startTime && { startTime: new Date(body.startTime) }),
          ...(body.endTime && { endTime: new Date(body.endTime) }),
        },
        include: {
          studio: {
            include: {
              owner: {
                select: {
                  id: true,
                  userId: true,
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
      });

      // Send notification based on status change
      if (body.status) {
        let notificationMessage = "";
        let notificationType: NotificationType | null = null;
        let recipientId = booking.userId;

        if (body.status === "CONFIRMED" && isStudioOwner) {
          notificationMessage = `Your booking for ${booking.studio.name} has been confirmed!`;
          notificationType = NotificationType.BOOKING_CONFIRMED;
          recipientId = booking.userId;
        } else if (body.status === "CANCELLED") {
          notificationMessage = `Booking for ${booking.studio.name} has been cancelled`;
          notificationType = NotificationType.BOOKING_CANCELLED;
          recipientId = isStudioOwner ? booking.userId : booking.studio.owner.userId;
        } else if (body.status === "COMPLETED") {
          notificationMessage = `Booking for ${booking.studio.name} has been completed`;
          notificationType = NotificationType.TRANSACTION_COMPLETED;
          recipientId = booking.userId;
        }

        if (notificationMessage && notificationType) {
          await prisma.notification.create({
            data: {
              userId: recipientId,
              type: notificationType,
              title: "Booking Update",
              message: notificationMessage,
              referenceId: booking.id,
              referenceType: "booking",
            },
          });
        }
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        data: { booking: updatedBooking },
      });
    } catch (error: any) {
      console.error("Error updating booking:", error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: "Failed to update booking",
          code: "SERVER_ERROR",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
      }, { status: 500 });
    }
  });
}

// DELETE /api/bookings/[id] - Cancel a booking
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req) => {
    const user = req.user!;
    
    try {
      const { id } = params;

      // Verify booking exists
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          studio: {
            select: {
              id: true,
              name: true,
              ownerId: true,
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

      // Check authorization
      const isBookingOwner = booking.userId === user.id;
      const isStudioOwner = booking.studio.owner.userId === user.id;

      if (!isBookingOwner && !isStudioOwner) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Unauthorized to cancel this booking",
            code: "FORBIDDEN",
          },
        }, { status: 403 });
      }

      // Don't allow cancelling already completed bookings
      if (booking.status === "COMPLETED") {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Cannot cancel a completed booking",
            code: "VALIDATION_ERROR",
          },
        }, { status: 400 });
      }

      // Update booking status to CANCELLED
      await prisma.booking.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      // Notify the other party
      const recipientId = isBookingOwner ? booking.studio.owner.userId : booking.userId;
      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: NotificationType.BOOKING_CANCELLED,
          title: "Booking Cancelled",
          message: `Booking for ${booking.studio.name} has been cancelled`,
          referenceId: booking.id,
          referenceType: "booking",
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: { message: "Booking cancelled successfully" },
      });
    } catch (error: any) {
      console.error("Error deleting booking:", error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: "Failed to cancel booking",
          code: "SERVER_ERROR",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
      }, { status: 500 });
    }
  });
}