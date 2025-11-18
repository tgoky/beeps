import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

// GET /api/bookings - Fetch user bookings
export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const asOwner = searchParams.get("asOwner") === "true";

    let where: any = {};

    if (asOwner) {
      // Fetch bookings for studios owned by the user
      where = {
        studio: {
          owner: {
            userId: user.id,
          },
        },
      };
    } else {
      // Fetch bookings made by the user
      where = {
        userId: user.id,
      };
    }

    if (status) {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
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

    return NextResponse.json({ bookings });
  } catch (error: any) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
});

// POST /api/bookings - Create a booking
export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { studioId, startTime, endTime, notes } = body;

    // Validate required fields
    if (!studioId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields: studioId, startTime, endTime" },
        { status: 400 }
      );
    }

    // Verify studio exists
    const studio = await prisma.studio.findUnique({
      where: { id: studioId },
      include: {
        owner: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 });
    }

    if (!studio.isActive) {
      return NextResponse.json(
        { error: "Studio is not available for booking" },
        { status: 400 }
      );
    }

    // Check for conflicting bookings
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        studioId,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        OR: [
          {
            AND: [
              { startTime: { lte: new Date(startTime) } },
              { endTime: { gt: new Date(startTime) } },
            ],
          },
          {
            AND: [
              { startTime: { lt: new Date(endTime) } },
              { endTime: { gte: new Date(endTime) } },
            ],
          },
          {
            AND: [
              { startTime: { gte: new Date(startTime) } },
              { endTime: { lte: new Date(endTime) } },
            ],
          },
        ],
      },
    });

    if (conflictingBooking) {
      return NextResponse.json(
        { error: "Studio is already booked for this time slot" },
        { status: 409 }
      );
    }

    // Calculate total amount
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const totalAmount = parseFloat(studio.hourlyRate.toString()) * hours;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        studioId,
        userId: user.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        totalAmount,
        notes,
        status: "PENDING",
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

    // Create notification for studio owner
    await prisma.notification.create({
      data: {
        userId: studio.owner.userId,
        type: "BOOKING_CONFIRMED",
        title: "New Booking Request",
        message: `${user.fullName || user.username} requested to book ${studio.name} from ${start.toLocaleDateString()} ${start.toLocaleTimeString()} to ${end.toLocaleTimeString()}`,
        referenceId: booking.id,
        referenceType: "BOOKING",
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: "COMPLETE",
        title: `Booked studio "${studio.name}"`,
        description: `Booking request for ${hours} hours at $${studio.hourlyRate}/hour`,
        referenceId: booking.id,
        referenceType: "booking",
      },
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking", details: error.message },
      { status: 500 }
    );
  }
});
