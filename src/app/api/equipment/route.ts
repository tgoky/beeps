import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

// GET /api/equipment - Fetch all equipment with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const condition = searchParams.get("condition");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sellerId = searchParams.get("sellerId");
    const hasRental = searchParams.get("hasRental"); // "true" to show only rentable

    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = { contains: category, mode: "insensitive" };
    }

    if (condition) {
      where.condition = condition;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (sellerId) {
      where.sellerId = sellerId;
    }

    if (hasRental === "true") {
      where.rentalRate = { not: null };
    }

    const equipment = await prisma.equipment.findMany({
      where,
      include: {
        seller: {
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

    return NextResponse.json({ equipment   });
}
  } catch (error: any) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json(
      { error: "Failed to fetch equipment" },
      { status: 500 }
    );
  }
}

// POST /api/equipment - List equipment
export async function POST(req: NextRequest) {
  return withAuth(req, async (req) => {
    const user = req.user!;
  try {
    const body = await req.json();
    const {
      name,
      description,
      category,
      price,
      rentalRate,
      condition,
      imageUrl,
      clubId,
    } = body;

    // Validate required fields
    if (!name || !category || !price || !condition) {
      return NextResponse.json(
        { error: "Missing required fields: name, category, price, condition" },
        { status: 400 }
      );
    }

    // Check if user has a gear sales profile
    let gearSalesProfile = await prisma.gearSalesProfile.findUnique({
      where: { userId: user.id },
    });

    // If no gear sales profile exists, create one
    if (!gearSalesProfile) {
      gearSalesProfile = await prisma.gearSalesProfile.create({
        data: {
          userId: user.id,
          businessName: user.fullName || user.username || "Gear Seller",
          specialties: [category],
          inventory: "Various equipment",
        },
      });
    }

    const equipment = await prisma.equipment.create({
      data: {
        name,
        description,
        category,
        price: parseFloat(price),
        rentalRate: rentalRate ? parseFloat(rentalRate) : null,
        condition,
        imageUrl,
        sellerId: gearSalesProfile.id,
        clubId: clubId || null,
      },
      include: {
        seller: {
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
        title: `Listed equipment "${name}"`,
        description: `${condition} ${category} for $${price}${rentalRate ? ` or $${rentalRate}/day rental` : ""}`,
        referenceId: equipment.id,
        referenceType: "equipment",
      },
    });

    return NextResponse.json({ equipment }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating equipment:", error);
    return NextResponse.json(
      { error: "Failed to list equipment", details: error.message },
      { status: 500 }
    );
  }
  });
}
