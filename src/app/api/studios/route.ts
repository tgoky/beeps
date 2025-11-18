import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

// GET /api/studios - Fetch all studios (with filters)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const location = searchParams.get("location");
    const country = searchParams.get("country");
    const state = searchParams.get("state");
    const city = searchParams.get("city");
    const minRate = searchParams.get("minRate");
    const maxRate = searchParams.get("maxRate");
    const ownerId = searchParams.get("ownerId");

    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }

    // Enhanced location filtering
    if (country) {
      where.country = { contains: country, mode: "insensitive" };
    }
    if (state) {
      where.state = { contains: state, mode: "insensitive" };
    }
    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    if (minRate || maxRate) {
      where.hourlyRate = {};
      if (minRate) where.hourlyRate.gte = parseFloat(minRate);
      if (maxRate) where.hourlyRate.lte = parseFloat(maxRate);
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    const studios = await prisma.studio.findMany({
      where,
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
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ studios });
  } catch (error: any) {
    console.error("Error fetching studios:", error);
    return NextResponse.json(
      { error: "Failed to fetch studios" },
      { status: 500 }
    );
  }
}

// POST /api/studios - Create a studio
export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const {
      name,
      description,
      location,
      latitude,
      longitude,
      hourlyRate,
      equipment,
      capacity,
      imageUrl,
      clubId,
    } = body;

    // Validate required fields
    if (!name || !location || !hourlyRate) {
      return NextResponse.json(
        { error: "Missing required fields: name, location, hourlyRate" },
        { status: 400 }
      );
    }

    // Check if user has a studio owner profile or is a producer
    let studioOwnerProfile = await prisma.studioOwnerProfile.findUnique({
      where: { userId: user.id },
    });

    // If no studio owner profile exists, create one (for producers creating studios)
    if (!studioOwnerProfile) {
      // Check if user has producer profile
      const producerProfile = await prisma.producerProfile.findUnique({
        where: { userId: user.id },
      });

      if (!producerProfile) {
        return NextResponse.json(
          { error: "You need a producer or studio owner profile to create studios" },
          { status: 403 }
        );
      }

      // Create studio owner profile for producer
      studioOwnerProfile = await prisma.studioOwnerProfile.create({
        data: {
          userId: user.id,
          studioName: name,
          equipment: equipment || [],
          capacity: capacity || "1-5 people",
          hourlyRate: hourlyRate.toString(),
        },
      });
    }

    // Extract location fields from request
    const { country, state, city } = body;

    const studio = await prisma.studio.create({
      data: {
        name,
        description,
        location,
        country: country || null,
        state: state || null,
        city: city || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        hourlyRate: parseFloat(hourlyRate),
        equipment: equipment || [],
        capacity: capacity || "1-5 people",
        imageUrl,
        ownerId: studioOwnerProfile.id,
        clubId: clubId || null,
      },
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
    });

    // Create activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: "UPLOAD",
        title: `Listed studio "${name}"`,
        description: `New studio available for booking at $${hourlyRate}/hour`,
        referenceId: studio.id,
        referenceType: "studio",
      },
    });

    return NextResponse.json({ studio }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating studio:", error);
    return NextResponse.json(
      { error: "Failed to create studio", details: error.message },
      { status: 500 }
    );
  }
});
