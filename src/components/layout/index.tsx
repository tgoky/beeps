"use client";

import type { PropsWithChildren } from "react";
import { Breadcrumb } from "../breadcrumb"; // Make sure this is imported!
import { Menu } from "../menu";

export const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex h-screen bg-[#030303] overflow-hidden">
      <Menu />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* BREADCRUMBS ARE BACK! 
            Using true black background and a subtle white border instead of a white box */}
        <div className="bg-[#030303] border-b border-white/10 z-10 px-4 py-3 shrink-0">
          <Breadcrumb />
        </div>

        {/* The map/content area stays edge-to-edge */}
        <main className="flex-1 overflow-hidden bg-[#030303] w-full h-full relative">
          {children}
        </main>
      </div>
    </div>
  );
};