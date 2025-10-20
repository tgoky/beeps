// NavigationMenu.tsx
"use client";

import React from "react";
import { useTheme } from "../../providers/ThemeProvider";
import { MenuGroup } from "./MenuGroup";
import {
  BuildingStorefrontIcon,
  MusicalNoteIcon,
  StarIcon,
  CalendarDaysIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  CogIcon,
  UserIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

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

interface NavigationMenuProps {
  isClient: boolean;
  collapsed: boolean;
  menuItems: IMenuItem[];
  selectedKey: string;
  expandedGroups: string[];
  toggleGroup: (groupId: string) => void;
}

const getResourceMenuItems = (refineMenuItems: IMenuItem[], selectedKey: string): IMenuItem[] => {
  const resourceIconMap: Record<string, React.ReactElement> = {
    "studios": <BuildingStorefrontIcon className="h-4 w-4" />,
    "producers": <MusicalNoteIcon className="h-4 w-4" />,
    "beats": <StarIcon className="h-4 w-4" />,
    "bookings": <CalendarDaysIcon className="h-4 w-4" />,
    "collabs": <UsersIcon className="h-4 w-4" />,
    "equipment": <WrenchScrewdriverIcon className="h-4 w-4" />,
    "services": <CogIcon className="h-4 w-4" />,
    "artists": <UserIcon className="h-4 w-4" />,
    "transactions": <ChartBarIcon className="h-4 w-4" />,
  };

  const resourceLabelMap: Record<string, string> = {
    "studios": "Recording Studios",
    "producers": "Producers", 
    "beats": "Beats Marketplace",
    "bookings": "Bookings",
    "collabs": "Collabs",
    "equipment": "Gear & Equipment",
    "services": "Music Services",
    "artists": "Profile",
    "transactions": "Live Feeds",
  };

  return refineMenuItems.map(item => ({
    ...item,
    label: resourceLabelMap[item.name] || item.label || item.name,
    icon: resourceIconMap[item.name],
    checked: item.key === selectedKey,
  }));
};

const menuGroups: MenuGroupConfig[] = [
  {
    id: "beep", // Changed to match Menu.tsx
    label: "beep!",
    icon: <MusicalNoteIcon className="h-4 w-4" />,
    items: [
      "studios",
      "producers", 
      "beats",
      "bookings",
      "collabs",
      "equipment",
      "services",
      "artists",
      "transactions"
    ],
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

  const displayMenuItems = getResourceMenuItems(menuItems, selectedKey);

  const getMenuItemsByGroup = (groupItems: string[] = []) => {
    return displayMenuItems.filter((item) => 
      groupItems.includes(item.name)
    );
  };

  return (
    <nav data-tour="navigation-menu" className="h-full">
      <div className={`px-4 py-4 space-y-6 ${theme === "dark" ? "bg-black" : "bg-white"}`}>
        {isClient &&
          menuGroups.map((group) => {
            const groupItems = getMenuItemsByGroup(group.items || []);
            
            if (groupItems.length === 0) return null;
            
            return (
              <MenuGroup
                key={group.id}
                group={group}
                collapsed={collapsed}
                groupItems={groupItems}
                selectedKey={selectedKey}
                isExpanded={expandedGroups.includes(group.id)}
                toggleGroup={toggleGroup}
                allMenuItems={displayMenuItems}
              />
            );
          })}
      </div>
    </nav>
  );
};