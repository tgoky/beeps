import type { AuthProvider } from "@refinedev/core";
import { createSupabaseServerClient } from "@utils/supabase/server";

export const authProviderServer: Pick<AuthProvider, "check"> = {
  check: async () => {
    // SWITCHED FROM getUser() to getSession()
    const { data, error } = await createSupabaseServerClient().auth.getSession();
    const { session } = data;

    if (error || !session) {
      return {
        authenticated: false,
        logout: true,
        redirectTo: "/login",
      };
    }

    return {
      authenticated: true,
    };
  },
};