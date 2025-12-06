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

    const producerProfiles = await prisma.producerProfile.findMany({
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
              orderBy: {
                createdAt: "desc",
              },
            },
            receivedServiceRequests: {
              select: {
                id: true,
                status: true,
              },
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
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the data to match the expected format
    const producers = await Promise.all(
      producerProfiles.map(async (profile) => {
        // Fetch studios for this user
        const studios = await prisma.studio.findMany({
          where: {
            owner: {
              userId: profile.userId,
            },
          },
          select: {
            id: true,
            name: true,
            location: true,
            hourlyRate: true,
          },
          take: 5,
        });

        return {
          id: profile.user.id,
          name: profile.user.fullName,
          email: profile.user.email,
          imageUrl: profile.user.avatar,
          bio: profile.user.bio,
          location: profile.user.location,
          studios: studios.map((studio) => ({
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
          services: [], // Placeholder for now
          createdAt: profile.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json({ producers });
  } catch (error: any) {
    console.error("Error fetching producers:", error);
    return NextResponse.json(
      { error: "Failed to fetch producers" },
      { status: 500 }
    );
  }
}
