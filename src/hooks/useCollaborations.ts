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

export interface Collaboration {
  id: string;
  type: "DEAL" | "COLLAB" | "BID";
  status: string;
  title: string;
  description: string | null;
  creatorId: string;
  creator: {
    id: string;
    username: string;
    fullName: string | null;
    avatar: string | null;
  };
  studio: {
    id: string;
    name: string;
    location: string;
    hourlyRate: number;
  } | null;
  price: number | null;
  minBid: number | null;
  currentBid: number | null;
  duration: string | null;
  location: string | null;
  genre: string[];
  equipment: string[];
  slots: number;
  availableDate: string | null;
  expiresAt: string | null;
  imageUrl: string | null;
  bids: CollaborationBid[];
  createdAt: string;
  updatedAt: string;
}

export interface CollaborationBid {
  id: string;
  collaborationId: string;
  userId: string;
  user: {
    id: string;
    username: string;
    fullName: string | null;
    avatar: string | null;
  };
  amount: number;
  message: string | null;
  status: string;
  createdAt: string;
}

export interface CreateCollaborationInput {
  type: "DEAL" | "COLLAB" | "BID";
  title: string;
  description?: string;
  studioId?: string;
  price?: number;
  minBid?: number;
  duration?: string;
  location?: string;
  genre?: string[];
  equipment?: string[];
  slots?: number;
  availableDate?: string;
  expiresAt?: string;
  imageUrl?: string;
}

export interface PlaceBidInput {
  amount?: number;
  message?: string;
}

interface CollaborationsResponse {
  collaborations: Collaboration[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * Fetch all collaborations with optional filters
 */
export function useCollaborations(filters?: {
  type?: "DEAL" | "COLLAB" | "BID";
  status?: string;
  genre?: string;
  minPrice?: number;
  maxPrice?: number;
  creatorId?: string;
}) {
  return useQuery<Collaboration[], Error>({
    queryKey: ["collaborations", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.type) params.append("type", filters.type);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.genre) params.append("genre", filters.genre);
      if (filters?.minPrice) params.append("minPrice", filters.minPrice.toString());
      if (filters?.maxPrice) params.append("maxPrice", filters.maxPrice.toString());
      if (filters?.creatorId) params.append("creatorId", filters.creatorId);

      const response = await fetch(`/api/collaborations?${params.toString()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to fetch collaborations");
      }
      
      const result = await response.json();
      
      // Handle different API response formats
      if (result.success && result.data?.collaborations) {
        return result.data.collaborations;
      } else if (result.collaborations) {
        return result.collaborations;
      } else if (Array.isArray(result)) {
        return result;
      } else if (result.data && Array.isArray(result.data)) {
        return result.data;
      }
      
      // Fallback to empty array if no data
      return [];
    },
  });
}

/**
 * Fetch a single collaboration by ID
 */
export function useCollaboration(id: string) {
  return useQuery<Collaboration, Error>({
    queryKey: ["collaborations", id],
    queryFn: async () => {
      const response = await fetch(`/api/collaborations/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to fetch collaboration");
      }
      
      const result = await response.json();
      
      // Handle different response formats
      if (result.success && result.data?.collaboration) {
        return result.data.collaboration;
      } else if (result.collaboration) {
        return result.collaboration;
      } else if (result.data) {
        return result.data;
      }
      
      return result;
    },
    enabled: !!id,
  });
}

/**
 * Create a new collaboration
 */
export function useCreateCollaboration() {
  const queryClient = useQueryClient();

  return useMutation<Collaboration, Error, CreateCollaborationInput>({
    mutationFn: async (data: CreateCollaborationInput) => {
      const response = await fetch("/api/collaborations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to create collaboration");
      }
      
      const result = await response.json();
      
      if (result.success && result.data?.collaboration) {
        return result.data.collaboration;
      } else if (result.collaboration) {
        return result.collaboration;
      } else if (result.data) {
        return result.data;
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collaborations"] });
    },
  });
}

/**
 * Place a bid or request on a collaboration
 */
export function usePlaceBid(collaborationId: string) {
  const queryClient = useQueryClient();

  return useMutation<{ bid: CollaborationBid }, Error, PlaceBidInput>({
    mutationFn: async (data: PlaceBidInput) => {
      const response = await fetch(`/api/collaborations/${collaborationId}/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to place bid");
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      } else if (result.bid) {
        return { bid: result.bid };
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collaborations"] });
      queryClient.invalidateQueries({ queryKey: ["collaborations", collaborationId] });
    },
  });
}