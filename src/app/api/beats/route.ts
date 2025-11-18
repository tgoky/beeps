import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

// GET /api/beats - Fetch all beats with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const genre = searchParams.get("genre");
    const mood = searchParams.get("mood");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const producerId = searchParams.get("producerId");
    const type = searchParams.get("type"); // LEASE or EXCLUSIVE

    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (genre) {
      where.genres = { has: genre };
    }

    if (mood) {
      where.moods = { has: mood };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (producerId) {
      where.producerId = producerId;
    }

    if (type) {
      where.type = type;
    }

    const beats = await prisma.beat.findMany({
      where,
      include: {
        producer: {
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
            transactions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ beats });
  } catch (error: any) {
    console.error("Error fetching beats:", error);
    return NextResponse.json(
      { error: "Failed to fetch beats" },
      { status: 500 }
    );
  }
}

// POST /api/beats - Upload a beat
export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const {
      title,
      description,
      bpm,
      key,
      price,
      type,
      genres,
      moods,
      tags,
      imageUrl,
      audioUrl,
      clubId,
    } = body;

    // Validate required fields
    if (!title || !bpm || !price || !type || !audioUrl) {
      return NextResponse.json(
        { error: "Missing required fields: title, bpm, price, type, audioUrl" },
        { status: 400 }
      );
    }

    // Check if user has a producer profile
    const producerProfile = await prisma.producerProfile.findUnique({
      where: { userId: user.id },
    });

    if (!producerProfile) {
      return NextResponse.json(
        { error: "You need a producer profile to upload beats" },
        { status: 403 }
      );
    }

    const beat = await prisma.beat.create({
      data: {
        title,
        description,
        bpm: parseInt(bpm),
        key,
        price: parseFloat(price),
        type,
        genres: genres || [],
        moods: moods || [],
        tags: tags || [],
        imageUrl,
        audioUrl,
        producerId: producerProfile.id,
        clubId: clubId || null,
      },
      include: {
        producer: {
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
        title: `Uploaded beat "${title}"`,
        description: `New ${type.toLowerCase()} beat at ${bpm} BPM for $${price}`,
        referenceId: beat.id,
        referenceType: "beat",
      },
    });

    return NextResponse.json({ beat }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating beat:", error);
    return NextResponse.json(
      { error: "Failed to upload beat", details: error.message },
      { status: 500 }
    );
  }
});
