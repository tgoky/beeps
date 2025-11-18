import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

// GET /api/bookings/[id] - Fetch a booking by ID
export const GET = withAuth(
  async (req: NextRequest, { user, params }: { user: any; params: any }) => {
    try {
      const { id } = params;

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
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 }
        );
      }

      // Check if user is authorized to view this booking
      const isBookingOwner = booking.userId === user.id;
      const isStudioOwner = booking.studio.owner.userId === user.id;

      if (!isBookingOwner && !isStudioOwner) {
        return NextResponse.json(
          { error: "Unauthorized to view this booking" },
          { status: 403 }
        );
      }

      return NextResponse.json({ booking });
    } catch (error: any) {
      console.error("Error fetching booking:", error);
      return NextResponse.json(
        { error: "Failed to fetch booking" },
        { status: 500 }
      );
    }
  }
);

// PATCH /api/bookings/[id] - Update a booking
export const PATCH = withAuth(
  async (req: NextRequest, { user, params }: { user: any; params: any }) => {
    try {
      const { id } = params;
      const body = await req.json();

      // Verify booking exists
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          studio: {
            include: {
              owner: true,
            },
          },
          user: true,
        },
      });

      if (!booking) {
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 }
        );
      }

      // Check authorization
      const isBookingOwner = booking.userId === user.id;
      const isStudioOwner = booking.studio.owner.userId === user.id;

      if (!isBookingOwner && !isStudioOwner) {
        return NextResponse.json(
          { error: "Unauthorized to update this booking" },
          { status: 403 }
        );
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
      });

      // Send notification based on status change
      if (body.status) {
        let notificationMessage = "";
        let notificationType = "BOOKING_CONFIRMED";
        let recipientId = booking.userId;

        if (body.status === "CONFIRMED" && isStudioOwner) {
          notificationMessage = `Your booking for ${booking.studio.name} has been confirmed!`;
          notificationType = "BOOKING_CONFIRMED";
          recipientId = booking.userId;
        } else if (body.status === "CANCELLED") {
          notificationMessage = `Booking for ${booking.studio.name} has been cancelled`;
          notificationType = "BOOKING_CANCELLED";
          recipientId = isStudioOwner ? booking.userId : booking.studio.owner.userId;
        } else if (body.status === "COMPLETED") {
          notificationMessage = `Booking for ${booking.studio.name} has been completed`;
          notificationType = "TRANSACTION_COMPLETED";
          recipientId = booking.userId;
        }

        if (notificationMessage) {
          await prisma.notification.create({
            data: {
              userId: recipientId,
              type: notificationType,
              title: "Booking Update",
              message: notificationMessage,
              referenceId: booking.id,
              referenceType: "BOOKING",
            },
          });
        }
      }

      return NextResponse.json({ booking: updatedBooking });
    } catch (error: any) {
      console.error("Error updating booking:", error);
      return NextResponse.json(
        { error: "Failed to update booking" },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/bookings/[id] - Cancel a booking
export const DELETE = withAuth(
  async (req: NextRequest, { user, params }: { user: any; params: any }) => {
    try {
      const { id } = params;

      // Verify booking exists
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          studio: {
            include: {
              owner: true,
            },
          },
        },
      });

      if (!booking) {
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 }
        );
      }

      // Check authorization
      const isBookingOwner = booking.userId === user.id;
      const isStudioOwner = booking.studio.owner.userId === user.id;

      if (!isBookingOwner && !isStudioOwner) {
        return NextResponse.json(
          { error: "Unauthorized to cancel this booking" },
          { status: 403 }
        );
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
          type: "BOOKING_CANCELLED",
          title: "Booking Cancelled",
          message: `Booking for ${booking.studio.name} has been cancelled`,
          referenceId: booking.id,
          referenceType: "BOOKING",
        },
      });

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting booking:", error);
      return NextResponse.json(
        { error: "Failed to cancel booking" },
        { status: 500 }
      );
    }
  }
);
