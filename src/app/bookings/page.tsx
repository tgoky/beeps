"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/providers/ThemeProvider";
import { useAllBookings, useUpdateBookingStatus, useCancelBooking } from "@/hooks/useBookings";
import {
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Music,
  Package,
  Briefcase,
  Home,
  Loader2,
  Filter,
} from "lucide-react";
import dayjs from "dayjs";

type BookingType = "all" | "studio" | "equipment" | "service" | "beat";
type ViewMode = "customer" | "provider";
type StatusFilter = "all" | "pending" | "confirmed" | "cancelled" | "completed";

export default function BookingsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>("customer");
  const [bookingType, setBookingType] = useState<BookingType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data: bookingsData, isLoading, error } = useAllBookings(viewMode);
  const updateStatus = useUpdateBookingStatus();
  const cancelBooking = useCancelBooking();

  // Combine all bookings
  const allBookings = bookingsData
    ? [
        ...bookingsData.studioBookings,
        ...bookingsData.equipmentRentals,
        ...bookingsData.serviceRequests,
        ...bookingsData.beatPurchases,
      ]
    : [];

  // Filter bookings
  const filteredBookings = allBookings.filter((booking) => {
    // Type filter
    if (bookingType !== "all") {
      const typeMap = {
        studio: "STUDIO_BOOKING",
        equipment: "EQUIPMENT_RENTAL",
        service: "SERVICE_REQUEST",
        beat: "BEAT_PURCHASE",
      };
      if (booking.type !== typeMap[bookingType]) return false;
    }

    // Status filter
    if (statusFilter !== "all") {
      const bookingStatus = (booking as any).status?.toLowerCase();
      if (bookingStatus !== statusFilter) return false;
    }

    return true;
  });

  // Calculate stats
  const stats = {
    total: allBookings.length,
    pending: allBookings.filter((b: any) => b.status === "PENDING").length,
    confirmed: allBookings.filter((b: any) => b.status === "CONFIRMED" || b.status === "ACCEPTED").length,
    completed: allBookings.filter((b: any) => b.status === "COMPLETED").length,
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
      case "ACCEPTED":
      case "COMPLETED":
        return theme === "dark" ? "text-green-400 bg-green-500/10" : "text-green-600 bg-green-50";
      case "PENDING":
        return theme === "dark" ? "text-yellow-400 bg-yellow-500/10" : "text-yellow-600 bg-yellow-50";
      case "CANCELLED":
      case "REJECTED":
        return theme === "dark" ? "text-red-400 bg-red-500/10" : "text-red-600 bg-red-50";
      case "IN_PROGRESS":
        return theme === "dark" ? "text-blue-400 bg-blue-500/10" : "text-blue-600 bg-blue-50";
      default:
        return theme === "dark" ? "text-gray-400 bg-gray-500/10" : "text-gray-600 bg-gray-50";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "STUDIO_BOOKING":
        return <Home className="w-4 h-4" />;
      case "EQUIPMENT_RENTAL":
        return <Package className="w-4 h-4" />;
      case "SERVICE_REQUEST":
        return <Briefcase className="w-4 h-4" />;
      case "BEAT_PURCHASE":
        return <Music className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "STUDIO_BOOKING":
        return "Studio Booking";
      case "EQUIPMENT_RENTAL":
        return "Equipment Rental";
      case "SERVICE_REQUEST":
        return "Service Request";
      case "BEAT_PURCHASE":
        return "Beat Purchase";
      default:
        return "Booking";
    }
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format("MMM D, YYYY");
  };

  const formatTime = (startTime: string, endTime?: string) => {
    if (!endTime) return dayjs(startTime).format("h:mm A");
    return `${dayjs(startTime).format("h:mm A")} - ${dayjs(endTime).format("h:mm A")}`;
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-950" : "bg-gray-50"}`}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>
            My Bookings
          </h1>
          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Track all your bookings, purchases, and service requests
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-xl border ${
            theme === "dark" ? "bg-gray-900/40 border-gray-800/60" : "bg-white border-gray-200"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Total</p>
                <p className={`text-2xl font-bold ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>
                  {stats.total}
                </p>
              </div>
              <Calendar className={`w-8 h-8 ${theme === "dark" ? "text-gray-600" : "text-gray-400"}`} />
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${
            theme === "dark" ? "bg-gray-900/40 border-gray-800/60" : "bg-white border-gray-200"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Pending</p>
                <p className={`text-2xl font-bold ${theme === "dark" ? "text-yellow-400" : "text-yellow-600"}`}>
                  {stats.pending}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${
            theme === "dark" ? "bg-gray-900/40 border-gray-800/60" : "bg-white border-gray-200"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Confirmed</p>
                <p className={`text-2xl font-bold ${theme === "dark" ? "text-green-400" : "text-green-600"}`}>
                  {stats.confirmed}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${
            theme === "dark" ? "bg-gray-900/40 border-gray-800/60" : "bg-white border-gray-200"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Completed</p>
                <p className={`text-2xl font-bold ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}>
                  {stats.completed}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`p-4 rounded-xl border mb-6 ${
          theme === "dark" ? "bg-gray-900/40 border-gray-800/60" : "bg-white border-gray-200"
        }`}>
          <div className="flex flex-wrap gap-4 items-center">
            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("customer")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === "customer"
                    ? theme === "dark"
                      ? "bg-purple-500/20 text-purple-400 border-2 border-purple-500/40"
                      : "bg-purple-50 text-purple-600 border-2 border-purple-200"
                    : theme === "dark"
                      ? "bg-gray-800/40 text-gray-400 border border-gray-700/60 hover:border-gray-600"
                      : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300"
                }`}
              >
                As Customer
              </button>
              <button
                onClick={() => setViewMode("provider")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === "provider"
                    ? theme === "dark"
                      ? "bg-purple-500/20 text-purple-400 border-2 border-purple-500/40"
                      : "bg-purple-50 text-purple-600 border-2 border-purple-200"
                    : theme === "dark"
                      ? "bg-gray-800/40 text-gray-400 border border-gray-700/60 hover:border-gray-600"
                      : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300"
                }`}
              >
                As Provider
              </button>
            </div>

            {/* Type Filter */}
            <select
              value={bookingType}
              onChange={(e) => setBookingType(e.target.value as BookingType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                theme === "dark"
                  ? "bg-gray-800/40 border-gray-700/60 text-gray-300"
                  : "bg-white border-gray-300 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
            >
              <option value="all">All Types</option>
              <option value="studio">Studios</option>
              <option value="equipment">Equipment</option>
              <option value="service">Services</option>
              <option value="beat">Beats</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                theme === "dark"
                  ? "bg-gray-800/40 border-gray-700/60 text-gray-300"
                  : "bg-white border-gray-300 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : error ? (
          <div className={`p-6 rounded-xl text-center ${
            theme === "dark" ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600"
          }`}>
            <p>Failed to load bookings. Please try again.</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className={`p-12 rounded-xl text-center border ${
            theme === "dark" ? "bg-gray-900/40 border-gray-800/60" : "bg-white border-gray-200"
          }`}>
            <Calendar className={`w-16 h-16 mx-auto mb-4 ${
              theme === "dark" ? "text-gray-700" : "text-gray-300"
            }`} />
            <h3 className={`text-lg font-semibold mb-2 ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}>
              No bookings found
            </h3>
            <p className={`text-sm ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
              Try adjusting your filters or create a new booking
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking: any) => (
              <div
                key={booking.id}
                className={`p-6 rounded-xl border transition-all hover:shadow-lg ${
                  theme === "dark"
                    ? "bg-gray-900/40 border-gray-800/60 hover:border-gray-700"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${
                      theme === "dark" ? "bg-purple-500/10" : "bg-purple-50"
                    }`}>
                      {getTypeIcon(booking.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-lg font-semibold ${
                          theme === "dark" ? "text-gray-100" : "text-gray-900"
                        }`}>
                          {booking.itemName}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                        }`}>
                          {getTypeName(booking.type)}
                        </span>
                      </div>
                      <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        {viewMode === "customer" ? `Provider: ${booking.providerName}` : `Customer: ${booking.customerName}`}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {booking.type === "STUDIO_BOOKING" && (
                    <>
                      <div className="flex items-center gap-2">
                        <Calendar className={`w-4 h-4 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
                        <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                          {formatDate(booking.startTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
                        <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                          {formatTime(booking.startTime, booking.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className={`w-4 h-4 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
                        <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                          ${booking.totalAmount}
                        </span>
                      </div>
                    </>
                  )}
                  {(booking.type === "EQUIPMENT_RENTAL" || booking.type === "BEAT_PURCHASE") && (
                    <>
                      <div className="flex items-center gap-2">
                        <Calendar className={`w-4 h-4 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
                        <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                          {formatDate(booking.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className={`w-4 h-4 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
                        <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                          ${booking.amount}
                        </span>
                      </div>
                    </>
                  )}
                  {booking.type === "SERVICE_REQUEST" && (
                    <>
                      <div className="flex items-center gap-2">
                        <Calendar className={`w-4 h-4 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
                        <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                          {formatDate(booking.createdAt)}
                        </span>
                      </div>
                      {booking.budget && (
                        <div className="flex items-center gap-2">
                          <DollarSign className={`w-4 h-4 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
                          <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                            ${booking.budget}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {booking.notes && (
                  <p className={`text-sm mb-4 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    {booking.notes}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const routeMap: any = {
                        STUDIO_BOOKING: `/bookings/show/${booking.id}`,
                        EQUIPMENT_RENTAL: `/equipment/show/${booking.equipmentId}`,
                        SERVICE_REQUEST: `/services/show/${booking.id}`,
                        BEAT_PURCHASE: `/beats/show/${booking.beatId}`,
                      };
                      router.push(routeMap[booking.type] || "/bookings");
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      theme === "dark"
                        ? "bg-purple-600 hover:bg-purple-700 text-white"
                        : "bg-purple-600 hover:bg-purple-700 text-white"
                    }`}
                  >
                    View Details
                  </button>

                  {booking.status === "PENDING" && viewMode === "provider" && booking.type === "STUDIO_BOOKING" && (
                    <button
                      onClick={() => updateStatus.mutate({ bookingId: booking.id, status: "CONFIRMED" })}
                      disabled={updateStatus.isPending}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        theme === "dark"
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                    >
                      {updateStatus.isPending ? "Confirming..." : "Confirm"}
                    </button>
                  )}

                  {booking.status === "PENDING" && (
                    <button
                      onClick={() => cancelBooking.mutate(booking.id)}
                      disabled={cancelBooking.isPending}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        theme === "dark"
                          ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                          : "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                      }`}
                    >
                      {cancelBooking.isPending ? "Cancelling..." : "Cancel"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
