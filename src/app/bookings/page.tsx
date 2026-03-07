"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAllBookings, useUpdateBookingStatus, useCancelBooking, useCheckIn, useCheckOut, usePayBooking, useReleasePayment, useConfirmCheckIn } from "@/hooks/useBookings";
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
  Check,
  Play,
  Square,
  MessageCircle,
} from "lucide-react";
import dayjs from "dayjs";

type BookingType = "all" | "studio" | "equipment" | "service" | "beat";
type ViewMode = "customer" | "provider";
type StatusFilter = "all" | "pending" | "confirmed" | "active" | "cancelled" | "completed";

export default function BookingsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>("customer");
  const [bookingType, setBookingType] = useState<BookingType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [updatingServiceRequest, setUpdatingServiceRequest] = useState(false);
  const [qrCodeInput, setQrCodeInput] = useState<string>("");
  const [showQrPrompt, setShowQrPrompt] = useState<string | null>(null);
  const [confirmCodeInput, setConfirmCodeInput] = useState<string>("");
  const [showConfirmPrompt, setShowConfirmPrompt] = useState<string | null>(null);

  // Fetch BOTH customer and provider bookings for accurate combined stats
  const { data: customerBookingsData } = useAllBookings("customer");
  const { data: providerBookingsData } = useAllBookings("provider");

  // Use the current view mode data for the list display
  const { data: bookingsData, isLoading, error } = useAllBookings(viewMode);
  const updateStatus = useUpdateBookingStatus();
  const cancelBooking = useCancelBooking();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const payBooking = usePayBooking();
  const releasePayment = useReleasePayment();
  const confirmCheckIn = useConfirmCheckIn();

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

  // Combine ALL bookings from both customer and provider views for stats
  const allCombinedBookings = [
    ...(customerBookingsData?.studioBookings || []),
    ...(customerBookingsData?.equipmentRentals || []),
    ...(customerBookingsData?.serviceRequests || []),
    ...(customerBookingsData?.beatPurchases || []),
    ...(providerBookingsData?.studioBookings || []),
    ...(providerBookingsData?.equipmentRentals || []),
    ...(providerBookingsData?.serviceRequests || []),
    ...(providerBookingsData?.beatPurchases || []),
  ];

  // Remove duplicates (bookings where user is both customer and provider somehow)
  const uniqueCombinedBookings = Array.from(
    new Map(allCombinedBookings.map(b => [b.id, b])).values()
  );

  // Current view bookings (for display only)
  const allBookings = bookingsData
    ? [
        ...bookingsData.studioBookings,
        ...bookingsData.equipmentRentals,
        ...bookingsData.serviceRequests,
        ...bookingsData.beatPurchases,
      ]
    : [];

  // Filter bookings for display (only current view mode)
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

  // Calculate stats from ALL combined bookings (customer + provider)
  const stats = {
    total: uniqueCombinedBookings.length,
    pending: uniqueCombinedBookings.filter((b: any) => b.status === "PENDING").length,
    confirmed: uniqueCombinedBookings.filter((b: any) => b.status === "CONFIRMED" || b.status === "ACCEPTED").length,
    active: uniqueCombinedBookings.filter((b: any) => b.status === "ACTIVE").length,
    completed: uniqueCombinedBookings.filter((b: any) => b.status === "COMPLETED").length,
    cancelled: uniqueCombinedBookings.filter((b: any) => b.status === "CANCELLED" || b.status === "REJECTED").length,
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
      case "ACCEPTED":
        return <CheckCircle2 className="w-4 h-4 text-green-400" strokeWidth={2.5} />;
      case "ACTIVE":
        return <Zap className="w-4 h-4 text-emerald-400" strokeWidth={2.5} />;
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
      case "ACTIVE":
        return "In Session";
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
      case "ACTIVE":
        return theme === "dark"
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
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

  // Handle service request status updates
  const handleUpdateServiceRequest = async (requestId: string, status: string) => {
    try {
      setUpdatingServiceRequest(true);
      const res = await fetch(`/api/service-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update request");
      }

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error: any) {
      alert(error.message || "Failed to update service request");
      setUpdatingServiceRequest(false);
    }
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
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
                Active
              </p>
              <p className="text-3xl font-light tracking-tight text-emerald-400">
                {stats.active}
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
                <option value="active">In Session</option>
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

                {/* Session lifecycle info for studio bookings */}
                {booking.type === "STUDIO_BOOKING" && (booking as any).sessionInfo &&
                 (booking as any).sessionInfo.paymentStatus !== "UNPAID" && (
                  <div className={`mb-6 p-4 rounded-lg border ${borderPrimary} ${theme === "dark" ? "bg-black" : "bg-gray-50"}`}>
                    <p className="text-xs font-medium tracking-wider uppercase mb-3">
                      Session Details
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(booking as any).sessionInfo.checkedInAt && (
                        <div>
                          <p className={`text-xs ${textTertiary}`}>Checked In</p>
                          <p className="text-sm font-light">{dayjs((booking as any).sessionInfo.checkedInAt).format("h:mm A")}</p>
                        </div>
                      )}
                      {(booking as any).sessionInfo.checkedOutAt && (
                        <div>
                          <p className={`text-xs ${textTertiary}`}>Checked Out</p>
                          <p className="text-sm font-light">{dayjs((booking as any).sessionInfo.checkedOutAt).format("h:mm A")}</p>
                        </div>
                      )}
                      {(booking as any).sessionInfo.overtimeMinutes > 0 && (
                        <div>
                          <p className={`text-xs ${textTertiary}`}>Overtime</p>
                          <p className="text-sm font-light text-orange-400">+{Math.floor((booking as any).sessionInfo.overtimeMinutes / 60).toString().padStart(2, "0")}h {((booking as any).sessionInfo.overtimeMinutes % 60).toString().padStart(2, "0")}m (+{formatCurrency((booking as any).sessionInfo.overtimeAmount)})</p>
                        </div>
                      )}
                      {(booking as any).sessionInfo.qrCode && (
                        <div>
                          <p className={`text-xs ${textTertiary}`}>QR Code</p>
                          <p className="text-xs font-mono font-light">{(booking as any).sessionInfo.qrCode}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                <div className={`flex flex-wrap gap-3 pt-6 border-t ${borderPrimary}`}>
                  {/* View Details Button */}
                  <button
                    onClick={() => {
                      const routeMap: any = {
                        STUDIO_BOOKING: `/bookings/show/${booking.id}`,
                        EQUIPMENT_RENTAL: `/equipment/show/${booking.equipmentId}`,
                        SERVICE_REQUEST: `/service-requests/${booking.id}`,
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

                  {/* SERVICE REQUEST Actions */}
                  {booking.type === "SERVICE_REQUEST" && (() => {
                    const isProducer = currentUser?.id === (booking as any).producerId;
                    const isClient = currentUser?.id === (booking as any).userId;
                    const otherUserRole = isProducer ? "Client" : "Producer";

                    return (
                      <>
                        {/* Producer Actions - Accept/Reject when PENDING */}
                        {isProducer && booking.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleUpdateServiceRequest(booking.id, "ACCEPTED")}
                              disabled={updatingServiceRequest}
                              className={`
                                flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                                ${theme === "dark"
                                  ? "bg-green-500/10 border-green-500/20 text-green-400"
                                  : "bg-green-500/10 border-green-500/20 text-green-600"
                                }
                                hover:bg-green-500/20 hover:border-green-500/30 active:scale-[0.98]
                                disabled:opacity-50 disabled:cursor-not-allowed
                              `}
                            >
                              {updatingServiceRequest ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                                  <span>Processing...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-4 h-4" strokeWidth={2} />
                                  <span>Accept</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleUpdateServiceRequest(booking.id, "REJECTED")}
                              disabled={updatingServiceRequest}
                              className={`
                                flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                                ${theme === "dark"
                                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                                  : "bg-red-500/10 border-red-500/20 text-red-600"
                                }
                                hover:bg-red-500/20 hover:border-red-500/30 active:scale-[0.98]
                                disabled:opacity-50 disabled:cursor-not-allowed
                              `}
                            >
                              {updatingServiceRequest ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                                  <span>Processing...</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4" strokeWidth={2} />
                                  <span>Reject</span>
                                </>
                              )}
                            </button>
                          </>
                        )}

                        {/* Producer Actions - Start Work when ACCEPTED */}
                        {isProducer && booking.status === "ACCEPTED" && (
                          <button
                            onClick={() => handleUpdateServiceRequest(booking.id, "IN_PROGRESS")}
                            disabled={updatingServiceRequest}
                            className={`
                              flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                              ${theme === "dark"
                                ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                : "bg-blue-500/10 border-blue-500/20 text-blue-600"
                              }
                              hover:bg-blue-500/20 hover:border-blue-500/30 active:scale-[0.98]
                              disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                          >
                            {updatingServiceRequest ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4" strokeWidth={2} />
                                <span>Start Work</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Producer Actions - Mark Complete when IN_PROGRESS */}
                        {isProducer && booking.status === "IN_PROGRESS" && (
                          <button
                            onClick={() => handleUpdateServiceRequest(booking.id, "COMPLETED")}
                            disabled={updatingServiceRequest}
                            className={`
                              flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                              ${theme === "dark"
                                ? "bg-green-500/10 border-green-500/20 text-green-400"
                                : "bg-green-500/10 border-green-500/20 text-green-600"
                              }
                              hover:bg-green-500/20 hover:border-green-500/30 active:scale-[0.98]
                              disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                          >
                            {updatingServiceRequest ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                                <span>Mark Complete</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Client Actions - Cancel when PENDING or ACCEPTED */}
                        {isClient && (booking.status === "PENDING" || booking.status === "ACCEPTED") && (
                          <button
                            onClick={() => handleUpdateServiceRequest(booking.id, "CANCELLED")}
                            disabled={updatingServiceRequest}
                            className={`
                              flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                              ${theme === "dark"
                                ? "bg-red-500/10 border-red-500/20 text-red-400"
                                : "bg-red-500/10 border-red-500/20 text-red-600"
                              }
                              hover:bg-red-500/20 hover:border-red-500/30 active:scale-[0.98]
                              disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                          >
                            {updatingServiceRequest ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                                <span>Cancelling...</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4" strokeWidth={2} />
                                <span>Cancel</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Message Button - RBAC Aware */}
                        <button
                          onClick={() => {
                            const otherUserId = isProducer ? (booking as any).userId : (booking as any).producerId;
                            router.push(`/messages/${otherUserId}`);
                          }}
                          className={`
                            flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                            ${theme === "dark"
                              ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                              : "bg-blue-500/10 border-blue-500/20 text-blue-600"
                            }
                            hover:bg-blue-500/20 hover:border-blue-500/30 active:scale-[0.98]
                          `}
                        >
                          <MessageCircle className="w-4 h-4" strokeWidth={2} />
                          <span>Message {otherUserRole}</span>
                        </button>
                      </>
                    );
                  })()}

                  {/* STUDIO BOOKING Actions */}
                  {booking.type === "STUDIO_BOOKING" && (() => {
                    const isStudioOwner = currentUser?.id === (booking as any).studio?.owner?.userId;
                    const isCustomer = currentUser?.id === (booking as any).userId;
                    const sessionInfo = (booking as any).sessionInfo;

                    return (
                      <>
                        {/* PENDING: Customer can pay to hold in escrow */}
                        {booking.status === "PENDING" && isCustomer && (
                          <button
                            onClick={() => payBooking.mutate({ bookingId: booking.id })}
                            disabled={payBooking.isPending}
                            className={`
                              flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                              ${theme === "dark"
                                ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                                : "bg-purple-500/10 border-purple-500/20 text-purple-600"
                              }
                              hover:bg-purple-500/20 hover:border-purple-500/30 active:scale-[0.98]
                              disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                          >
                            {payBooking.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                            ) : (
                              <DollarSign className="w-4 h-4" strokeWidth={2} />
                            )}
                            <span>Pay & Confirm</span>
                          </button>
                        )}

                        {/* PENDING: Studio owner accepts the booking request */}
                        {booking.status === "PENDING" && isStudioOwner && (
                          <button
                            onClick={() => updateStatus.mutate({ bookingId: booking.id, status: "CONFIRMED" })}
                            disabled={updateStatus.isPending}
                            className={`
                              flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                              ${theme === "dark"
                                ? "bg-green-500/10 border-green-500/20 text-green-400"
                                : "bg-green-500/10 border-green-500/20 text-green-600"
                              }
                              hover:bg-green-500/20 hover:border-green-500/30 active:scale-[0.98]
                              disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                          >
                            {updateStatus.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                            ) : (
                              <Check className="w-4 h-4" strokeWidth={2} />
                            )}
                            <span>Accept Booking</span>
                          </button>
                        )}

                        {/* PENDING: Cancel/Reject */}
                        {booking.status === "PENDING" && (isStudioOwner || isCustomer) && (
                          <button
                            onClick={() => cancelBooking.mutate(booking.id)}
                            disabled={cancelBooking.isPending}
                            className={`
                              flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                              ${theme === "dark"
                                ? "bg-red-500/10 border-red-500/20 text-red-400"
                                : "bg-red-500/10 border-red-500/20 text-red-600"
                              }
                              hover:bg-red-500/20 hover:border-red-500/30 active:scale-[0.98]
                              disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                          >
                            {cancelBooking.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                            ) : (
                              <XCircle className="w-4 h-4" strokeWidth={2} />
                            )}
                            <span>{isStudioOwner ? "Reject" : "Cancel"}</span>
                          </button>
                        )}

                        {/* CONFIRMED + UNPAID: Artist needs to pay (after studio owner accepted) */}
                        {booking.status === "CONFIRMED" && isCustomer &&
                         (!sessionInfo?.paymentStatus || sessionInfo?.paymentStatus === "UNPAID") && (
                          <button
                            onClick={() => payBooking.mutate({ bookingId: booking.id })}
                            disabled={payBooking.isPending}
                            className={`
                              flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                              ${theme === "dark"
                                ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                                : "bg-purple-500/10 border-purple-500/20 text-purple-600"
                              }
                              hover:bg-purple-500/20 hover:border-purple-500/30 active:scale-[0.98]
                              disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                          >
                            {payBooking.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                            ) : (
                              <DollarSign className="w-4 h-4" strokeWidth={2} />
                            )}
                            <span>Pay Now</span>
                          </button>
                        )}

                        {/* CONFIRMED + UNPAID: Cancel for both parties */}
                        {booking.status === "CONFIRMED" &&
                         (!sessionInfo?.paymentStatus || sessionInfo?.paymentStatus === "UNPAID") &&
                         (isStudioOwner || isCustomer) && (
                          <button
                            onClick={() => cancelBooking.mutate(booking.id)}
                            disabled={cancelBooking.isPending}
                            className={`
                              flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                              ${theme === "dark"
                                ? "bg-red-500/10 border-red-500/20 text-red-400"
                                : "bg-red-500/10 border-red-500/20 text-red-600"
                              }
                              hover:bg-red-500/20 hover:border-red-500/30 active:scale-[0.98]
                              disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                          >
                            {cancelBooking.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                            ) : (
                              <XCircle className="w-4 h-4" strokeWidth={2} />
                            )}
                            <span>Cancel</span>
                          </button>
                        )}

                        {/* CONFIRMED + PAID: Studio owner starts session with QR code prompt */}
                        {booking.status === "CONFIRMED" && isStudioOwner &&
                         sessionInfo?.paymentStatus === "PAYMENT_HELD" && (
                          <>
                            {showQrPrompt === booking.id ? (
                              <div className="flex items-center gap-2 w-full">
                                <input
                                  type="text"
                                  placeholder="Enter artist's QR code"
                                  value={qrCodeInput}
                                  onChange={(e) => setQrCodeInput(e.target.value)}
                                  className={`
                                    flex-1 px-4 py-3 text-sm font-light rounded-lg border transition-all duration-200
                                    ${theme === "dark" ? "bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600" : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"}
                                    tracking-wide focus:outline-none focus:ring-1 ${theme === "dark" ? "focus:ring-white" : "focus:ring-black"}
                                  `}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && qrCodeInput.trim()) {
                                      checkIn.mutate({ bookingId: booking.id, qrCode: qrCodeInput.trim() });
                                      setShowQrPrompt(null);
                                      setQrCodeInput("");
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    if (qrCodeInput.trim()) {
                                      checkIn.mutate({ bookingId: booking.id, qrCode: qrCodeInput.trim() });
                                      setShowQrPrompt(null);
                                      setQrCodeInput("");
                                    }
                                  }}
                                  disabled={checkIn.isPending || !qrCodeInput.trim()}
                                  className={`
                                    flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                                    ${theme === "dark"
                                      ? "bg-green-500/10 border-green-500/20 text-green-400"
                                      : "bg-green-500/10 border-green-500/20 text-green-600"
                                    }
                                    hover:bg-green-500/20 hover:border-green-500/30 active:scale-[0.98]
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                  `}
                                >
                                  {checkIn.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                                  ) : (
                                    <Check className="w-4 h-4" strokeWidth={2} />
                                  )}
                                  <span>Confirm</span>
                                </button>
                                <button
                                  onClick={() => { setShowQrPrompt(null); setQrCodeInput(""); }}
                                  className={`
                                    px-3 py-3 text-sm rounded-lg border transition-all duration-200
                                    ${theme === "dark" ? "border-zinc-800 text-zinc-400 hover:text-white" : "border-gray-300 text-gray-600 hover:text-black"}
                                  `}
                                >
                                  <XCircle className="w-4 h-4" strokeWidth={2} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowQrPrompt(booking.id)}
                                disabled={checkIn.isPending}
                                className={`
                                  flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                                  ${theme === "dark"
                                    ? "bg-green-500/10 border-green-500/20 text-green-400"
                                    : "bg-green-500/10 border-green-500/20 text-green-600"
                                  }
                                  hover:bg-green-500/20 hover:border-green-500/30 active:scale-[0.98]
                                  disabled:opacity-50 disabled:cursor-not-allowed
                                `}
                              >
                                <Play className="w-4 h-4" strokeWidth={2} />
                                <span>Start Session</span>
                              </button>
                            )}
                          </>
                        )}

                        {/* ACTIVE: Show live session info */}
                        {booking.status === "ACTIVE" && sessionInfo && (
                          <div className={`
                            flex items-center gap-2 px-4 py-2 text-sm rounded-lg border
                            ${sessionInfo.isOvertime
                              ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
                              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            }
                          `}>
                            <span className={`w-2 h-2 rounded-full animate-pulse ${sessionInfo.isOvertime ? "bg-orange-400" : "bg-emerald-400"}`} />
                            {sessionInfo.isOvertime
                              ? `Overtime: +${sessionInfo.currentOvertimeMinutes}m`
                              : sessionInfo.timeRemaining
                              ? `${sessionInfo.timeRemaining}m remaining`
                              : "In Session"
                            }
                          </div>
                        )}

                        {/* ACTIVE: Artist confirms presence with confirmation code */}
                        {booking.status === "ACTIVE" && isCustomer && sessionInfo && !sessionInfo.bookerConfirmedCheckIn && (
                          <>
                            {showConfirmPrompt === booking.id ? (
                              <div className="flex items-center gap-2 w-full">
                                <input
                                  type="text"
                                  placeholder="Enter confirmation code"
                                  value={confirmCodeInput}
                                  onChange={(e) => setConfirmCodeInput(e.target.value.toUpperCase())}
                                  maxLength={6}
                                  className={`
                                    flex-1 px-4 py-3 text-sm font-mono font-light rounded-lg border transition-all duration-200
                                    ${theme === "dark" ? "bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600" : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"}
                                    tracking-widest text-center focus:outline-none focus:ring-1 ${theme === "dark" ? "focus:ring-white" : "focus:ring-black"}
                                  `}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && confirmCodeInput.trim()) {
                                      confirmCheckIn.mutate({ bookingId: booking.id, confirmationCode: confirmCodeInput.trim() });
                                      setShowConfirmPrompt(null);
                                      setConfirmCodeInput("");
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    if (confirmCodeInput.trim()) {
                                      confirmCheckIn.mutate({ bookingId: booking.id, confirmationCode: confirmCodeInput.trim() });
                                      setShowConfirmPrompt(null);
                                      setConfirmCodeInput("");
                                    }
                                  }}
                                  disabled={confirmCheckIn.isPending || !confirmCodeInput.trim()}
                                  className={`
                                    flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                                    ${theme === "dark"
                                      ? "bg-green-500/10 border-green-500/20 text-green-400"
                                      : "bg-green-500/10 border-green-500/20 text-green-600"
                                    }
                                    hover:bg-green-500/20 hover:border-green-500/30 active:scale-[0.98]
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                  `}
                                >
                                  {confirmCheckIn.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                                  ) : (
                                    <Check className="w-4 h-4" strokeWidth={2} />
                                  )}
                                  <span>Verify</span>
                                </button>
                                <button
                                  onClick={() => { setShowConfirmPrompt(null); setConfirmCodeInput(""); }}
                                  className={`
                                    px-3 py-3 text-sm rounded-lg border transition-all duration-200
                                    ${theme === "dark" ? "border-zinc-800 text-zinc-400 hover:text-white" : "border-gray-300 text-gray-600 hover:text-black"}
                                  `}
                                >
                                  <XCircle className="w-4 h-4" strokeWidth={2} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowConfirmPrompt(booking.id)}
                                className={`
                                  flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                                  ${theme === "dark"
                                    ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                                    : "bg-yellow-500/10 border-yellow-500/20 text-yellow-600"
                                  }
                                  hover:bg-yellow-500/20 hover:border-yellow-500/30 active:scale-[0.98]
                                `}
                              >
                                <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                                <span>Confirm Presence</span>
                              </button>
                            )}
                          </>
                        )}

                        {/* ACTIVE: Both parties can end session (check-out) */}
                        {booking.status === "ACTIVE" && (isStudioOwner || isCustomer) && (
                          <button
                            onClick={() => {
                              if (confirm("Are you sure you want to end this session?")) {
                                checkOut.mutate(booking.id);
                              }
                            }}
                            disabled={checkOut.isPending}
                            className={`
                              flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                              ${theme === "dark"
                                ? "bg-red-500/10 border-red-500/20 text-red-400"
                                : "bg-red-500/10 border-red-500/20 text-red-600"
                              }
                              hover:bg-red-500/20 hover:border-red-500/30 active:scale-[0.98]
                              disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                          >
                            {checkOut.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                            ) : (
                              <Square className="w-4 h-4" strokeWidth={2} />
                            )}
                            <span>End Session</span>
                          </button>
                        )}

                        {/* COMPLETED: Artist (customer) approves payment release - NOT studio owner */}
                        {booking.status === "COMPLETED" && isCustomer &&
                         sessionInfo?.paymentStatus === "PAYMENT_HELD" && (
                          <button
                            onClick={() => {
                              if (confirm("Approve payment release to the studio? This cannot be undone.")) {
                                releasePayment.mutate(booking.id);
                              }
                            }}
                            disabled={releasePayment.isPending}
                            className={`
                              flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                              ${theme === "dark"
                                ? "bg-green-500/10 border-green-500/20 text-green-400"
                                : "bg-green-500/10 border-green-500/20 text-green-600"
                              }
                              hover:bg-green-500/20 hover:border-green-500/30 active:scale-[0.98]
                              disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                          >
                            {releasePayment.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                            ) : (
                              <DollarSign className="w-4 h-4" strokeWidth={2} />
                            )}
                            <span>Approve Payment</span>
                          </button>
                        )}

                        {/* COMPLETED: Studio owner sees waiting status */}
                        {booking.status === "COMPLETED" && isStudioOwner &&
                         sessionInfo?.paymentStatus === "PAYMENT_HELD" && (
                          <div className={`
                            flex items-center gap-2 px-4 py-2 text-sm rounded-lg border
                            bg-yellow-500/10 border-yellow-500/20 text-yellow-400
                          `}>
                            <Clock className="w-4 h-4" strokeWidth={2} />
                            <span>Awaiting artist payment approval</span>
                          </div>
                        )}

                        {/* Payment status badge */}
                        {sessionInfo?.paymentStatus && sessionInfo.paymentStatus !== "UNPAID" && (
                          <div className={`
                            flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border
                            ${sessionInfo.paymentStatus === "PAYMENT_RELEASED"
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : sessionInfo.paymentStatus === "PAYMENT_HELD"
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                              : sessionInfo.paymentStatus === "REFUNDED"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                            }
                          `}>
                            <DollarSign className="w-3 h-3" strokeWidth={2} />
                            {sessionInfo.paymentStatus === "PAYMENT_RELEASED" ? "Paid" :
                             sessionInfo.paymentStatus === "PAYMENT_HELD" ? "In Escrow" :
                             sessionInfo.paymentStatus === "PAYMENT_CAPTURED" ? "Captured" :
                             sessionInfo.paymentStatus === "REFUNDED" ? "Refunded" :
                             sessionInfo.paymentStatus}
                          </div>
                        )}

                        {/* Message button for confirmed/active */}
                        {(booking.status === "CONFIRMED" || booking.status === "ACTIVE") && isCustomer && (
                          <button
                            onClick={() => router.push(`/bookings/${booking.id}/chat`)}
                            className={`
                              flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                              ${theme === "dark"
                                ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                : "bg-blue-500/10 border-blue-500/20 text-blue-600"
                              }
                              hover:bg-blue-500/20 hover:border-blue-500/30 active:scale-[0.98]
                            `}
                          >
                            <MessageCircle className="w-4 h-4" strokeWidth={2} />
                            <span>Message</span>
                          </button>
                        )}
                      </>
                    );
                  })()}
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