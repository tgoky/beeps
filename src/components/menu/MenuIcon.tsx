// components/menu/MenuIcon.tsx
import React from 'react';
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
  FolderIcon,
} from "@heroicons/react/24/outline";

interface MenuIconProps {
  name: string;
}

export const MenuIcon = ({ name }: MenuIconProps) => {
  const iconMap: Record<string, React.ReactElement> = {
    // Only your Refine resources
    "studios": <BuildingStorefrontIcon className="h-4 w-4" />,
    "producers": <MusicalNoteIcon className="h-4 w-4" />,
    "beats": <StarIcon className="h-4 w-4" />,
    "bookings": <CalendarDaysIcon className="h-4 w-4" />,
    "collabs": <UsersIcon className="h-4 w-4" />,
    "equipment": <WrenchScrewdriverIcon className="h-4 w-4" />,
    "services": <CogIcon className="h-4 w-4" />,
    "artists": <UserIcon className="h-4 w-4" />,
    "transactions": <ChartBarIcon className="h-4 w-4" />,
    
    default: <FolderIcon className="h-4 w-4" />
  };

  return iconMap[name] || iconMap.default;
};