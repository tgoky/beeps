// admin-app/src/components/menu/NavigationMenu.tsx
"use client";

import React from "react";
import { useTheme } from "../../providers/ThemeProvider";
import { MenuGroup } from "./MenuGroup";
import {
  ShieldCheckIcon,
  HomeIcon,
  BoltIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import { Workflow } from "lucide-react";

// Define your own MenuItem interface instead of importing
export interface IMenuItem {
  key: string;
  name: string;
  label?: string;
  route?: string;
  icon?: React.ReactNode;
  children?: IMenuItem[];
}

// Shared MenuGroupConfig interface
export interface MenuGroupConfig {
  id: string;
  label: string;
  icon: React.ReactElement;
  items?: string[];
  subGroups?: MenuGroupConfig[];
}

interface NavigationMenuProps {
  isClient: boolean;
  collapsed: boolean;
  menuItems: IMenuItem[];
  selectedKey: string;
  expandedGroups: string[];
  toggleGroup: (groupId: string) => void;
}

const menuGroups: MenuGroupConfig[] = [
  {
    id: "content",
    label: "Platform Users",
    icon: <ShieldCheckIcon className="h-4 w-4" />,
    subGroups: [
      {
        id: "compliance",
        label: "Users",
        icon: <ShieldCheckIcon className="h-4 w-4" />,
        items: ["admin"],
      },
      {
        id: "tools",
        label: "Tools",
        icon: <BoltIcon className="h-4 w-4" />,
        items: [""],
      },
      {
        id: "agents",
        label: "Agents",
        icon: <CubeIcon className="h-4 w-4" />,
        items: [],
      },
    ],
  },
  {
    id: "overview",
    label: "View Invites",
    icon: <HomeIcon className="h-4 w-4" />,
    items: ["invites"],
  },
  {
    id: "automations",
    label: "Activities",
    icon: <Workflow className="h-4 w-4" />,
    items: [""],
  },
];


export const NavigationMenu = ({
  isClient,
  collapsed,
  menuItems,
  selectedKey,
  expandedGroups,
  toggleGroup,
}: NavigationMenuProps) => {
  const { theme } = useTheme();

  // Debug: Log menuItems to verify content
  console.log("menuItems:", menuItems);

  const getMenuItemsByGroup = (groupItems: string[] = []) => {
    const filteredItems = menuItems.filter((item) => groupItems.includes(item.name));
    console.log(`Group ${groupItems.join(", ") || "no items"} filtered items:`, filteredItems);
    return filteredItems;
  };

  // Helper function to collect all items from a group and its subgroups
  const getAllGroupItems = (group: MenuGroupConfig): string[] => {
    const items: string[] = [];
    if (group.items) {
      items.push(...group.items);
    }
    if (group.subGroups) {
      group.subGroups.forEach((subGroup) => {
        items.push(...getAllGroupItems(subGroup));
      });
    }
    return items;
  };

  // Helper function to check if a group should be rendered
  const shouldRenderGroup = (group: MenuGroupConfig): boolean => {
    const hasSubGroups = group.subGroups && group.subGroups.length > 0;
    const allGroupItems = getAllGroupItems(group);
    const matchingItems = getMenuItemsByGroup(allGroupItems);
    return hasSubGroups || matchingItems.length > 0;
  };

  return (
    <nav  data-tour="navigation-menu"  className="flex-1 overflow-y-auto py-4">
      <div className={`px-4 space-y-6 ${theme === "dark" ? "bg-black" : "bg-white"}`}>
        {isClient &&
          menuGroups.map((group) => {
            if (shouldRenderGroup(group)) {
              const groupItems = getMenuItemsByGroup(group.items || []);
              return (
                <MenuGroup
                  key={group.id}
                  group={group}
                  collapsed={collapsed}
                  groupItems={groupItems}
                  selectedKey={selectedKey}
                  isExpanded={expandedGroups.includes(group.id)}
                  toggleGroup={toggleGroup}
                  allMenuItems={menuItems} // Pass all menu items for subgroup filtering
                />
              );
            }
            return null;
          })}
      </div>
    </nav>
  );
};