// components/menu/MenuGroup.tsx
"use client";

import { usePathname } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";
import { MenuItem } from "./MenuItem";

// Import the interfaces from NavigationMenu
export interface IMenuItem {
  key: string;
  name: string;
  label?: string;
  route?: string;
  icon?: React.ReactNode;
  children?: IMenuItem[];
  checked?: boolean;
}

export interface MenuGroupConfig {
  id: string;
  label: string;
  icon: React.ReactElement;
  items?: string[];
  subGroups?: MenuGroupConfig[];
}

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
  allMenuItems,
}: MenuGroupProps) => {
  const pathname = usePathname();
  const { theme } = useTheme();

  // Check if any item in this group is selected
  const hasSelectedItem = groupItems.some(item => item.key === selectedKey);

  const handleGroupHeaderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!collapsed) {
      toggleGroup(group.id); // Menu.tsx will handle the prevention logic
    }
  };

  return (
    <div className="group">
      {/* Group Header */}
      <button
        onClick={handleGroupHeaderClick}
        className={`w-full flex items-center gap-3 py-3 px-3 border-none rounded-lg transition-all duration-200 ${
          theme === "dark"
            ? "bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white"
            : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        } ${collapsed ? "justify-center" : "justify-between"}
        cursor-pointer`}
      >
        <div className="flex items-center gap-3">
          <span className={`transition-colors ${
            theme === "dark" ? "text-blue-400" : "text-blue-600"
          }`}>
            {group.icon}
          </span>
          {!collapsed && (
            <span className="font-semibold text-sm">{group.label}</span>
          )}
        </div>
        {!collapsed && groupItems.length > 0 && (
          <span className={`transition-colors ${
            theme === "dark" ? "text-gray-500" : "text-gray-400"
          }`}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        )}
      </button>

      {/* Expanded View: Items */}
      {!collapsed && isExpanded && (
        <div className="ml-2 mt-2 space-y-1">
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

      {/* Collapsed View: Hover Menu */}
      {collapsed && groupItems.length > 0 && (
        <div className="relative">
          <div
            className={`absolute left-full top-0 ml-1 hidden group-hover:block z-50 ${
              theme === "dark" 
                ? "bg-black border-gray-700 shadow-2xl" 
                : "bg-white border-gray-200 shadow-xl"
            } border rounded-lg py-2 min-w-56 backdrop-blur-sm transition-all duration-200`}
          >
            <div
              className={`px-4 py-3 border-b ${
                theme === "dark" 
                  ? "border-gray-700 bg-black" 
                  : "border-gray-100 bg-gray-50"
              } rounded-t-lg`}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                {group.icon}
                <span className={theme === "dark" ? "text-gray-200" : "text-gray-800"}>
                  {group.label}
                </span>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
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
        </div>
      )}
    </div>
  );
};