import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";

export interface SessionInfo {
  isActive: boolean;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  qrCode: string | null;
  paymentStatus: string;
  overtimeMinutes: number;
  overtimeAmount: number;
  timeRemaining: number | null;
  isOvertime: boolean;
  currentOvertimeMinutes: number;
  bookerConfirmedCheckIn: boolean;
}

export interface StudioBooking {
  id: string;
  studioId: string;
  userId: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "ACTIVE" | "CANCELLED" | "COMPLETED";
  totalAmount: number;
  notes?: string;
  type: "STUDIO_BOOKING";
  itemName: string;
  providerName: string;
  customerName: string;
  studio: any;
  user: any;
  createdAt: string;
  sessionInfo?: SessionInfo;
}

export interface EquipmentRental {
  id: string;
  equipmentId: string;
  amount: number;
  status: string;
  type: "EQUIPMENT_RENTAL";
  itemName: string;
  providerName: string;
  customerName: string;
  equipment: any;
  buyer: any;
  seller: any;
  createdAt: string;
}

export interface ServiceRequest {
  id: string;
  projectTitle: string;
  projectDescription: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  budget?: number;
  type: "SERVICE_REQUEST";
  itemName: string;
  providerName: string;
  customerName: string;
  client: any;
  producer: any;
  createdAt: string;
}

export interface BeatPurchase {
  id: string;
  beatId: string;
  amount: number;
  status: string;
  type: "BEAT_PURCHASE";
  itemName: string;
  providerName: string;
  customerName: string;
  beat: any;
  buyer: any;
  seller: any;
  createdAt: string;
}

export interface AllBookings {
  studioBookings: StudioBooking[];
  equipmentRentals: EquipmentRental[];
  serviceRequests: ServiceRequest[];
  beatPurchases: BeatPurchase[];
}

