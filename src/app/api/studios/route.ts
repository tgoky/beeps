import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { getCurrencyConfig } from "@/lib/currency";

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const radiusInMiles = 3958.8;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radiusInMiles * c;
};

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
    const latitude = searchParams.get("latitude");
    const longitude = searchParams.get("longitude");
    const radius = searchParams.get("radius");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const userLatitude = latitude !== null ? parseFloat(latitude) : null;
    const userLongitude = longitude !== null ? parseFloat(longitude) : null;
    const radiusMiles = radius !== null ? parseFloat(radius) : 50;
    const hasNearbyFilter =
      userLatitude !== null &&
      userLongitude !== null &&
      Number.isFinite(userLatitude) &&
      Number.isFinite(userLongitude) &&
      Number.isFinite(radiusMiles);

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

    if (hasNearbyFilter) {
      where.latitude = { not: null };
      where.longitude = { not: null };
    }

    const [studiosResult, totalResult] = await Promise.all([
      prisma.studio.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          location: true,
          streetAddress: true,
          country: true,
          state: true,
          city: true,
          latitude: true,
          longitude: true,
          hourlyRate: true,
          currency: true,
          imageUrl: true,
          equipment: true,
          capacity: true,
          rating: true,
          reviewsCount: true,
          isActive: true,
          verificationStatus: true,
          verifiedAt: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
          owner: {
            select: {
              id: true,
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
        orderBy: { createdAt: "desc" },
        take: hasNearbyFilter ? undefined : limit,
        skip: hasNearbyFilter ? undefined : offset,
      }),
      prisma.studio.count({ where }),
    ]);

    const studiosWithDistance = hasNearbyFilter
      ? studiosResult
          .map((studio) => ({
            ...studio,
            distanceMiles:
              studio.latitude !== null && studio.longitude !== null
                ? calculateDistance(userLatitude!, userLongitude!, studio.latitude, studio.longitude)
                : null,
          }))
          .filter(
            (studio) => studio.distanceMiles !== null && studio.distanceMiles <= radiusMiles
          )
          .sort((a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity))
      : studiosResult;

    const studios = hasNearbyFilter
      ? studiosWithDistance.slice(offset, offset + limit)
      : studiosWithDistance;
    const total = hasNearbyFilter ? studiosWithDistance.length : totalResult;

    return NextResponse.json({
      studios,
      pagination: { total, limit, offset },
    });
  } catch (error: any) {
    console.error("Error fetching studios:", error);
    return NextResponse.json(
      { error: "Failed to fetch studios" },
      { status: 500 }
    );
  }
}

// POST /api/studios - Create a studio
// FIXED: Changed to match withAuth(request, handler) signature
export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const user = req.user!;
      const body = await req.json();
      const {
        name,
        description,
        location,
        latitude,
        longitude,
        hourlyRate,
        currency,
        equipment,
        capacity,
        imageUrl,
        clubId,
        streetAddress,
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
      const studioCurrency = currency || getCurrencyConfig(body.countryCode || country).currency;

      const studio = await prisma.studio.create({
        data: {
          name,
          description,
          location,
          streetAddress: streetAddress || null,
          country: country || null,
          state: state || null,
          city: city || null,
          latitude: latitude !== undefined && latitude !== null && latitude !== "" ? parseFloat(latitude) : null,
          longitude: longitude !== undefined && longitude !== null && longitude !== "" ? parseFloat(longitude) : null,
          hourlyRate: parseFloat(hourlyRate),
          currency: studioCurrency,
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
}
