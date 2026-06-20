export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// ✅ FIX #14: Cached producers query with invalidation tag
const getCachedProducers = unstable_cache(
  async (where: any, userWhere: any, limit: number, offset: number) => {
    const [producerProfiles, total] = await Promise.all([
      prisma.producerProfile.findMany({
        where: {
          ...where,
          ...(Object.keys(userWhere).length > 0 && { user: userWhere }),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              bio: true,
              location: true,
              latitude: true,  
              longitude: true, 
              verified: true,
              email: true,
              currency: true,
              followersCount: true,
              followingCount: true,
              uploadedBeats: {
                where: { isActive: true },
                select: { id: true, title: true, imageUrl: true, plays: true, likes: true, price: true },
                take: 5,
                orderBy: { createdAt: "desc" },
              },
              receivedServiceRequests: { select: { id: true, status: true } },
              _count: { select: { uploadedBeats: true, receivedServiceRequests: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.producerProfile.count({
        where: {
          ...where,
          ...(Object.keys(userWhere).length > 0 && { user: userWhere }),
        },
      }),
    ]);

    // Batch-fetch studios for all producers in one query (eliminates N+1)
    const userIds = producerProfiles.map((p) => p.userId);
    const studioOwnerProfiles = userIds.length
      ? await prisma.studioOwnerProfile.findMany({
          where: { userId: { in: userIds } },
          select: {
            userId: true,
            studios: {
              select: { id: true, name: true, location: true, hourlyRate: true },
              take: 5,
            },
          },
        })
      : [];

    const studiosByUserId = Object.fromEntries(
      studioOwnerProfiles.map((sop) => [sop.userId, sop.studios])
    );

    const producers = producerProfiles.map((profile) => ({
      // --- WEB APP EXPECTS THESE AT TOP LEVEL ---
      id: profile.id,
      userId: profile.userId,
      name: profile.user.fullName || profile.user.username,
      email: profile.user.email,
      imageUrl: profile.user.avatar,
      bio: profile.user.bio,
      location: profile.user.location,
      lat: profile.user.latitude,   
      lng: profile.user.longitude,  
      verified: profile.user.verified,
      followersCount: profile.user.followersCount || 0,
      followingCount: profile.user.followingCount || 0,
      genres: profile.genres || [],
      specialties: profile.specialties || [],
      studios: (studiosByUserId[profile.userId] || []).map((studio) => ({
        id: studio.id,
        name: studio.name,
        location: studio.location,
        hourlyRate: Number(studio.hourlyRate),
      })),
      beats: profile.user.uploadedBeats.map((beat) => ({
        id: beat.id,
        title: beat.title,
        price: Number(beat.price || 0),
        likeCount: beat.likes || 0,
      })),
      services: [],
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),

      // --- MOBILE APP ADDITIONS ---
      equipment: profile.equipment || [],
      experience: profile.experience || 0,
      productionRate: profile.productionRate,
      songwritingRate: profile.songwritingRate,
      mixingRate: profile.mixingRate,
      currency: profile.user.currency || "USD",
      availability: profile.availability || 'AVAILABLE',
      user: {
        id: profile.user.id,
        username: profile.user.username,
        fullName: profile.user.fullName,
        avatar: profile.user.avatar,
        location: profile.user.location,
        bio: profile.user.bio,
        verified: profile.user.verified,
        followersCount: profile.user.followersCount || 0,
        rating: 5.0
      }
    }));

    return { producers, total };
  },
  ['producers-list'],
  { revalidate: 60, tags: ['producers'] }
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const genre = searchParams.get("genre");
    const skill = searchParams.get("skill");

    const where: any = {};
    const userWhere: any = {};
    
    if (search) {
      userWhere.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (genre) {
      where.genres = { has: genre };
    }

    if (skill) {
      where.specialties = { has: skill };
    }

    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // ✅ FIX #14: Use cached query
    const { producers, total } = await getCachedProducers(where, userWhere, limit, offset);

    // Mobile expects { producers: [] }, Web expects { producers: [], pagination: {} }
    // By returning both properties, both apps are perfectly happy!
    return NextResponse.json({ producers, pagination: { total, limit, offset } });
  } catch (error: any) {
    console.error("Error fetching producers:", error);
    return NextResponse.json(
      { error: "Failed to fetch producers" },
      { status: 500 }
    );
  }
}