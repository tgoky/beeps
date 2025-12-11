import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

// GET /api/beats/[id] - Fetch a beat by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const beat = await prisma.beat.findUnique({
      where: { id },
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
        beatLikes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            beatLikes: true,
          },
        },
      },
    });

    if (!beat) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: "Beat not found",
          code: "NOT_FOUND",
        },
      }, { status: 404 });
    }

    // Increment plays
    await prisma.beat.update({
      where: { id },
      data: { plays: { increment: 1 } },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { beat },
    });
  } catch (error: any) {
    console.error("Error fetching beat:", error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        message: "Failed to fetch beat",
        code: "SERVER_ERROR",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
    }, { status: 500 });
  }
}

// PATCH /api/beats/[id] - Update a beat
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req) => {
    const user = req.user!;
    
    try {
      const { id } = params;
      const body = await req.json();

      // Verify beat exists and user owns it
      const beat = await prisma.beat.findUnique({
        where: { id },
        select: {
          id: true,
          producerId: true,
        },
      });

      if (!beat) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Beat not found",
            code: "NOT_FOUND",
          },
        }, { status: 404 });
      }

      if (beat.producerId !== user.id) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Unauthorized to update this beat",
            code: "FORBIDDEN",
          },
        }, { status: 403 });
      }

      const updatedBeat = await prisma.beat.update({
        where: { id },
        data: {
          ...(body.title && { title: body.title }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.bpm && { bpm: parseInt(body.bpm) }),
          ...(body.key !== undefined && { key: body.key }),
          ...(body.price && { price: parseFloat(body.price) }),
          ...(body.type && { type: body.type }),
          ...(body.genres && { genres: body.genres }),
          ...(body.moods && { moods: body.moods }),
          ...(body.tags && { tags: body.tags }),
          ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
          ...(body.audioUrl && { audioUrl: body.audioUrl }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
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

      return NextResponse.json<ApiResponse>({
        success: true,
        data: { beat: updatedBeat },
      });
    } catch (error: any) {
      console.error("Error updating beat:", error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: "Failed to update beat",
          code: "SERVER_ERROR",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
      }, { status: 500 });
    }
  });
}

// DELETE /api/beats/[id] - Delete a beat (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req) => {
    const user = req.user!;
    
    try {
      const { id } = params;

      // Verify beat exists and user owns it
      const beat = await prisma.beat.findUnique({
        where: { id },
        select: {
          id: true,
          producerId: true,
        },
      });

      if (!beat) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Beat not found",
            code: "NOT_FOUND",
          },
        }, { status: 404 });
      }

      if (beat.producerId !== user.id) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Unauthorized to delete this beat",
            code: "FORBIDDEN",
          },
        }, { status: 403 });
      }

      // Soft delete by marking as inactive
      await prisma.beat.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: { message: "Beat deleted successfully" },
      });
    } catch (error: any) {
      console.error("Error deleting beat:", error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: "Failed to delete beat",
          code: "SERVER_ERROR",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
      }, { status: 500 });
    }
  });
}