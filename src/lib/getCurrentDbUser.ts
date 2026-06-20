import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";
import { SUPABASE_KEY, SUPABASE_URL } from "@/utils/supabase/constants";

export const getCurrentDbUser = cache(async () => {
  const cookieStore = await cookies();

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set() {},
      remove() {},
    },
  });

  const { data: { user: supabaseUser } } = await supabase.auth.getUser();
  if (!supabaseUser) return null;

  return prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    select: { id: true, location: true, countryCode: true, currency: true },
  });
});