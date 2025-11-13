// app/layout.tsx
import { DevtoolsProvider } from "@providers/devtools";
import { GitHubBanner, Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import routerProvider from "@refinedev/nextjs-router";
import { Metadata } from "next";
import React, { Suspense } from "react";

import { SidebarProvider } from "../providers/sidebar-provider/sidebar-provider";
import { authProviderClient } from "@providers/auth-provider/auth-provider.client";
import { dataProvider } from "@providers/data-provider";
import { ThemeProvider } from "@providers/ThemeProvider";
import { PermissionsProvider } from "@/hooks/usePermissions"; 
import "@styles/global.css";

export const metadata: Metadata = {
  title: "Beeps - Music Production Marketplace",
  description: "Connect with artists, producers, and studios. Book sessions, buy beats, and rent equipment.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body>
        <Suspense>
          <RefineKbarProvider>
            <ThemeProvider>
              <SidebarProvider>
                {/* ✅ FIXED: Refine must wrap PermissionsProvider */}
                <Refine
                  routerProvider={routerProvider}
                  authProvider={authProviderClient}
                  dataProvider={dataProvider}
                  resources={[
                    {
                      name: "studios",
                      list: "/studios",
                      create: "/studios/create/:id",
                      edit: "/studios/edit/:id",
                      show: "/studios/show/:id",
                      meta: {
                        label: "Recording Studios",
                        canDelete: true,
                      },
                    },
                    {
                      name: "producers",
                      list: "/producers",
                      create: "/producers/create/:id",
                      edit: "/producers/edit/:id",
                      show: "/producers/show/:id",
                      meta: {
                        label: "Producers",
                        canDelete: true,
                      },
                    },
                    {
                      name: "beats",
                      list: "/beats",
                      create: "/beats/upload",
                      edit: "/beats/edit/:id",
                      show: "/beats/show/:id",
                      meta: {
                        label: "Beats Marketplace",
                        canDelete: true,
                      },
                    },
                    {
                      name: "bookings",
                      list: "/bookings",
                      create: "/bookings/create",
                      edit: "/bookings/edit/:id",
                      show: "/bookings/show/:id",
                      meta: {
                        label: "Bookings",
                        canDelete: false,
                      },
                    },
                    {
                      name: "collabs",
                      list: "/collabs",
                      create: "/collabs/create",
                      edit: "/collabs/edit/:id",
                      show: "/collabs/show/:id",
                      meta: {
                        label: "Collabs",
                        canDelete: false,
                      },
                    },
                    {
                      name: "equipment",
                      list: "/equipment",
                      create: "/equipment/list",
                      edit: "/equipment/edit/:id",
                      show: "/equipment/show/:id",
                      meta: {
                        label: "Gear & Equipments",
                        canDelete: true,
                      },
                    },
                    {
                      name: "services",
                      list: "/services",
                      create: "/services/offer",
                      edit: "/services/edit/:id",
                      show: "/services/show/:id",
                      meta: {
                        label: "Music Services",
                        canDelete: true,
                      },
                    },
                    {
                      name: "artists",
                      list: "/artists",
                      show: "/artists/profile/:id",
                      meta: {
                        label: "Profile",
                        canDelete: false,
                      },
                    },
                    {
                      name: "transactions",
                      list: "/transactions",
                      show: "/transactions/show/:id",
                      meta: {
                        label: "Live Feeds",
                        canDelete: false,
                      },
                    },
                  ]}
                  options={{
                    syncWithLocation: true,
                    warnWhenUnsavedChanges: true,
                    useNewQueryKeys: true,
                    projectId: "1qO17T-Aib2M5-IanaeI",
                  }}
                >
                  {/* ✅ FIXED: PermissionsProvider INSIDE Refine */}
                  <PermissionsProvider>
                    {children}
                    <RefineKbar />
                  </PermissionsProvider>
                </Refine>
              </SidebarProvider>
            </ThemeProvider>
          </RefineKbarProvider>
        </Suspense>
      </body>
    </html>
  );
}