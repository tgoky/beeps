import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

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
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

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
          select: {
            id: true,
            businessName: true,
            specialties: true,
            userId: true,
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
                verified: true,
              },
            },
          },
        },
        club: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      ...(limit && { take: parseInt(limit) }),
      ...(offset && { skip: parseInt(offset) }),
    });

    // Get total count for pagination
    const totalCount = await prisma.equipment.count({ where });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        equipment,
        pagination: {
          total: totalCount,
          limit: limit ? parseInt(limit) : equipment.length,
          offset: offset ? parseInt(offset) : 0,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        message: "Failed to fetch equipment",
        code: "SERVER_ERROR",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
    }, { status: 500 });
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
        location,
        country,
        state,
        city,
        imageUrl,
        clubId,
      } = body;

      // Validate required fields
      if (!name || !category || !price || !condition) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Missing required fields: name, category, price, condition",
            code: "VALIDATION_ERROR",
          },
        }, { status: 400 });
      }

      // Validate price
      const priceNum = parseFloat(price);
      if (priceNum < 0) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Price must be a positive number",
            code: "VALIDATION_ERROR",
          },
        }, { status: 400 });
      }

      // Validate rental rate if provided
      if (rentalRate !== undefined && rentalRate !== null) {
        const rentalRateNum = parseFloat(rentalRate);
        if (rentalRateNum < 0) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: {
              message: "Rental rate must be a positive number",
              code: "VALIDATION_ERROR",
            },
          }, { status: 400 });
        }
      }

      // Validate condition
      const validConditions = ["New", "Like New", "Good", "Fair", "Poor"];
      if (!validConditions.includes(condition)) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: `Condition must be one of: ${validConditions.join(", ")}`,
            code: "VALIDATION_ERROR",
          },
        }, { status: 400 });
      }

      // Check if user has a gear sales profile
      let gearSalesProfile = await prisma.gearSalesProfile.findUnique({
        where: { userId: user.id },
      });

      // If no gear sales profile exists, create one automatically
      if (!gearSalesProfile) {
        gearSalesProfile = await prisma.gearSalesProfile.create({
          data: {
            userId: user.id,
            businessName: user.fullName || user.username || "Gear Seller",
            specialties: [category],
            inventory: "Various equipment",
          },
        });

        // Update user's primary role to GEAR_SALES if they're currently OTHER
        if (user.primaryRole === "OTHER") {
          await prisma.user.update({
            where: { id: user.id },
            data: { primaryRole: "GEAR_SALES" },
          });
        }
      } else {
        // Update specialties if category is new
        if (!gearSalesProfile.specialties.includes(category)) {
          await prisma.gearSalesProfile.update({
            where: { id: gearSalesProfile.id },
            data: {
              specialties: [...gearSalesProfile.specialties, category],
            },
          });
        }
      }

      // If clubId is provided, verify user is a member
      if (clubId) {
        const clubMembership = await prisma.clubMember.findUnique({
          where: {
            clubId_userId: {
              clubId,
              userId: user.id,
            },
          },
        });

        if (!clubMembership) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: {
              message: "You must be a member of the club to list equipment to it",
              code: "NOT_CLUB_MEMBER",
            },
          }, { status: 403 });
        }
      }

      const equipment = await prisma.equipment.create({
        data: {
          name,
          description,
          category,
          price: priceNum,
          rentalRate: rentalRate ? parseFloat(rentalRate) : null,
          condition,
          location,
          country,
          state,
          city,
          imageUrl,
          sellerId: gearSalesProfile.id,
          clubId: clubId || null,
        },
        include: {
          seller: {
            select: {
              id: true,
              businessName: true,
              specialties: true,
              userId: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                  avatar: true,
                  verified: true,
                },
              },
            },
          },
          club: {
            select: {
              id: true,
              name: true,
              icon: true,
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
          description: `${condition} ${category} for $${priceNum}${rentalRate ? ` or $${rentalRate}/day rental` : ""}`,
          referenceId: equipment.id,
          referenceType: "equipment",
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: { equipment },
      }, { status: 201 });
    } catch (error: any) {
      console.error("Error creating equipment:", error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: "Failed to list equipment",
          code: "SERVER_ERROR",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
      }, { status: 500 });
    }
  });
}