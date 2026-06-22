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
  imageUrl?: string; // Added for post images
  user: {
    id: string;
    username: string;
    avatar?: string;
    name?: string; // Added for display name
  };
  author?: { // Added as an alias for user (if your API returns author instead)
    id: string;
    username: string;
    avatar?: string;
    name?: string;
  };
  _count?: {
    comments: number;
    likes: number;
    reposts?: number; // If you have reposts
    views?: number; // If you track views
  };
  isLiked?: boolean; // For tracking if current user liked
  isReposted?: boolean; // For tracking if current user reposted
  tags?: string[]; // If you use tags
  likes?: Like[]; // If you need the actual likes array
  comments?: Comment[]; // If you need the actual comments array
  reposts?: Repost[]; // If you have reposts
}

export interface Like {
  id: string;
  userId: string;
  postId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  postId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
}

export interface Repost {
  id: string;
  userId: string;
  postId: string;
  createdAt: string;
}

export interface CreatePostData {
  content: string;
  role: string;
  imageUrl?: string; // If posts can have images
}

export interface CommunityStats {
  totalPosts: number;
  totalMembers: number;
  postsToday: number;
  activeMembers: number;
}

// Helper function to normalize post data (handles both author and user fields)
function normalizePost(post: any): CommunityPost {
  return {
    ...post,
    author: post.author || post.user, // Ensure author exists
    user: post.user || post.author, // Ensure user exists
  };
}

// Fetch community posts
async function fetchCommunityPosts(role: string): Promise<CommunityPost[]> {
  const response = await fetch(`/api/communities/${role}/posts`);

  if (!response.ok) {
    throw new Error("Failed to fetch posts");
  }

  const json = await response.json();
  const posts = json.data || json;
  
  // Normalize posts to ensure both user and author fields exist
  return Array.isArray(posts) ? posts.map(normalizePost) : [];
}

// Create a new post
async function createCommunityPost(data: CreatePostData): Promise<CommunityPost> {
  const response = await fetch(`/api/communities/${data.role}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      content: data.content,
      imageUrl: data.imageUrl 
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create post");
  }

  const json = await response.json();
  return normalizePost(json.data || json);
}

// Fetch community stats
async function fetchCommunityStats(role: string): Promise<CommunityStats> {
  const response = await fetch(`/api/communities/${role}/stats`);

  if (!response.ok) {
    throw new Error("Failed to fetch stats");
  }

  const json = await response.json();
  return json.data || json;
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
          imageUrl: newPost.imageUrl,
          userId: "current-user",
          role: newPost.role,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: {
            id: "current-user",
            username: "You",
            avatar: undefined,
          },
          author: {
            id: "current-user",
            username: "You",
            avatar: undefined,
          },
          _count: {
            comments: 0,
            likes: 0,
          },
          isLiked: false,
          isReposted: false,
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

// Like a post
export function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, role }: { postId: string; role: string }) => {
      const response = await fetch(`/api/communities/${role}/posts/${postId}/like`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to like post");
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: communityKeys.posts(variables.role),
      });
    },
  });
}

// Unlike a post
export function useUnlikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, role }: { postId: string; role: string }) => {
      const response = await fetch(`/api/communities/${role}/posts/${postId}/like`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to unlike post");
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: communityKeys.posts(variables.role),
      });
    },
  });
}

// Repost a post
export function useRepostPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, role }: { postId: string; role: string }) => {
      const response = await fetch(`/api/communities/${role}/posts/${postId}/repost`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to repost");
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: communityKeys.posts(variables.role),
      });
    },
  });
}