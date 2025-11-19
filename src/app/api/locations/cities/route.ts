import { NextRequest, NextResponse } from "next/server";
import { City } from "country-state-city";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const countryCode = searchParams.get("country");
    const stateCode = searchParams.get("state");

    if (!countryCode || !stateCode) {
      return NextResponse.json(
        { error: "Country code and state code are required" },
        { status: 400 }
      );
    }

    const cities = City.getCitiesOfState(countryCode, stateCode);

    // Get unique city names and sort alphabetically
    const cityNames = Array.from(new Set(cities.map((city) => city.name)))
      .sort((a, b) => a.localeCompare(b));

    return NextResponse.json({
      success: true,
      cities: cityNames,
    });
  } catch (error) {
    console.error("Error fetching cities:", error);
    return NextResponse.json(
      { error: "Failed to fetch cities" },
      { status: 500 }
    );
  }
}
