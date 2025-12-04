import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

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
        transactions: {
          select: {
            id: true,
            amount: true,
            createdAt: true,
            buyer: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!beat) {
      return NextResponse.json({ error: "Beat not found" }, { status: 404 });
    }

    // Increment plays
    await prisma.beat.update({
      where: { id },
      data: { plays: { increment: 1 } },
    });

    return NextResponse.json({ beat });
  } catch (error: any) {
    console.error("Error fetching beat:", error);
    return NextResponse.json(
      { error: "Failed to fetch beat" },
      { status: 500 }
    );
  }
}

// PATCH /api/beats/[id] - Update a beat
export async function PATCH(req: NextRequest, { params }: { params: any }) {
  return withAuth(req, async (req) => {
    const user = req.user!;
    try {
      const { id } = params;
      const body = await req.json();

      // Verify beat exists and user owns it
      const beat = await prisma.beat.findUnique({
        where: { id },
        include: {
          producer: true,
        },
      });

      if (!beat) {
        return NextResponse.json({ error: "Beat not found" }, { status: 404 });
      }

      if (beat.producer.userId !== user.id) {
        return NextResponse.json(
          { error: "Unauthorized to update this beat" },
          { status: 403 }
        );
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

      return NextResponse.json({ beat: updatedBeat });
    } catch (error: any) {
      console.error("Error updating beat:", error);
      return NextResponse.json(
        { error: "Failed to update beat" },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/beats/[id] - Delete a beat (soft delete)
export async function DELETE(req: NextRequest, { params }: { params: any }) {
  return withAuth(req, async (req) => {
    const user = req.user!;
    try {
      const { id } = params;

      // Verify beat exists and user owns it
      const beat = await prisma.beat.findUnique({
        where: { id },
        include: {
          producer: true,
        },
      });

      if (!beat) {
        return NextResponse.json({ error: "Beat not found" }, { status: 404 });
      }

      if (beat.producer.userId !== user.id) {
        return NextResponse.json(
          { error: "Unauthorized to delete this beat" },
          { status: 403 }
        );
      }

      // Soft delete by marking as inactive
      await prisma.beat.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({ success: true   });
}
    } catch (error: any) {
      console.error("Error deleting beat:", error);
      return NextResponse.json(
        { error: "Failed to delete beat" },
        { status: 500 }
      );
    }
  }
  });
}
