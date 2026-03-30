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
  const [sessionActionError, setSessionActionError] = useState<string | null>(null);

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
    <div className={`min-h-screen p-4 md:p-6 transition-colors duration-200 ${bgPrimary} ${textPrimary}`}>
      <div className="max-w-5xl mx-auto">

        {/* Header row */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h1 className="text-2xl font-light tracking-tight">Bookings</h1>
          {/* View mode toggle */}
          <div className={`flex rounded-lg border overflow-hidden ${borderPrimary}`}>
            <button
              onClick={() => setViewMode("customer")}
              className={`px-4 py-2 text-sm font-medium transition-all duration-200 tracking-wide ${viewMode === "customer" ? (theme === "dark" ? "bg-white text-black" : "bg-black text-white") : `${bgCard} ${textSecondary} hover:${textPrimary}`}`}
            >
              Customer
            </button>
            <button
              onClick={() => setViewMode("provider")}
              className={`px-4 py-2 text-sm font-medium transition-all duration-200 tracking-wide border-l ${borderPrimary} ${viewMode === "provider" ? (theme === "dark" ? "bg-white text-black" : "bg-black text-white") : `${bgCard} ${textSecondary} hover:${textPrimary}`}`}
            >
              Provider
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className={`flex items-center gap-1 flex-wrap mb-4 p-3 rounded-xl border ${borderPrimary} ${bgCard}`}>
          <button onClick={() => setStatusFilter("all")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${statusFilter === "all" ? (theme === "dark" ? "bg-zinc-700 text-white" : "bg-gray-200 text-gray-900") : `${textTertiary} hover:${textPrimary}`}`}>
            <span>All</span><span className="font-light">{stats.total}</span>
          </button>
          {stats.active > 0 && (
            <button onClick={() => setStatusFilter("active")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${statusFilter === "active" ? "bg-emerald-500/20 text-emerald-400" : "text-emerald-400/70 hover:text-emerald-400"}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active</span><span className="font-light">{stats.active}</span>
            </button>
          )}
          <button onClick={() => setStatusFilter("pending")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${statusFilter === "pending" ? "bg-yellow-500/20 text-yellow-400" : `${textTertiary} hover:${textPrimary}`}`}>
            <span>Pending</span><span className="font-light text-yellow-400">{stats.pending}</span>
          </button>
          <button onClick={() => setStatusFilter("confirmed")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${statusFilter === "confirmed" ? "bg-green-500/20 text-green-400" : `${textTertiary} hover:${textPrimary}`}`}>
            <span>Confirmed</span><span className="font-light text-green-400">{stats.confirmed}</span>
          </button>
          <button onClick={() => setStatusFilter("completed")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${statusFilter === "completed" ? "bg-blue-500/20 text-blue-400" : `${textTertiary} hover:${textPrimary}`}`}>
            <span>Completed</span><span className="font-light text-blue-400">{stats.completed}</span>
          </button>
          {stats.cancelled > 0 && (
            <button onClick={() => setStatusFilter("cancelled")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${statusFilter === "cancelled" ? "bg-red-500/20 text-red-400" : `${textTertiary} hover:${textPrimary}`}`}>
              <span>Cancelled</span><span className="font-light text-red-400">{stats.cancelled}</span>
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <select
              value={bookingType}
              onChange={(e) => setBookingType(e.target.value as BookingType)}
              className={`px-3 py-1.5 text-xs font-light rounded-lg border transition-all duration-200 ${theme === "dark" ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-gray-300 text-gray-900"} focus:outline-none appearance-none`}
            >
              <option value="all">All Types</option>
              <option value="studio">Studios</option>
              <option value="equipment">Equipment</option>
              <option value="service">Services</option>
              <option value="beat">Beats</option>
            </select>
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
          <div className="space-y-2">
            {filteredBookings.map((booking: any) => {
              const sessionInfo = (booking as any).sessionInfo;
              const routeMap: any = {
                STUDIO_BOOKING: `/bookings/show/${booking.id}`,
                EQUIPMENT_RENTAL: `/equipment/show/${booking.equipmentId}`,
                SERVICE_REQUEST: `/service-requests/${booking.id}`,
                BEAT_PURCHASE: `/beats/show/${booking.beatId}`,
              };
              const detailRoute = routeMap[booking.type] || "/bookings";
              const counterpart = viewMode === "customer" ? booking.providerName : booking.customerName;
              const dateStr = booking.type === "STUDIO_BOOKING"
                ? `${formatDate(booking.startTime)} · ${formatTime(booking.startTime, booking.endTime)}`
                : formatDate(booking.createdAt);
              const amount = formatCurrency(booking.totalAmount || booking.amount || booking.budget || 0);
              const isActive = booking.status === "ACTIVE";

              return (
              <div
                key={booking.id}
                className={`rounded-xl border transition-all duration-200 ${borderPrimary} ${bgCard} ${isActive ? (theme === "dark" ? "border-emerald-500/30" : "border-emerald-400/40") : ""}`}
              >
                {/* Main row */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => router.push(detailRoute)}
                >
                  {/* Type icon */}
                  <div className={`flex-shrink-0 w-9 h-9 rounded-lg border ${borderPrimary} ${theme === "dark" ? "bg-zinc-900" : "bg-gray-100"} flex items-center justify-center`}>
                    {getTypeIcon(booking.type)}
                  </div>

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium tracking-tight truncate">{booking.itemName}</span>
                      <span className={`text-xs font-medium tracking-wide px-2 py-0.5 rounded-full border flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                        {getStatusText(booking.status)}
                      </span>
                      {sessionInfo?.paymentStatus && sessionInfo.paymentStatus !== "UNPAID" && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          sessionInfo.paymentStatus === "PAYMENT_RELEASED" ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : sessionInfo.paymentStatus === "PAYMENT_HELD" ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                        }`}>
                          <DollarSign className="w-2.5 h-2.5" strokeWidth={2} />
                          {sessionInfo.paymentStatus === "PAYMENT_RELEASED" ? "Paid" : sessionInfo.paymentStatus === "PAYMENT_HELD" ? "Escrow" : "Captured"}
                        </span>
                      )}
                    </div>
                    <div className={`flex items-center gap-2 mt-0.5 text-xs font-light ${textTertiary} flex-wrap`}>
                      <span>{dateStr}</span>
                      {counterpart && <><span>·</span><span>with {counterpart}</span></>}
                      {isActive && sessionInfo?.timeRemaining && (
                        <><span>·</span><span className="text-emerald-400">{sessionInfo.timeRemaining}m left</span></>
                      )}
                      {isActive && sessionInfo?.isOvertime && (
                        <><span>·</span><span className="text-orange-400">+{sessionInfo.currentOvertimeMinutes}m overtime</span></>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="flex-shrink-0 text-right hidden sm:block">
                    <p className="text-sm font-light">{amount}</p>
                  </div>

                  {/* Navigate arrow */}
                  <ChevronRight className={`flex-shrink-0 w-4 h-4 ${textTertiary}`} strokeWidth={2} />
                </div>

                {/* Inline action strip — only shows when there's something actionable */}
                {(() => {
                  const isStudioOwner = currentUser?.id === (booking as any).studio?.owner?.userId;
                  const isCustomer = currentUser?.id === (booking as any).userId;
                  const isProducer = currentUser?.id === (booking as any).producerId;
                  const isClient = currentUser?.id === (booking as any).userId;

                  const actions: any[] = [];

                  // SERVICE REQUEST actions
                  if (booking.type === "SERVICE_REQUEST") {
                    if (isProducer && booking.status === "PENDING") {
                      actions.push(
                        <button key="accept" onClick={(e) => { e.stopPropagation(); handleUpdateServiceRequest(booking.id, "ACCEPTED"); }} disabled={updatingServiceRequest}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${theme === "dark" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-green-50 border-green-200 text-green-700"} hover:bg-green-500/20 active:scale-[0.98] disabled:opacity-50`}
                        >
                          {updatingServiceRequest ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} /> : <Check className="w-3.5 h-3.5" strokeWidth={2} />}
                          Accept
                        </button>,
                        <button key="reject" onClick={(e) => { e.stopPropagation(); handleUpdateServiceRequest(booking.id, "REJECTED"); }} disabled={updatingServiceRequest}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${theme === "dark" ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-700"} hover:bg-red-500/20 active:scale-[0.98] disabled:opacity-50`}
                        >
                          <XCircle className="w-3.5 h-3.5" strokeWidth={2} /> Reject
                        </button>
                      );
                    }
                    if (isProducer && booking.status === "ACCEPTED") {
                      actions.push(
                        <button key="start" onClick={(e) => { e.stopPropagation(); handleUpdateServiceRequest(booking.id, "IN_PROGRESS"); }} disabled={updatingServiceRequest}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${theme === "dark" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-700"} hover:bg-blue-500/20 active:scale-[0.98] disabled:opacity-50`}
                        >
                          <Play className="w-3.5 h-3.5" strokeWidth={2} /> Start Work
                        </button>
                      );
                    }
                    if (isProducer && booking.status === "IN_PROGRESS") {
                      actions.push(
                        <button key="complete" onClick={(e) => { e.stopPropagation(); handleUpdateServiceRequest(booking.id, "COMPLETED"); }} disabled={updatingServiceRequest}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${theme === "dark" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-green-50 border-green-200 text-green-700"} hover:bg-green-500/20 active:scale-[0.98] disabled:opacity-50`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} /> Mark Complete
                        </button>
                      );
                    }
                    if (isClient && (booking.status === "PENDING" || booking.status === "ACCEPTED")) {
                      actions.push(
                        <button key="cancel-svc" onClick={(e) => { e.stopPropagation(); handleUpdateServiceRequest(booking.id, "CANCELLED"); }} disabled={updatingServiceRequest}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${theme === "dark" ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-700"} hover:bg-red-500/20 active:scale-[0.98] disabled:opacity-50`}
                        >
                          <XCircle className="w-3.5 h-3.5" strokeWidth={2} /> Cancel
                        </button>
                      );
                    }
                    if (booking.status === "CONFIRMED" || booking.status === "ACTIVE" || booking.status === "ACCEPTED" || booking.status === "IN_PROGRESS") {
                      const otherUserId = isProducer ? (booking as any).userId : (booking as any).producerId;
                      actions.push(
                        <button key="msg-svc" onClick={(e) => { e.stopPropagation(); router.push(`/messages/${otherUserId}`); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${theme === "dark" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-700"} hover:bg-blue-500/20 active:scale-[0.98]`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" strokeWidth={2} /> Message
                        </button>
                      );
                    }
                  }

                  // STUDIO BOOKING actions
                  if (booking.type === "STUDIO_BOOKING") {
                    if (booking.status === "PENDING" && isCustomer) {
                      actions.push(
                        <button key="pay" onClick={(e) => { e.stopPropagation(); payBooking.mutate({ bookingId: booking.id }); }} disabled={payBooking.isPending}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${theme === "dark" ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-purple-50 border-purple-200 text-purple-700"} hover:bg-purple-500/20 active:scale-[0.98] disabled:opacity-50`}
                        >
                          {payBooking.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} /> : <DollarSign className="w-3.5 h-3.5" strokeWidth={2} />}
                          Pay & Confirm
                        </button>
                      );
                    }
                    if (booking.status === "PENDING" && isStudioOwner) {
                      actions.push(
                        <button key="accept-booking" onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ bookingId: booking.id, status: "CONFIRMED" }); }} disabled={updateStatus.isPending}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${theme === "dark" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-green-50 border-green-200 text-green-700"} hover:bg-green-500/20 active:scale-[0.98] disabled:opacity-50`}
                        >
                          {updateStatus.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} /> : <Check className="w-3.5 h-3.5" strokeWidth={2} />}
                          Accept
                        </button>
                      );
                    }
                    if (booking.status === "PENDING" && (isStudioOwner || isCustomer)) {
                      actions.push(
                        <button key="cancel-booking" onClick={(e) => { e.stopPropagation(); cancelBooking.mutate(booking.id); }} disabled={cancelBooking.isPending}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${theme === "dark" ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-700"} hover:bg-red-500/20 active:scale-[0.98] disabled:opacity-50`}
                        >
                          <XCircle className="w-3.5 h-3.5" strokeWidth={2} />
                          {isStudioOwner ? "Reject" : "Cancel"}
                        </button>
                      );
                    }
                    if (booking.status === "CONFIRMED" && isCustomer && (!sessionInfo?.paymentStatus || sessionInfo?.paymentStatus === "UNPAID")) {
                      actions.push(
                        <button key="pay-now" onClick={(e) => { e.stopPropagation(); payBooking.mutate({ bookingId: booking.id }); }} disabled={payBooking.isPending}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${theme === "dark" ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-purple-50 border-purple-200 text-purple-700"} hover:bg-purple-500/20 active:scale-[0.98] disabled:opacity-50`}
                        >
                          {payBooking.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} /> : <DollarSign className="w-3.5 h-3.5" strokeWidth={2} />}
                          Pay Now
                        </button>
                      );
                    }
                    if (booking.status === "CONFIRMED" && isStudioOwner && sessionInfo?.paymentStatus === "PAYMENT_HELD") {
                      if (showQrPrompt === booking.id) {
                        actions.push(
                          <div key="qr-input" className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {sessionActionError && <span className="text-xs text-red-400">{sessionActionError}</span>}
                            <input type="text" placeholder="QR code" value={qrCodeInput} onChange={(e) => setQrCodeInput(e.target.value)}
                              className={`px-2.5 py-1.5 text-xs rounded-lg border ${theme === "dark" ? "bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600" : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"} focus:outline-none w-32`}
                              onKeyDown={(e) => { if (e.key === "Enter" && qrCodeInput.trim()) checkIn.mutate({ bookingId: booking.id, qrCode: qrCodeInput.trim() }, { onSuccess: () => { setShowQrPrompt(null); setQrCodeInput(""); setSessionActionError(null); }, onError: (err: any) => setSessionActionError(err.message) }); }}
                            />
                            <button onClick={() => checkIn.mutate({ bookingId: booking.id, qrCode: qrCodeInput.trim() }, { onSuccess: () => { setShowQrPrompt(null); setQrCodeInput(""); setSessionActionError(null); }, onError: (err: any) => setSessionActionError(err.message) })} disabled={checkIn.isPending || !qrCodeInput.trim()}
                              className={`flex items-center px-2.5 py-1.5 text-xs rounded-lg border ${theme === "dark" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-green-50 border-green-200 text-green-700"} disabled:opacity-50`}
                            >
                              {checkIn.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} /> : <Check className="w-3.5 h-3.5" strokeWidth={2} />}
                            </button>
                            <button onClick={() => { setShowQrPrompt(null); setQrCodeInput(""); setSessionActionError(null); }} className={`px-2 py-1.5 text-xs rounded-lg border ${theme === "dark" ? "border-zinc-800 text-zinc-400" : "border-gray-300 text-gray-500"}`}>
                              <XCircle className="w-3.5 h-3.5" strokeWidth={2} />
                            </button>
                          </div>
                        );
                      } else {
                        actions.push(
                          <button key="start-session" onClick={(e) => { e.stopPropagation(); setShowQrPrompt(booking.id); setSessionActionError(null); }} disabled={checkIn.isPending}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${theme === "dark" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-green-50 border-green-200 text-green-700"} hover:bg-green-500/20 active:scale-[0.98] disabled:opacity-50`}
                          >
                            <Play className="w-3.5 h-3.5" strokeWidth={2} /> Start Session
                          </button>
                        );
                      }
                    }
                    if (booking.status === "ACTIVE" && isCustomer && sessionInfo && !sessionInfo.bookerConfirmedCheckIn) {
                      if (showConfirmPrompt === booking.id) {
                        actions.push(
                          <div key="code-input" className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {sessionActionError && <span className="text-xs text-red-400">{sessionActionError}</span>}
                            <input type="text" placeholder="6-digit code" value={confirmCodeInput} onChange={(e) => setConfirmCodeInput(e.target.value.toUpperCase())} maxLength={6}
                              className={`px-2.5 py-1.5 text-xs font-mono rounded-lg border text-center ${theme === "dark" ? "bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600" : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"} focus:outline-none w-24 tracking-widest`}
                              onKeyDown={(e) => { if (e.key === "Enter" && confirmCodeInput.trim()) confirmCheckIn.mutate({ bookingId: booking.id, confirmationCode: confirmCodeInput.trim() }, { onSuccess: () => { setShowConfirmPrompt(null); setConfirmCodeInput(""); setSessionActionError(null); }, onError: (err: any) => setSessionActionError(err.message) }); }}
                            />
                            <button onClick={() => confirmCheckIn.mutate({ bookingId: booking.id, confirmationCode: confirmCodeInput.trim() }, { onSuccess: () => { setShowConfirmPrompt(null); setConfirmCodeInput(""); setSessionActionError(null); }, onError: (err: any) => setSessionActionError(err.message) })} disabled={confirmCheckIn.isPending || !confirmCodeInput.trim()}
                              className={`flex items-center px-2.5 py-1.5 text-xs rounded-lg border ${theme === "dark" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-green-50 border-green-200 text-green-700"} disabled:opacity-50`}
                            >
                              {confirmCheckIn.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} /> : <Check className="w-3.5 h-3.5" strokeWidth={2} />}
                            </button>
                            <button onClick={() => { setShowConfirmPrompt(null); setConfirmCodeInput(""); setSessionActionError(null); }} className={`px-2 py-1.5 text-xs rounded-lg border ${theme === "dark" ? "border-zinc-800 text-zinc-400" : "border-gray-300 text-gray-500"}`}>
                              <XCircle className="w-3.5 h-3.5" strokeWidth={2} />
                            </button>
                          </div>
                        );
                      } else {
                        actions.push(
                          <button key="confirm-presence" onClick={(e) => { e.stopPropagation(); setShowConfirmPrompt(booking.id); setSessionActionError(null); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${theme === "dark" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" : "bg-yellow-50 border-yellow-200 text-yellow-700"} hover:bg-yellow-500/20 active:scale-[0.98]`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} /> Confirm Presence
                          </button>
                        );
                      }
                    }
                    if (booking.status === "ACTIVE" && (isStudioOwner || isCustomer)) {
                      actions.push(
                        <button key="end-session" onClick={(e) => { e.stopPropagation(); if (confirm("End this session?")) checkOut.mutate(booking.id); }} disabled={checkOut.isPending}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${theme === "dark" ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-700"} hover:bg-red-500/20 active:scale-[0.98] disabled:opacity-50`}
                        >
                          {checkOut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} /> : <Square className="w-3.5 h-3.5" strokeWidth={2} />}
                          End Session
                        </button>
                      );
                    }
                    if (booking.status === "COMPLETED" && isCustomer && sessionInfo?.paymentStatus === "PAYMENT_HELD") {
                      actions.push(
                        <button key="approve-payment" onClick={(e) => { e.stopPropagation(); if (confirm("Approve payment release? Cannot be undone.")) releasePayment.mutate(booking.id); }} disabled={releasePayment.isPending}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${theme === "dark" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-green-50 border-green-200 text-green-700"} hover:bg-green-500/20 active:scale-[0.98] disabled:opacity-50`}
                        >
                          {releasePayment.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} /> : <DollarSign className="w-3.5 h-3.5" strokeWidth={2} />}
                          Approve Payment
                        </button>
                      );
                    }
                    if ((booking.status === "CONFIRMED" || booking.status === "ACTIVE") && isCustomer) {
                      actions.push(
                        <button key="msg" onClick={(e) => { e.stopPropagation(); router.push(`/bookings/${booking.id}/chat`); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${theme === "dark" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-700"} hover:bg-blue-500/20 active:scale-[0.98]`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" strokeWidth={2} /> Message
                        </button>
                      );
                    }
                  }

                  if (actions.length === 0) return null;

                  return (
                    <div className={`flex items-center gap-2 flex-wrap px-4 pb-3 pt-0 border-t ${borderPrimary}`} onClick={(e) => e.stopPropagation()}>
                      {actions}
                    </div>
                  );
                })()}
              </div>
              );
            })}
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