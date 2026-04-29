"use client";

import { LogOut, User, Settings, Zap } from "lucide-react";
import { useGetIdentity } from "@refinedev/core";

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
  const { data: identity } = useGetIdentity<UserIdentity>();

  // Use real user data from auth, with fallbacks
  const user = {
    name: identity?.name || "User",
    email: identity?.email || "",
    avatar: identity?.imageUrl || null,
    role: identity?.roles?.[0] || "MEMBER"
  };

  return (
    <div className="p-4 border-t border-white/10 bg-[#030303]">
      {!collapsed ? (
        <>
          {/* User Info Block */}
          <div className="flex items-center gap-3 mb-4">
            
            {/* Sharp Avatar Box */}
            <div className="relative flex-shrink-0 w-8 h-8 bg-black border border-white/20 flex items-center justify-center">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-full h-full object-cover grayscale opacity-90 hover:grayscale-0 transition-all duration-300"
                />
              ) : (
                <User className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
              )}
              {/* Brutalist Status Square (Instead of a green dot) */}
              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-black" title="Online"></div>
            </div>

            {/* User Details */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h3 className="font-black text-[10px] uppercase tracking-widest text-white truncate">
                {user.name}
              </h3>
              <p className="font-bold text-[8px] uppercase tracking-[0.2em] text-zinc-500 truncate mt-0.5">
                {user.role}
              </p>
            </div>
          </div>

          {/* Split Action Bar - Zero Borders outside, sharp divider inside */}
          <div className="flex border border-white/10 bg-black">
            <button
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border-r border-white/10 text-zinc-500 hover:text-white hover:bg-white/5 transition-colors outline-none"
              aria-label="Settings"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="text-[8px] font-black uppercase tracking-widest">Config</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors outline-none"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="text-[8px] font-black uppercase tracking-widest">Eject</span>
            </button>
          </div>
        </>
      ) : (
        /* Collapsed State - Ultra Minimal */
        <div className="flex flex-col items-center gap-4">
          
          {/* Avatar Only */}
          <div className="relative w-8 h-8 bg-black border border-white/20 flex items-center justify-center cursor-pointer hover:border-white transition-colors" title={user.name}>
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300"
              />
            ) : (
              <User className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
            )}
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-black"></div>
          </div>

          {/* Stacked Actions */}
          <div className="flex flex-col gap-2 w-full border border-white/10 bg-black">
            <button
              className="w-full flex items-center justify-center py-2 border-b border-white/10 text-zinc-500 hover:text-white hover:bg-white/5 transition-colors outline-none"
              aria-label="Settings"
              title="Config"
            >
              <Settings className="w-4 h-4" strokeWidth={1.5} />
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center py-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors outline-none"
              aria-label="Logout"
              title="Eject"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};