import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

// GET /api/studios/[id] - Fetch a studio by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const studio = await prisma.studio.findUnique({
      where: { id },
      include: {
        owner: {
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
        bookings: {
          where: {
            status: {
              in: ["PENDING", "CONFIRMED"],
            },
          },
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
          },
        },
        reviews: {
          include: {
            author: {
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
          take: 10,
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    });

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 });
    }

    return NextResponse.json({ studio });
  } catch (error: any) {
    console.error("Error fetching studio:", error);
    return NextResponse.json(
      { error: "Failed to fetch studio" },
      { status: 500 }
    );
  }
}

// PATCH /api/studios/[id] - Update a studio
export async function PATCH(req: NextRequest, { params }: { params: any }) {
  return withAuth(req, async (req) => {
    const user = req.user!;
    try {
      const { id } = params;
      const body = await req.json();

      // Verify studio exists and user owns it
      const studio = await prisma.studio.findUnique({
        where: { id },
        include: {
          owner: true,
        },
      });

      if (!studio) {
        return NextResponse.json(
          { error: "Studio not found" },
          { status: 404 }
        );
      }

      if (studio.owner.userId !== user.id) {
        return NextResponse.json(
          { error: "Unauthorized to update this studio" },
          { status: 403 }
        );
      }

      const updatedStudio = await prisma.studio.update({
        where: { id },
        data: {
          ...(body.name && { name: body.name }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.location && { location: body.location }),
          ...(body.latitude !== undefined && { latitude: parseFloat(body.latitude) }),
          ...(body.longitude !== undefined && { longitude: parseFloat(body.longitude) }),
          ...(body.hourlyRate && { hourlyRate: parseFloat(body.hourlyRate) }),
          ...(body.equipment && { equipment: body.equipment }),
          ...(body.capacity && { capacity: body.capacity }),
          ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
        },
        include: {
          owner: {
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

      return NextResponse.json({ studio: updatedStudio });
    } catch (error: any) {
      console.error("Error updating studio:", error);
      return NextResponse.json(
        { error: "Failed to update studio" },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/studios/[id] - Delete a studio (soft delete)
export async function DELETE(req: NextRequest, { params }: { params: any }) {
  return withAuth(req, async (req) => {
    const user = req.user!;
    try {
      const { id } = params;

      // Verify studio exists and user owns it
      const studio = await prisma.studio.findUnique({
        where: { id },
        include: {
          owner: true,
        },
      });

      if (!studio) {
        return NextResponse.json(
          { error: "Studio not found" },
          { status: 404 }
        );
      }

      if (studio.owner.userId !== user.id) {
        return NextResponse.json(
          { error: "Unauthorized to delete this studio" },
          { status: 403 }
        );
      }

      // Soft delete by marking as inactive
      await prisma.studio.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({ success: true   });
}
    } catch (error: any) {
      console.error("Error deleting studio:", error);
      return NextResponse.json(
        { error: "Failed to delete studio" },
        { status: 500 }
      );
    }
  }
  });
}
