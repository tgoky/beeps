// components/menu/Menu.tsx
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

// Simple flat mapping of menu items to their groups
const getGroupForMenuItem = (itemKey: string): string | null => {
  if (itemKey.startsWith("community-")) {
    return "communities";
  }
  return "beep"; // Changed to match the actual group ID
};

// Windows 98-style Logout Dialog Component
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="border-2 border-gray-400 w-80">
        <div className="bg-blue-700 text-white px-2 py-1 flex justify-between items-center">
          <div className="flex items-center">
            <Power className="w-4 h-4 mr-2" />
            <span className="font-bold">Log Off</span>
          </div>
          <div className="flex space-x-1">
            <div
              className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400"
              onClick={onClose}
            >
              <span className="text-xs">×</span>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-200">
          <p className="mb-4">Are you sure you want to log off?</p>
          <div className="flex justify-end space-x-2">
            <button
              className="px-4 py-1 bg-gray-300 border-2 border-gray-400 font-bold hover:bg-gray-400 active:border-gray-500 active:bg-gray-500"
              onClick={onClose}
            >
              No
            </button>
            <button
              className="px-4 py-1 bg-blue-700 text-white border-2 border-gray-400 font-bold hover:bg-blue-800 active:border-gray-500 active:bg-blue-900"
              onClick={onConfirm}
            >
              Yes
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
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["beep"]); // Changed to "beep"
  const userHasInteractedRef = useRef<boolean>(false);
  const { theme } = useTheme();
  const [showLogoutDialog, setShowLogoutDialog] = useState<boolean>(false);

  const [showCreateClubModal, setShowCreateClubModal] = useState(false);

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
        setExpandedGroups([selectedItemGroup]);
      }
    }
  }, [selectedItemGroup, expandedGroups]);

  const handleLogout = (): void => {
    setShowLogoutDialog(true);
  };

  const handleCreateClub = async (clubData: any) => {
    try {
      console.log('Creating club:', clubData);

      // Get Supabase user ID from session
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      // Fetch user's database ID from Supabase ID
      const userResponse = await fetch(`/api/users/by-supabase/${user.id}`);
      if (!userResponse.ok) {
        console.error('Failed to fetch user data');
        return;
      }
      const userData = await userResponse.json();
      const userId = userData.data.id;

      // Create the club via API
      const response = await fetch('/api/clubs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: clubData.name,
          type: clubData.type,
          description: clubData.description,
          icon: clubData.icon,
          ownerId: userId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to create club:', error);
        alert(error.error?.message || 'Failed to create club');
        return;
      }

      const result = await response.json();
      console.log('Club created successfully:', result);

      // Redirect to the community page for the granted role
      const communityRole = (result.data.grantedRole || clubData.grantsRole).toLowerCase();
      router.push(`/community/${communityRole}`);
    } catch (error) {
      console.error('Error creating club:', error);
      alert('An error occurred while creating the club');
    }
  };


  const toggleGroup = (groupId: string): void => {
    userHasInteractedRef.current = true;
    setExpandedGroups((prev) => {
      if (prev.includes(groupId)) {
        // Allow collapsing even if a group item is selected
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
        ${theme === "dark" ? "bg-black border-gray-700" : "bg-white border-gray-200"}
        border-r flex flex-col transition-all duration-300
        ${collapsed ? "w-16" : "w-64"}
        relative flex-shrink-0
      `}
    >
      {/* Top Section - Fixed height content */}
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

      {/* Bottom Section - User Section (Fixed at bottom) */}
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