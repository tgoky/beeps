"use client";

import { useState, useRef, useEffect } from "react";
import { LayoutGrid, ChevronDown, Plus, Activity, Check } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useGetIdentity } from "@refinedev/core";
import { useUserBySupabaseId } from "@/hooks/api/useUserData";
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
  
  const { data: identity } = useGetIdentity<any>();
  const { data: userData } = useUserBySupabaseId(identity?.id, {
    enabled: !!identity?.id,
  });
  const { data: clubsData } = useClubs(userData?.id, {
    enabled: !!userData?.id,
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
    <div className={`px-4 py-6 flex flex-col gap-6 border-b border-white/10 bg-transparent ${collapsed ? 'items-center' : ''}`}>
      
      {/* Typographic Logo */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
        {collapsed ? (
           <LayoutGrid className="w-5 h-5 text-white" strokeWidth={1.5} />
        ) : (
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter uppercase text-white leading-none">
              BEEPS<span className="text-zinc-500 italic">.</span>
            </span>
            <span className="text-[8px] font-bold tracking-[0.3em] uppercase text-zinc-500 mt-1">
              Creator Network
            </span>
          </div>
        )}
      </div>

      {/* Workspace Switcher */}
      <div className="relative w-full" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{ border: 'none', outline: 'none' }}
          className={`
            w-full flex items-center justify-between transition-colors duration-200 !outline-none !border-0 !ring-0
            ${collapsed ? "p-2 bg-transparent hover:text-white text-zinc-500 justify-center" : "p-3 bg-transparent hover:bg-white/5"}
          `}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-5 h-5 shrink-0 flex items-center justify-center bg-transparent border border-white/20 text-white text-xs">
              {currentClub ? (currentClub.icon || '🎵') : <Activity className="w-3 h-3" />}
            </div>
            {!collapsed && (
              <span className="text-[10px] font-black uppercase tracking-widest text-white truncate pr-2">
                {currentClub ? currentClub.name : "YOUR CLUBS"}
              </span>
            )}
          </div>
          {!collapsed && (
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          )}
        </button>

        {/* Dropdown Flyout - Strictly Black Background */}
        {isOpen && (
          <div className={`
            absolute z-50 bg-[#030303] border border-white/10 shadow-2xl flex flex-col
            ${collapsed ? "left-full top-0 ml-4 w-[240px]" : "top-full left-0 w-full mt-2"}
          `}>
            
            {/* Clubs List */}
            <div className="flex flex-col bg-[#030303]">
              <div className="px-4 py-3 border-b border-white/10 text-[8px] font-black uppercase tracking-widest text-zinc-500 bg-[#0A0A0A]">
                ACTIVE CLUBS ({clubsCount})
              </div>
              
              <div className="max-h-48 overflow-y-auto no-scrollbar flex flex-col bg-transparent">
                {clubsData?.map((club: any) => {
                  const isActive = currentClub?.id === club.id;
                  return (
                    <button 
                      key={club.id}
                      onClick={() => { router.push(`/club/${club.id}`); setIsOpen(false); }}
                      style={{ border: 'none', outline: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                      className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 transition-colors !outline-none !border-l-0 !border-r-0 !border-t-0 !ring-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-6 h-6 shrink-0 bg-transparent  flex items-center justify-center text-sm">
                          {club.icon || '🎵'}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest truncate pr-2 ${isActive ? "text-white" : "text-zinc-500"}`}>
                          {club.name}
                        </span>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-white shrink-0" strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Create Action - Removed rogue borders here */}
            <div className="bg-[#030303] border-t border-white/10">
              <button 
                onClick={() => { setIsOpen(false); onCreateClub?.(); }}
                style={{ border: 'none', outline: 'none' }}
                className="w-full flex items-center gap-3 p-4 bg-transparent hover:bg-white/5 text-zinc-500 hover:text-white transition-colors !outline-none !border-none !ring-0"
              >
                <div className="w-6 h-6 flex items-center justify-center border border-dashed border-zinc-600 shrink-0">
                  <Plus className="w-3 h-3" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest">
                  CREATE CLUB
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