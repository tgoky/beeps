"use client";

import React, { useEffect, useState } from "react";
import { MenuGroup, MenuGroupConfig } from "./MenuGroup";
import { MenuItem, IMenuItem } from "./MenuItem";
import { Building2, Users, Wrench } from "lucide-react";

interface NavigationMenuProps {
  isClient: boolean;
  collapsed: boolean;
  menuItems: IMenuItem[];
  selectedKey: string;
  expandedGroups: string[];
  toggleGroup: (groupId: string) => void;
}

const getResourceMenuItems = (refineMenuItems: IMenuItem[], selectedKey: string): IMenuItem[] => {
  const resourceLabelMap: Record<string, string> = {
    "studios": "Recording Studios",
    "producers": "Producers", 
    "beats": "Beat Market",
    "bookings": "Bookings",
    "collabs": "Collabs",
    "equipment": "Equipment",
    "services": "Services",
    "transactions": "Live Feeds",
  };

  return refineMenuItems.map(item => ({
    ...item,
    label: resourceLabelMap[item.name] || item.label || item.name,
    checked: item.key === selectedKey,
  }));
};

const menuGroups: MenuGroupConfig[] = [
  { id: "create", label: "Create", icon: <Building2 className="w-4 h-4" />, items: ["studios", "producers", "services"] },
  { id: "collabs", label: "Collaborate", icon: <Users className="h-4 w-4" />, items: ["collabs", "transactions"] },
  { id: "gear", label: "Gear", icon: <Wrench className="h-4 w-4" />, items: ["equipment", "beats"] },
  // "Clubs" group entirely removed!
];

export const NavigationMenu = ({
  isClient,
  collapsed,
  menuItems,
  selectedKey,
  expandedGroups,
  toggleGroup,
}: NavigationMenuProps) => {

  const displayMenuItems = getResourceMenuItems(menuItems, selectedKey);
  const getMenuItemsByGroup = (groupItems: string[] = []) => displayMenuItems.filter((item) => groupItems.includes(item.name));
  const bookingsItem = displayMenuItems.find(item => item.name === "bookings");

  return (
    <nav className="flex-1 overflow-y-auto py-6 bg-transparent no-scrollbar">
      <div className="px-4 space-y-2 bg-transparent">
        
        {bookingsItem && (
          <div className="mb-6">
            <MenuItem
              key={bookingsItem.key}
              item={bookingsItem}
              selected={selectedKey === bookingsItem.key}
              collapsed={collapsed}
              pathname=""
            />
          </div>
        )}

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
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </nav>
  );
};