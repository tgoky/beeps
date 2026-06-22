"use client";

import { useQuery } from "@tanstack/react-query";

export interface Producer {
  id: string;
  userId?: string;
  name: string | null;
  email: string;
  imageUrl: string | null;
  bio: string | null;
  location: string | null;
  lat: number | null | any;
  lng: number | null | any;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  genres: string[];
  specialties: string[];
  equipment?: string[];
  experience?: string | number;
  productionRate?: string | null;
  songwritingRate?: string | null;
  mixingRate?: string | null;
  currency: string;
  availability?: string;
  createdAt: string;
  updatedAt?: string;
  
  // Dynamic fields added/calculated on client-side or during aggregation
  isOnline?: boolean;
  responseTime?: string;
  startingPrice?: number;
  rating?: number;
  totalPosts?: number;
  handle?: string;
  distance?: number | null;

  // Nested structures matching mobile app and rich details view
  user?: {
    id: string;
    username: string;
    fullName: string | null;
    avatar: string | null;
    location: string | null;
    bio: string | null;
    verified: boolean;
    followersCount: number;
    rating: number;
  };
  studios: {
    id: string;
    name: string;
    location: string;
    hourlyRate: number;
    currency?: string;
    imageUrl?: string | null;
    rating?: number;
  }[];
  beats: {
    id: string;
    title: string;
    bpm?: number;
    price: number;
    likeCount: number;
    likes?: number;
    plays?: number;
    currency?: string;
    imageUrl?: string | null;
    genre?: string[]; // Supports beat.genre?.[0] fallbacks on frontend view
  }[];
  services: {
    id: string;
    title: string;
    category?: string;
    price: number;
    currency?: string;
  }[];
}

/**
 * Fetch all producers with optional filters
 */
export function useProducers(filters?: {
  hasStudios?: boolean;
  hasBeats?: boolean;
  hasServices?: boolean;
  search?: string;
  genre?: string;
}) {
  return useQuery<Producer[]>({
    queryKey: ["producers", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.hasStudios !== undefined) params.append("hasStudios", filters.hasStudios.toString());
      if (filters?.hasBeats !== undefined) params.append("hasBeats", filters.hasBeats.toString());
      if (filters?.hasServices !== undefined) params.append("hasServices", filters.hasServices.toString());
      if (filters?.search) params.append("search", filters.search);
      if (filters?.genre) params.append("genre", filters.genre);

      const response = await fetch(`/api/producers?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch producers");
      const data = await response.json();
      return data.producers || [];
    },
    keepPreviousData: true,
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