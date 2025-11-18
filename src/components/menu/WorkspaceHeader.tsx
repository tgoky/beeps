// WorkspaceHeader.tsx
"use client";

import { useTheme } from "../../providers/ThemeProvider";
import { Users, Plus, Music, Building2, Mic2, Music2, Guitar, Headphones, User as UserIcon } from "lucide-react";
import { useGetIdentity } from "@refinedev/core";
import { useUserBySupabaseId } from "@/hooks/api/useUserData";
import { useClubs } from "@/hooks/api/useClubs";

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

  return (
    <div
      className={`border-b backdrop-blur-sm ${
        theme === "dark" 
          ? "bg-black border-gray-800/50" 
          : "bg-white/40 border-gray-200/60"
      }`}
    >
      {!collapsed ? (
        <div className="space-y-2.5 p-3">
          {/* Main Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className={`w-4 h-4 ${theme === "dark" ? "text-purple-400" : "text-purple-600"}`} />
              <span className={`text-[11px] font-medium tracking-[0.15em] ${
                theme === "dark" ? "text-gray-300" : "text-gray-900"
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
                  ? "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20" 
                  : "bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200/50"
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
              p-2.5 rounded-lg border cursor-pointer transition-all duration-200
              ${theme === "dark" 
                ? "bg-gray-900/40 border-gray-800/60 hover:border-gray-700/80 hover:bg-gray-900/60" 
                : "bg-gray-50/50 border-gray-200/60 hover:border-gray-300/80 hover:bg-gray-100/50"
              }
              active:scale-[0.98]
            `}
          >
            <div className="flex items-center gap-2.5">
              {/* User Avatar/Icon */}
              {userData?.avatar ? (
                <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={userData.avatar} 
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className={`w-9 h-9 rounded-lg ${roleColor} flex items-center justify-center text-white text-sm flex-shrink-0`}>
                  {currentUser.icon}
                </div>
              )}
              
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <h3 className={`
                  font-medium text-[13px] truncate
                  ${theme === "dark" ? "text-gray-200" : "text-gray-900"}
                `}>
                  {currentUser.fullName}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <RoleIcon className={`w-3 h-3 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
                  <span className={`
                    text-[11px]
                    ${theme === "dark" ? "text-gray-500" : "text-gray-600"}
                  `}>
                    {roleLabel}
                  </span>
                </div>
              </div>

              {/* Clubs Count */}
              <div className={`
                flex items-center gap-1 px-2 py-1 rounded-md
                ${theme === "dark" ? "bg-gray-800/50" : "bg-gray-100"}
              `}>
                <Users className={`w-3 h-3 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
                <span className={`
                  text-[11px] font-medium
                  ${theme === "dark" ? "text-gray-400" : "text-gray-600"}
                `}>
                  {clubsCount}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className={`
            flex items-center justify-between text-[10px] px-1
            ${theme === "dark" ? "text-gray-600" : "text-gray-500"}
          `}>
            <span>{clubsCount} {clubsCount === 1 ? 'club' : 'clubs'}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${theme === "dark" ? "bg-green-500" : "bg-green-600"}`} />
              Active
            </span>
          </div>
        </div>
      ) : (
        /* Collapsed State */
        <div className="space-y-2.5 p-2">
          {/* Logo */}
          <div className="flex justify-center">
            <div className={`
              w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm
              bg-gradient-to-br from-purple-500 to-pink-600
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
                ? "hover:bg-gray-800/60" 
                : "hover:bg-gray-100/80"
              }
            `}
            title={`${currentUser.fullName} - ${roleLabel}`}
          >
            {userData?.avatar ? (
              <div className="w-7 h-7 rounded-md overflow-hidden">
                <img 
                  src={userData.avatar} 
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className={`w-7 h-7 rounded-md ${roleColor} flex items-center justify-center text-white text-xs`}>
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
                  ? "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20" 
                  : "bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200/50"
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