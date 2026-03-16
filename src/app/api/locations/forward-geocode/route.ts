import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`,
      {
        headers: {
          "User-Agent": "Beeps-Music-App/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Forward geocoding failed");
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No results found for the given query",
      });
    }

    const result = data[0];

    return NextResponse.json({
      success: true,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
    });
  } catch (error) {
    console.error("Error forward geocoding:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to forward geocode location",
      },
      { status: 500 }
    );
  }
}
