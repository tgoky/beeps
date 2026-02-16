// MenuItem.tsx
"use client";

import Link from "next/link";
import { useTheme } from "../../providers/ThemeProvider";
import { IMenuItem } from "./NavigationMenu";
import { MenuIcon } from "./MenuIcon";

interface MenuItemProps {
  item: IMenuItem;
  selected: boolean;
  collapsed: boolean;
  pathname: string;
  nested?: boolean;
}

export const MenuItem = ({
  item,
  selected,
  collapsed,
  pathname,
  nested = false,
}: MenuItemProps) => {
  const { theme } = useTheme();

  return (
    <Link
      href={item.route ?? "#"}
      className={`
        flex items-center gap-3 py-2.5 text-sm no-underline transition-all duration-200 rounded-lg
        ${nested ? "px-5" : "px-3"}
        ${selected || pathname === item.route
          ? theme === "dark"
            ? "bg-zinc-900 text-zinc-200 border-l-2 border-emerald-500"
            : "bg-zinc-100 text-zinc-900 border-l-2 border-emerald-500"
          : theme === "dark"
            ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
            : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
        }
      `}
      onClick={(e) => e.stopPropagation()}
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      <span className={`${selected ? "text-emerald-500" : ""}`}>
        <MenuIcon name={item.name} />
      </span>
      {!collapsed && <span className="font-medium text-xs tracking-wide">{item.label}</span>}
    </Link>
  );
};