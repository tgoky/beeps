import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  });
}

// Update booking status
export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: string;
    }) => {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update booking");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

// Cancel booking
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel booking");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

// ============================================================================
// SESSION MANAGEMENT HOOKS
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
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
    onSuccess: () => {
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
    refetchInterval: 30000, // Refresh every 30 seconds for live updates
  });
}
