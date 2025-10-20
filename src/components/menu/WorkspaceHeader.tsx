// WorkspaceHeader.tsx
"use client";

import { useTheme } from "../../providers/ThemeProvider";
import { Users, Plus, Music, Building2 } from "lucide-react";

interface WorkspaceHeaderProps {
  collapsed: boolean;
  onCreateClub?: () => void;
  onSwitchClub?: () => void;
}

export const WorkspaceHeader = ({
  collapsed,
  onCreateClub,
  onSwitchClub,
}: WorkspaceHeaderProps) => {
  const { theme } = useTheme();

  const currentClub = {
    name: "Studio Alpha",
    type: "Recording Studio",
    members: 12,
    color: "bg-purple-500",
    icon: "🎵"
  };

  const userClubs = [
    { name: "Studio Alpha", type: "Recording Studio", members: 12 },
    { name: "Beat Lab", type: "Production House", members: 8 },
    { name: "Vocal Booth", type: "Vocal Studio", members: 6 }
  ];

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

          {/* Current Club Card */}
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
              {/* Club Icon */}
              <div className={`w-9 h-9 rounded-lg ${currentClub.color} flex items-center justify-center text-white text-sm`}>
                {currentClub.icon}
              </div>
              
              {/* Club Info */}
              <div className="flex-1 min-w-0">
                <h3 className={`
                  font-medium text-[13px] truncate
                  ${theme === "dark" ? "text-gray-200" : "text-gray-900"}
                `}>
                  {currentClub.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Building2 className={`w-3 h-3 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
                  <span className={`
                    text-[11px]
                    ${theme === "dark" ? "text-gray-500" : "text-gray-600"}
                  `}>
                    {currentClub.type}
                  </span>
                </div>
              </div>

              {/* Members Count */}
              <div className={`
                flex items-center gap-1 px-2 py-1 rounded-md
                ${theme === "dark" ? "bg-gray-800/50" : "bg-gray-100"}
              `}>
                <Users className={`w-3 h-3 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
                <span className={`
                  text-[11px] font-medium
                  ${theme === "dark" ? "text-gray-400" : "text-gray-600"}
                `}>
                  {currentClub.members}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className={`
            flex items-center justify-between text-[10px] px-1
            ${theme === "dark" ? "text-gray-600" : "text-gray-500"}
          `}>
            <span>{userClubs.length} clubs</span>
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

          {/* Current Club Icon */}
          <div 
            onClick={onSwitchClub}
            className={`
              flex justify-center cursor-pointer p-1.5 rounded-lg transition-all duration-200
              ${theme === "dark" 
                ? "hover:bg-gray-800/60" 
                : "hover:bg-gray-100/80"
              }
            `}
            title={`${currentClub.name} - ${currentClub.type}`}
          >
            <div className={`w-7 h-7 rounded-md ${currentClub.color} flex items-center justify-center text-white text-xs`}>
              {currentClub.icon}
            </div>
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