"use client";

import { useBreadcrumb } from "@refinedev/core";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { NotificationBell } from "../NotificationBell";

export const Breadcrumb = () => {
  const { breadcrumbs } = useBreadcrumb();

  return (
    // 1. Removed all borders, backgrounds, and padding. 
    // It now sits perfectly inside the black header we made in Layout.tsx
    <div className="flex items-center justify-between w-full bg-transparent">
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center">
          {breadcrumbs.map((breadcrumb, index) => (
            <li key={`breadcrumb-${breadcrumb.label}`} className="inline-flex items-center">
              {index > 0 && (
                <ChevronRight className="w-3 h-3 text-zinc-600 mx-1.5" strokeWidth={2} />
              )}
              {breadcrumb.href ? (
                <Link
                  href={breadcrumb.href}
                  // 2. Swapped soft purple for sharp, brutalist uppercase text
                  className={`inline-flex items-center text-[9px] font-black uppercase tracking-widest no-underline transition-colors duration-200 ${
                    index === breadcrumbs.length - 1
                      ? "text-white" // Active page is bright white
                      : "text-zinc-500 hover:text-white" // Previous pages are gray, hover to white
                  }`}
                >
                  {index === 0 ? (
                    <Home className="w-3 h-3 mr-1.5 pb-[1px]" strokeWidth={2} />
                  ) : null}
                  {breadcrumb.label}
                </Link>
              ) : (
                <span className="inline-flex items-center text-[9px] font-black uppercase tracking-widest text-zinc-500 no-underline">
                  {index === 0 ? (
                    <Home className="w-3 h-3 mr-1.5 pb-[1px]" strokeWidth={2} />
                  ) : null}
                  {breadcrumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      {/* Ensure your NotificationBell component also doesn't have a white background! */}
      <NotificationBell />
    </div>
  );
};