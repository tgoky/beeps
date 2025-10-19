// components/menu/MenuIcon.tsx
import React from 'react';
import {
  Mail,
  Tag,
  FileText,
  BarChart2,
  ClipboardList,
  Calculator,
  Megaphone,
  FolderSearch,
  PhoneCall,
  ListOrdered,
  Presentation,
  Workflow,
  Wand2,
  BookOpen,
  Users,
  GitBranch,
  Bot,
  Library,
  ShieldCheck,
  User,
  Notebook
} from "lucide-react";

interface MenuIconProps {
  name: string;
}

export const MenuIcon = ({ name }: MenuIconProps) => {
  const iconMap: Record<string, React.ReactElement> = {
    Admin: <ClipboardList className="h-4 w-4" />,
    Invites: <Megaphone className="h-4 w-4" />,
    default: (
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    ),
  };

  return iconMap[name] || iconMap.default;
};