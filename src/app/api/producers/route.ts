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

    const producers = await prisma.producerProfile.findMany({
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
            isVerified: true,
          },
        },
        beats: {
          where: { isActive: true },
          select: {
            id: true,
            title: true,
            imageUrl: true,
            plays: true,
            likes: true,
          },
          take: 5,
          orderBy: {
            createdAt: "desc",
          },
        },
        serviceRequests: {
          select: {
            id: true,
            status: true,
          },
        },
        _count: {
          select: {
            beats: true,
            serviceRequests: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ producers });
  } catch (error: any) {
    console.error("Error fetching producers:", error);
    return NextResponse.json(
      { error: "Failed to fetch producers" },
      { status: 500 }
    );
  }
}
