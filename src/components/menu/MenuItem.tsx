// components/menu/MenuItem.tsx
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

  // Render checkbox for items
  const renderCheckbox = () => {
    return (
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={item.checked || false}
          readOnly
          className={`h-3.5 w-3.5 rounded border-2 transition-all duration-200 ${
            theme === "dark"
              ? "border-gray-500 bg-gray-700 checked:bg-blue-500 checked:border-blue-500"
              : "border-gray-400 bg-white checked:bg-blue-600 checked:border-blue-600"
          } focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            theme === "dark" ? "focus:ring-offset-gray-900" : "focus:ring-offset-white"
          }`}
        />
      </div>
    );
  };

  return (
    <Link
      href={item.route ?? "#"}
      className={`group/menu-item flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-200 no-underline ${
        nested ? "ml-2" : ""
      } ${
        selected || pathname === item.route
          ? theme === "dark"
            ? "bg-black text-blue-300 border-l-2 border-blue-500"
            : "bg-blue-50 text-blue-700 border-l-2 border-blue-500"
          : theme === "dark"
          ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {renderCheckbox()}
      <span className={`transition-colors duration-200 ${
        selected || pathname === item.route
          ? theme === "dark" ? "text-blue-300" : "text-blue-600"
          : theme === "dark" ? "text-gray-400 group-hover/menu-item:text-gray-200" : "text-gray-500 group-hover/menu-item:text-gray-700"
      }`}>
        <MenuIcon name={item.name} />
      </span>
      {!collapsed && (
        <span className={`text-sm font-medium transition-colors duration-200 ${
          selected || pathname === item.route
            ? theme === "dark" ? "text-blue-300" : "text-blue-700"
            : theme === "dark" ? "text-gray-300 group-hover/menu-item:text-white" : "text-gray-700 group-hover/menu-item:text-gray-900"
        }`}>
          {item.label}
        </span>
      )}
    </Link>
  );
};