import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface StudioBooking {
  id: string;
  studioId: string;
  userId: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  totalAmount: number;
  notes?: string;
  type: "STUDIO_BOOKING";
  itemName: string;
  providerName: string;
  customerName: string;
  studio: any;
  user: any;
  createdAt: string;
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
      // Invalidate and refetch bookings
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
