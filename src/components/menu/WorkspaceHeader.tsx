// WorkspaceHeader.tsx
"use client";

import { useTheme } from "../../providers/ThemeProvider";
import { Users, Plus, Music, Building2, Mic2, Music2, Guitar, Headphones, User as UserIcon, ChevronRight } from "lucide-react";
import { useGetIdentity } from "@refinedev/core";
import { useUserBySupabaseId } from "@/hooks/api/useUserData";
import { useClubs } from "@/hooks/api/useClubs";
import { useEffect } from "react";

interface WorkspaceHeaderProps {
  collapsed: boolean;
  onCreateClub?: () => void;
  onSwitchClub?: () => void;
}

// Role icon mapping
const roleIcons: Record<string, React.ElementType> = {
  ARTIST: Mic2,
  PRODUCER: Music2,
  STUDIO_OWNER: Building2,
  GEAR_SALES: Guitar,
  LYRICIST: Headphones,
  OTHER: UserIcon,
};

// Role label mapping
const roleLabels: Record<string, string> = {
  ARTIST: "Artist",
  PRODUCER: "Producer",
  STUDIO_OWNER: "Studio Owner",
  GEAR_SALES: "Gear Specialist",
  LYRICIST: "Lyricist",
  OTHER: "Music Enthusiast",
};

// Role colors
const roleColors: Record<string, string> = {
  ARTIST: "bg-purple-500",
  PRODUCER: "bg-blue-500",
  STUDIO_OWNER: "bg-emerald-500",
  GEAR_SALES: "bg-orange-500",
  LYRICIST: "bg-pink-500",
  OTHER: "bg-gray-500",
};

export const WorkspaceHeader = ({
  collapsed,
  onCreateClub,
  onSwitchClub,
}: WorkspaceHeaderProps) => {
  const { theme } = useTheme();
  const { data: identity } = useGetIdentity<any>();

  // Fetch user data with TanStack Query
  const { data: userData } = useUserBySupabaseId(identity?.id, {
    enabled: !!identity?.id,
  });

  // Fetch user's clubs with TanStack Query
  const { data: clubsData } = useClubs(userData?.id, {
    enabled: !!userData?.id,
  });

  const clubsCount = clubsData?.length || 0;

  // Get current user info - use identity data as fallback
  const currentUser = {
    name: userData?.username || identity?.user_metadata?.username || identity?.email?.split('@')[0] || "User",
    fullName: userData?.fullName || identity?.user_metadata?.full_name || identity?.email?.split('@')[0] || "Music Creator",
    type: userData?.primaryRole || identity?.user_metadata?.role || "OTHER",
    avatar: userData?.avatar || identity?.user_metadata?.avatar,
    icon: "🎵",
  };

  const RoleIcon = roleIcons[currentUser.type] || UserIcon;
  const roleLabel = roleLabels[currentUser.type] || "Music Enthusiast";
  const roleColor = roleColors[currentUser.type] || "bg-gray-500";

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

  return (
    <div
      className={`border-b transition-all duration-200 ${
        theme === "dark" 
          ? "bg-black border-zinc-800" 
          : "bg-white border-zinc-200"
      }`}
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      {!collapsed ? (
        <div className="space-y-3 p-3">
          {/* Main Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className={`w-4 h-4 ${
                theme === "dark" ? "text-zinc-600" : "text-zinc-400"
              }`} />
              <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${
                theme === "dark" ? "text-zinc-600" : "text-zinc-400"
              }`}>
                make a beep!
              </span>
            </div>
      
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateClub?.();
              }}
              className={`
                p-1.5 rounded-lg transition-all duration-200
                ${theme === "dark" 
                  ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-300 border border-zinc-800" 
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 border border-zinc-200"
                }
                active:scale-95
              `}
              title="Create New Club"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Current User Card */}
          <div 
            onClick={onSwitchClub}
            className={`
              p-2.5 rounded-lg border cursor-pointer transition-all duration-200 group
              ${theme === "dark" 
                ? "bg-black border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900" 
                : "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
              }
              active:scale-[0.98]
            `}
          >
            <div className="flex items-center gap-2.5">
              {/* User Avatar/Icon */}
              {userData?.avatar ? (
                <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-white/10">
                  <img 
                    src={userData.avatar} 
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className={`w-9 h-9 rounded-lg ${roleColor} flex items-center justify-center text-white text-sm flex-shrink-0 ring-1 ring-white/10`}>
                  {currentUser.icon}
                </div>
              )}
              
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <h3 className={`
                  font-semibold text-[13px] truncate
                  ${theme === "dark" ? "text-zinc-200" : "text-zinc-900"}
                `}>
                  {currentUser.fullName}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <RoleIcon className={`w-3 h-3 ${theme === "dark" ? "text-zinc-600" : "text-zinc-400"}`} />
                  <span className={`
                    text-[11px] font-medium
                    ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"}
                  `}>
                    {roleLabel}
                  </span>
                </div>
              </div>

              {/* Clubs Count */}
              <div className={`
                flex items-center gap-1 px-2 py-1 rounded-md transition-all duration-200
                ${theme === "dark" 
                  ? "bg-zinc-900 group-hover:bg-zinc-800" 
                  : "bg-zinc-100 group-hover:bg-zinc-200"
                }
              `}>
                <Users className={`w-3 h-3 ${theme === "dark" ? "text-zinc-600" : "text-zinc-400"}`} />
                <span className={`
                  text-[11px] font-semibold
                  ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}
                `}>
                  {clubsCount}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className={`
            flex items-center justify-between text-[10px] font-medium px-1
            ${theme === "dark" ? "text-zinc-600" : "text-zinc-500"}
          `}>
            <span>{clubsCount} {clubsCount === 1 ? 'club' : 'clubs'}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${
                theme === "dark" ? "bg-emerald-500" : "bg-emerald-600"
              }`} />
              <span className={theme === "dark" ? "text-zinc-500" : "text-zinc-600"}>Active</span>
            </span>
          </div>
        </div>
      ) : (
        /* Collapsed State */
        <div className="space-y-3 p-2">
          {/* Logo */}
          <div className="flex justify-center">
            <div className={`
              w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm
              bg-gradient-to-br from-purple-500 to-pink-600 ring-1 ring-white/10
            `}>
              🎵
            </div>
          </div>

          {/* Current User Icon */}
          <div 
            onClick={onSwitchClub}
            className={`
              flex justify-center cursor-pointer p-1.5 rounded-lg transition-all duration-200
              ${theme === "dark" 
                ? "hover:bg-zinc-900" 
                : "hover:bg-zinc-100"
              }
            `}
            title={`${currentUser.fullName} - ${roleLabel}`}
          >
            {userData?.avatar ? (
              <div className="w-7 h-7 rounded-md overflow-hidden ring-1 ring-white/10">
                <img 
                  src={userData.avatar} 
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className={`w-7 h-7 rounded-md ${roleColor} flex items-center justify-center text-white text-xs ring-1 ring-white/10`}>
                {currentUser.icon}
              </div>
            )}
          </div>

          {/* Create Club Button */}
          <div className="flex justify-center">
            <button
              onClick={onCreateClub}
              className={`
                p-1.5 rounded-lg transition-all duration-200
                ${theme === "dark" 
                  ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-300 border border-zinc-800" 
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 border border-zinc-200"
                }
                active:scale-95
              `}
              title="Create New Club"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};