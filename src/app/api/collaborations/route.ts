import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";

// GET /api/collaborations - Fetch all collaborations with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // DEAL, COLLAB, BID
    const status = searchParams.get("status");
    const genre = searchParams.get("genre");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const creatorId = searchParams.get("creatorId");

    const where: any = {};

    if (type) where.type = type;
    if (status) where.status = status;
    else where.status = "ACTIVE"; // Default to active only

    if (genre) {
      where.genre = { has: genre };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (creatorId) where.creatorId = creatorId;

    const collaborations = await prisma.collaboration.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
        studio: {
          select: {
            id: true,
            name: true,
            location: true,
            hourlyRate: true,
          },
        },
        bids: {
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
          orderBy: {
            amount: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ collaborations });
  } catch (error) {
    console.error("Error fetching collaborations:", error);
    return NextResponse.json(
      { error: "Failed to fetch collaborations" },
      { status: 500 }
    );
  }
}

// POST /api/collaborations - Create a new collaboration
export async function POST(req: NextRequest) {
  return withAuth(req, async (req) => {
    const user = req.user!;
  try {
    const body = await req.json();
    const {
      type,
      title,
      description,
      studioId,
      price,
      minBid,
      duration,
      location,
      genre,
      equipment,
      slots,
      availableDate,
      expiresAt,
      imageUrl,
    } = body;

    // Validate required fields
    if (!type || !title) {
      return NextResponse.json(
        { error: "Type and title are required" },
        { status: 400 }
      );
    }

    // Validate type
    if (!["DEAL", "COLLAB", "BID"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid collaboration type" },
        { status: 400 }
      );
    }

    const collaboration = await prisma.collaboration.create({
      data: {
        type,
        title,
        description,
        creatorId: user.id,
        studioId: studioId || null,
        price: price ? parseFloat(price) : null,
        minBid: minBid ? parseFloat(minBid) : null,
        currentBid: minBid ? parseFloat(minBid) : null,
        duration,
        location,
        genre: genre || [],
        equipment: equipment || [],
        slots: slots || 1,
        availableDate: availableDate ? new Date(availableDate) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        imageUrl,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
        studio: true,
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: "UPLOAD",
        title: `Created ${type.toLowerCase()}: "${title}"`,
        description: description || `New ${type.toLowerCase()} available`,
        referenceId: collaboration.id,
        referenceType: "collaboration",
      },
    });

    return NextResponse.json({ collaboration }, { status: 201 });
  } catch (error) {
    console.error("Error creating collaboration:", error);
    return NextResponse.json(
      { error: "Failed to create collaboration" },
      { status: 500 }
    );
  }
  });
}
