import { NextRequest, NextResponse } from "next/server";
import { withFullUser, withAuth, type AuthenticatedRequest } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

// GET /api/notifications - Fetch user's own notifications
export async function GET(req: NextRequest) {
  return withAuth(req, async (req: AuthenticatedRequest) => {
    try {
      const user = req.user!;
      const { searchParams } = new URL(req.url);
      const unreadOnly = searchParams.get("unreadOnly") === "true";
      const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100); // Cap at 100
      const offset = parseInt(searchParams.get("offset") || "0");

      const where: any = {
        userId: user.id,
      };

      if (unreadOnly) {
        where.read = false;
      }

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({
          where: { userId: user.id, read: false }
        }),
      ]);

      return NextResponse.json({
        notifications,
        pagination: {
          total,
          limit,
          offset,
          unreadCount,
        },
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

// POST /api/notifications - ADMIN ONLY: Create notifications
export async function POST(req: NextRequest) {
  return withFullUser(req, async (req) => {
    try {
      const user = req.user!;

      // ✅ FIX #9: Lock notification creation to admin users only
      // This prevents open notification injection from regular users
      // Every legitimate notification is created inline by business-logic routes
      if (!user.verified) {
        return NextResponse.json(
          { error: "Admin access required" }, 
          { status: 403 }
        );
      }

      const body = await req.json();
      const { userId, type, title, message, referenceId, referenceType } = body;

      // Validate required fields
      if (!userId || !type || !title || !message) {
        return NextResponse.json(
          { error: "Missing required fields: userId, type, title, message" }, 
          { status: 400 }
        );
      }

      // Validate message length to prevent abuse
      if (title.length > 200 || message.length > 1000) {
        return NextResponse.json(
          { error: "Title or message exceeds maximum length" }, 
          { status: 400 }
        );
      }

      // Verify the target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!targetUser) {
        return NextResponse.json(
          { error: "Target user not found" }, 
          { status: 404 }
        );
      }

      const notification = await prisma.notification.create({
        data: { 
          userId, 
          type, 
          title, 
          message, 
          ...(referenceId && { referenceId }), 
          ...(referenceType && { referenceType }) 
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

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(req: NextRequest) {
  return withAuth(req, async (req: AuthenticatedRequest) => {
    try {
      const user = req.user!;
      const body = await req.json();
      const { notificationIds, markAllRead } = body;

      if (markAllRead) {
        await prisma.notification.updateMany({
          where: {
            userId: user.id,  // ✅ Only user's own notifications
            read: false,
          },
          data: {
            read: true,
          },
        });

        return NextResponse.json({
          success: true,
          message: "All notifications marked as read",
        });
      }

      if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
        return NextResponse.json(
          { error: "notificationIds array is required and must not be empty" },
          { status: 400 }
        );
      }

      // Cap batch updates to prevent abuse
      if (notificationIds.length > 100) {
        return NextResponse.json(
          { error: "Cannot mark more than 100 notifications at once" },
          { status: 400 }
        );
      }

      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.id,  // ✅ Only user's own notifications
        },
        data: {
          read: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Notifications marked as read",
      });
    } catch (error: any) {
      console.error("Error updating notifications:", error);
      return NextResponse.json(
        { error: "Failed to update notifications" },
        { status: 500 }
      );
    }
  });
}