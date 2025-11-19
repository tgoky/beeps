import { NextRequest, NextResponse } from "next/server";
import { Country, State, City } from "country-state-city";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "");
    const lon = parseFloat(searchParams.get("lon") || "");

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json(
        { error: "Valid latitude and longitude are required" },
        { status: 400 }
      );
    }

    // Use a free reverse geocoding service
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
      {
        headers: {
          "User-Agent": "Beeps-Music-App/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Reverse geocoding failed");
    }

    const data = await response.json();
    const address = data.address || {};

    // Extract location details
    const countryName = address.country;
    const stateName = address.state || address.region || address.province;
    const cityName =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county;

    // Find country code
    const country = Country.getAllCountries().find(
      (c) => c.name.toLowerCase() === countryName?.toLowerCase()
    );

    let stateCode = "";
    if (country && stateName) {
      const state = State.getStatesOfCountry(country.isoCode).find(
        (s) => s.name.toLowerCase() === stateName.toLowerCase()
      );
      stateCode = state?.isoCode || "";
    }

    return NextResponse.json({
      success: true,
      country: countryName || "",
      countryCode: country?.isoCode || "",
      state: stateName || "",
      stateCode: stateCode,
      city: cityName || "",
      fullAddress: data.display_name || "",
      latitude: lat,
      longitude: lon,
    });
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to reverse geocode location"
      },
      { status: 500 }
    );
  }
}
