"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface Studio {
  id: string;
  name: string;
  description: string | null;
  location: string;
  country: string | null;
  state: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  hourlyRate: number;
  imageUrl: string | null;
  equipment: string[];
  capacity: string;
  rating: number;
  reviewsCount: number;
  isActive: boolean;
  ownerId: string;
  owner: {
    id: string;
    user: {
      id: string;
      username: string;
      fullName: string | null;
      avatar: string | null;
    };
  };
  bookings?: {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
  }[];
  reviews?: {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    author: {
      id: string;
      username: string;
      fullName: string | null;
      avatar: string | null;
    };
  }[];
  _count?: {
    bookings: number;
    reviews: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudioInput {
  name: string;
  description?: string;
  location: string;
  country?: string;
  state?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  hourlyRate: number;
  imageUrl?: string;
  equipment?: string[];
  capacity?: string;
}

/**
 * Fetch all studios with optional filters
 */
export function useStudios(filters?: { location?: string; minRate?: number; maxRate?: number }) {
  return useQuery<Studio[]>({
    queryKey: ["studios", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.location) params.append("location", filters.location);
      if (filters?.minRate) params.append("minRate", filters.minRate.toString());
      if (filters?.maxRate) params.append("maxRate", filters.maxRate.toString());

      const response = await fetch(`/api/studios?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch studios");
      
      const data = await response.json();
      // FIXED: Extract studios array from the response object
      return data.studios || [];
    },
  });
}

/**
 * Fetch a single studio by ID
 */
export function useStudio(id: string) {
  return useQuery<Studio>({
    queryKey: ["studios", id],
    queryFn: async () => {
      const response = await fetch(`/api/studios/${id}`);
      if (!response.ok) throw new Error("Failed to fetch studio");
      
      const data = await response.json();
      // FIXED: Extract studio from the response object
      return data.studio;
    },
    enabled: !!id,
  });
}

/**
 * Create a new studio listing
 */
export function useCreateStudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStudioInput) => {
      const response = await fetch("/api/studios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create studio");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studios"] });
    },
  });
}

/**
 * Update an existing studio
 */
export function useUpdateStudio(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<CreateStudioInput>) => {
      const response = await fetch(`/api/studios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update studio");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studios"] });
      queryClient.invalidateQueries({ queryKey: ["studios", id] });
    },
  });
}

/**
 * Delete a studio listing
 */
export function useDeleteStudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/studios/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete studio");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studios"] });
    },
  });
}