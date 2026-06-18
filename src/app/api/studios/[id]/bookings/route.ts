export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/studios/[id]/bookings - Fetch calendar bookings for a specific studio
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const bookings = await prisma.booking.findMany({
      where: { studioId: id },
      // Return just the necessary fields for rendering a calendar
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
      },
      orderBy: { startTime: "asc" }
    });

    return NextResponse.json({ bookings });
  } catch (error: any) {
    console.error("Error fetching studio bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch studio bookings" },
      { status: 500 }
    );
  }
}