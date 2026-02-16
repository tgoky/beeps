// NavigationMenu.tsx
"use client";

import React, { useMemo, useEffect } from "react";
import { useTheme } from "../../providers/ThemeProvider";
import { MenuGroup } from "./MenuGroup";
import { MenuItem } from "./MenuItem";
import { useUserBySupabaseId } from "@/hooks/api/useUserData";
import { useClubs } from "@/hooks/api/useClubs";
import {
  BuildingStorefrontIcon,
  MusicalNoteIcon,
  StarIcon,
  CalendarDaysIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  CogIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { Mic2, Music2, Home, Briefcase, PenTool } from "lucide-react";

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
    "transactions": <ChartBarIcon className="h-4 w-4" />,
  };

  const resourceLabelMap: Record<string, string> = {
    "studios": "Recording Studios",
    "producers": "Producers", 
    "beats": "Beat Marketplace",
    "bookings": "Bookings",
    "collabs": "Collabs",
    "equipment": "Gear & Equipment",
    "services": "Music Services",
    "transactions": "Live Feeds",
  };

  return refineMenuItems.map(item => ({
    ...item,
    label: resourceLabelMap[item.name] || item.label || item.name,
    icon: resourceIconMap[item.name],
    checked: item.key === selectedKey,
  }));
};

// Restructured menu groups
const menuGroups: MenuGroupConfig[] = [
  {
    id: "create",
    label: "Create",
    icon: <MusicalNoteIcon className="h-4 w-4" />,
    items: [
      "studios",     // Recording Studios
      "producers",   // Producers
      "services",    // Music Services
    ],
  },
  {
    id: "collabs",
    label: "Collaborate",
    icon: <UsersIcon className="h-4 w-4" />,
    items: [
      "collabs",      // Collabs
      "transactions", // Live Feeds
    ],
  },
  {
    id: "gear",
    label: "Gear",
    icon: <WrenchScrewdriverIcon className="h-4 w-4" />,
    items: [
      "equipment",    // Gear & Equipment
      "beats",        // Beat Marketplace
    ],
  },
  {
    id: "clubs",
    label: "Clubs",
    icon: <UsersIcon className="h-4 w-4" />,
    items: [], // Will be populated dynamically with user's clubs
  },
];

// Helper function to get icon for role (for clubs)
const getRoleIcon = (roleIcon: string): React.ReactElement => {
  const iconMap: Record<string, React.ReactElement> = {
    "ARTIST": <Mic2 className="h-4 w-4" />,
    "PRODUCER": <Music2 className="h-4 w-4" />,
    "STUDIO_OWNER": <Home className="h-4 w-4" />,
    "LYRICIST": <PenTool className="h-4 w-4" />,
    "GEAR_SALES": <WrenchScrewdriverIcon className="h-4 w-4" />,
    "OTHER": <Briefcase className="h-4 w-4" />,
  };
  return iconMap[roleIcon] || <UsersIcon className="h-4 w-4" />;
};

export const NavigationMenu = ({
  isClient,
  collapsed,
  menuItems,
  selectedKey,
  expandedGroups,
  toggleGroup,
}: NavigationMenuProps) => {
  const { theme } = useTheme();
  const [supabaseUser, setSupabaseUser] = React.useState<any>(null);

  // Get Supabase user ID
  React.useEffect(() => {
    const getSupabaseUser = async () => {
      const { createBrowserClient } = await import('@supabase/ssr');
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser();
      setSupabaseUser(user);
    };

    if (isClient) {
      getSupabaseUser();
    }
  }, [isClient]);

  // Fetch user data with TanStack Query
  const { data: userData } = useUserBySupabaseId(supabaseUser?.id, {
    enabled: isClient && !!supabaseUser?.id,
  });

  // Fetch user's clubs with TanStack Query
  const { data: clubsData } = useClubs(
    userData?.id,
    {
      enabled: isClient && !!userData?.id,
    }
  );

  const displayMenuItems = getResourceMenuItems(menuItems, selectedKey);

  // Transform clubs data to menu items
  const userClubs = useMemo(() => {
    if (!clubsData) return [];

    return (clubsData as any[])?.map((club: any) => ({
      key: `club-${club.id}`,
      name: club.name.toLowerCase().replace(/\s+/g, '-'),
      label: club.name,
      route: `/club/${club.id}`,
      icon: getRoleIcon(club.primaryRole || 'OTHER'),
    })) || [];
  }, [clubsData]);

  const getMenuItemsByGroup = (groupItems: string[] = []) => {
    return displayMenuItems.filter((item) =>
      groupItems.includes(item.name)
    );
  };

  // Inject Manrope font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Find the Bookings item (should be first, outside any group)
  const bookingsItem = displayMenuItems.find(item => item.name === "bookings");

  return (
    <nav data-tour="navigation-menu" className="flex-1 overflow-y-auto py-4">
      <div className={`px-3 space-y-4 ${
        theme === "dark" ? "bg-black" : "bg-white"
      }`} style={{ fontFamily: "'Manrope', sans-serif" }}>
        
        {/* Bookings - Always visible first, outside any group */}
        {bookingsItem && (
          <div className="mb-2">
            <MenuItem
              key={bookingsItem.key}
              item={bookingsItem}
              selected={selectedKey === bookingsItem.key}
              collapsed={collapsed}
              pathname=""
            />
          </div>
        )}

        {/* Menu Groups */}
        {isClient &&
          menuGroups.map((group) => {
            // For Clubs group, use custom items from user's clubs
            const groupItems = group.id === "clubs"
              ? userClubs
              : getMenuItemsByGroup(group.items || []);

            // Don't show empty groups
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