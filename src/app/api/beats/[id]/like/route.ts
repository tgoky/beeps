import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

// POST /api/beats/[id]/like - Like/unlike a beat
export const POST = withAuth(
  async (req: NextRequest, { user, params }: { user: any; params: any }) => {
    try {
      const { id } = params;

      const beat = await prisma.beat.findUnique({
        where: { id },
      });

      if (!beat) {
        return NextResponse.json({ error: "Beat not found" }, { status: 404 });
      }

      // For now, just increment likes (in production, track individual likes)
      const updatedBeat = await prisma.beat.update({
        where: { id },
        data: {
          likes: { increment: 1 },
        },
      });

      return NextResponse.json({ beat: updatedBeat });
    } catch (error: any) {
      console.error("Error liking beat:", error);
      return NextResponse.json(
        { error: "Failed to like beat" },
        { status: 500 }
      );
    }
  }
);
