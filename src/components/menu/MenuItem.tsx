"use client";

import Link from "next/link";
import { MenuIcon } from "./MenuIcon";

export interface IMenuItem {
  key: string;
  name: string;
  label?: string;
  route?: string;
  icon?: React.ReactNode;
  children?: IMenuItem[];
  checked?: boolean;
}

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
  
  const isSelected = selected || pathname === item.route;
  const displayLabel = item.label || item.name;

  return (
    <Link
      href={item.route ?? "#"}
      className={`
        group/menu-item flex items-center gap-3 py-3 px-3 transition-all duration-300 no-underline border
        ${nested ? "ml-2" : ""} 
        ${isSelected
            ? "bg-white/5 border-white/20 text-white"
            : "bg-transparent border-transparent text-zinc-500 hover:text-white hover:border-white/10"
        }
      `}
      onClick={(e) => e.stopPropagation()}
    >
      <span className={`flex-shrink-0 transition-colors duration-300 ${isSelected ? "text-white" : "text-zinc-600 group-hover/menu-item:text-white"}`}>
        <MenuIcon name={item.name} />
      </span>

      {!collapsed && (
        <span className={`text-[10px] font-black tracking-widest uppercase transition-colors duration-300 truncate ${isSelected ? "text-white" : "text-zinc-500 group-hover/menu-item:text-zinc-300"}`}>
          {displayLabel}
        </span>
      )}

      {collapsed && isSelected && (
        <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white" />
      )}
    </Link>
  );
};