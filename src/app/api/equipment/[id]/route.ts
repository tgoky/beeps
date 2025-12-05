import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

// GET /api/equipment/[id] - Fetch equipment by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const equipment = await prisma.equipment.findUnique({
      where: { id },
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

    if (!equipment) {
      return NextResponse.json(
        { error: "Equipment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ equipment });
  } catch (error: any) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json(
      { error: "Failed to fetch equipment" },
      { status: 500 }
    );
  }
}

// PATCH /api/equipment/[id] - Update equipment
export async function PATCH(req: NextRequest, { params }: { params: any }) {
  return withAuth(req, async (req) => {
    const user = req.user!;
    try {
      const { id } = params;
      const body = await req.json();

      // Verify equipment exists and user owns it
      const equipment = await prisma.equipment.findUnique({
        where: { id },
        include: {
          seller: true,
        },
      });

      if (!equipment) {
        return NextResponse.json(
          { error: "Equipment not found" },
          { status: 404 }
        );
      }

      if (equipment.seller.userId !== user.id) {
        return NextResponse.json(
          { error: "Unauthorized to update this equipment" },
          { status: 403 }
        );
      }

      const updatedEquipment = await prisma.equipment.update({
        where: { id },
        data: {
          ...(body.name && { name: body.name }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.category && { category: body.category }),
          ...(body.price && { price: parseFloat(body.price) }),
          ...(body.rentalRate !== undefined && {
            rentalRate: body.rentalRate ? parseFloat(body.rentalRate) : null,
          }),
          ...(body.condition && { condition: body.condition }),
          ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
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

      return NextResponse.json({ equipment: updatedEquipment });
    } catch (error: any) {
      console.error("Error updating equipment:", error);
      return NextResponse.json(
        { error: "Failed to update equipment" },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/equipment/[id] - Delete equipment (soft delete)
export async function DELETE(req: NextRequest, { params }: { params: any }) {
  return withAuth(req, async (req) => {
    const user = req.user!;
    try {
      const { id } = params;

      // Verify equipment exists and user owns it
      const equipment = await prisma.equipment.findUnique({
        where: { id },
        include: {
          seller: true,
        },
      });

      if (!equipment) {
        return NextResponse.json(
          { error: "Equipment not found" },
          { status: 404 }
        );
      }

      if (equipment.seller.userId !== user.id) {
        return NextResponse.json(
          { error: "Unauthorized to delete this equipment" },
          { status: 403 }
        );
      }

      // Soft delete
      await prisma.equipment.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting equipment:", error);
      return NextResponse.json(
        { error: "Failed to delete equipment" },
        { status: 500 }
      );
    }
  });
}
