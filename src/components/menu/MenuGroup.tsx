// MenuGroup.tsx
"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react"; 
import { useTheme } from "../../providers/ThemeProvider";
import { MenuGroupConfig, IMenuItem } from "./NavigationMenu";
import { MenuItem } from "./MenuItem";

interface MenuGroupProps {
  group: MenuGroupConfig;
  collapsed: boolean;
  groupItems: IMenuItem[];
  selectedKey: string;
  isExpanded: boolean;
  toggleGroup: (groupId: string) => void;
  allMenuItems: IMenuItem[];
}

export const MenuGroup = ({
  group,
  collapsed,
  groupItems,
  selectedKey,
  isExpanded,
  toggleGroup,
}: MenuGroupProps) => {
  const pathname = usePathname();
  const { theme } = useTheme();

  const handleGroupHeaderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!collapsed) {
      toggleGroup(group.id);
    }
  };

  if (groupItems.length === 0) return null;

  return (
    <div className="mb-2">
      {/* Group Header */}
      <button
        onClick={handleGroupHeaderClick}
        className={`w-full flex items-center gap-3 py-2 px-3 border-none bg-transparent transition-all duration-200 
          ${collapsed ? "justify-center" : "justify-between group"}
          ${theme === "dark" ? "hover:bg-zinc-900" : "hover:bg-zinc-100"} rounded-lg
        `}
      >
        <div className="flex items-center gap-3">
          {collapsed && (
            <span className={`${theme === "dark" ? "text-zinc-600" : "text-zinc-400"}`}>
              {group.icon}
            </span>
          )}
          
          {!collapsed && (
            <span 
              className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${
                theme === "dark" ? "text-zinc-600" : "text-zinc-400"
              }`}
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              {group.label}
            </span>
          )}
        </div>
        
        {!collapsed && (
          <span className={`transition-transform duration-200 ${
            theme === "dark" ? "text-zinc-700 group-hover:text-zinc-500" : "text-zinc-400 group-hover:text-zinc-600"
          } ${isExpanded ? "rotate-90" : "rotate-0"}`}>
            <ChevronRight className="h-3 w-3" />
          </span>
        )}
      </button>

      {/* Expanded View */}
      {!collapsed && isExpanded && (
        <div className="mt-1 space-y-[2px]">
          {groupItems.map((item) => (
            <MenuItem
              key={item.key}
              item={item}
              selected={selectedKey === item.key}
              collapsed={false}
              pathname={pathname}
            />
          ))}
        </div>
      )}

      {/* Collapsed View (Tooltip Hover) */}
      {collapsed && (
        <div className="group relative">
          <div 
            className={`absolute left-full top-0 ml-2 hidden group-hover:block z-50 border shadow-2xl py-2 min-w-48 rounded-lg backdrop-blur-xl ${
              theme === "dark" 
                ? "bg-zinc-950 border-zinc-800" 
                : "bg-white border-zinc-200"
            }`}
          >
            <div className={`px-3 py-2 border-b ${
              theme === "dark" ? "border-zinc-800" : "border-zinc-200"
            }`}>
              <div 
                className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                  theme === "dark" ? "text-zinc-600" : "text-zinc-400"
                }`}
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {group.label}
              </div>
            </div>
            {groupItems.map((item) => (
              <MenuItem
                key={item.key}
                item={item}
                selected={selectedKey === item.key}
                collapsed={false}
                pathname={pathname}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};