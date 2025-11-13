// NavigationMenu.tsx
"use client";

import React, { useState, useEffect } from "react";
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
  {
    id: "communities",
    label: "Communities",
    icon: <UsersIcon className="h-4 w-4" />,
    items: [], // Will be populated dynamically with user's joined communities
  },
];

// Helper function to get icon for role
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
  const [userCommunities, setUserCommunities] = useState<IMenuItem[]>([]);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState<boolean>(true);

  const displayMenuItems = getResourceMenuItems(menuItems, selectedKey);

  // Fetch user's communities
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setIsLoadingCommunities(true);

        // Get Supabase user ID
        const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
        const supabase = createClientComponentClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setUserCommunities([]);
          return;
        }

        // Fetch user's database ID
        const userResponse = await fetch(`/api/users/by-supabase/${user.id}`);
        if (!userResponse.ok) {
          console.error('Failed to fetch user data');
          setUserCommunities([]);
          return;
        }

        const userData = await userResponse.json();
        const userId = userData.data.id;

        // Fetch user's communities
        const communitiesResponse = await fetch(`/api/users/${userId}/communities`);
        if (!communitiesResponse.ok) {
          console.error('Failed to fetch communities');
          setUserCommunities([]);
          return;
        }

        const communitiesData = await communitiesResponse.json();

        // Transform API response to menu items
        const communities: IMenuItem[] = communitiesData.data.map((community: any) => ({
          key: `community-${community.role.toLowerCase()}`,
          name: `${community.role.toLowerCase()}-community`,
          label: community.label,
          route: community.route,
          icon: getRoleIcon(community.icon),
        }));

        setUserCommunities(communities);
      } catch (error) {
        console.error('Error fetching communities:', error);
        setUserCommunities([]);
      } finally {
        setIsLoadingCommunities(false);
      }
    };

    if (isClient) {
      fetchCommunities();
    }
  }, [isClient]);

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
            // For Communities group, use custom items
            const groupItems = group.id === "communities"
              ? userCommunities
              : getMenuItemsByGroup(group.items || []);

            // Don't show empty groups (except Communities which we always show)
            if (groupItems.length === 0 && group.id !== "communities") return null;

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