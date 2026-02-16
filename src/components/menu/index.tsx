// Menu.tsx (main container)
"use client";

import React from "react";
import { useLogout, useMenu } from "@refinedev/core";
import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../../providers/ThemeProvider";
import { useSidebar } from "../../providers/sidebar-provider/sidebar-provider";
import { Controls } from "./Controls";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { NavigationMenu } from "./NavigationMenu";
import { UserSection } from "./UserSection";
import { Power } from "lucide-react";
import { CreateClubModal } from '@/components/menu/CreateClubModal';
import { createBrowserClient } from '@supabase/ssr';
import { useUserBySupabaseId } from "@/hooks/api/useUserData";
import { useCreateClub } from "@/hooks/api/useClubs";

// --- PREMIUM THEME CONSTANTS ---
const DARK_BG = '#000000';
const LIGHT_BG = '#ffffff';
const DARK_BORDER = '#27272a'; // Zinc-800
const LIGHT_BORDER = '#e4e4e7'; // Zinc-200

// Updated group mapping for menu items
const getGroupForMenuItem = (itemKey: string): string | null => {
  // Check if it's a club item
  if (itemKey.startsWith("club-")) {
    return "clubs";
  }
  
  // Map menu items to their groups
  if (["studios", "producers", "services"].includes(itemKey)) {
    return "create";
  }
  if (["collabs", "transactions"].includes(itemKey)) {
    return "collabs";
  }
  if (["equipment", "beats"].includes(itemKey)) {
    return "gear";
  }
  
  return null;
};

// Logout Dialog Component
interface LogoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutDialog: React.FC<LogoutDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { theme } = useTheme();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50 backdrop-blur-sm">
      <div className={`border w-80 rounded-lg shadow-2xl overflow-hidden ${
        theme === "dark" 
          ? "bg-zinc-950 border-zinc-800" 
          : "bg-white border-zinc-200"
      }`} style={{ fontFamily: "'Manrope', sans-serif" }}>
        <div className={`px-3 py-2 flex justify-between items-center border-b ${
          theme === "dark" ? "border-zinc-800" : "border-zinc-200"
        }`}>
          <div className="flex items-center gap-2">
            <Power className={`w-4 h-4 ${
              theme === "dark" ? "text-emerald-500" : "text-emerald-600"
            }`} />
            <span className={`font-bold text-xs tracking-widest ${
              theme === "dark" ? "text-zinc-600" : "text-zinc-500"
            }`}>SYSTEM LOGOFF</span>
          </div>
          <button 
            onClick={onClose} 
            className={`transition-colors ${
              theme === "dark" ? "text-zinc-600 hover:text-zinc-400" : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            ×
          </button>
        </div>
        <div className={`p-6 ${
          theme === "dark" ? "bg-zinc-950" : "bg-white"
        }`}>
          <p className={`mb-6 text-sm ${
            theme === "dark" ? "text-zinc-400" : "text-zinc-600"
          }`}>
            Terminate session and return to login?
          </p>
          <div className="flex justify-end space-x-3">
            <button
              className={`px-4 py-1.5 text-xs font-bold transition-colors ${
                theme === "dark" 
                  ? "text-zinc-500 hover:text-zinc-400" 
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
              onClick={onClose}
            >
              CANCEL
            </button>
            <button
              className={`px-4 py-1.5 text-xs font-bold rounded transition-colors ${
                theme === "dark"
                  ? "bg-emerald-500 text-black hover:bg-emerald-400"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
              onClick={onConfirm}
            >
              CONFIRM
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
  const { collapsed, setCollapsed } = useSidebar();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["create", "clubs"]); // Create and Clubs open by default
  const userHasInteractedRef = useRef<boolean>(false);
  const { theme } = useTheme();
  const [showLogoutDialog, setShowLogoutDialog] = useState<boolean>(false);
  const [showCreateClubModal, setShowCreateClubModal] = useState(false);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);

  // TanStack Query hooks
  const { data: userData } = useUserBySupabaseId(supabaseUser?.id, {
    enabled: !!supabaseUser?.id,
  });
  const createClubMutation = useCreateClub();

  const selectedItemGroup = useMemo(() => {
    if (!selectedKey) return null;
    return getGroupForMenuItem(selectedKey);
  }, [selectedKey]);

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

  useEffect(() => {
    setIsClient(true);

    // Load Supabase user
    const loadUser = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser();
      setSupabaseUser(user);
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (!userHasInteractedRef.current && selectedItemGroup) {
      if (!expandedGroups.includes(selectedItemGroup)) {
        setExpandedGroups(prev => [...prev, selectedItemGroup]);
      }
    }
  }, [selectedItemGroup]);

  const handleLogout = (): void => {
    setShowLogoutDialog(true);
  };

  const handleCreateClub = async (clubData: any) => {
    if (!userData?.id) {
      console.error('No user data available');
      alert('Please wait while we load your profile...');
      return;
    }

    createClubMutation.mutate(
      {
        name: clubData.name,
        type: clubData.type,
        description: clubData.description,
        icon: clubData.icon,
        ownerId: userData.id,
      },
      {
        onSuccess: (result: any) => {
          console.log('Club created successfully:', result);
          setShowCreateClubModal(false);

          const communityRole = (result.grantedRole || clubData.grantsRole || 'producer').toLowerCase();
          router.push(`/community/${communityRole}`);
        },
        onError: (error: any) => {
          console.error('Failed to create club:', error);
          alert(error.message || 'Failed to create club');
        },
      }
    );
  };

  const toggleGroup = (groupId: string): void => {
    userHasInteractedRef.current = true;
    setExpandedGroups((prev) => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  return (
    <div
      className={`
        h-screen sticky top-0 z-10
        border-r flex flex-col transition-all duration-300
        ${collapsed ? "w-16" : "w-64"}
        relative flex-shrink-0
      `}
      style={{ 
        fontFamily: "'Manrope', sans-serif",
        backgroundColor: theme === "dark" ? DARK_BG : LIGHT_BG,
        borderColor: theme === "dark" ? DARK_BORDER : LIGHT_BORDER
      }}
    >
      {/* Top Section */}
      <div className="flex-shrink-0">
        <WorkspaceHeader
          collapsed={collapsed} 
          onCreateClub={() => setShowCreateClubModal(true)}  
          onSwitchClub={() => {/* switch logic */}}
        />

        <CreateClubModal
          isOpen={showCreateClubModal}
          onClose={() => setShowCreateClubModal(false)}
          onCreateClub={handleCreateClub}
        />

        <Controls collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Middle Section - Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto">
        <NavigationMenu
          isClient={isClient}
          collapsed={collapsed}
          menuItems={menuItems}
          selectedKey={selectedKey}
          expandedGroups={expandedGroups}
          toggleGroup={toggleGroup}
        />
      </div>

      {/* Bottom Section - User Section */}
      <div className="flex-shrink-0">
        <UserSection collapsed={collapsed} handleLogout={handleLogout} />
      </div>

      <LogoutDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={() => {
          logout();
          setShowLogoutDialog(false);
        }}
      />
    </div>
  );
};