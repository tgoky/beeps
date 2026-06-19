"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useLogout, useMenu, useGetIdentity } from "@refinedev/core";
import { useRouter } from "next/navigation";
import { useSidebar } from "../../providers/sidebar-provider/sidebar-provider";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { NavigationMenu } from "./NavigationMenu";
import { UserSection } from "./UserSection";
import { Power } from "lucide-react";
import { CreateClubModal } from '@/components/menu/CreateClubModal';
import { useCreateClub } from "@/hooks/api/useClubs";
import { Manrope } from 'next/font/google';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
});

// Removed "clubs" routing logic
const getGroupForMenuItem = (itemKey: string): string | null => {
  if (["studios", "producers", "services"].includes(itemKey)) return "create";
  if (["collabs", "transactions"].includes(itemKey)) return "collabs";
  if (["equipment", "beats"].includes(itemKey)) return "gear";
  return null;
};

// --- Brutalist Logout Dialog ---
const LogoutDialog = ({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className={`fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-50 ${manrope.className}`}>
      <div className="bg-black border border-white/20 w-80 shadow-2xl">
        <div className="p-8 flex flex-col items-center text-center">
          <Power className="w-6 h-6 text-white mb-4" strokeWidth={1.5} />
          <h3 className="text-sm font-black uppercase tracking-widest text-white mb-2">Terminate Session</h3>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-8">
            Confirm your departure.
          </p>
          <div className="flex w-full gap-3">
            <button onClick={onClose} className="flex-1 py-3 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-white/30 transition-all outline-none">
              Cancel
            </button>
            <button onClick={onConfirm} className="flex-1 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-300 transition-all outline-none border-none">
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Menu: React.FC = () => {
  const { mutate: logout } = useLogout();
  const { menuItems, selectedKey } = useMenu();
  const router = useRouter();
  const [isClient, setIsClient] = useState<boolean>(false);
  const { collapsed } = useSidebar();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["create"]);
  const userHasInteractedRef = useRef<boolean>(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState<boolean>(false);
  const [showCreateClubModal, setShowCreateClubModal] = useState(false);

  // ✅ GRAB IDENTITY (0ms delay, no DB fetch)
  const { data: identity } = useGetIdentity<any>();
  const dbId = identity?.dbId;

  const createClubMutation = useCreateClub();

  const selectedItemGroup = useMemo(() => {
    if (!selectedKey) return null;
    return getGroupForMenuItem(selectedKey);
  }, [selectedKey]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!userHasInteractedRef.current && selectedItemGroup) {
      if (!expandedGroups.includes(selectedItemGroup)) {
        setExpandedGroups(prev => [...prev, selectedItemGroup]);
      }
    }
  }, [selectedItemGroup, expandedGroups]);

  const handleCreateClub = async (clubData: any) => {
    if (!dbId) return; // ✅ Check against dbId from JWT
    createClubMutation.mutate(
      { ...clubData, ownerId: dbId }, // ✅ Use dbId
      {
        onSuccess: (result: any) => {
          setShowCreateClubModal(false);
          const communityRole = (result.grantedRole || clubData.grantsRole || 'producer').toLowerCase();
          router.push(`/community/${communityRole}`);
        }
      }
    );
  };

  const toggleGroup = (groupId: string): void => {
    userHasInteractedRef.current = true;
    setExpandedGroups((prev) => prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]);
  };

  return (
    <div
      className={`
        ${manrope.className} h-screen sticky top-0 z-50 flex flex-col border-r border-white/10 transition-all duration-300 ease-in-out flex-shrink-0 bg-[#030303]
        ${collapsed ? "w-[76px]" : "w-64"}
      `}
    >
      <div className="flex-shrink-0 relative">
        <WorkspaceHeader collapsed={collapsed} onCreateClub={() => setShowCreateClubModal(true)} />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <NavigationMenu
          isClient={isClient}
          collapsed={collapsed}
          menuItems={menuItems}
          selectedKey={selectedKey}
          expandedGroups={expandedGroups}
          toggleGroup={toggleGroup}
        />
      </div>

      <div className="flex-shrink-0">
        <UserSection collapsed={collapsed} handleLogout={() => setShowLogoutDialog(true)} />
      </div>

      <CreateClubModal
        isOpen={showCreateClubModal}
        onClose={() => setShowCreateClubModal(false)}
        onCreateClub={handleCreateClub}
      />

      <LogoutDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={() => { logout(); setShowLogoutDialog(false); }}
      />
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};