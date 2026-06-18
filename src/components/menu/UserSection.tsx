"use client";

import { LogOut, User, Settings } from "lucide-react";
import { useGetIdentity } from "@refinedev/core";

interface UserSectionProps {
  collapsed: boolean;
  handleLogout: () => void;
}

// ✅ Updated: Replaced `imageUrl` with `avatar` to match your database schema
interface UserIdentity {
  id: string;
  name: string | null;
  email: string;
  avatar?: string; // or string | null depending on your exact auth provider payload
  roles: string[];
}

export const UserSection = ({ collapsed, handleLogout }: UserSectionProps) => {
  const { data: identity } = useGetIdentity<UserIdentity>();

  // ✅ Updated: Mapped to `identity?.avatar`
  const user = {
    name: identity?.name || "User",
    email: identity?.email || "",
    avatar: identity?.avatar || null, 
    role: identity?.roles?.[0] || "Member"
  };

  return (
    <div className="p-4 border-t border-zinc-800 bg-[#030303]">
      {!collapsed ? (
        <div className="flex flex-col gap-4">
          {/* User Info Block */}
          <div className="flex items-center gap-3">
            
            {/* Smooth Avatar */}
            <div className="relative flex-shrink-0">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border border-zinc-800"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <User className="w-5 h-5 text-zinc-500" strokeWidth={1.5} />
                </div>
              )}
              {/* Standard Online Indicator */}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#030303] rounded-full" title="Online"></div>
            </div>

            {/* User Details */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h3 className="text-sm font-semibold text-white truncate">
                {user.name}
              </h3>
              <p className="text-xs font-medium text-zinc-500 truncate capitalize mt-0.5">
                {user.role.toLowerCase()}
              </p>
            </div>
          </div>

          {/* Action Bar - Soft Buttons */}
          <div className="flex items-center gap-2">
            <button
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all outline-none"
              aria-label="Settings"
              title="Settings"
            >
              <Settings className="w-4 h-4" strokeWidth={2} />
              <span>Settings</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all outline-none"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="w-4 h-4" strokeWidth={2} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      ) : (
        /* Collapsed State */
        <div className="flex flex-col items-center gap-5">
          
          {/* Avatar Only */}
          <div className="relative flex-shrink-0 cursor-pointer" title={user.name}>
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border border-zinc-800 hover:border-zinc-600 transition-colors"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:border-zinc-600 transition-colors">
                <User className="w-5 h-5 text-zinc-500" strokeWidth={1.5} />
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#030303] rounded-full"></div>
          </div>

          {/* Stacked Actions */}
          <div className="flex flex-col gap-2 w-full">
            <button
              className="w-full flex items-center justify-center p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all outline-none"
              title="Settings"
            >
              <Settings className="w-5 h-5" strokeWidth={2} />
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2.5 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all outline-none"
              title="Logout"
            >
              <LogOut className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};