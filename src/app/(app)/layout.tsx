import { Layout as BaseLayout } from "@/components/layout";
import { authProviderServer } from "@/providers/auth-provider/auth-provider.server";
import { redirect } from "next/navigation";
import React from "react";

export default async function AppLayout({ children }: React.PropsWithChildren) {
  const { authenticated, redirectTo } = await authProviderServer.check();

  if (!authenticated) {
    return redirect(redirectTo || "/login");
  }

  return <BaseLayout>{children}</BaseLayout>;
}