"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface Equipment {
  id: string;
  name: string;
  description: string | null;
  category: string;
  condition: string;
  salePrice: number | null;
  rentalRate: number | null;
  imageUrl: string | null;
  isActive: boolean;
  ownerId: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateEquipmentInput {
  name: string;
  description?: string;
  category: string;
  condition: string;
  salePrice?: number;
  rentalRate?: number;
  imageUrl?: string;
}

/**
 * Fetch all equipment with optional filters
 */
export function useEquipment(filters?: {
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  forRent?: boolean;
  forSale?: boolean;
}) {
  return useQuery<Equipment[]>({
    queryKey: ["equipment", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.category) params.append("category", filters.category);
      if (filters?.condition) params.append("condition", filters.condition);
      if (filters?.minPrice) params.append("minPrice", filters.minPrice.toString());
      if (filters?.maxPrice) params.append("maxPrice", filters.maxPrice.toString());
      if (filters?.forRent !== undefined) params.append("forRent", filters.forRent.toString());
      if (filters?.forSale !== undefined) params.append("forSale", filters.forSale.toString());

      const response = await fetch(`/api/equipment?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch equipment");
      return response.json();
    },
  });
}

/**
 * Fetch a single equipment item by ID
 */
export function useEquipmentItem(id: string) {
  return useQuery<Equipment>({
    queryKey: ["equipment", id],
    queryFn: async () => {
      const response = await fetch(`/api/equipment/${id}`);
      if (!response.ok) throw new Error("Failed to fetch equipment");
      return response.json();
    },
    enabled: !!id,
  });
}

/**
 * List new equipment
 */
export function useCreateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEquipmentInput) => {
      const response = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create equipment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
    },
  });
}

/**
 * Update existing equipment
 */
export function useUpdateEquipment(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<CreateEquipmentInput>) => {
      const response = await fetch(`/api/equipment/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update equipment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      queryClient.invalidateQueries({ queryKey: ["equipment", id] });
    },
  });
}

/**
 * Delete equipment listing
 */
export function useDeleteEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/equipment/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete equipment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
    },
  });
}
