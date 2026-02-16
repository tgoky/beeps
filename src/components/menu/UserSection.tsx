// UserSection.tsx
"use client";

import { useTheme } from "../../providers/ThemeProvider";
import { LogOut, User, Settings } from "lucide-react";
import { useGetIdentity } from "@refinedev/core";
import { useEffect } from "react";

interface UserSectionProps {
  collapsed: boolean;
  handleLogout: () => void;
}

interface UserIdentity {
  id: string;
  name: string | null;
  email: string;
  imageUrl: string | null;
  roles: string[];
}

export const UserSection = ({ collapsed, handleLogout }: UserSectionProps) => {
  const { theme } = useTheme();
  const { data: identity } = useGetIdentity<UserIdentity>();

  // Use real user data from auth, with fallbacks
  const user = {
    name: identity?.name || "User",
    email: identity?.email || "",
    avatar: identity?.imageUrl || null,
    role: identity?.roles?.[0] || "Member"
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

  return (
    <div className={`p-3 border-t ${
      theme === "dark" 
        ? "bg-black border-zinc-800" 
        : "bg-white border-zinc-200"
    }`} style={{ fontFamily: "'Manrope', sans-serif" }}>
      {!collapsed ? (
        <>
          {/* Compact User Info */}
          <div className={`
            flex items-center gap-2.5 p-2 rounded-lg mb-2.5 transition-all duration-200
            ${theme === "dark" 
              ? "bg-black border-zinc-800 hover:border-zinc-700" 
              : "bg-white border-zinc-200 hover:border-zinc-300"
            }
            border
          `}>
            {/* User Avatar */}
            <div className="relative flex-shrink-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold ring-1 ring-white/10 ${
                theme === "dark" ? "bg-zinc-900" : "bg-zinc-100"
              }`}>
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                ) : (
                  <User className={`w-3.5 h-3.5 ${
                    theme === "dark" ? "text-zinc-500" : "text-zinc-400"
                  }`} />
                )}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 bg-emerald-500 ${
                theme === "dark" ? "border-black" : "border-white"
              }`}></div>
            </div>

            {/* User Details */}
            <div className="flex-1 min-w-0">
              <h3 className={`
                font-semibold text-[13px] truncate
                ${theme === "dark" ? "text-zinc-200" : "text-zinc-900"}
              `}>
                {user.name}
              </h3>
              <p className={`
                text-[11px] font-medium truncate
                ${theme === "dark" ? "text-zinc-600" : "text-zinc-500"}
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
                  ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 border border-zinc-800" 
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 border border-zinc-200"
                }
                active:scale-95
              `}
              aria-label="Settings"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold tracking-wide">Settings</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className={`
                flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg transition-all duration-200
                ${theme === "dark" 
                  ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 border border-zinc-800" 
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-red-600 border border-zinc-200"
                }
                active:scale-95
              `}
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold tracking-wide">Logout</span>
            </button>
          </div>
        </>
      ) : (
        /* Collapsed State - Very Compact */
        <div className="space-y-2">
          {/* User Avatar Only */}
          <div className="flex justify-center">
            <div className="relative">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ring-1 ring-white/10 ${
                theme === "dark" ? "bg-zinc-900" : "bg-zinc-100"
              }`}>
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                ) : (
                  <User className={`w-3.5 h-3.5 ${
                    theme === "dark" ? "text-zinc-500" : "text-zinc-400"
                  }`} />
                )}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 bg-emerald-500 ${
                theme === "dark" ? "border-black" : "border-white"
              }`}></div>
            </div>
          </div>

          {/* Action Buttons - Icons Only */}
          <div className="flex justify-center gap-1">
            <button
              className={`
                p-1.5 rounded-lg transition-all duration-200
                ${theme === "dark" 
                  ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 border border-zinc-800" 
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 border border-zinc-200"
                }
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
                  ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 border border-zinc-800" 
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-red-600 border border-zinc-200"
                }
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