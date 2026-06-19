"use client";

import { useState, useRef, useEffect } from "react";
import { LayoutGrid, ChevronDown, Plus, Activity, Check } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useGetIdentity } from "@refinedev/core";
import { useClubs } from "@/hooks/api/useClubs";

interface WorkspaceHeaderProps {
  collapsed: boolean;
  onCreateClub?: () => void;
}

export const WorkspaceHeader = ({
  collapsed,
  onCreateClub,
}: WorkspaceHeaderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // ✅ USE IDENTITY INSTEAD OF FETCHING FROM DB
  const { data: identity } = useGetIdentity<any>();
  const dbId = identity?.dbId; // Grab the internal DB ID exposed by our auth provider

  const { data: clubsData } = useClubs(dbId, {
    enabled: !!dbId, // Only fetch clubs if we have the DB ID
  });

  const clubsCount = clubsData?.length || 0;

  const currentClubId = pathname.startsWith('/club/') ? pathname.split('/')[2] : null;
  const currentClub = clubsData?.find((c: any) => c.id === currentClubId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`px-4 py-6 flex flex-col gap-6 border-b border-zinc-800 bg-[#030303] ${collapsed ? 'items-center' : ''}`}>
      
      {/* Clean Logo */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
        {collapsed ? (
           <LayoutGrid className="w-6 h-6 text-white" strokeWidth={2} />
        ) : (
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-white leading-none mb-1">
              BEEPS<span className="text-purple-500">.</span>
            </span>
            <span className="text-xs font-medium text-zinc-500">
              Creator Network
            </span>
          </div>
        )}
      </div>

      {/* Workspace Switcher */}
      <div className="relative w-full" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full flex items-center justify-between transition-colors duration-200 outline-none border border-zinc-800 rounded-xl bg-zinc-900/50 hover:bg-zinc-800
            ${collapsed ? "p-2 justify-center" : "p-3"}
          `}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm">
              {currentClub ? (currentClub.icon || '🎵') : <Activity className="w-4 h-4" />}
            </div>
            {!collapsed && (
              <span className="text-sm font-medium text-white truncate pr-2">
                {currentClub ? currentClub.name : "Your Clubs"}
              </span>
            )}
          </div>
          {!collapsed && (
            <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          )}
        </button>

        {/* Dropdown Flyout */}
        {isOpen && (
          <div className={`
            absolute z-50 bg-zinc-950 border border-zinc-800 shadow-xl rounded-xl flex flex-col overflow-hidden
            ${collapsed ? "left-full top-0 ml-4 w-[260px]" : "top-full left-0 w-full mt-2"}
          `}>
            
            {/* Clubs List */}
            <div className="flex flex-col bg-zinc-950">
              <div className="px-4 py-3 border-b border-zinc-800 text-xs font-semibold text-zinc-400 bg-zinc-900/50">
                Active Clubs ({clubsCount})
              </div>
              
              <div className="max-h-60 overflow-y-auto no-scrollbar flex flex-col">
                {clubsData?.map((club: any) => {
                  const isActive = currentClub?.id === club.id;
                  return (
                    <button 
                      key={club.id}
                      onClick={() => { router.push(`/club/${club.id}`); setIsOpen(false); }}
                      className="w-full flex items-center justify-between p-3 bg-transparent hover:bg-zinc-900 transition-colors outline-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 shrink-0 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sm">
                          {club.icon || '🎵'}
                        </div>
                        <span className={`text-sm font-medium truncate pr-2 ${isActive ? "text-white" : "text-zinc-400"}`}>
                          {club.name}
                        </span>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-white shrink-0" strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Create Action */}
            <div className="bg-zinc-950 border-t border-zinc-800">
              <button 
                onClick={() => { setIsOpen(false); onCreateClub?.(); }}
                className="w-full flex items-center gap-3 p-3 bg-transparent hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors outline-none"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-dashed border-zinc-700 shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">
                  Create New Club
                </span>
              </button>
            </div>

          </div>
        )}
      </div>
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};