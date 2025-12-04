import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

// GET /api/services - Fetch all services (with filters)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const country = searchParams.get("country");
    const state = searchParams.get("state");
    const city = searchParams.get("city");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const maxDeliveryTime = searchParams.get("maxDeliveryTime");
    const providerId = searchParams.get("providerId");

    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = { contains: category, mode: "insensitive" };
    }

    // Location filtering
    if (country) {
      where.country = { contains: country, mode: "insensitive" };
    }
    if (state) {
      where.state = { contains: state, mode: "insensitive" };
    }
    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (maxDeliveryTime) {
      where.deliveryTime = { lte: parseInt(maxDeliveryTime) };
    }

    if (providerId) {
      where.providerId = providerId;
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ services   });
}
  } catch (error: any) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// POST /api/services - Create a service offering
export async function POST(req: NextRequest) {
  return withAuth(req, async (req) => {
    const user = req.user!;
  try {
    const body = await req.json();
    const {
      title,
      description,
      category,
      price,
      deliveryTime,
      imageUrl,
      location,
      country,
      state,
      city,
      latitude,
      longitude,
      clubId,
    } = body;

    // Validate required fields
    if (!title || !category || !price || !deliveryTime) {
      return NextResponse.json(
        { error: "Missing required fields: title, category, price, deliveryTime" },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        title,
        description,
        category,
        price: parseFloat(price),
        deliveryTime: parseInt(deliveryTime),
        imageUrl,
        location: location || null,
        country: country || null,
        state: state || null,
        city: city || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        providerId: user.id,
        clubId: clubId || null,
      },
      include: {
        provider: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: "UPLOAD",
        title: `Listed service "${title}"`,
        description: `New ${category} service available for $${price}`,
        referenceId: service.id,
        referenceType: "service",
      },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service", details: error.message },
      { status: 500 }
    );
  }
  });
}
