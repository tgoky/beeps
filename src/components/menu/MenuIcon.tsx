import React from 'react';
import {
  Building2,
  SlidersHorizontal,
  Disc,
  Calendar,
  Users,
  Lamp,
  Wrench,
  Activity,
  Mic2,
  Music2,
  Home,
  PenTool,
  Briefcase,
  FolderDot
} from "lucide-react";

interface MenuIconProps {
  name: string;
}

export const MenuIcon = ({ name }: MenuIconProps) => {
  const iconProps = {
    className: "w-[16px] h-[16px]",
    strokeWidth: 1.5
  };

  const iconMap: Record<string, React.ReactElement> = {
    // Resources
    "studios": <Building2 {...iconProps} />,
    "producers": <SlidersHorizontal {...iconProps} />,
    "beats": <Disc {...iconProps} />,
    "bookings": <Calendar {...iconProps} />,
    "collabs": <Users {...iconProps} />,
    "equipment": <Lamp {...iconProps} />,
    "services": <Wrench {...iconProps} />,
    "transactions": <Activity {...iconProps} />,
    
    // Club role icons
    "ARTIST": <Mic2 {...iconProps} />,
    "PRODUCER": <Music2 {...iconProps} />,
    "STUDIO_OWNER": <Home {...iconProps} />,
    "LYRICIST": <PenTool {...iconProps} />,
    "GEAR_SALES": <Wrench {...iconProps} />,
    "OTHER": <Briefcase {...iconProps} />,
    
    default: <FolderDot {...iconProps} />
  };

  if (name.includes('-')) {
    return iconMap[name.split('-')[0]] || iconMap.default;
  }

  return iconMap[name] || iconMap.default;
};