"use client";

import { useBreadcrumb } from "@refinedev/core";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { NotificationBell } from "../NotificationBell";

export const Breadcrumb = () => {
  const { breadcrumbs } = useBreadcrumb();

  return (
    <div className="flex items-center justify-between w-full bg-transparent">
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center">
          {breadcrumbs.map((breadcrumb, index) => (
            <li key={`breadcrumb-${breadcrumb.label}`} className="inline-flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-zinc-600 mx-1.5" strokeWidth={1.5} />
              )}
              {breadcrumb.href ? (
                <Link
                  href={breadcrumb.href}
                  className={`inline-flex items-center text-sm font-medium no-underline transition-colors duration-200 ${
                    index === breadcrumbs.length - 1
                      ? "text-white" // Active page is bright white
                      : "text-zinc-400 hover:text-zinc-200" // Previous pages are soft gray
                  }`}
                >
                  {index === 0 ? (
                    <Home className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
                  ) : null}
                  {breadcrumb.label}
                </Link>
              ) : (
                <span className="inline-flex items-center text-sm font-medium text-white no-underline">
                  {index === 0 ? (
                    <Home className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
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