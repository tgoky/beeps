import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { geolocation } from "@vercel/functions";
import { SUPABASE_KEY, SUPABASE_URL } from "./constants";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        // Use direct arguments instead of object shorthand to fix the TS error
        request.cookies.set(name, value);
        
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        
        response.cookies.set(name, value, options);
      },
      remove(name: string, options: CookieOptions) {
        // Pass an empty string "" explicitly for the value when removing
        request.cookies.set(name, "");
        
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        
        response.cookies.set(name, "", options);
      },
    },
  });

  await supabase.auth.getUser();

  // ↓↓↓ NEW — 6 lines setting the location cookie for the first paint
  if (!request.cookies.get("geo_country")) {
    const { country } = geolocation(request);
    if (country) {
      response.cookies.set("geo_country", country, { maxAge: 60 * 60 * 24 * 30 });
    }
  }
  // ↑↑↑ NEW

  return response;
}