"use client";

import { useQuery } from "@tanstack/react-query";

// Types
export interface UserData {
  id: string;
  email: string;
  supabaseId: string;
  username: string;
  avatar?: string;
  primaryRole?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

// Query Keys
export const userKeys = {
  all: ["users"] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  bySupabase: (supabaseId: string) => [...userKeys.all, "supabase", supabaseId] as const,
  communities: (userId: string) => [...userKeys.all, userId, "communities"] as const,
  permissions: (supabaseId: string) => [...userKeys.all, "permissions", supabaseId] as const,
};

// Fetch user by Supabase ID
async function fetchUserBySupabaseId(supabaseId: string): Promise<UserData> {
  const response = await fetch(`/api/users/by-supabase/${supabaseId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }

  return response.json();
}

// Fetch user by database ID
async function fetchUserById(userId: string): Promise<UserData> {
  const response = await fetch(`/api/users/${userId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }

  return response.json();
}

/**
 * Hook to fetch user data by Supabase ID
 * @param supabaseId - Supabase user ID
 * @param options - Additional query options
 */
export function useUserBySupabaseId(
  supabaseId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: userKeys.bySupabase(supabaseId || ""),
    queryFn: () => fetchUserBySupabaseId(supabaseId!),
    staleTime: 10 * 60 * 1000, // 10 minutes - user data changes infrequently
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: (options?.enabled ?? true) && !!supabaseId,
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}

/**
 * Hook to fetch user data by database ID
 * @param userId - Database user ID
 * @param options - Additional query options
 */
export function useUserById(
  userId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: userKeys.detail(userId || ""),
    queryFn: () => fetchUserById(userId!),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: (options?.enabled ?? true) && !!userId,
  });
}
