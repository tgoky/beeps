// MenuIcon.tsx
import React from 'react';
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

interface MenuIconProps {
  name: string;
}

export const MenuIcon = ({ name }: MenuIconProps) => {
  const iconMap: Record<string, React.ReactElement> = {
    // Resources
    "studios": <BuildingStorefrontIcon className="h-4 w-4" />,
    "producers": <MusicalNoteIcon className="h-4 w-4" />,
    "beats": <StarIcon className="h-4 w-4" />,
    "bookings": <CalendarDaysIcon className="h-4 w-4" />,
    "collabs": <UsersIcon className="h-4 w-4" />,
    "equipment": <WrenchScrewdriverIcon className="h-4 w-4" />,
    "services": <CogIcon className="h-4 w-4" />,
    "transactions": <ChartBarIcon className="h-4 w-4" />,
    
    // Club role icons (for clubs)
    "ARTIST": <Mic2 className="h-4 w-4" />,
    "PRODUCER": <Music2 className="h-4 w-4" />,
    "STUDIO_OWNER": <Home className="h-4 w-4" />,
    "LYRICIST": <PenTool className="h-4 w-4" />,
    "GEAR_SALES": <WrenchScrewdriverIcon className="h-4 w-4" />,
    "OTHER": <Briefcase className="h-4 w-4" />,
    
    default: <UsersIcon className="h-4 w-4" />
  };

  // Check if this is a club item (keys start with club-)
  if (name.includes('-')) {
    return iconMap[name.split('-')[0]] || iconMap.default;
  }

  return iconMap[name] || iconMap.default;
};