import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

// PATCH /api/notifications/[id] - Mark notification as read
export async function PATCH(req: NextRequest, { params }: { params: any }) {
  return withAuth(req, async (req) => {
    const user = req.user!;
    try {
      const { id } = params;
      const body = await req.json();
      const { isRead } = body;

      // Verify notification belongs to user
      const notification = await prisma.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        return NextResponse.json(
          { error: "Notification not found" },
          { status: 404 }
        );
      }

      if (notification.userId !== user.id) {
        return NextResponse.json(
          { error: "Unauthorized to update this notification" },
          { status: 403 }
        );
      }

      const updatedNotification = await prisma.notification.update({
        where: { id },
        data: { isRead: isRead ?? true },
      });

      return NextResponse.json({ notification: updatedNotification });
    } catch (error: any) {
      console.error("Error updating notification:", error);
      return NextResponse.json(
        { error: "Failed to update notification" },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/notifications/[id] - Delete a notification
export async function DELETE(req: NextRequest, { params }: { params: any }) {
  return withAuth(req, async (req) => {
    const user = req.user!;
    try {
      const { id } = params;

      // Verify notification belongs to user
      const notification = await prisma.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        return NextResponse.json(
          { error: "Notification not found" },
          { status: 404 }
        );
      }

      if (notification.userId !== user.id) {
        return NextResponse.json(
          { error: "Unauthorized to delete this notification" },
          { status: 403 }
        );
      }

      await prisma.notification.delete({
        where: { id },
      });

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      return NextResponse.json(
        { error: "Failed to delete notification" },
        { status: 500 }
      );
    }
  });
}
