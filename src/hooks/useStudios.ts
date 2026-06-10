"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface Studio {
  id: string;
  name: string;
  description: string | null;
  location: string;
  streetAddress: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  hourlyRate: number;
  currency: string;
  imageUrl: string | null;
  equipment: string[];
  capacity: string;
  rating: number;
  reviewsCount: number;
  isActive: boolean;
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  verifiedAt: string | null;
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
  streetAddress?: string;
  country?: string;
  state?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  hourlyRate: number;
  currency?: string;
  imageUrl?: string;
  equipment?: string[];
  capacity?: string;
}

export interface StudiosResponse {
  studios: Studio[];
  pagination: { total: number; limit: number; offset: number };
}

export function useStudios(filters?: {
  search?: string;
  location?: string;
  country?: string;
  city?: string;
  minRate?: number;
  maxRate?: number;
  latitude?: number;
  longitude?: number;
  radius?: number;
  limit?: number;
  offset?: number;
  enabled?: boolean; // ✅ Added enabled flag
}) {
  return useQuery<StudiosResponse>({
    queryKey: ["studios", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.append("search", filters.search);
      if (filters?.location) params.append("location", filters.location);
      if (filters?.country) params.append("country", filters.country);
      if (filters?.city) params.append("city", filters.city);
      if (filters?.minRate) params.append("minRate", filters.minRate.toString());
      if (filters?.maxRate) params.append("maxRate", filters.maxRate.toString());
      if (filters?.latitude !== undefined) params.append("latitude", filters.latitude.toString());
      if (filters?.longitude !== undefined) params.append("longitude", filters.longitude.toString());
      if (filters?.radius !== undefined) params.append("radius", filters.radius.toString());
      params.append("limit", (filters?.limit ?? 20).toString());
      params.append("offset", (filters?.offset ?? 0).toString());

      const response = await fetch(`/api/studios?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch studios");

      const data = await response.json();
      return {
        studios: data.studios || [],
        pagination: data.pagination ?? { total: 0, limit: filters?.limit ?? 20, offset: filters?.offset ?? 0 },
      };
    },
    enabled: filters?.enabled !== false, // ✅ Tells React Query to wait if enabled is explicitly false
    staleTime: 1000 * 60 * 5, 
  });
}

export function useStudio(id: string) {
  const queryClient = useQueryClient();

  return useQuery<Studio>({
    queryKey: ["studios", id],
    queryFn: async () => {
      const response = await fetch(`/api/studios/${id}`);
      if (!response.ok) throw new Error("Failed to fetch studio");
      
      const data = await response.json();
      return data.studio;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    placeholderData: () => {
      const allQueries = queryClient.getQueriesData<StudiosResponse>({ queryKey: ["studios"] });
      for (const [_, data] of allQueries) {
        if (data?.studios) {
          const found = data.studios.find(s => s.id === id);
          if (found) return found;
        }
      }
      return undefined;
    }
  });
}

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