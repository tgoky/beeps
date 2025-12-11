import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

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
          select: {
            id: true,
            userId: true,
            businessName: true,
            specialties: true,
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

    if (!equipment) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: "Equipment not found",
          code: "NOT_FOUND",
        },
      }, { status: 404 });
    }

    // Get related transactions if needed
    const relatedTransactions = await prisma.transaction.findMany({
      where: {
        referenceId: id,
        referenceType: "equipment",
        status: "COMPLETED",
      },
      select: {
        id: true,
        type: true,
        amount: true,
        createdAt: true,
        user: {
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
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        equipment,
        recentTransactions: relatedTransactions,
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

// PATCH /api/equipment/[id] - Update equipment
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req) => {
    const user = req.user!;
    
    try {
      const { id } = params;
      const body = await req.json();

      // Verify equipment exists and user owns it
      const equipment = await prisma.equipment.findUnique({
        where: { id },
        select: {
          id: true,
          sellerId: true,
          seller: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!equipment) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Equipment not found",
            code: "NOT_FOUND",
          },
        }, { status: 404 });
      }

      if (equipment.seller.userId !== user.id) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Unauthorized to update this equipment",
            code: "FORBIDDEN",
          },
        }, { status: 403 });
      }

      // Validate price if provided
      if (body.price !== undefined) {
        const priceNum = parseFloat(body.price);
        if (priceNum < 0) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: {
              message: "Price must be a positive number",
              code: "VALIDATION_ERROR",
            },
          }, { status: 400 });
        }
      }

      // Validate rental rate if provided
      if (body.rentalRate !== undefined && body.rentalRate !== null) {
        const rentalRateNum = parseFloat(body.rentalRate);
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

      const updatedEquipment = await prisma.equipment.update({
        where: { id },
        data: {
          ...(body.name && { name: body.name }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.category && { category: body.category }),
          ...(body.price !== undefined && { price: parseFloat(body.price) }),
          ...(body.rentalRate !== undefined && {
            rentalRate: body.rentalRate ? parseFloat(body.rentalRate) : null,
          }),
          ...(body.condition && { condition: body.condition }),
          ...(body.location !== undefined && { location: body.location }),
          ...(body.country !== undefined && { country: body.country }),
          ...(body.state !== undefined && { state: body.state }),
          ...(body.city !== undefined && { city: body.city }),
          ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
        },
        include: {
          seller: {
            select: {
              id: true,
              userId: true,
              businessName: true,
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

      return NextResponse.json<ApiResponse>({
        success: true,
        data: { equipment: updatedEquipment },
      });
    } catch (error: any) {
      console.error("Error updating equipment:", error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: "Failed to update equipment",
          code: "SERVER_ERROR",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
      }, { status: 500 });
    }
  });
}

// DELETE /api/equipment/[id] - Delete equipment (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req) => {
    const user = req.user!;
    
    try {
      const { id } = params;

      // Verify equipment exists and user owns it
      const equipment = await prisma.equipment.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          sellerId: true,
          seller: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!equipment) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Equipment not found",
            code: "NOT_FOUND",
          },
        }, { status: 404 });
      }

      if (equipment.seller.userId !== user.id) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Unauthorized to delete this equipment",
            code: "FORBIDDEN",
          },
        }, { status: 403 });
      }

      // Check if there are any pending transactions
      const pendingTransactions = await prisma.transaction.count({
        where: {
          referenceId: id,
          referenceType: "equipment",
          status: "PENDING",
        },
      });

      if (pendingTransactions > 0) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Cannot delete equipment with pending transactions",
            code: "HAS_PENDING_TRANSACTIONS",
          },
        }, { status: 400 });
      }

      // Soft delete
      await prisma.equipment.update({
        where: { id },
        data: { isActive: false },
      });

      // Create activity
      await prisma.activity.create({
        data: {
          userId: user.id,
          type: "COMPLETE", // Using closest available type
          title: `Removed "${equipment.name}" from marketplace`,
          referenceId: id,
          referenceType: "equipment",
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: { message: "Equipment deleted successfully" },
      });
    } catch (error: any) {
      console.error("Error deleting equipment:", error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: "Failed to delete equipment",
          code: "SERVER_ERROR",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
      }, { status: 500 });
    }
  });
}