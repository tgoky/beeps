import { NextRequest, NextResponse } from "next/server";
import { State, Country } from "country-state-city";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const countryCode = searchParams.get("country");

    if (!countryCode) {
      return NextResponse.json(
        { error: "Country code is required" },
        { status: 400 }
      );
    }

    const states = State.getStatesOfCountry(countryCode);

    const formattedStates = states.map((state) => ({
      name: state.name,
      code: state.isoCode,
      latitude: state.latitude,
      longitude: state.longitude,
    }));

    return NextResponse.json({
      success: true,
      states: formattedStates,
    });
  } catch (error) {
    console.error("Error fetching states:", error);
    return NextResponse.json(
      { error: "Failed to fetch states" },
      { status: 500 }
    );
  }
}
