import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

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
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

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
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            verified: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
        _count: {
          select: {
            beatLikes: true,
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
    const totalCount = await prisma.beat.count({ where });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        beats,
        pagination: {
          total: totalCount,
          limit: limit ? parseInt(limit) : beats.length,
          offset: offset ? parseInt(offset) : 0,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching beats:", error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        message: "Failed to fetch beats",
        code: "SERVER_ERROR",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
    }, { status: 500 });
  }
}

// POST /api/beats - Upload a beat
export async function POST(req: NextRequest) {
  return withAuth(req, async (req) => {
    const user = req.user!;
    
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
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Missing required fields: title, bpm, price, type, audioUrl",
            code: "VALIDATION_ERROR",
          },
        }, { status: 400 });
      }

      // Validate BPM range
      const bpmNum = parseInt(bpm);
      if (bpmNum < 20 || bpmNum > 300) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "BPM must be between 20 and 300",
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

      // Validate type
      if (!["LEASE", "EXCLUSIVE"].includes(type)) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Type must be either LEASE or EXCLUSIVE",
            code: "VALIDATION_ERROR",
          },
        }, { status: 400 });
      }

      // Check permissions - user must be a producer or have uploadBeats permission
      const permissions = req.permissions;
      if (!permissions?.canUploadBeats) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "You don't have permission to upload beats. You need a producer profile.",
            code: "INSUFFICIENT_PERMISSIONS",
          },
        }, { status: 403 });
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
              message: "You must be a member of the club to upload beats to it",
              code: "NOT_CLUB_MEMBER",
            },
          }, { status: 403 });
        }
      }

      const beat = await prisma.beat.create({
        data: {
          title,
          description,
          bpm: bpmNum,
          key,
          price: priceNum,
          type,
          genres: genres || [],
          moods: moods || [],
          tags: tags || [],
          imageUrl,
          audioUrl,
          producerId: user.id, // Beat relates directly to User, not ProducerProfile
          clubId: clubId || null,
        },
        include: {
          producer: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              verified: true,
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
          title: `Uploaded beat "${title}"`,
          description: `New ${type.toLowerCase()} beat at ${bpmNum} BPM for $${priceNum}`,
          referenceId: beat.id,
          referenceType: "beat",
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: { beat },
      }, { status: 201 });
    } catch (error: any) {
      console.error("Error creating beat:", error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: "Failed to upload beat",
          code: "SERVER_ERROR",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
      }, { status: 500 });
    }
  });
}