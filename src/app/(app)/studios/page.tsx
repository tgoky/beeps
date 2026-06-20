import { cookies } from "next/headers";
import { getCurrentDbUser } from "@/lib/getCurrentDbUser";
import StudioListClient from "./StudioListClient";

const ISO_TO_NAME: Record<string, string> = {
  GH: "Ghana",
  NG: "Nigeria",
  GB: "United Kingdom",
  US: "United States",
};

function detectCountryFromAccount(
  user: { location: string | null; countryCode: string | null; currency: string } | null
): string {
  if (!user) return "";
  const loc = (user.location || "").toLowerCase();
  const code = user.countryCode || "";
  const curr = user.currency || "";

  if (code === "GH" || curr === "GHS" || loc.includes("ghana") || loc.includes("accra")) return "Ghana";
  if (code === "NG" || curr === "NGN" || loc.includes("nigeria") || loc.includes("lagos") || loc.includes("abuja") || loc.includes("umuahia")) return "Nigeria";
  if (code === "GB" || curr === "GBP" || loc.includes("uk") || loc.includes("united kingdom") || loc.includes("london")) return "United Kingdom";
  if (code === "US" || loc.includes("usa") || loc.includes("united states") || loc.includes("new york") || loc.includes("los angeles")) return "United States";
  return "";
}

export default async function StudiosPage() {
  const user = await getCurrentDbUser();

  // 1. Logged-in account preference always wins
  let initialCountry = detectCountryFromAccount(user);

  // 2. No account yet (logged out / never set) → fall back to the geo guess
  //    that middleware already wrote into a cookie (see step 4 below)
  if (!initialCountry) {
    const cookieStore = await cookies();
    const geoCode = cookieStore.get("geo_country")?.value;
    if (geoCode) initialCountry = ISO_TO_NAME[geoCode] || "";
  }

  return <StudioListClient initialCountry={initialCountry} />;
}