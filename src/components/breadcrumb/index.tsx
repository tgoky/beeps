// components/Breadcrumb.tsx
"use client";

import { useBreadcrumb } from "@refinedev/core";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { NotificationBell } from "../NotificationBell";

export const Breadcrumb = () => {
  const { breadcrumbs } = useBreadcrumb();

  return (
    <div className="flex items-center justify-between px-4 py-2.5 backdrop-blur-sm  dark:bg-black border border-gray-200/60 dark:border-gray-800/50 ">
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center">
          {breadcrumbs.map((breadcrumb, index) => (
            <li key={`breadcrumb-${breadcrumb.label}`} className="inline-flex items-center">
              {index > 0 && (
                <ChevronRight className="w-3 h-3 text-gray-400 dark:text-gray-600 mx-1.5" />
              )}
              {breadcrumb.href ? (
                <Link
                  href={breadcrumb.href}
                  className={`inline-flex items-center text-[13px] font-medium no-underline transition-colors duration-200 ${
                    index === breadcrumbs.length - 1
                      ? "text-purple-600 dark:text-purple-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                  }`}
                >
                  {index === 0 ? (
                    <Home className="w-3 h-3 mr-1.5" />
                  ) : null}
                  {breadcrumb.label}
                </Link>
              ) : (
                <span className="inline-flex items-center text-[13px] font-medium text-gray-400 dark:text-gray-600 no-underline">
                  {index === 0 ? (
                    <Home className="w-3 h-3 mr-1.5" />
                  ) : null}
                  {breadcrumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <NotificationBell />
    </div>
  );
};