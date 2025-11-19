"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface Beat {
  id: string;
  title: string;
  description: string | null;
  genre: string[];
  mood: string[];
  bpm: number;
  key: string | null;
  price: number;
  audioUrl: string;
  imageUrl: string | null;
  tags: string[];
  isActive: boolean;
  producerId: string;
  producer: {
    id: string;
    name: string | null;
    email: string;
  };
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBeatInput {
  title: string;
  description?: string;
  genre: string[];
  mood: string[];
  bpm: number;
  key?: string;
  price: number;
  audioUrl: string;
  imageUrl?: string;
  tags?: string[];
}

/**
 * Fetch all beats with optional filters
 */
export function useBeats(filters?: {
  genre?: string[];
  mood?: string[];
  minPrice?: number;
  maxPrice?: number;
  minBpm?: number;
  maxBpm?: number;
}) {
  return useQuery<Beat[]>({
    queryKey: ["beats", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.genre?.length) params.append("genre", filters.genre.join(","));
      if (filters?.mood?.length) params.append("mood", filters.mood.join(","));
      if (filters?.minPrice) params.append("minPrice", filters.minPrice.toString());
      if (filters?.maxPrice) params.append("maxPrice", filters.maxPrice.toString());
      if (filters?.minBpm) params.append("minBpm", filters.minBpm.toString());
      if (filters?.maxBpm) params.append("maxBpm", filters.maxBpm.toString());

      const response = await fetch(`/api/beats?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch beats");
      return response.json();
    },
  });
}

/**
 * Fetch a single beat by ID
 */
export function useBeat(id: string) {
  return useQuery<Beat>({
    queryKey: ["beats", id],
    queryFn: async () => {
      const response = await fetch(`/api/beats/${id}`);
      if (!response.ok) throw new Error("Failed to fetch beat");
      return response.json();
    },
    enabled: !!id,
  });
}

/**
 * Upload a new beat
 */
export function useCreateBeat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBeatInput) => {
      const response = await fetch("/api/beats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create beat");
      return response.json();
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

  return useMutation({
    mutationFn: async (data: Partial<CreateBeatInput>) => {
      const response = await fetch(`/api/beats/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update beat");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beats"] });
      queryClient.invalidateQueries({ queryKey: ["beats", id] });
    },
  });
}

/**
 * Like/unlike a beat
 */
export function useLikeBeat(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/beats/${id}/like`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to like beat");
      return response.json();
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

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/beats/${id}/like`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to toggle like");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["beats"] });
      queryClient.invalidateQueries({ queryKey: ["beats", id] });
      return data;
    },
  });
}

/**
 * Delete a beat
 */
export function useDeleteBeat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/beats/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete beat");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beats"] });
    },
  });
}
