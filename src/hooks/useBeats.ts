"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// API Response wrapper type
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
    code: string;
  };
}

export interface Beat {
  id: string;
  title: string;
  description: string | null;
  genres: string[]; // Changed from genre to genres
  moods: string[];  // Changed from mood to moods
  bpm: number;
  key: string | null;
  price: number;
  type: 'LEASE' | 'EXCLUSIVE';
  audioUrl: string;
  imageUrl: string | null;
  tags: string[];
  isActive: boolean;
  plays: number;
  likes: number;
  producerId: string;
  producer: {
    id: string;
    username: string; // Changed from name to username
    fullName: string | null;
    email: string;
    avatar: string | null;
    verified: boolean;
  };
  club?: {
    id: string;
    name: string;
    icon: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface BeatsApiResponse {
  beats: Beat[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface CreateBeatInput {
  title: string;
  description?: string;
  genres: string[];
  moods: string[];
  bpm: number;
  key?: string;
  price: number;
  type: 'LEASE' | 'EXCLUSIVE';
  audioUrl: string;
  imageUrl?: string;
  tags?: string[];
  clubId?: string;
}

/**
 * Fetch all beats with optional filters
 */
export function useBeats(filters?: {
  genre?: string;
  mood?: string;
  minPrice?: number;
  maxPrice?: number;
  minBpm?: number;
  maxBpm?: number;
  limit?: number;
  offset?: number;
}) {
  return useQuery<BeatsApiResponse, Error>({
    queryKey: ["beats", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.genre) params.append("genre", filters.genre);
      if (filters?.mood) params.append("mood", filters.mood);
      if (filters?.minPrice) params.append("minPrice", filters.minPrice.toString());
      if (filters?.maxPrice) params.append("maxPrice", filters.maxPrice.toString());
      if (filters?.minBpm) params.append("minBpm", filters.minBpm.toString());
      if (filters?.maxBpm) params.append("maxBpm", filters.maxBpm.toString());
      if (filters?.limit) params.append("limit", filters.limit.toString());
      if (filters?.offset) params.append("offset", filters.offset.toString());

      const response = await fetch(`/api/beats?${params.toString()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to fetch beats");
      }
      
      const result: ApiResponse<BeatsApiResponse> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || "Failed to fetch beats");
      }
      
      return result.data;
    },
  });
}

/**
 * Fetch a single beat by ID
 */
export function useBeat(id: string) {
  return useQuery<Beat, Error>({
    queryKey: ["beats", id],
    queryFn: async () => {
      const response = await fetch(`/api/beats/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to fetch beat");
      }
      
      const result: ApiResponse<{ beat: Beat }> = await response.json();
      
      if (!result.success || !result.data?.beat) {
        throw new Error(result.error?.message || "Failed to fetch beat");
      }
      
      return result.data.beat;
    },
    enabled: !!id,
  });
}

/**
 * Upload a new beat
 */
export function useCreateBeat() {
  const queryClient = useQueryClient();

  return useMutation<Beat, Error, CreateBeatInput>({
    mutationFn: async (data: CreateBeatInput) => {
      const response = await fetch("/api/beats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to create beat");
      }
      
      const result: ApiResponse<{ beat: Beat }> = await response.json();
      
      if (!result.success || !result.data?.beat) {
        throw new Error(result.error?.message || "Failed to create beat");
      }
      
      return result.data.beat;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beats"] });
    },
  });
}

/**
 * Update an existing beat
 */
export function useUpdateBeat(id: string) {
  const queryClient = useQueryClient();

  return useMutation<Beat, Error, Partial<CreateBeatInput>>({
    mutationFn: async (data: Partial<CreateBeatInput>) => {
      const response = await fetch(`/api/beats/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to update beat");
      }
      
      const result: ApiResponse<{ beat: Beat }> = await response.json();
      
      if (!result.success || !result.data?.beat) {
        throw new Error(result.error?.message || "Failed to update beat");
      }
      
      return result.data.beat;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beats"] });
      queryClient.invalidateQueries({ queryKey: ["beats", id] });
    },
  });
}

/**
 * Toggle like on a beat
 */
export function useToggleLikeBeat(id: string) {
  const queryClient = useQueryClient();

  return useMutation<{ liked: boolean; likeCount: number }, Error>({
    mutationFn: async () => {
      const response = await fetch(`/api/beats/${id}/like`, {
        method: "POST",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to toggle like");
      }
      
      const result: ApiResponse<{ liked: boolean; likeCount: number }> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || "Failed to toggle like");
      }
      
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beats"] });
      queryClient.invalidateQueries({ queryKey: ["beats", id] });
    },
  });
}

/**
 * Delete a beat
 */
export function useDeleteBeat() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/beats/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to delete beat");
      }
      
      const result: ApiResponse<{ message: string }> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to delete beat");
      }
      
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beats"] });
    },
  });
}