import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-middleware";

// POST /api/collaborations/[id]/bid - Place a bid or request on a collaboration
export async function POST(req: NextRequest, { params }: { params: any }) {
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
          creator: true,
          bids: {
            orderBy: {
              amount: "desc",
            },
            take: 1,
          },
        },
      });

      if (!collaboration) {
        return NextResponse.json(
          { error: "Collaboration not found" },
          { status: 404 }
        );
      }

      // Don't allow creator to bid on their own collaboration
      if (collaboration.creatorId === user.id) {
        return NextResponse.json(
          { error: "Cannot bid on your own collaboration" },
          { status: 400 }
        );
      }

      // Validate based on type
      if (collaboration.type === "BID" && amount) {
        // For bids, validate minimum bid
        const minBid = collaboration.minBid
          ? parseFloat(collaboration.minBid.toString())
          : 0;
        const currentBid = collaboration.currentBid
          ? parseFloat(collaboration.currentBid.toString())
          : minBid;

        if (parseFloat(amount) < currentBid) {
          return NextResponse.json(
            { error: `Bid must be at least $${currentBid}` },
            { status: 400 }
          );
        }
      }

      // Create the bid/request
      const bid = await prisma.collaborationBid.create({
        data: {
          collaborationId: id,
          userId: user.id,
          amount: amount ? parseFloat(amount) : 0,
          message: message || null,
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
      await prisma.notification.create({
        data: {
          userId: collaboration.creatorId,
          type: "BOOKING",
          title:
            collaboration.type === "BID"
              ? `New bid on "${collaboration.title}"`
              : `New request for "${collaboration.title}"`,
          message:
            collaboration.type === "BID"
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
          type: "BOOKING",
          title:
            collaboration.type === "BID"
              ? `Bid $${amount} on "${collaboration.title}"`
              : `Requested "${collaboration.title}"`,
          description: message || "",
          referenceId: id,
          referenceType: "collaboration",
        },
      });

      return NextResponse.json({ bid }, { status: 201 });
    } catch (error) {
      console.error("Error creating bid:", error);
      return NextResponse.json(
        { error: "Failed to place bid" },
        { status: 500 }
      );
    }
  });
}
