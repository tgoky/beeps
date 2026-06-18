import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Studio, VerificationStatus } from "@/types/database";

export interface StudioWithOwner extends Studio {
  owner: {
    id: string;
    username: string;
    fullName?: string;
    avatar?: string;
  };
}

// 🛡️ Secure API Fetcher to hit your Next.js Backend
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:3000'; // Change to your local IP / production URL

const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  // Cleanly handle query parameters vs path variables
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
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
      // Your backend /api/studios route handles the Prisma camelCase mapping!
      const data = await authFetch('/api/studios');
      return data.studios as StudioWithOwner[];
    },
  });
}

// Fetch ALL studios (including inactive) - used by Studio Manager tool
export function useAllStudiosDebug() {
  return useQuery({
    queryKey: ["studios", "debug", "all"],
    queryFn: async () => {
      const data = await authFetch('/api/studios?debug=true');
      return data.studios as StudioWithOwner[];
    },
  });
}

export function useNearbyStudios(latitude?: number, longitude?: number, radiusKm: number = 50) {
  return useQuery({
    queryKey: ["studios", "nearby", latitude, longitude, radiusKm],
    queryFn: async () => {
      // Let the Next.js server handle the complex PostGIS/Math logic!
      let endpoint = '/api/studios';
      if (latitude && longitude) {
        endpoint += `?lat=${latitude}&lng=${longitude}&radius=${radiusKm}`;
      }
      const data = await authFetch(endpoint);
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
      const data = await authFetch(`/api/studios/${studioId}/verification`);
      return {
        status: (data.verificationStatus || "UNVERIFIED") as VerificationStatus,
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
      return await authFetch(`/api/studios/${studioId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive })
      });
    },
    // ⚡ OPTIMISTIC UPDATE: Make the UI feel instant!
    onMutate: async ({ studioId, isActive }) => {
      // 1. Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['studios'] });

      // 2. Snapshot the previous value
      const previousStudios = queryClient.getQueryData<StudioWithOwner[]>(['studios']);

      // 3. Optimistically update the cache
      if (previousStudios) {
        queryClient.setQueryData<StudioWithOwner[]>(['studios'], (old) => 
          old?.map(studio => 
            studio.id === studioId ? { ...studio, isActive } : studio
          )
        );
      }

      // 4. Return a context object with the snapshotted value to rollback if it fails
      return { previousStudios };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, newTodo, context) => {
      if (context?.previousStudios) {
        queryClient.setQueryData(['studios'], context.previousStudios);
      }
    },
    // Always refetch after error or success to ensure we are synced with the server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["studios"] });
    },
  });
}

export function useRequestVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studioId, documents }: { studioId: string; userId: string; documents: string[]; }) => {
      // The Next.js backend will securely verify ownership, update status to PENDING, and trigger notifications!
      return await authFetch(`/api/studios/${studioId}/verification`, {
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

// Client-side Haversine distance calculation (in miles) for UI display rendering
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