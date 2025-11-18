"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
export interface Club {
  id: string;
  name: string;
  type: string;
  ownerId: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateClubData {
  name: string;
  type: string;
  ownerId: string;
  icon?: string;
  description?: string;
}

// Query Keys
export const clubKeys = {
  all: ["clubs"] as const,
  lists: () => [...clubKeys.all, "list"] as const,
  list: (userId?: string) => [...clubKeys.lists(), userId] as const,
  details: () => [...clubKeys.all, "detail"] as const,
  detail: (id: string) => [...clubKeys.details(), id] as const,
};

// Fetch clubs by user ID
async function fetchClubs(userId?: string): Promise<Club[]> {
  const url = userId ? `/api/clubs?userId=${userId}` : "/api/clubs";
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch clubs");
  }

  return response.json();
}

// Create a new club
async function createClub(clubData: CreateClubData): Promise<Club> {
  const response = await fetch("/api/clubs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(clubData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create club");
  }

  return response.json();
}

/**
 * Hook to fetch clubs for a specific user
 * @param userId - Optional user ID to filter clubs
 * @param options - Additional query options
 */
export function useClubs(userId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: clubKeys.list(userId),
    queryFn: () => fetchClubs(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to create a new club with optimistic updates
 */
export function useCreateClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClub,

    // Optimistic update: Immediately add the club to the UI
    onMutate: async (newClub) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: clubKeys.lists() });

      // Snapshot the previous value
      const previousClubs = queryClient.getQueryData<Club[]>(
        clubKeys.list(newClub.ownerId)
      );

      // Optimistically update to the new value
      if (previousClubs) {
        queryClient.setQueryData<Club[]>(
          clubKeys.list(newClub.ownerId),
          [
            ...previousClubs,
            {
              ...newClub,
              id: `temp-${Date.now()}`, // Temporary ID
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as Club,
          ]
        );
      }

      // Return a context object with the snapshotted value
      return { previousClubs };
    },

    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, newClub, context) => {
      if (context?.previousClubs) {
        queryClient.setQueryData(
          clubKeys.list(newClub.ownerId),
          context.previousClubs
        );
      }
    },

    // Always refetch after error or success to ensure server state
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: clubKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: clubKeys.list(variables.ownerId)
      });
    },
  });
}
