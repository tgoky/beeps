import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { getCurrencyConfig } from "@/lib/currency";
import { unstable_cache } from 'next/cache';
import { Prisma } from "@prisma/client";

// ✅ Next.js Cache Wrapper for the heavy DB call (Non-Geo searches)
const getCachedStudios = unstable_cache(
  async (whereParams: any, limit: number, offset: number) => {
    const [studios, total] = await Promise.all([
      prisma.studio.findMany({
        where: whereParams,
        select: {
          id: true, name: true, description: true, location: true, streetAddress: true,
          country: true, state: true, city: true, latitude: true, longitude: true,
          hourlyRate: true, currency: true, imageUrl: true, equipment: true, capacity: true,
          rating: true, reviewsCount: true, isActive: true, verificationStatus: true,
          verifiedAt: true, ownerId: true, createdAt: true, updatedAt: true,
          owner: { select: { id: true, user: { select: { id: true, username: true, fullName: true, avatar: true } } } },
          _count: { select: { bookings: true, reviews: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.studio.count({ where: whereParams }),
    ]);
    return { studios, total };
  },
  ['studios-list'],
  { revalidate: 60 } // Keeps it fast but fresh every 60 seconds
);

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
      AND: [] 
    };

    if (search) {
      where.AND.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
        ]
      });
    }

    if (location) {
      where.AND.push({ location: { contains: location, mode: "insensitive" } });
    }

    if (country) {
      const currencyMap: Record<string, string> = {
        "Nigeria": "NGN",
        "Ghana": "GHS",
        "United States": "USD",
        "United Kingdom": "GBP"
      };
      const mappedCurrency = currencyMap[country];
      
      if (mappedCurrency) {
        where.AND.push({
          OR: [
            { country: { contains: country, mode: "insensitive" } },
            { currency: mappedCurrency } 
          ]
        });
      } else {
        where.AND.push({ country: { contains: country, mode: "insensitive" } });
      }
    }

    if (state) where.AND.push({ state: { contains: state, mode: "insensitive" } });
    if (city) where.AND.push({ city: { contains: city, mode: "insensitive" } });

    if (minRate || maxRate) {
      const rateFilter: any = {};
      if (minRate) rateFilter.gte = parseFloat(minRate);
      if (maxRate) rateFilter.lte = parseFloat(maxRate);
      where.AND.push({ hourlyRate: rateFilter });
    }

    if (ownerId) where.AND.push({ ownerId });

    if (where.AND.length === 0) {
      delete where.AND;
    }

    let studiosResult: any = [];
    let totalResult: number = 0;

    if (hasNearbyFilter) {
      // ✅ 1. THE DATABASE MATH: Offload distance calc to PostgreSQL Engine
      const nearbyStudioRecords = await prisma.$queryRaw<Array<{ id: string; distanceMiles: number }>>`
        WITH Distances AS (
          SELECT id, (
            3958.8 * acos(
              LEAST(1.0, GREATEST(-1.0,
                cos(radians(${userLatitude}::float)) * cos(radians("latitude"::float)) *
                cos(radians("longitude"::float) - radians(${userLongitude}::float)) +
                sin(radians(${userLatitude}::float)) * sin(radians("latitude"::float))
              ))
            )
          ) AS "distanceMiles"
          FROM "Studio"
          WHERE "isActive" = true AND "latitude" IS NOT NULL AND "longitude" IS NOT NULL
        )
        SELECT id, "distanceMiles"
        FROM Distances
        WHERE "distanceMiles" <= ${radiusMiles}::float
        ORDER BY "distanceMiles" ASC
      `;

      if (nearbyStudioRecords.length > 0) {
        // Create a fast-lookup map to preserve the distance sorting later
        const distanceMap = new Map(nearbyStudioRecords.map(s => [s.id, s.distanceMiles]));
        const nearbyIds = Array.from(distanceMap.keys());

        // Update the Prisma WHERE clause to only search within these pre-filtered IDs!
        if (!where.AND) where.AND = [];
        where.AND.push({ id: { in: nearbyIds } });

        // ✅ 2. PRISMA MAGIC: Fetch only the matching records + nested relations
        const [rawStudios, rawTotal] = await Promise.all([
          prisma.studio.findMany({
            where,
            select: {
              id: true, name: true, description: true, location: true, streetAddress: true,
              country: true, state: true, city: true, latitude: true, longitude: true,
              hourlyRate: true, currency: true, imageUrl: true, equipment: true, capacity: true,
              rating: true, reviewsCount: true, isActive: true, verificationStatus: true,
              verifiedAt: true, ownerId: true, createdAt: true, updatedAt: true,
              owner: { select: { id: true, user: { select: { id: true, username: true, fullName: true, avatar: true } } } },
              _count: { select: { bookings: true, reviews: true } },
            },
            // Note: NO ORDER BY here. We want to sort by the raw SQL distance map below.
          }),
          prisma.studio.count({ where }),
        ]);

        // Attach the calculated distances and sort to match PostgreSQL's raw math
        studiosResult = rawStudios
          .map((studio: any) => ({
            ...studio,
            distanceMiles: distanceMap.get(studio.id)
          }))
          .sort((a: any, b: any) => a.distanceMiles - b.distanceMiles);

        totalResult = rawTotal;
      }
    } else {
      // ✅ NO GEO-FILTER: Fallback to edge cache speed
      const cached = await getCachedStudios(where, limit, offset);
      studiosResult = cached.studios;
      totalResult = cached.total;
    }

    // Apply standard pagination (slice) AFTER everything is sorted
    const studios = hasNearbyFilter
      ? studiosResult.slice(offset, offset + limit)
      : studiosResult;

    return NextResponse.json({
      studios,
      pagination: { total: totalResult, limit, offset },
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
export async function POST(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => { 
    try {
      const user = req.user!;
      const body = await req.json();
      const {
        name, description, location, latitude, longitude, hourlyRate, currency,
        equipment, capacity, imageUrl, clubId, streetAddress, country, state, city
      } = body;

      if (!name || !location || !hourlyRate) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      let studioOwnerProfile = await prisma.studioOwnerProfile.findUnique({
        where: { userId: user.id },
      });

      if (!studioOwnerProfile) {
        const producerProfile = await prisma.producerProfile.findUnique({
          where: { userId: user.id },
        });

        if (!producerProfile) {
          return NextResponse.json({ error: "You need a producer or studio owner profile to create studios" }, { status: 403 });
        }

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

      const resolvedCurrency = getCurrencyConfig(body.countryCode || country).currency;
      const studioCurrency = (currency && currency !== "USD") ? currency : resolvedCurrency;

      const studio = await prisma.studio.create({
        data: {
          name, description, location, streetAddress: streetAddress || null,
          country: country || null, state: state || null, city: city || null,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          hourlyRate: parseFloat(hourlyRate), currency: studioCurrency,
          equipment: equipment || [], capacity: capacity || "1-5 people",
          imageUrl, ownerId: studioOwnerProfile.id, clubId: clubId || null,
        },
        include: {
          owner: { include: { user: { select: { id: true, username: true, fullName: true, avatar: true } } } },
        },
      });

      await prisma.activity.create({
        data: {
          userId: user.id, type: "UPLOAD", title: `Listed studio "${name}"`,
          description: `New studio available for booking at $${hourlyRate}/hour`,
          referenceId: studio.id, referenceType: "studio",
        },
      });

      return NextResponse.json({ studio }, { status: 201 });
    } catch (error: any) {
      console.error("Error creating studio:", error);
      return NextResponse.json({ error: "Failed to create studio", details: error.message }, { status: 500 });
    }
  });
}