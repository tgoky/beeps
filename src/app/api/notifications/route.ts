import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

// GET /api/notifications - Fetch user notifications
export async function GET(req: NextRequest) {
  return withAuth(req, async (req) => {
    try {
      const user = req.user!;
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get("limit") || "50");
      const unreadOnly = searchParams.get("unreadOnly") === "true";

      const where: any = {
        userId: user.id,
      };

      if (unreadOnly) {
        where.isRead = false;
      }

      const notifications = await prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      });

      // Enrich notifications with related data (like booking status)
      const enrichedNotifications = await Promise.all(
        notifications.map(async (notification) => {
          let relatedData = null;

          // Fetch booking status if it's a booking notification
          if (notification.referenceType === "BOOKING" && notification.referenceId) {
            try {
              const booking = await prisma.booking.findUnique({
                where: { id: notification.referenceId },
                select: { status: true },
              });
              if (booking) {
                relatedData = { status: booking.status };
              }
            } catch (error) {
              console.error("Error fetching booking data for notification:", error);
            }
          }

          return {
            ...notification,
            relatedData,
          };
        })
      );

      const unreadCount = await prisma.notification.count({
        where: {
          userId: user.id,
          isRead: false,
        },
      });

      return NextResponse.json({
        notifications: enrichedNotifications,
        unreadCount,
      });
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 }
      );
    }
  });
}

// POST /api/notifications - Create a notification (internal use)
export async function POST(req: NextRequest) {
  return withAuth(req, async (req) => {
    try {
      const user = req.user!;
      const body = await req.json();
      const { userId, type, title, message, referenceId, referenceType } = body;

      // Validate required fields
      if (!userId || !type || !title || !message) {
        return NextResponse.json(
          { error: "Missing required fields: userId, type, title, message" },
          { status: 400 }
        );
      }

      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          referenceId,
          referenceType,
        },
      });

      return NextResponse.json({ notification }, { status: 201 });
    } catch (error: any) {
      console.error("Error creating notification:", error);
      return NextResponse.json(
        { error: "Failed to create notification" },
        { status: 500 }
      );
    }
  });
}
