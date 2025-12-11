import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-middleware";
import type { ApiResponse } from "@/types";
import { NotificationType, ActivityType } from "@prisma/client";

// POST /api/collaborations/[id]/bid - Place a bid or request on a collaboration
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req) => {
    const user = req.user!;
    
    try {
      const { id } = params;
      const body = await req.json();
      const { amount, message } = body;

      // Fetch the collaboration
      const collaboration = await prisma.collaboration.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
            },
          },
          bids: {
            orderBy: {
              amount: "desc",
            },
            take: 1,
          },
        },
      });

      if (!collaboration) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Collaboration not found",
            code: "NOT_FOUND",
          },
        }, { status: 404 });
      }

      // Check if collaboration is still active
      if (collaboration.status !== "ACTIVE") {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "This collaboration is no longer accepting bids",
            code: "COLLABORATION_INACTIVE",
          },
        }, { status: 400 });
      }

      // Check if collaboration has expired
      if (collaboration.expiresAt && new Date() > collaboration.expiresAt) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "This collaboration has expired",
            code: "COLLABORATION_EXPIRED",
          },
        }, { status: 400 });
      }

      // Don't allow creator to bid on their own collaboration
      if (collaboration.creatorId === user.id) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Cannot bid on your own collaboration",
            code: "INVALID_ACTION",
          },
        }, { status: 400 });
      }

      // Check if user already has a pending bid
      const existingBid = await prisma.collaborationBid.findFirst({
        where: {
          collaborationId: id,
          userId: user.id,
          status: "pending",
        },
      });

      if (existingBid) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "You already have a pending bid on this collaboration",
            code: "DUPLICATE_BID",
          },
        }, { status: 400 });
      }

      // Validate based on type
      if (collaboration.type === "BID") {
        if (!amount) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: {
              message: "Bid amount is required",
              code: "VALIDATION_ERROR",
            },
          }, { status: 400 });
        }

        // For bids, validate minimum bid
        const minBid = collaboration.minBid
          ? parseFloat(collaboration.minBid.toString())
          : 0;
        const currentBid = collaboration.currentBid
          ? parseFloat(collaboration.currentBid.toString())
          : minBid;

        const bidAmount = parseFloat(amount);

        if (bidAmount < currentBid) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: {
              message: `Bid must be at least $${currentBid}`,
              code: "BID_TOO_LOW",
            },
          }, { status: 400 });
        }

        // Validate bid increment (optional: enforce minimum increments)
        if (currentBid > 0 && bidAmount < currentBid + 10) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: {
              message: `Bid must be at least $10 more than current bid ($${currentBid})`,
              code: "BID_INCREMENT_TOO_LOW",
            },
          }, { status: 400 });
        }
      }

      // Create the bid/request
      const bid = await prisma.collaborationBid.create({
        data: {
          collaborationId: id,
          userId: user.id,
          amount: amount ? parseFloat(amount) : 0,
          message: message || null,
          status: "pending",
        },
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
      });

      // Update current bid if this is a BID type
      if (collaboration.type === "BID" && amount) {
        await prisma.collaboration.update({
          where: { id },
          data: {
            currentBid: parseFloat(amount),
          },
        });
      }

      // Create notification for creator
      const isBidType = collaboration.type === "BID";
      await prisma.notification.create({
        data: {
          userId: collaboration.creatorId,
          type: isBidType
            ? NotificationType.COLLABORATION_BID
            : NotificationType.COLLABORATION_REQUEST,
          title: isBidType
            ? `New bid on "${collaboration.title}"`
            : `New request for "${collaboration.title}"`,
          message: isBidType
            ? `${user.username} placed a bid of $${amount}`
            : `${user.username} sent you a collaboration request`,
          referenceId: id,
          referenceType: "collaboration",
        },
      });

      // Create activity
      await prisma.activity.create({
        data: {
          userId: user.id,
          type: ActivityType.COLLAB,
          title: isBidType
            ? `Bid $${amount} on "${collaboration.title}"`
            : `Requested "${collaboration.title}"`,
          description: message || undefined,
          referenceId: id,
          referenceType: "collaboration",
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: { bid },
      }, { status: 201 });
    } catch (error: any) {
      console.error("Error creating bid:", error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: "Failed to place bid",
          code: "SERVER_ERROR",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
      }, { status: 500 });
    }
  });
}

// GET /api/collaborations/[id]/bid - Get all bids for a collaboration
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req) => {
    const user = req.user!;
    
    try {
      const { id } = params;

      // Fetch the collaboration to check ownership
      const collaboration = await prisma.collaboration.findUnique({
        where: { id },
        select: {
          id: true,
          creatorId: true,
          type: true,
          title: true,
        },
      });

      if (!collaboration) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: "Collaboration not found",
            code: "NOT_FOUND",
          },
        }, { status: 404 });
      }

      // Only creator can view all bids
      const isCreator = collaboration.creatorId === user.id;

      let bids;
      if (isCreator) {
        // Creator sees all bids
        bids = await prisma.collaborationBid.findMany({
          where: { collaborationId: id },
          include: {
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
          orderBy: {
            amount: "desc",
          },
        });
      } else {
        // Others only see their own bids
        bids = await prisma.collaborationBid.findMany({
          where: {
            collaborationId: id,
            userId: user.id,
          },
          include: {
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
          orderBy: {
            createdAt: "desc",
          },
        });
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          bids,
          isCreator,
        },
      });
    } catch (error: any) {
      console.error("Error fetching bids:", error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: "Failed to fetch bids",
          code: "SERVER_ERROR",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
      }, { status: 500 });
    }
  });
}