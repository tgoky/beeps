import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

// POST /api/notifications/mark-all-read - Mark all notifications as read
export async function POST(req: NextRequest) {
  return withAuth(req, async (req) => {
    const user = req.user!;
  try {
    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
  });
}
