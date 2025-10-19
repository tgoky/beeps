"use client";

import { useTheme } from "../../providers/ThemeProvider";
import { LogOut, User, Settings } from "lucide-react";

interface UserSectionProps {
  collapsed: boolean;
  handleLogout: () => void;
}

export const UserSection = ({ collapsed, handleLogout }: UserSectionProps) => {
  const { theme } = useTheme();

  // Mock user data - replace with actual user data from your auth context
  const user = {
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "/images/avatar-placeholder.png",
    role: "Admin"
  };

  return (
    <div className={`p-3 backdrop-blur-sm border-t ${
      theme === "dark" 
        ? "bg-gray-950/40 border-gray-800/50" 
        : "bg-white/40 border-gray-200/60"
    }`}>
      {!collapsed ? (
        <>
          {/* Compact User Info */}
          <div className={`
            flex items-center gap-2.5 p-2 rounded-lg mb-2.5
            ${theme === "dark" 
              ? "bg-gray-900/40 border-gray-800/60" 
              : "bg-gray-50/50 border-gray-200/60"
            }
            border
          `}>
            {/* User Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 bg-green-500 ${
                theme === "dark" ? "border-gray-900" : "border-white"
              }`}></div>
            </div>

            {/* User Details */}
            <div className="flex-1 min-w-0">
              <h3 className={`
                font-medium text-[13px] truncate
                ${theme === "dark" ? "text-gray-200" : "text-gray-900"}
              `}>
                {user.name}
              </h3>
              <p className={`
                text-[11px] truncate
                ${theme === "dark" ? "text-gray-500" : "text-gray-600"}
              `}>
                {user.role}
              </p>
            </div>
          </div>

          {/* Single Row Action Buttons */}
          <div className="flex gap-1.5">
            {/* Settings Button */}
            <button
              className={`
                flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg transition-all duration-200
                ${theme === "dark" 
                  ? "bg-gray-800/60 hover:bg-gray-800 text-gray-400 hover:text-gray-300" 
                  : "bg-gray-100/80 hover:bg-gray-200 text-gray-600 hover:text-gray-700"
                }
                border ${theme === "dark" ? "border-gray-800/60" : "border-gray-200/60"}
                active:scale-95
              `}
              aria-label="Settings"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Settings</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className={`
                flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg transition-all duration-200
                ${theme === "dark" 
                  ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300" 
                  : "bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700"
                }
                border ${theme === "dark" ? "border-red-500/20" : "border-red-200/50"}
                active:scale-95
              `}
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Logout</span>
            </button>
          </div>
        </>
      ) : (
        /* Collapsed State - Very Compact */
        <div className="space-y-2">
          {/* User Avatar Only */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 bg-green-500 ${
                theme === "dark" ? "border-gray-950" : "border-white"
              }`}></div>
            </div>
          </div>

          {/* Action Buttons - Icons Only */}
          <div className="flex justify-center gap-1">
            <button
              className={`
                p-1.5 rounded-lg transition-all duration-200
                ${theme === "dark" 
                  ? "bg-gray-800/60 hover:bg-gray-800 text-gray-400 hover:text-gray-300" 
                  : "bg-gray-100/80 hover:bg-gray-200 text-gray-600 hover:text-gray-700"
                }
                border ${theme === "dark" ? "border-gray-800/60" : "border-gray-200/60"}
                active:scale-95
              `}
              aria-label="Settings"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleLogout}
              className={`
                p-1.5 rounded-lg transition-all duration-200
                ${theme === "dark" 
                  ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300" 
                  : "bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700"
                }
                border ${theme === "dark" ? "border-red-500/20" : "border-red-200/50"}
                active:scale-95
              `}
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};