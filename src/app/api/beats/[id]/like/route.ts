import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-middleware";
import type { ApiResponse } from "@/types";

// POST /api/beats/[id]/like - Toggle like on a beat
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req) => {
    const user = req.user!;
    
    try {
      const { id } = params;

      // Check if beat exists
      const beat = await prisma.beat.findUnique({
        where: { id },
        include: {
          producer: {
            select: {
              id: true,
              username: true,
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

      // Check if user has already liked this beat
      const existingLike = await prisma.beatLike.findUnique({
        where: {
          beatId_userId: {
            beatId: id,
            userId: user.id,
          },
        },
      });

      if (existingLike) {
        // Unlike: Delete the like and decrement count
        await prisma.$transaction([
          prisma.beatLike.delete({
            where: { id: existingLike.id },
          }),
          prisma.beat.update({
            where: { id },
            data: {
              likes: {
                decrement: 1,
              },
            },
          }),
        ]);

        const updatedBeat = await prisma.beat.findUnique({
          where: { id },
          select: { likes: true },
        });

        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            liked: false,
            likeCount: updatedBeat?.likes || 0,
          },
        });
      } else {
        // Like: Create a new like and increment count
        await prisma.$transaction([
          prisma.beatLike.create({
            data: {
              beatId: id,
              userId: user.id,
            },
          }),
          prisma.beat.update({
            where: { id },
            data: {
              likes: {
                increment: 1,
              },
            },
          }),
        ]);

        const updatedBeat = await prisma.beat.findUnique({
          where: { id },
          select: { likes: true },
        });

        // Create notification for producer (don't notify yourself)
        if (beat.producerId !== user.id) {
          await prisma.notification.create({
            data: {
              userId: beat.producerId,
              type: "BEAT_LIKED",
              title: `${user.username} liked your beat`,
              message: `"${beat.title}" received a new like`,
              referenceId: id,
              referenceType: "beat",
            },
          });
        }

        // Create activity
        await prisma.activity.create({
          data: {
            userId: user.id,
            type: "LIKE",
            title: `Liked "${beat.title}"`,
            description: `by ${beat.producer.username}`,
            referenceId: id,
            referenceType: "beat",
          },
        });

        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            liked: true,
            likeCount: updatedBeat?.likes || 0,
          },
        });
      }
    } catch (error: any) {
      console.error("Error toggling beat like:", error);
      
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: "Failed to toggle like",
          code: "SERVER_ERROR",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
      }, { status: 500 });
    }
  });
}

// GET /api/beats/[id]/like - Check if current user has liked this beat
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req) => {
    const user = req.user!;
    
    try {
      const { id } = params;

      // Check if beat exists
      const beat = await prisma.beat.findUnique({
        where: { id },
        select: {
          id: true,
          likes: true,
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

      // Check if user has liked this beat
      const existingLike = await prisma.beatLike.findUnique({
        where: {
          beatId_userId: {
            beatId: id,
            userId: user.id,
          },
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          liked: !!existingLike,
          likeCount: beat.likes,
        },
      });
    } catch (error: any) {
      console.error("Error checking beat like status:", error);
      
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: "Failed to check like status",
          code: "SERVER_ERROR",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
      }, { status: 500 });
    }
  });
}