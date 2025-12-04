"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAllBookings, useUpdateBookingStatus, useCancelBooking } from "@/hooks/useBookings";
import { useTheme } from "@/providers/ThemeProvider";
import { createBrowserClient } from "@supabase/ssr";
import { useUserBySupabaseId } from "@/hooks/api/useUserData";
import {
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Music2,
  Package,
  Briefcase,
  Home,
  Loader2,
  Filter,
  Users,
  Mic2,
  Building2,
  Guitar,
  Headphones,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  MoreVertical,
  Search,
  MapPin,
  Star,
  Zap,
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
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);

  const { data: bookingsData, isLoading, error } = useAllBookings(viewMode);
  const updateStatus = useUpdateBookingStatus();
  const cancelBooking = useCancelBooking();

  // Fetch current user data
  const { data: currentUser } = useUserBySupabaseId(supabaseUser?.id, {
    enabled: !!supabaseUser?.id,
  });

  // Load Supabase user
  useEffect(() => {
    const loadUser = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser();
      setSupabaseUser(user);
    };

    loadUser();
  }, []);

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
    cancelled: allBookings.filter((b: any) => b.status === "CANCELLED" || b.status === "REJECTED").length,
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
      case "ACCEPTED":
        return <CheckCircle2 className="w-4 h-4 text-green-400" strokeWidth={2.5} />;
      case "COMPLETED":
        return <CheckCircle2 className="w-4 h-4 text-blue-400" strokeWidth={2.5} />;
      case "PENDING":
        return <AlertCircle className="w-4 h-4 text-yellow-400" strokeWidth={2.5} />;
      case "CANCELLED":
      case "REJECTED":
        return <XCircle className="w-4 h-4 text-red-400" strokeWidth={2.5} />;
      default:
        return <AlertCircle className={`w-4 h-4 ${theme === "dark" ? "text-zinc-400" : "text-gray-400"}`} strokeWidth={2.5} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
      case "ACCEPTED":
        return "Confirmed";
      case "COMPLETED":
        return "Completed";
      case "PENDING":
        return "Pending";
      case "CANCELLED":
      case "REJECTED":
        return "Cancelled";
      default:
        return status || "Unknown";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
      case "ACCEPTED":
        return theme === "dark" 
          ? "bg-green-500/10 text-green-400 border-green-500/20" 
          : "bg-green-500/10 text-green-600 border-green-500/20";
      case "COMPLETED":
        return theme === "dark"
          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
          : "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "PENDING":
        return theme === "dark"
          ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
          : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "CANCELLED":
      case "REJECTED":
        return theme === "dark"
          ? "bg-red-500/10 text-red-400 border-red-500/20"
          : "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return theme === "dark"
          ? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
          : "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const getTypeIcon = (type: string) => {
    const iconClass = theme === "dark" ? "text-white" : "text-gray-900";
    switch (type) {
      case "STUDIO_BOOKING":
        return <Building2 className={`w-4 h-4 ${iconClass}`} strokeWidth={2} />;
      case "EQUIPMENT_RENTAL":
        return <Guitar className={`w-4 h-4 ${iconClass}`} strokeWidth={2} />;
      case "SERVICE_REQUEST":
        return <Briefcase className={`w-4 h-4 ${iconClass}`} strokeWidth={2} />;
      case "BEAT_PURCHASE":
        return <Music2 className={`w-4 h-4 ${iconClass}`} strokeWidth={2} />;
      default:
        return <Calendar className={`w-4 h-4 ${iconClass}`} strokeWidth={2} />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "STUDIO_BOOKING":
        return "Studio";
      case "EQUIPMENT_RENTAL":
        return "Equipment";
      case "SERVICE_REQUEST":
        return "Service";
      case "BEAT_PURCHASE":
        return "Beat";
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Theme-based text colors
  const textPrimary = theme === "dark" ? "text-white" : "text-gray-900";
  const textSecondary = theme === "dark" ? "text-zinc-400" : "text-gray-600";
  const textTertiary = theme === "dark" ? "text-zinc-500" : "text-gray-500";
  const textMuted = theme === "dark" ? "text-zinc-600" : "text-gray-400";

  // Theme-based background colors
  const bgPrimary = theme === "dark" ? "bg-black" : "bg-gray-50";
  const bgSecondary = theme === "dark" ? "bg-zinc-950" : "bg-white";
  const bgCard = theme === "dark" ? "bg-zinc-900/40" : "bg-white";
  const bgHover = theme === "dark" ? "bg-zinc-900/60" : "bg-gray-50";

  // Theme-based border colors
  const borderPrimary = theme === "dark" ? "border-zinc-800" : "border-gray-300";
  const borderSecondary = theme === "dark" ? "border-zinc-700" : "border-gray-400";
  const borderMuted = theme === "dark" ? "border-zinc-900" : "border-gray-200";

  // Theme-based button styles
  const buttonPrimary = theme === "dark"
    ? "bg-white border-white text-black hover:bg-zinc-100 active:scale-[0.98]"
    : "bg-black border-black text-white hover:bg-gray-800 active:scale-[0.98]";
  
  const buttonSecondary = theme === "dark"
    ? "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white hover:bg-black"
    : "bg-gray-50 border-gray-300 text-gray-600 hover:border-gray-400 hover:text-black hover:bg-white";

  return (
    <div className={`min-h-screen p-6 transition-colors duration-200 ${bgPrimary} ${textPrimary}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-8">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              theme === "dark" ? "bg-white" : "bg-black"
            }`}>
              <Calendar className={`w-5 h-5 ${theme === "dark" ? "text-black" : "text-white"}`} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-light tracking-tight">
              Beeps
            </h1>
          </div>

          <div className="space-y-2">
            <h2 className="text-4xl font-light tracking-tight">
              Bookings & Purchases
            </h2>
            <p className="text-base font-light tracking-wide">
              Track all your bookings, purchases, and service requests
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
            <div className="space-y-2">
              <p className="text-sm font-light tracking-wide">
                Total
              </p>
              <p className="text-3xl font-light tracking-tight">
                {stats.total}
              </p>
            </div>
          </div>

          <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
            <div className="space-y-2">
              <p className="text-sm font-light tracking-wide">
                Pending
              </p>
              <p className="text-3xl font-light tracking-tight text-yellow-400">
                {stats.pending}
              </p>
            </div>
          </div>

          <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
            <div className="space-y-2">
              <p className="text-sm font-light tracking-wide">
                Confirmed
              </p>
              <p className="text-3xl font-light tracking-tight text-green-400">
                {stats.confirmed}
              </p>
            </div>
          </div>

          <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
            <div className="space-y-2">
              <p className="text-sm font-light tracking-wide">
                Completed
              </p>
              <p className="text-3xl font-light tracking-tight text-blue-400">
                {stats.completed}
              </p>
            </div>
          </div>

          <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
            <div className="space-y-2">
              <p className="text-sm font-light tracking-wide">
                Cancelled
              </p>
              <p className="text-3xl font-light tracking-tight text-red-400">
                {stats.cancelled}
              </p>
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard} mb-8`}>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Filter className={`w-4 h-4 ${textTertiary}`} strokeWidth={2} />
              <p className="text-sm font-light tracking-wide">
                Filters
              </p>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("customer")}
                  className={`
                    px-4 py-2.5 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                    ${viewMode === "customer"
                      ? buttonPrimary
                      : buttonSecondary
                    }
                  `}
                >
                  As Customer
                </button>
                <button
                  onClick={() => setViewMode("provider")}
                  className={`
                    px-4 py-2.5 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                    ${viewMode === "provider"
                      ? buttonPrimary
                      : buttonSecondary
                    }
                  `}
                >
                  As Provider
                </button>
              </div>

              {/* Type Filter */}
              <select
                value={bookingType}
                onChange={(e) => setBookingType(e.target.value as BookingType)}
                className={`
                  px-4 py-2.5 text-sm font-light rounded-lg border transition-all duration-200
                  ${theme === "dark" ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-gray-300 text-gray-900"}
                  tracking-wide focus:outline-none focus:border-white focus:bg-black
                  appearance-none
                `}
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
                className={`
                  px-4 py-2.5 text-sm font-light rounded-lg border transition-all duration-200
                  ${theme === "dark" ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-gray-300 text-gray-900"}
                  tracking-wide focus:outline-none focus:border-white focus:bg-black
                  appearance-none
                `}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="space-y-4 text-center">
              <Loader2 className={`w-8 h-8 animate-spin ${theme === "dark" ? "text-white" : "text-gray-900"} mx-auto`} strokeWidth={2.5} />
              <p className="text-sm font-light tracking-wide">
                Loading bookings...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className={`p-6 rounded-xl border ${theme === "dark" ? "border-red-500/50 bg-red-500/10" : "border-red-500/30 bg-red-500/5"}`}>
            <p className="text-sm font-light tracking-wide">
              Failed to load bookings. Please try again.
            </p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className={`p-12 rounded-xl text-center border ${borderPrimary} ${bgCard}`}>
            <Calendar className={`w-16 h-16 ${theme === "dark" ? "text-zinc-700" : "text-gray-300"} mx-auto mb-4`} strokeWidth={1.5} />
            <h3 className="text-lg font-light tracking-tight mb-2">
              No bookings found
            </h3>
            <p className="text-sm font-light tracking-wide mb-6">
              Try adjusting your filters or create a new booking
            </p>
            <button
              onClick={() => router.push('/explore')}
              className={`
                inline-flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200
                ${buttonPrimary} tracking-wide active:scale-[0.98]
              `}
            >
              <span>Explore Services</span>
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking: any) => (
              <div
                key={booking.id}
                className={`
                  p-6 rounded-xl border transition-all duration-200
                  ${borderPrimary} ${bgCard}
                  hover:${borderSecondary} hover:${bgHover}
                `}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`
                      p-3 rounded-lg border ${borderPrimary} ${theme === "dark" ? "bg-black" : "bg-gray-100"}
                      flex items-center justify-center
                    `}>
                      {getTypeIcon(booking.type)}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-light tracking-tight">
                        {booking.itemName}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className={`
                          text-xs font-medium tracking-wide
                          px-3 py-1 rounded-full border
                          ${theme === "dark" ? "bg-zinc-900 text-zinc-400 border-zinc-800" : "bg-gray-100 text-gray-600 border-gray-300"}
                        `}>
                          {getTypeName(booking.type)}
                        </span>
                        <span className={`
                          text-xs font-medium tracking-wide
                          px-3 py-1 rounded-full border flex items-center gap-1.5
                          ${getStatusColor(booking.status)}
                        `}>
                          {getStatusIcon(booking.status)}
                          {getStatusText(booking.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                    className={`
                      p-2 rounded-lg border transition-all duration-200
                      ${borderPrimary} ${textTertiary}
                      hover:${borderSecondary} hover:text-white
                    `}
                  >
                    <MoreVertical className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-3">
                    <p className="text-xs font-medium tracking-wider uppercase">
                      {viewMode === "customer" ? "Provider" : "Customer"}
                    </p>
                    <p className="text-sm font-light tracking-wide">
                      {viewMode === "customer" ? booking.providerName : booking.customerName}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-medium tracking-wider uppercase">
                      Date & Time
                    </p>
                    {booking.type === "STUDIO_BOOKING" ? (
                      <div className="space-y-1">
                        <p className="text-sm font-light tracking-wide">
                          {formatDate(booking.startTime)}
                        </p>
                        <p className="text-xs font-light tracking-wide">
                          {formatTime(booking.startTime, booking.endTime)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm font-light tracking-wide">
                        {formatDate(booking.createdAt)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-medium tracking-wider uppercase">
                      Amount
                    </p>
                    <p className="text-lg font-light tracking-wide">
                      {formatCurrency(booking.totalAmount || booking.amount || booking.budget || 0)}
                    </p>
                  </div>
                </div>

                {booking.notes && (
                  <div className={`mb-6 p-4 rounded-lg border ${borderPrimary} ${theme === "dark" ? "bg-black" : "bg-gray-50"}`}>
                    <p className="text-xs font-medium tracking-wider uppercase mb-2">
                      Notes
                    </p>
                    <p className="text-sm font-light tracking-wide">
                      {booking.notes}
                    </p>
                  </div>
                )}

                {/* Expanded Details */}
                {expandedBooking === booking.id && (
                  <div className={`mt-6 pt-6 border-t ${borderPrimary} space-y-4`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <p className="text-xs font-medium tracking-wider uppercase">
                          Booking ID
                        </p>
                        <p className="text-sm font-light tracking-wide">
                          {booking.id}
                        </p>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs font-medium tracking-wider uppercase">
                          Created
                        </p>
                        <p className="text-sm font-light tracking-wide">
                          {dayjs(booking.createdAt).format("MMM D, YYYY [at] h:mm A")}
                        </p>
                      </div>
                    </div>
                    {booking.updatedAt && (
                      <div className="space-y-3">
                        <p className="text-xs font-medium tracking-wider uppercase">
                          Last Updated
                        </p>
                        <p className="text-sm font-light tracking-wide">
                          {dayjs(booking.updatedAt).format("MMM D, YYYY [at] h:mm A")}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className={`flex gap-3 pt-6 border-t ${borderPrimary}`}>
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
                    className={`
                      flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200
                      ${buttonPrimary} tracking-wide active:scale-[0.98]
                      flex-1 justify-center
                    `}
                  >
                    <span>View Details</span>
                    <ChevronRight className="w-4 h-4" strokeWidth={2} />
                  </button>

                  {/* Only show confirm button if user is the studio owner */}
                  {booking.status === "PENDING" &&
                   booking.type === "STUDIO_BOOKING" &&
                   currentUser?.id === (booking as any).studio?.owner?.userId && (
                    <button
                      onClick={() => updateStatus.mutate({ bookingId: booking.id, status: "CONFIRMED" })}
                      disabled={updateStatus.isPending}
                      className={`
                        px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                        ${theme === "dark"
                          ? "bg-green-500/10 border-green-500/20 text-green-400"
                          : "bg-green-500/10 border-green-500/20 text-green-600"
                        }
                        hover:bg-green-500/20 hover:border-green-500/30 active:scale-[0.98]
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      {updateStatus.isPending ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                          Confirming...
                        </span>
                      ) : (
                        "Confirm Booking"
                      )}
                    </button>
                  )}

                  {/* Show cancel/reject button based on user role */}
                  {booking.status === "PENDING" && (
                    (() => {
                      const isStudioOwner = booking.type === "STUDIO_BOOKING" && currentUser?.id === (booking as any).studio?.owner?.userId;
                      const isCustomer = currentUser?.id === (booking as any).userId;

                      if (!isStudioOwner && !isCustomer) return null;

                      return (
                        <button
                          onClick={() => cancelBooking.mutate(booking.id)}
                          disabled={cancelBooking.isPending}
                          className={`
                            px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                            ${theme === "dark"
                              ? "bg-red-500/10 border-red-500/20 text-red-400"
                              : "bg-red-500/10 border-red-500/20 text-red-600"
                            }
                            hover:bg-red-500/20 hover:border-red-500/30 active:scale-[0.98]
                            disabled:opacity-50 disabled:cursor-not-allowed
                          `}
                        >
                          {cancelBooking.isPending ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                              {isStudioOwner ? 'Rejecting...' : 'Cancelling...'}
                            </span>
                          ) : (
                            isStudioOwner ? 'Reject' : 'Cancel'
                          )}
                        </button>
                      );
                    })()
                  )}

                  {/* Show message button only to customers on confirmed bookings */}
                  {booking.status === "CONFIRMED" &&
                   booking.type === "STUDIO_BOOKING" &&
                   currentUser?.id === (booking as any).userId && (
                    <button
                      onClick={() => router.push(`/bookings/${booking.id}/chat`)}
                      className={`
                        px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                        ${theme === "dark"
                          ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          : "bg-blue-500/10 border-blue-500/20 text-blue-600"
                        }
                        hover:bg-blue-500/20 hover:border-blue-500/30 active:scale-[0.98]
                      `}
                    >
                      Message
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className={`text-center mt-12 pt-8 border-t ${borderMuted}`}>
          <p className="text-xs font-light tracking-wide">
            Having issues with a booking?{' '}
            <button
              type="button"
              onClick={() => router.push('/support')}
              className="font-medium hover:text-zinc-300 transition-colors"
            >
              Contact support
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}