// components/Layout.tsx
"use client";

import type { PropsWithChildren } from "react";
import { Breadcrumb } from "../breadcrumb";
import { Menu } from "../menu";

export const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      <Menu />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <Breadcrumb />
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background-light dark:bg-background-dark">
          {children}
        </main>
      </div>
    </div>
  );
};