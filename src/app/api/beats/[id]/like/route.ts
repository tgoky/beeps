import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-middleware";

// POST /api/beats/[id]/like - Toggle like on a beat
export async function POST(req: NextRequest, { params }: { params: any }) {
  return withAuth(req, async (req) => {
    const user = req.user!;
    try {
      const { id } = params;

      // Check if beat exists
      const beat = await prisma.beat.findUnique({
        where: { id },
        include: {
          producer: true,
        },
      });

      if (!beat) {
        return NextResponse.json({ error: "Beat not found" }, { status: 404 });
      }

      // Check if user has already liked this beat
      const existingLike = await prisma.like.findFirst({
        where: {
          userId: user.id,
          targetId: id,
          targetType: "beat",
        },
      });

      if (existingLike) {
        // Unlike: Delete the like
        await prisma.like.delete({
          where: { id: existingLike.id },
        });

        // Decrement like count
        const updatedBeat = await prisma.beat.update({
          where: { id },
          data: {
            likeCount: {
              decrement: 1,
            },
          },
        });

        return NextResponse.json({
          liked: false,
          likeCount: updatedBeat.likeCount,
        });
      } else {
        // Like: Create a new like
        await prisma.like.create({
          data: {
            userId: user.id,
            targetId: id,
            targetType: "beat",
          },
        });

        // Increment like count
        const updatedBeat = await prisma.beat.update({
          where: { id },
          data: {
            likeCount: {
              increment: 1,
            },
          },
        });

        // Create notification for producer (don't notify yourself)
        if (beat.producerId !== user.id) {
          await prisma.notification.create({
            data: {
              userId: beat.producerId,
              type: "LIKE",
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

        return NextResponse.json({
          liked: true,
          likeCount: updatedBeat.likeCount,
        });
      }
    } catch (error) {
      console.error("Error toggling beat like:", error);
      return NextResponse.json(
        { error: "Failed to toggle like" },
        { status: 500 }
      );
    }
  });
}
