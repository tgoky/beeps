"use client";

import { useQuery } from "@tanstack/react-query";
import { userKeys } from "./useUserData";

// Types
export interface UserPermissions {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  primaryRole?: string;
  roles: Array<{
    id: string;
    roleType: string;
    grantedAt: string;
  }>;
  clubs: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}

// Fetch user permissions
async function fetchUserPermissions(): Promise<UserPermissions> {
  const response = await fetch("/api/auth/me");

  if (!response.ok) {
    throw new Error("Failed to fetch permissions");
  }

  const json = await response.json();
  return json.data || json; // Extract data field if present
}

/**
 * Hook to fetch current user's permissions and roles
 * Used for permission-based UI rendering and access control
 */
export function useUserPermissions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userKeys.permissions("current"),
    queryFn: fetchUserPermissions,
    staleTime: 10 * 60 * 1000, // 10 minutes - permissions don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1, // Only retry once for auth endpoints
    enabled: options?.enabled ?? true,
    refetchOnWindowFocus: false, // Don't refetch on focus for permissions
  });
}
