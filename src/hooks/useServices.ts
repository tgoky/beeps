"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface Service {
  id: string;
  title: string;
  description: string | null;
  category: string;
  price: number;
  deliveryTime: number;
  imageUrl: string | null;
  isActive: boolean;
  providerId: string;
  provider: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceInput {
  title: string;
  description?: string;
  category: string;
  price: number;
  deliveryTime: number;
  imageUrl?: string;
}

/**
 * Fetch all services with optional filters
 */
export function useServices(filters?: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  maxDeliveryTime?: number;
}) {
  return useQuery<Service[]>({
    queryKey: ["services", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.category) params.append("category", filters.category);
      if (filters?.minPrice) params.append("minPrice", filters.minPrice.toString());
      if (filters?.maxPrice) params.append("maxPrice", filters.maxPrice.toString());
      if (filters?.maxDeliveryTime) params.append("maxDeliveryTime", filters.maxDeliveryTime.toString());

      const response = await fetch(`/api/services?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch services");
      return response.json();
    },
  });
}

/**
 * Fetch a single service by ID
 */
export function useService(id: string) {
  return useQuery<Service>({
    queryKey: ["services", id],
    queryFn: async () => {
      const response = await fetch(`/api/services/${id}`);
      if (!response.ok) throw new Error("Failed to fetch service");
      return response.json();
    },
    enabled: !!id,
  });
}

/**
 * Create a new service offering
 */
export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateServiceInput) => {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create service");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

/**
 * Update an existing service
 */
export function useUpdateService(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<CreateServiceInput>) => {
      const response = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update service");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["services", id] });
    },
  });
}

/**
 * Delete a service
 */
export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/services/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete service");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}
