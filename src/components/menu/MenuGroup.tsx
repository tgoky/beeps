"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react"; 
import { MenuItem, IMenuItem } from "./MenuItem"; // <--- ADDED MenuItem HERE

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
}: MenuGroupProps) => {
  const pathname = usePathname();

  const handleGroupHeaderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!collapsed) {
      toggleGroup(group.id);
    }
  };

  if (groupItems.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={handleGroupHeaderClick}
        className={`w-full flex items-center gap-3 py-2 px-3 border-none bg-transparent transition-opacity duration-200 outline-none
          ${collapsed ? "justify-center" : "justify-between group"}
        `}
      >
        <div className="flex items-center gap-3">
          {collapsed && (
            <span className="text-zinc-600 hover:text-white transition-colors">
              {group.icon}
            </span>
          )}
          
          {!collapsed && (
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
              {group.label}
            </span>
          )}
        </div>
        
        {!collapsed && (
          <span className={`transition-transform duration-200 text-zinc-600 group-hover:text-white ${isExpanded ? "rotate-90" : "rotate-0"}`}>
            <ChevronRight className="h-3 w-3" />
          </span>
        )}
      </button>

      {!collapsed && isExpanded && (
        <div className="mt-2 space-y-1">
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

      {/* Brutalist Hover Flyout for Collapsed State */}
      {collapsed && (
        <div className="group relative">
          <div className="absolute left-full top-0 ml-2 hidden group-hover:block z-50 bg-[#030303] border border-white/10 shadow-2xl min-w-[200px]">
            <div className="px-4 py-3 border-b border-white/10 bg-white/5">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white">
                {group.label}
              </div>
            </div>
            <div className="p-2 space-y-1">
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