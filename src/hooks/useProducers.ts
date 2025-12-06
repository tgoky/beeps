"use client";

import { useQuery } from "@tanstack/react-query";

export interface Producer {
  id: string;
  name: string | null;
  email: string;
  imageUrl: string | null;
  bio: string | null;
  location: string | null;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  genres: string[];
  specialties: string[];
  studios: {
    id: string;
    name: string;
    location: string;
    hourlyRate: number;
  }[];
  beats: {
    id: string;
    title: string;
    price: number;
    likeCount: number;
  }[];
  services: {
    id: string;
    title: string;
    price: number;
  }[];
  createdAt: string;
}

/**
 * Fetch all producers with optional filters
 */
export function useProducers(filters?: {
  hasStudios?: boolean;
  hasBeats?: boolean;
  hasServices?: boolean;
  search?: string;
}) {
  return useQuery<Producer[]>({
    queryKey: ["producers", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.hasStudios !== undefined) params.append("hasStudios", filters.hasStudios.toString());
      if (filters?.hasBeats !== undefined) params.append("hasBeats", filters.hasBeats.toString());
      if (filters?.hasServices !== undefined) params.append("hasServices", filters.hasServices.toString());
      if (filters?.search) params.append("search", filters.search);

      const response = await fetch(`/api/producers?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch producers");
      const data = await response.json();
      return data.producers || [];
    },
  });
}

/**
 * Fetch a single producer profile by ID
 */
export function useProducer(id: string) {
  return useQuery<Producer>({
    queryKey: ["producers", id],
    queryFn: async () => {
      const response = await fetch(`/api/producers/${id}`);
      if (!response.ok) throw new Error("Failed to fetch producer");
      const data = await response.json();
      return data.producer || data;
    },
    enabled: !!id,
  });
}
