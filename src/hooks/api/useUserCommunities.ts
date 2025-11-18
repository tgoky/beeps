"use client";

import { useQuery } from "@tanstack/react-query";

// Types
export interface Community {
  id: string;
  name: string;
  role: string;
  icon?: string;
  memberCount?: number;
}

// Query Keys
export const communityKeys = {
  all: ["communities"] as const,
  userCommunities: (userId: string) => [...communityKeys.all, "user", userId] as const,
  posts: (role: string) => [...communityKeys.all, role, "posts"] as const,
  stats: (role: string) => [...communityKeys.all, role, "stats"] as const,
};

// Fetch user's communities
async function fetchUserCommunities(userId: string): Promise<Community[]> {
  const response = await fetch(`/api/users/${userId}/communities`);

  if (!response.ok) {
    throw new Error("Failed to fetch communities");
  }

  return response.json();
}

/**
 * Hook to fetch communities for a specific user
 * @param userId - Database user ID
 * @param options - Additional query options
 */
export function useUserCommunities(
  userId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: communityKeys.userCommunities(userId || ""),
    queryFn: () => fetchUserCommunities(userId!),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: (options?.enabled ?? true) && !!userId,
    refetchOnWindowFocus: true,
  });
}
