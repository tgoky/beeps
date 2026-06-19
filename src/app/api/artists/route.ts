"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Adjust these imports based on where your types actually live in the web app
// import { Studio, VerificationStatus } from "@prisma/client"; 

export interface StudioWithOwner {
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
  verificationStatus: string;
  verifiedAt: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    user: {
      id: string;
      username: string;
      fullName?: string | null;
      avatar?: string | null;
    };
  };
  // ✅ The backend now calculates this for us!
  distanceMiles?: number; 
}

// 🛡️ Secure API Fetcher for Next.js Web
// Automatically includes cookies for the withAuth middleware!
const webFetch = async (endpoint: string, options: RequestInit = {}) => {
  const res = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || json.message || 'API Request Failed');
  return json;
};

// ==========================================
// QUERIES (Data Fetching via API)
// ==========================================

export function useStudios() {
  return useQuery({
    queryKey: ["studios"],
    queryFn: async () => {
      const data = await webFetch('/api/studios');
      return data.studios as StudioWithOwner[];
    },
  });
}

// Fetch ALL studios (including inactive) - used by Studio Manager tool
export function useAllStudiosDebug() {
  return useQuery({
    queryKey: ["studios", "debug", "all"],
    queryFn: async () => {
      const data = await webFetch('/api/studios?debug=true');
      return data.studios as StudioWithOwner[];
    },
  });
}

export function useNearbyStudios(latitude?: number, longitude?: number, radiusMiles: number = 50) {
  return useQuery({
    queryKey: ["studios", "nearby", latitude, longitude, radiusMiles],
    queryFn: async () => {
      // Let the Next.js server handle the complex PostgreSQL Earthdistance logic!
      let endpoint = '/api/studios';
      if (latitude && longitude) {
        endpoint += `?latitude=${latitude}&longitude=${longitude}&radius=${radiusMiles}`;
      }
      const data = await webFetch(endpoint);
      return data.studios as StudioWithOwner[];
    },
    // Don't run the nearby query until we actually have GPS coordinates
    enabled: !!latitude && !!longitude, 
  });
}

export function useStudioVerification(studioId?: string) {
  return useQuery({
    queryKey: ["studio", "verification", studioId],
    queryFn: async () => {
      if (!studioId) return null;
      const data = await webFetch(`/api/studios/${studioId}/verification`);
      return {
        status: data.verificationStatus || "UNVERIFIED",
        documents: data.verificationDocuments || [],
        notes: data.verificationNotes,
        verifiedAt: data.verifiedAt,
        requestedAt: data.verificationRequestedAt,
      };
    },
    enabled: !!studioId,
  });
}

// ==========================================
// MUTATIONS (Secure API Actions with Optimistic UI)
// ==========================================

// Mutation to update studio is_active status (WITH OPTIMISTIC UI)
export function useUpdateStudioStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studioId, isActive }: { studioId: string; isActive: boolean; }) => {
      return await webFetch(`/api/studios/${studioId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive })
      });
    },
    // ⚡ OPTIMISTIC UPDATE: Make the UI feel instant!
    onMutate: async ({ studioId, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ['studios'] });

      const previousStudios = queryClient.getQueryData<StudioWithOwner[]>(['studios']);

      if (previousStudios) {
        queryClient.setQueryData<StudioWithOwner[]>(['studios'], (old) => 
          old?.map(studio => 
            studio.id === studioId ? { ...studio, isActive } : studio
          )
        );
      }

      return { previousStudios };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousStudios) {
        queryClient.setQueryData(['studios'], context.previousStudios);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["studios"] });
    },
  });
}

export function useRequestVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studioId, documents }: { studioId: string; documents: string[]; }) => {
      return await webFetch(`/api/studios/${studioId}/verification`, {
        method: 'POST',
        body: JSON.stringify({ documents })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studios"] });
      queryClient.invalidateQueries({ queryKey: ["studio", "verification"] });
    },
  });
}

// Client-side Haversine distance calculation (in miles) for UI fallback rendering
// Note: Our backend now provides `distanceMiles` automatically for the nearby query!
export function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}