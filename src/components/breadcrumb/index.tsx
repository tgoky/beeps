// components/Breadcrumb.tsx
"use client";

import { useBreadcrumb } from "@refinedev/core";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const Breadcrumb = () => {
  const { breadcrumbs } = useBreadcrumb();

  return (
    <div className="flex items-center px-6 py-3 bg-white dark:bg-black rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-2">
          {breadcrumbs.map((breadcrumb, index) => (
            <li key={`breadcrumb-${breadcrumb.label}`} className="inline-flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600 mx-2" />
              )}
              {breadcrumb.href ? (
                <Link
                  href={breadcrumb.href}
                  className={`inline-flex items-center text-sm font-medium no-underline ${
                    index === breadcrumbs.length - 1
                      ? "text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                      : "text-gray-600 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-500"
                  } transition-colors duration-200`}
                >
                  {index === 0 ? (
                    <svg
                      className="w-4 h-4 mr-2 text-current"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                  ) : null}
                  {breadcrumb.label}
                </Link>
              ) : (
                <span className="text-sm font-medium text-gray-400 dark:text-gray-600 no-underline">
                  {breadcrumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
};