// Fetch all bookings
export function useAllBookings(view: "customer" | "provider" = "customer") {
  return useQuery<AllBookings>({
    queryKey: ["bookings", "all", view],
    queryFn: async () => {
      const response = await fetch(`/api/bookings/all?view=${view}`);
      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }
      return response.json();
    },
    keepPreviousData: true,export function useCollaborations(filters?: {
  });
}

// Update booking status
export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update booking");
      return response.json();
    },
    onMutate: async ({ bookingId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["bookings"] });
      const previousBookings = queryClient.getQueriesData({ queryKey: ["bookings"] });

      queryClient.setQueriesData({ queryKey: ["bookings"] }, (old: any) => {
        if (!old?.studioBookings) return old;
        return {
          ...old,
          studioBookings: old.studioBookings.map((b: any) => b.id === bookingId ? { ...b, status } : b),
        };
      });
      return { previousBookings };
    },
    onError: (err, variables, context) => {
      context?.previousBookings.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

// Cancel booking
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to cancel booking");
      return response.json();
    },
    onMutate: async (bookingId) => {
      await queryClient.cancelQueries({ queryKey: ["bookings"] });
      const previousBookings = queryClient.getQueriesData({ queryKey: ["bookings"] });

      queryClient.setQueriesData({ queryKey: ["bookings"] }, (old: any) => {
        if (!old?.studioBookings) return old;
        return {
          ...old,
          studioBookings: old.studioBookings.map((b: any) => b.id === bookingId ? { ...b, status: "CANCELLED" } : b),
        };
      });
      return { previousBookings };
    },
    onError: (err, variables, context) => {
      context?.previousBookings.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

// ============================================================================
// SESSION MANAGEMENT HOOKS (OPTIMISTIC UI ENABLED)
// ============================================================================

// Check in a booking (start session)
export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, qrCode }: { bookingId: string; qrCode?: string }) => {
      const response = await fetch(`/api/bookings/${bookingId}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to check in");
      }
      return response.json();
    },
    // 🚀 THE MAGIC: Optimistic UI
    onMutate: async ({ bookingId }) => {
      await queryClient.cancelQueries({ queryKey: ["sessions"] });
      await queryClient.cancelQueries({ queryKey: ["bookings"] });

      const previousSessions = queryClient.getQueriesData({ queryKey: ["sessions"] });
      const previousBookings = queryClient.getQueriesData({ queryKey: ["bookings"] });

      // Instantly update sessions
      queryClient.setQueriesData({ queryKey: ["sessions"] }, (old: any) => {
        if (!old?.sessions) return old;
        return {
          ...old,
          sessions: old.sessions.map((s: any) => s.id === bookingId ? { ...s, status: "ACTIVE" } : s),
        };
      });

      // Instantly update bookings
      queryClient.setQueriesData({ queryKey: ["bookings"] }, (old: any) => {
        if (!old?.studioBookings) return old;
        return {
          ...old,
          studioBookings: old.studioBookings.map((b: any) => 
            b.id === bookingId ? { 
              ...b, 
              status: "ACTIVE",
              sessionInfo: { ...b.sessionInfo, isActive: true } 
            } : b
          ),
        };
      });

      return { previousSessions, previousBookings };
    },
    // 🛑 ROLLBACK
    onError: (err, variables, context) => {
      context?.previousSessions.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
      context?.previousBookings.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
    },
    // 🔄 QUIET SYNC
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

// Check out a booking (end session)
export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await fetch(`/api/bookings/${bookingId}/check-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to check out");
      }
      return response.json();
    },
    onMutate: async (bookingId) => {
      await queryClient.cancelQueries({ queryKey: ["sessions"] });
      await queryClient.cancelQueries({ queryKey: ["bookings"] });

      const previousSessions = queryClient.getQueriesData({ queryKey: ["sessions"] });
      const previousBookings = queryClient.getQueriesData({ queryKey: ["bookings"] });

      queryClient.setQueriesData({ queryKey: ["sessions"] }, (old: any) => {
        if (!old?.sessions) return old;
        return {
          ...old,
          sessions: old.sessions.map((s: any) => s.id === bookingId ? { ...s, status: "COMPLETED" } : s),
        };
      });

      queryClient.setQueriesData({ queryKey: ["bookings"] }, (old: any) => {
        if (!old?.studioBookings) return old;
        return {
          ...old,
          studioBookings: old.studioBookings.map((b: any) => 
            b.id === bookingId ? { 
              ...b, 
              status: "COMPLETED",
              sessionInfo: { ...b.sessionInfo, isActive: false } 
            } : b
          ),
        };
      });

      return { previousSessions, previousBookings };
    },
    onError: (err, variables, context) => {
      context?.previousSessions.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
      context?.previousBookings.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

// Pay for a booking (hold in escrow)
export function usePayBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, paymentMethod }: { bookingId: string; paymentMethod?: string }) => {
      const response = await fetch(`/api/bookings/${bookingId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to process payment");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

// Confirm check-in (artist confirms presence with code)
export function useConfirmCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, confirmationCode }: { bookingId: string; confirmationCode: string }) => {
      const response = await fetch(`/api/bookings/${bookingId}/confirm-check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationCode }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to confirm check-in");
      }
      return response.json();
    },
    onMutate: async ({ bookingId }) => {
      await queryClient.cancelQueries({ queryKey: ["bookings"] });
      const previousBookings = queryClient.getQueriesData({ queryKey: ["bookings"] });

      queryClient.setQueriesData({ queryKey: ["bookings"] }, (old: any) => {
        if (!old?.studioBookings) return old;
        return {
          ...old,
          studioBookings: old.studioBookings.map((b: any) => 
            b.id === bookingId ? { 
              ...b, 
              sessionInfo: { ...b.sessionInfo, bookerConfirmedCheckIn: true } 
            } : b
          ),
        };
      });
      return { previousBookings };
    },
    onError: (err, variables, context) => {
      context?.previousBookings.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

// Release payment to studio owner
export function useReleasePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await fetch(`/api/bookings/${bookingId}/release-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to release payment");
      }
      return response.json();
    },
    onMutate: async (bookingId) => {
      await queryClient.cancelQueries({ queryKey: ["bookings"] });
      const previousBookings = queryClient.getQueriesData({ queryKey: ["bookings"] });

      queryClient.setQueriesData({ queryKey: ["bookings"] }, (old: any) => {
        if (!old?.studioBookings) return old;
        return {
          ...old,
          studioBookings: old.studioBookings.map((b: any) => 
            b.id === bookingId ? { 
              ...b, 
              paymentStatus: "PAYMENT_RELEASED",
              sessionInfo: { ...b.sessionInfo, paymentStatus: "PAYMENT_RELEASED" } 
            } : b
          ),
        };
      });
      return { previousBookings };
    },
    onError: (err, variables, context) => {
      context?.previousBookings.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

// Fetch active sessions (for studio owner dashboard)
export interface ActiveSession {
  id: string;
  studioId: string;
  userId: string;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: number;
  checkedInAt: string | null;
  qrCode: string | null;
  paymentStatus: string;
  studio: {
    id: string;
    name: string;
    location: string;
    hourlyRate: number;
    imageUrl: string | null;
  };
  user: {
    id: string;
    username: string;
    fullName: string | null;
    avatar: string | null;
  };
  sessionInfo: {
    isActive: boolean;
    totalMinutes: number;
    elapsedMinutes: number;
    timeRemaining: number | null;
    isOvertime: boolean;
    overtimeMinutes: number;
    startsIn: number | null;
  };
}

export function useActiveSessions(includeUpcoming: boolean = true) {
  return useQuery<{
    sessions: ActiveSession[];
    summary: {
      active: number;
      upcoming: number;
      overtime: number;
      total: number;
    };
  }>({
    queryKey: ["sessions", "active", includeUpcoming],
    queryFn: async () => {
      const response = await fetch(`/api/sessions/active?includeUpcoming=${includeUpcoming}`);
      if (!response.ok) {
        throw new Error("Failed to fetch active sessions");
      }
      const data = await response.json();
      return data.data;
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });
}

// ============================================================================
// REAL-TIME SESSION STREAM
// Opens a persistent SSE connection to /api/sessions/stream.
// When the server emits a "session_updated" event (on check-in or check-out),
// this hook invalidates the sessions and bookings queries so they refetch
// immediately instead of waiting for the next 30-second poll.
// Usage: call useSessionStream() once in the studio owner dashboard component.
// ============================================================================
export function useSessionStream() {
  const queryClient = useQueryClient();

  const handleSessionUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["sessions"] });
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
  }, [queryClient]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const es = new EventSource("/api/sessions/stream");

    es.addEventListener("session_updated", handleSessionUpdate);

    es.onerror = () => {
      // EventSource auto-reconnects after ~3 seconds on failure
    };

    return () => es.close();
  }, [handleSessionUpdate]);
}