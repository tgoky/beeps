import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/producers - Fetch all producers with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const genre = searchParams.get("genre");
    const skill = searchParams.get("skill");

    const where: any = {};

    // Build where clause for user search
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
              verified: true,
              email: true,
              followersCount: true,
              followingCount: true,
              uploadedBeats: {
                where: { isActive: true },
                select: {
                  id: true,
                  title: true,
                  imageUrl: true,
                  plays: true,
                  likes: true,
                  price: true,
                },
                take: 5,
                orderBy: { createdAt: "desc" },
              },
              receivedServiceRequests: {
                select: { id: true, status: true },
              },
              _count: {
                select: {
                  uploadedBeats: true,
                  receivedServiceRequests: true,
                },
              },
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
      id: profile.user.id,
      name: profile.user.fullName,
      email: profile.user.email,
      imageUrl: profile.user.avatar,
      bio: profile.user.bio,
      location: profile.user.location,
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
    }));

    return NextResponse.json({ producers, pagination: { total, limit, offset } });
  } catch (error: any) {
    console.error("Error fetching producers:", error);
    return NextResponse.json(
      { error: "Failed to fetch producers" },
      { status: 500 }
    );
  }
}
