"use client";

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { communityKeys } from "./useUserCommunities";

// Types
export interface CommunityPost {
  id: string;
  content: string;
  userId: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
  _count?: {
    comments: number;
    likes: number;
  };
}

export interface CreatePostData {
  content: string;
  role: string;
}

export interface CommunityStats {
  totalPosts: number;
  totalMembers: number;
  postsToday: number;
  activeMembers: number;
}

// Fetch community posts
async function fetchCommunityPosts(role: string): Promise<CommunityPost[]> {
  const response = await fetch(`/api/communities/${role}/posts`);

  if (!response.ok) {
    throw new Error("Failed to fetch posts");
  }

  const json = await response.json();
  return json.data || json; // Extract data field if present
}

// Create a new post
async function createCommunityPost(data: CreatePostData): Promise<CommunityPost> {
  const response = await fetch(`/api/communities/${data.role}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content: data.content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create post");
  }

  const json = await response.json();
  return json.data || json; // Extract data field if present
}

// Fetch community stats
async function fetchCommunityStats(role: string): Promise<CommunityStats> {
  const response = await fetch(`/api/communities/${role}/stats`);

  if (!response.ok) {
    throw new Error("Failed to fetch stats");
  }

  const json = await response.json();
  return json.data || json; // Extract data field if present
}

/**
 * Hook to fetch community posts
 * @param role - Community role (producer, artist, engineer, etc.)
 * @param options - Additional query options
 */
export function useCommunityPosts(
  role: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: communityKeys.posts(role || ""),
    queryFn: () => fetchCommunityPosts(role!),
    staleTime: 2 * 60 * 1000, // 2 minutes - posts are more dynamic
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: (options?.enabled ?? true) && !!role,
    refetchOnWindowFocus: true, // Keep posts fresh
  });
}

/**
 * Hook to create a new community post with optimistic updates
 */
export function useCreateCommunityPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCommunityPost,

    // Optimistic update: Immediately add the post to the UI
    onMutate: async (newPost) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: communityKeys.posts(newPost.role),
      });

      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData<CommunityPost[]>(
        communityKeys.posts(newPost.role)
      );

      // Optimistically update to the new value
      if (previousPosts) {
        const optimisticPost: CommunityPost = {
          id: `temp-${Date.now()}`,
          content: newPost.content,
          userId: "current-user", // Will be replaced with real data
          role: newPost.role,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: {
            id: "current-user",
            username: "You",
            avatar: undefined,
          },
          _count: {
            comments: 0,
            likes: 0,
          },
        };

        queryClient.setQueryData<CommunityPost[]>(
          communityKeys.posts(newPost.role),
          [optimisticPost, ...previousPosts]
        );
      }

      return { previousPosts };
    },

    // If the mutation fails, roll back
    onError: (err, newPost, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(
          communityKeys.posts(newPost.role),
          context.previousPosts
        );
      }
    },

    // Always refetch after error or success
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: communityKeys.posts(variables.role),
      });
      // Also invalidate stats since we added a post
      queryClient.invalidateQueries({
        queryKey: communityKeys.stats(variables.role),
      });
    },
  });
}

/**
 * Hook to fetch community stats
 * @param role - Community role
 * @param options - Additional query options
 */
export function useCommunityStats(
  role: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: communityKeys.stats(role || ""),
    queryFn: () => fetchCommunityStats(role!),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: (options?.enabled ?? true) && !!role,
  });
}
