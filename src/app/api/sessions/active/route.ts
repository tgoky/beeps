import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

// GET /api/sessions/active - Get all active/upcoming sessions for the studio owner
export async function GET(req: NextRequest) {
  return withAuth(req, async (req) => {
    const user = req.user!;

    try {
      const { searchParams } = new URL(req.url);
      const includeUpcoming = searchParams.get("includeUpcoming") !== "false";

      const now = new Date();
      const upcomingWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Next 24 hours

      // Build the where clause for sessions owned by this user
      const conditions: any[] = [
        // Active sessions (currently in progress)
        {
          status: "ACTIVE",
          studio: { owner: { userId: user.id } },
        },
      ];

      if (includeUpcoming) {
        // Confirmed sessions starting within the next 24 hours
        conditions.push({
          status: "CONFIRMED",
          studio: { owner: { userId: user.id } },
          startTime: {
            gte: now,
            lte: upcomingWindow,
          },
        });
      }

      const sessions = await prisma.booking.findMany({
        where: {
          OR: conditions,
        },
        include: {
          studio: {
            select: {
              id: true,
              name: true,
              location: true,
              hourlyRate: true,
              imageUrl: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
        },
        orderBy: [
          { status: "asc" }, // ACTIVE first, then CONFIRMED
          { startTime: "asc" },
        ],
      });

      // Calculate real-time session info
      const sessionsWithInfo = sessions.map((session) => {
        const startTime = new Date(session.startTime);
        const endTime = new Date(session.endTime);
        const isActive = session.status === "ACTIVE";
        const checkedInAt = session.checkedInAt ? new Date(session.checkedInAt) : null;

        let timeRemaining = null;
        let isOvertime = false;
        let overtimeMinutes = 0;
        let elapsedMinutes = 0;
        let totalMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

        if (isActive && checkedInAt) {
          elapsedMinutes = Math.round((now.getTime() - checkedInAt.getTime()) / (1000 * 60));
          const minutesUntilEnd = Math.round((endTime.getTime() - now.getTime()) / (1000 * 60));

          if (minutesUntilEnd > 0) {
            timeRemaining = minutesUntilEnd;
          } else {
            isOvertime = true;
            overtimeMinutes = Math.abs(minutesUntilEnd);
          }
        }

        let startsIn = null;
        if (session.status === "CONFIRMED") {
          startsIn = Math.round((startTime.getTime() - now.getTime()) / (1000 * 60));
        }

        return {
          ...session,
          sessionInfo: {
            isActive,
            totalMinutes,
            elapsedMinutes,
            timeRemaining,
            isOvertime,
            overtimeMinutes,
            startsIn,
          },
        };
      });

      // Summary stats
      const activeSessions = sessionsWithInfo.filter((s) => s.status === "ACTIVE");
      const upcomingSessions = sessionsWithInfo.filter((s) => s.status === "CONFIRMED");
      const overtimeSessions = activeSessions.filter((s) => s.sessionInfo.isOvertime);

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          sessions: sessionsWithInfo,
          summary: {
            active: activeSessions.length,
            upcoming: upcomingSessions.length,
            overtime: overtimeSessions.length,
            total: sessionsWithInfo.length,
          },
        },
      });
    } catch (error: any) {
      console.error("Error fetching active sessions:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: "Failed to fetch active sessions", code: "SERVER_ERROR", details: process.env.NODE_ENV === "development" ? error.message : undefined } },
        { status: 500 }
      );
    }
  });
}
