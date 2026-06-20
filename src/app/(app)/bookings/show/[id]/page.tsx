"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useUserBySupabaseId } from "@/hooks/api/useUserData";
import {
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Loader2,
  ArrowLeft,
  MapPin,
  User,
  FileText,
  Ban,
  MessageSquare,
  Play,
  Square,
  Check,
  QrCode,
  Shield,
  Navigation,
  Bell,
  CalendarPlus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import dayjs from "dayjs";

interface BookingDetails {
  id: string;
  studioId: string;
  userId: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "ACTIVE" | "CANCELLED" | "COMPLETED";
  totalAmount: number;
  paymentStatus: string;
  qrCode?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  bookerConfirmedCheckIn?: boolean;
  overtimeMinutes?: number;
  overtimeAmount?: number;
  proRataAmount?: number;
  actualSessionMinutes?: number;
  earlyEndReason?: string;
  endedBy?: string;
  platformFee?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  studio: {
    id: string;
    name: string;
    location: string;
    streetAddress?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    hourlyRate: number;
    equipment: string[];
    capacity?: string;
    imageUrl?: string;
    owner: {
      userId: string;
      user: {
        id: string;
        username: string;
        fullName: string | null;
        avatar: string | null;
      };
    };
  };
  user: {
    id: string;
    username: string;
    fullName: string | null;
    avatar: string | null;
  };
}

// ─── Booking Timeline ──────────────────────────────────────────────────────────
function BookingTimeline({ booking }: { booking: BookingDetails }) {
  const steps = [
    { key: "requested", label: "Requested",  done: true },
    { key: "confirmed", label: "Confirmed",  done: ["CONFIRMED", "ACTIVE", "COMPLETED"].includes(booking.status) },
    { key: "funded",    label: "In Escrow",  done: ["PAYMENT_HELD", "PAYMENT_CAPTURED", "PAYMENT_RELEASED"].includes(booking.paymentStatus) },
    { key: "active",    label: "In Session", done: ["ACTIVE", "COMPLETED"].includes(booking.status) },
    { key: "completed", label: "Completed",  done: booking.status === "COMPLETED" },
    { key: "released",  label: "Paid Out",   done: booking.paymentStatus === "PAYMENT_RELEASED" },
  ];

  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-[#08080a]">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-6">Booking Progress</h3>
      <div className="flex items-center gap-0 overflow-x-auto pb-2 scrollbar-hide">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center flex-1 min-w-[80px]">
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
                step.done
                  ? "bg-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  : "bg-zinc-900 border-zinc-800"
              }`}>
                {step.done
                  ? <Check className="w-4 h-4 text-black" strokeWidth={3} />
                  : <span className="w-2 h-2 rounded-full bg-zinc-700" />
                }
              </div>
              <span className={`text-[9px] font-medium text-center uppercase tracking-wide leading-tight w-16 ${
                step.done ? "text-emerald-400" : "text-zinc-600"
              }`}>{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-[2px] w-full mb-6 transition-all shrink-0 min-w-[20px] ${
                step.done && steps[i + 1].done ? "bg-emerald-500" : "bg-zinc-800"
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BookingShowPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const bookingId = params?.id;
  
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [qrCodeInput, setQrCodeInput] = useState("");
  const [showQrPrompt, setShowQrPrompt] = useState(false);
  const [confirmCodeInput, setConfirmCodeInput] = useState("");
  const [showConfirmPrompt, setShowConfirmPrompt] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [showCalendarOptions, setShowCalendarOptions] = useState(false);

  const { data: currentUser } = useUserBySupabaseId(supabaseUser?.id, {
    enabled: !!supabaseUser?.id,
  });

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

  const fetchBooking = async () => {
    if (!bookingId) {
      setError("No booking ID provided");
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/bookings/${bookingId}`);
      const data = await response.json();
      if (!response.ok) {
        const errorMessage = data.error?.message || data.message || "Failed to fetch booking";
        throw new Error(errorMessage);
      }
      setBooking(data.data?.booking || data.booking);
    } catch (err: any) {
      setError(err.message || "Failed to load booking");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  // Live clock for active session timer
  useEffect(() => {
    if (booking?.status !== "ACTIVE") return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [booking?.status]);

  const handleAction = async (action: () => Promise<Response>, successMessage?: string): Promise<boolean> => {
    if (!booking) return false;
    setIsUpdating(true);
    setActionError(null);
    try {
      const response = await action();
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "Action failed");
      }
      // Refresh booking data
      await fetchBooking();
      return true;
    } catch (err: any) {
      setActionError(err.message || "Something went wrong");
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAcceptBooking = () => handleAction(() =>
    fetch(`/api/bookings/${booking!.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CONFIRMED" }),
    })
  );

  const handleCancelBooking = async () => {
    if (!booking || !confirm("Are you sure you want to cancel this booking?")) return;
    handleAction(() => fetch(`/api/bookings/${booking.id}`, { method: "DELETE" }));
  };

  const handlePayBooking = () => handleAction(() =>
    fetch(`/api/bookings/${booking!.id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
  );

  const handleCheckIn = async (qrCode: string) => {
    const success = await handleAction(() =>
      fetch(`/api/bookings/${booking!.id}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode }),
      })
    );
    if (success) {
      setShowQrPrompt(false);
      setQrCodeInput("");
    }
  };

  const handleConfirmCheckIn = async (confirmationCode: string) => {
    const success = await handleAction(() =>
      fetch(`/api/bookings/${booking!.id}/confirm-check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationCode }),
      })
    );
    if (success) {
      setShowConfirmPrompt(false);
      setConfirmCodeInput("");
    }
  };

  const handleCheckOut = async () => {
    if (!booking || !confirm("Are you sure you want to end this session?")) return;
    handleAction(() =>
      fetch(`/api/bookings/${booking.id}/check-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
  };

  const handleReleasePayment = async () => {
    if (!booking || !confirm("Approve payment release to the studio? This cannot be undone.")) return;
    handleAction(() =>
      fetch(`/api/bookings/${booking.id}/release-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
  };

  const handleAddToGoogleCalendar = () => {
    if (!booking) return;
    const title = encodeURIComponent(`Studio Session — ${booking.studio.name}`);
    const start = dayjs(booking.startTime).format("YYYYMMDDTHHmmss");
    const end = dayjs(booking.endTime).format("YYYYMMDDTHHmmss");
    const details = encodeURIComponent(`Booking ID: ${booking.id}\nStudio: ${booking.studio.name}\nLocation: ${booking.studio.location}`);
    const location = encodeURIComponent(booking.studio.location);
    window.open(
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`,
      "_blank"
    );
  };

  const handleDownloadICS = () => {
    if (!booking) return;
    const start = dayjs(booking.startTime).format("YYYYMMDDTHHmmss");
    const end = dayjs(booking.endTime).format("YYYYMMDDTHHmmss");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Beeps//Booking//EN",
      "BEGIN:VEVENT",
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:Studio Session — ${booking.studio.name}`,
      `DESCRIPTION:Booking ID: ${booking.id}\\nStudio: ${booking.studio.name}`,
      `LOCATION:${booking.studio.location}`,
      `UID:booking-${booking.id}@beeps`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `beeps-booking-${booking.id.slice(0, 8)}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED": return <CheckCircle2 className="w-5 h-5 text-emerald-400" strokeWidth={2.5} />;
      case "COMPLETED": return <CheckCircle2 className="w-5 h-5 text-blue-400" strokeWidth={2.5} />;
      case "PENDING":   return <AlertCircle className="w-5 h-5 text-yellow-400" strokeWidth={2.5} />;
      case "ACTIVE":    return <Play className="w-5 h-5 text-emerald-400" strokeWidth={2.5} />;
      case "CANCELLED": return <XCircle className="w-5 h-5 text-red-400" strokeWidth={2.5} />;
      default:          return <AlertCircle className="w-5 h-5 text-zinc-400" strokeWidth={2.5} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "COMPLETED": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "PENDING":   return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "ACTIVE":    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "CANCELLED": return "bg-red-500/10 text-red-400 border-red-500/20";
      default:          return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case "UNPAID": return "Unpaid";
      case "PAYMENT_HELD": return "In Escrow";
      case "PAYMENT_CAPTURED": return "Captured";
      case "PAYMENT_RELEASED": return "Paid";
      case "REFUNDED": return "Refunded";
      default: return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "PAYMENT_RELEASED": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "PAYMENT_HELD": 
      case "PAYMENT_CAPTURED": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "REFUNDED":         return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:                 return "bg-[#08080a] text-zinc-400 border-zinc-800";
    }
  };

  const formatDate = (dateString: string) => dayjs(dateString).format("MMM D, YYYY");
  const formatTime = (startTime: string, endTime?: string) => {
    if (!endTime) return dayjs(startTime).format("h:mm A");
    return `${dayjs(startTime).format("h:mm A")} - ${dayjs(endTime).format("h:mm A")}`;
  };
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const calculateDuration = (startTime: string, endTime: string) => dayjs(endTime).diff(dayjs(startTime), 'hour', true);
  const formatDurationHMS = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, "0")}h ${m.toString().padStart(2, "0")}m`;
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto bg-black text-zinc-200 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-24">
            <div className="space-y-4 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-white mx-auto" strokeWidth={2.5} />
              <p className="text-sm font-light tracking-wide text-zinc-400">Loading booking details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    const isAuthError = error?.toLowerCase().includes("unauthorized") || error?.toLowerCase().includes("forbidden");
    return (
      <div className="h-full overflow-y-auto bg-black text-zinc-200 p-4 md:p-6 flex items-center justify-center">
        <div className="w-full max-w-md p-12 rounded-2xl text-center border border-zinc-800 bg-[#08080a] shadow-2xl">
          <XCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" strokeWidth={1.5} />
          <h3 className="text-xl font-light tracking-tight text-white mb-2">
            {isAuthError ? "Access denied" : "Booking not found"}
          </h3>
          <p className="text-sm font-light tracking-wide mb-8 text-zinc-500">
            {error || "The booking you're looking for doesn't exist"}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => router.push('/bookings')} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium rounded-xl bg-white text-black hover:bg-zinc-200 transition-colors tracking-wide">
              <ArrowLeft className="w-4 h-4" strokeWidth={2} />
              Back to Bookings
            </button>
            <button onClick={() => fetchBooking()} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium rounded-xl border border-zinc-700 bg-[#08080a] text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors tracking-wide">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const duration = calculateDuration(booking.startTime, booking.endTime);
  const isCustomer = currentUser?.id === booking.userId;
  const isStudioOwner = currentUser?.id === booking.studio.owner.userId;

  return (
    <div className="h-full overflow-y-auto bg-black text-zinc-200 p-4 md:p-6 selection:bg-white selection:text-black">
      <div className="max-w-7xl mx-auto pb-24">

        {/* Top bar: back + status badges */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <button onClick={() => router.push('/bookings')} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 text-zinc-300 shadow-lg transition-colors hover:border-zinc-700 hover:bg-zinc-900 hover:text-white">
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium tracking-wide ${getStatusColor(booking.status)}`}>
              {getStatusIcon(booking.status)}
              {booking.status === "ACTIVE" ? "In Session" : booking.status}
            </span>
            {booking.paymentStatus && booking.paymentStatus !== "UNPAID" && (
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium tracking-wide ${getPaymentStatusColor(booking.paymentStatus)}`}>
                <DollarSign className="w-3.5 h-3.5" strokeWidth={2} />
                {getPaymentStatusLabel(booking.paymentStatus)}
              </span>
            )}
          </div>
        </div>

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-light tracking-tight text-white sm:text-4xl mb-2">{booking.studio.name}</h1>
          <p className="text-sm font-light tracking-wide text-zinc-500">
            {formatDate(booking.startTime)} · {formatTime(booking.startTime, booking.endTime)}
          </p>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ─── LEFT COLUMN (main content) ─── */}
          <div className="lg:col-span-2 space-y-6">

          {/* Session stats — compact 4-up grid */}
          <div className="p-6 rounded-2xl border border-zinc-800 bg-[#08080a] shadow-xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 divide-x divide-transparent">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1.5">Date</p>
                <p className="text-sm font-light text-zinc-200">{formatDate(booking.startTime)}</p>
              </div>
              <div className="md:pl-5 md:border-l border-zinc-800">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1.5">Time</p>
                <p className="text-sm font-light text-zinc-200">{formatTime(booking.startTime, booking.endTime)}</p>
              </div>
              <div className="md:pl-5 md:border-l border-zinc-800">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1.5">Duration</p>
                <p className="text-sm font-light text-zinc-200">{duration} {duration === 1 ? 'hr' : 'hrs'}</p>
              </div>
              <div className="md:pl-5 md:border-l border-zinc-800">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1.5">Amount</p>
                <p className="text-xl font-light tracking-tight text-white">{formatCurrency(booking.totalAmount)}</p>
              </div>
            </div>
          </div>

          {/* ESCROW / BOOKING TIMELINE */}
          {booking.status !== "CANCELLED" && (
            <BookingTimeline booking={booking} />
          )}

          {/* QR Code Card - Show to customer only (never to studio owner) */}
          {booking.qrCode && isCustomer && !isStudioOwner && (booking.status === "CONFIRMED" || booking.status === "ACTIVE") && (
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <QrCode className="w-5 h-5 text-zinc-400" strokeWidth={2} />
                <h3 className="text-lg font-light tracking-tight text-white">Your Check-In QR Code</h3>
              </div>
              <p className="text-sm font-light tracking-wide mb-6 text-zinc-400">
                Show this code to the studio owner when you arrive to start your session.
              </p>
              <div className="p-6 rounded-xl border border-zinc-800 bg-[#08080a] text-center">
                <p className="text-3xl font-mono font-medium tracking-widest text-white">{booking.qrCode}</p>
              </div>
            </div>
          )}

          {/* Session Time Window Info - Confirmed bookings */}
          {booking.status === "CONFIRMED" && booking.paymentStatus === "PAYMENT_HELD" && (() => {
            const scheduledStart = new Date(booking.startTime);
            const earliestCheckIn = new Date(scheduledStart.getTime() - 30 * 60 * 1000);
            const currentTime = new Date();
            const isTooEarly = currentTime < earliestCheckIn;
            const minutesUntilOpen = Math.ceil((earliestCheckIn.getTime() - currentTime.getTime()) / (1000 * 60));
            const minutesUntilSession = Math.ceil((scheduledStart.getTime() - currentTime.getTime()) / (1000 * 60));

            if (minutesUntilSession <= 0) return null;

            return (
              <div className="p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5 shadow-xl flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 shrink-0">
                  <Clock className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-medium tracking-wide text-blue-400 mb-0.5">
                    Session {minutesUntilSession > 60
                      ? `in ${Math.floor(minutesUntilSession / 60)}h ${minutesUntilSession % 60}m`
                      : `in ${minutesUntilSession}m`
                    } — {dayjs(scheduledStart).format("h:mm A")}
                  </p>
                  <p className="text-xs font-light tracking-wide text-blue-400/70">
                    {isTooEarly
                      ? `Check-in opens at ${dayjs(earliestCheckIn).format("h:mm A")} (30 min before session)`
                      : "Check-in window is open"}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Session Progress Card - Active sessions */}
          {booking.status === "ACTIVE" && booking.checkedInAt && (() => {
            const endMs = new Date(booking.endTime).getTime();
            const checkedInMs = new Date(booking.checkedInAt).getTime();
            const nowMs = now.getTime();
            const totalMs = endMs - checkedInMs;
            const elapsedMs = nowMs - checkedInMs;
            const remainingMs = endMs - nowMs;
            const isOvertime = remainingMs < 0;
            const absRemainingMs = Math.abs(remainingMs);
            const progressPct = Math.min(100, (elapsedMs / totalMs) * 100);

            const rH = Math.floor(absRemainingMs / (1000 * 60 * 60));
            const rM = Math.floor((absRemainingMs % (1000 * 60 * 60)) / (1000 * 60));
            const rS = Math.floor((absRemainingMs % (1000 * 60)) / 1000);
            const countdown = `${rH.toString().padStart(2, "0")}:${rM.toString().padStart(2, "0")}:${rS.toString().padStart(2, "0")}`;

            const eH = Math.floor(elapsedMs / (1000 * 60 * 60));
            const eM = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
            const eS = Math.floor((elapsedMs % (1000 * 60)) / 1000);
            const elapsed = `${eH.toString().padStart(2, "0")}:${eM.toString().padStart(2, "0")}:${eS.toString().padStart(2, "0")}`;

            return (
              <div className={`p-6 rounded-2xl border shadow-xl ${
                isOvertime ? "border-orange-500/20 bg-orange-500/5" : "border-emerald-500/20 bg-emerald-500/5"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${isOvertime ? "bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.5)]" : "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"}`} />
                    <h3 className="text-xl font-light tracking-tight text-white">
                      {isOvertime ? "Session Overtime" : "Session In Progress"}
                    </h3>
                  </div>
                  <div className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border ${
                    isOvertime ? "bg-orange-500/10 border-orange-500/20" : "bg-emerald-500/10 border-emerald-500/20"
                  }`}>
                    <p className={`text-2xl font-mono font-medium tabular-nums tracking-tight ${isOvertime ? "text-orange-400" : "text-emerald-400"}`}>
                      {isOvertime ? "+" : ""}{countdown}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-6">
                  <div className="relative h-2.5 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                        isOvertime
                          ? "bg-gradient-to-r from-orange-500 to-red-500"
                          : progressPct > 80
                          ? "bg-gradient-to-r from-emerald-500 to-yellow-500"
                          : "bg-gradient-to-r from-emerald-600 to-emerald-400"
                      }`}
                      style={{ width: `${Math.min(progressPct, 100)}%` }}
                    />
                    {progressPct <= 100 && (
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 shadow-lg transition-all duration-1000 ease-linear ${
                          isOvertime ? "bg-orange-400 border-orange-300" : "bg-emerald-400 border-emerald-300"
                        }`}
                        style={{ left: `calc(${Math.min(progressPct, 100)}% - 8px)` }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs font-light text-zinc-500">
                      {dayjs(booking.checkedInAt).format("h:mm A")}
                    </span>
                    <span className={`text-xs font-medium ${isOvertime ? "text-orange-400" : progressPct > 80 ? "text-yellow-400" : "text-emerald-400"}`}>
                      {Math.round(progressPct)}%
                    </span>
                    <span className="text-xs font-light text-zinc-500">
                      {dayjs(booking.endTime).format("h:mm A")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-black/40 border border-zinc-800/50">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1">Elapsed</p>
                    <p className="text-sm font-mono tabular-nums font-light text-zinc-200">{elapsed}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-black/40 border border-zinc-800/50">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1">Scheduled End</p>
                    <p className="text-sm font-light text-zinc-200">{dayjs(booking.endTime).format("h:mm A")}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-black/40 border border-zinc-800/50">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1">Presence</p>
                    <p className={`text-sm font-light ${booking.bookerConfirmedCheckIn ? "text-emerald-400" : "text-yellow-400"}`}>
                      {booking.bookerConfirmedCheckIn ? "Confirmed" : "Pending"}
                    </p>
                  </div>
                  {isOvertime && (
                    <div className="p-3 rounded-lg bg-black/40 border border-orange-500/20">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-orange-500/70 mb-1">Overtime</p>
                      <p className="text-sm font-mono tabular-nums font-light text-orange-400">+{countdown}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Session Complete Summary */}
          {booking.status === "COMPLETED" && booking.checkedInAt && (
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" strokeWidth={2} />
                <h3 className="text-lg font-light tracking-tight text-white">Session Completed</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1">Checked In</p>
                  <p className="text-sm font-light text-zinc-200">{dayjs(booking.checkedInAt).format("h:mm A")}</p>
                </div>
                {booking.checkedOutAt && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1">Checked Out</p>
                    <p className="text-sm font-light text-zinc-200">{dayjs(booking.checkedOutAt).format("h:mm A")}</p>
                  </div>
                )}
                {booking.actualSessionMinutes != null && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1">Actual Duration</p>
                    <p className="text-sm font-light text-zinc-200">{formatDurationHMS(booking.actualSessionMinutes)}</p>
                  </div>
                )}
                {booking.proRataAmount != null && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1">Final Amount</p>
                    <p className="text-sm font-light text-emerald-400">{formatCurrency(booking.proRataAmount)}</p>
                  </div>
                )}
                {booking.overtimeMinutes && booking.overtimeMinutes > 0 ? (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1">Overtime</p>
                    <p className="text-sm font-light text-orange-400">+{formatDurationHMS(booking.overtimeMinutes)} ({formatCurrency(booking.overtimeAmount || 0)})</p>
                  </div>
                ) : null}
                {booking.endedBy && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1">Ended By</p>
                    <p className="text-sm font-light text-zinc-200">{booking.endedBy === "STUDIO_OWNER" ? "Studio Owner" : "Artist"}</p>
                  </div>
                )}
              </div>
              {booking.earlyEndReason && (
                <div className="mt-6 pt-5 border-t border-zinc-800">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-2">Early End Reason</p>
                  <p className="text-sm font-light text-zinc-300">{booking.earlyEndReason}</p>
                </div>
              )}
            </div>
          )}

          {/* Studio Information Card */}
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#08080a] flex items-center justify-center shadow-inner">
                  <Building2 className="w-6 h-6 text-zinc-300" strokeWidth={1.5} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-light tracking-tight text-white">{booking.studio.name}</h3>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                    <p className="text-sm font-light tracking-wide text-zinc-400">{booking.studio.location}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-xl border border-zinc-800/60 bg-[#08080a]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1">Hourly Rate</p>
                <p className="text-lg font-light tracking-wide text-white">{formatCurrency(booking.studio.hourlyRate)}<span className="text-sm text-zinc-500">/hr</span></p>
              </div>
              {booking.studio.capacity && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1">Capacity</p>
                  <p className="text-sm font-light tracking-wide text-zinc-200 mt-1">{booking.studio.capacity}</p>
                </div>
              )}
            </div>
            {booking.studio.equipment && booking.studio.equipment.length > 0 && (
              <div className="mt-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-4">Equipment Available</p>
                <div className="flex flex-wrap gap-2">
                  {booking.studio.equipment.map((item, index) => (
                    <span key={index} className="text-xs font-light tracking-wide px-3 py-1.5 rounded-full border border-zinc-800 bg-[#08080a] text-zinc-300">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">Booking Notes</p>
              </div>
              <div className="p-5 rounded-xl border border-zinc-800/60 bg-[#08080a]">
                <p className="text-sm font-light tracking-wide leading-relaxed text-zinc-300">{booking.notes}</p>
              </div>
            </div>
          )}

          </div>{/* ─── END LEFT COLUMN ─── */}

          {/* ─── RIGHT COLUMN (sticky sidebar) ─── */}
          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">

            {/* Error Banner */}
            {actionError && (
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 shadow-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p className="text-sm font-light tracking-wide text-red-400 flex-1">{actionError}</p>
                  <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-300 flex-shrink-0">
                    <XCircle className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-5">Actions</p>
              <div className="flex flex-col gap-3">

                {/* === PENDING === */}
                {booking.status === "PENDING" && (
                  <>
                    {isCustomer && (
                      <button onClick={handlePayBooking} disabled={isUpdating}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold rounded-xl bg-white text-black hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-lg shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : <DollarSign className="w-4 h-4" strokeWidth={2} />}
                        Pay & Confirm ({formatCurrency(booking.totalAmount)})
                      </button>
                    )}
                    {isStudioOwner && (
                      <button onClick={handleAcceptBooking} disabled={isUpdating}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold rounded-xl bg-white text-black hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-lg shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : <CheckCircle2 className="w-4 h-4" strokeWidth={2} />}
                        Accept Booking
                      </button>
                    )}
                    {(isCustomer || isStudioOwner) && (
                      <button onClick={handleCancelBooking} disabled={isUpdating}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium rounded-xl border border-red-500/20 bg-[#08080a] text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : <Ban className="w-4 h-4" strokeWidth={2} />}
                        {isStudioOwner ? 'Reject Booking' : 'Cancel Booking'}
                      </button>
                    )}
                  </>
                )}

                {/* === CONFIRMED === */}
                {booking.status === "CONFIRMED" && (
                  <>
                    {isCustomer && booking.paymentStatus === "UNPAID" && (
                      <button onClick={handlePayBooking} disabled={isUpdating}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold rounded-xl bg-white text-black hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-lg shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : <DollarSign className="w-4 h-4" strokeWidth={2} />}
                        Pay Now ({formatCurrency(booking.totalAmount)})
                      </button>
                    )}
                    {isStudioOwner && booking.paymentStatus === "PAYMENT_HELD" && (
                      <>
                        {(() => {
                          const scheduledStart = new Date(booking.startTime);
                          const earliestCheckIn = new Date(scheduledStart.getTime() - 30 * 60 * 1000);
                          const latestCheckIn = new Date(scheduledStart.getTime() + 15 * 60 * 1000);
                          const currentTime = new Date();
                          const isTooEarly = currentTime < earliestCheckIn;
                          const isTooLate = currentTime > latestCheckIn;
                          const minutesUntilOpen = Math.ceil((earliestCheckIn.getTime() - currentTime.getTime()) / (1000 * 60));
                          return (
                            <>
                              {isTooEarly && (
                                <div className="flex items-center gap-2 px-4 py-3 text-xs rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-yellow-500">
                                  <Clock className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                                  <span className="font-light">Check-in opens {minutesUntilOpen > 60 ? `${Math.floor(minutesUntilOpen / 60)}h ${minutesUntilOpen % 60}m` : `${minutesUntilOpen}m`} before session</span>
                                </div>
                              )}
                              {isTooLate && (
                                <div className="flex items-center gap-2 px-4 py-3 text-xs rounded-xl border border-red-500/20 bg-red-500/5 text-red-400">
                                  <AlertCircle className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                                  <span className="font-light">Check-in window expired. Contact support.</span>
                                </div>
                              )}
                              {showQrPrompt ? (
                                <div className="flex items-center gap-2 w-full">
                                  <input type="text" placeholder="Enter artist's QR code" value={qrCodeInput}
                                    onChange={(e) => setQrCodeInput(e.target.value)}
                                    className="flex-1 px-4 py-3.5 text-sm font-light rounded-xl border border-zinc-800 bg-[#08080a] text-white placeholder:text-zinc-600 tracking-wide focus:outline-none focus:border-emerald-500 transition-colors"
                                    onKeyDown={(e) => { if (e.key === "Enter" && qrCodeInput.trim() && !isUpdating) handleCheckIn(qrCodeInput.trim()); }}
                                  />
                                  <button onClick={() => { if (qrCodeInput.trim()) handleCheckIn(qrCodeInput.trim()); }} disabled={isUpdating || !qrCodeInput.trim()}
                                    className="flex items-center px-4 py-3.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : <Check className="w-4 h-4" strokeWidth={2} />}
                                  </button>
                                  <button onClick={() => { setShowQrPrompt(false); setQrCodeInput(""); setActionError(null); }}
                                    className="px-3 py-3.5 rounded-xl border border-zinc-800 bg-[#08080a] text-zinc-400 hover:text-white transition-colors"
                                  >
                                    <XCircle className="w-4 h-4" strokeWidth={2} />
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => { setShowQrPrompt(true); setActionError(null); }} disabled={isUpdating || isTooLate}
                                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed tracking-wide shadow-lg shadow-emerald-900/20"
                                >
                                  <Play className="w-4 h-4" strokeWidth={2} />
                                  Start Session
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </>
                    )}
                    {booking.paymentStatus === "UNPAID" && (isCustomer || isStudioOwner) && (
                      <button onClick={handleCancelBooking} disabled={isUpdating}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium rounded-xl border border-red-500/20 bg-[#08080a] text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : <Ban className="w-4 h-4" strokeWidth={2} />}
                        Cancel
                      </button>
                    )}
                  </>
                )}

                {/* === ACTIVE === */}
                {booking.status === "ACTIVE" && (
                  <>
                    {isCustomer && !booking.bookerConfirmedCheckIn && (
                      <>
                        {showConfirmPrompt ? (
                          <div className="flex items-center gap-2 w-full">
                            <input type="text" placeholder="6-digit code" value={confirmCodeInput}
                              onChange={(e) => setConfirmCodeInput(e.target.value.toUpperCase())} maxLength={6}
                              className="flex-1 px-4 py-3.5 text-sm font-mono font-light rounded-xl border border-zinc-800 bg-[#08080a] text-white placeholder:text-zinc-600 tracking-widest text-center focus:outline-none focus:border-emerald-500 transition-colors"
                              onKeyDown={(e) => { if (e.key === "Enter" && confirmCodeInput.trim() && !isUpdating) handleConfirmCheckIn(confirmCodeInput.trim()); }}
                            />
                            <button onClick={() => { if (confirmCodeInput.trim()) handleConfirmCheckIn(confirmCodeInput.trim()); }} disabled={isUpdating || !confirmCodeInput.trim()}
                              className="flex items-center px-4 py-3.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : <Check className="w-4 h-4" strokeWidth={2} />}
                            </button>
                            <button onClick={() => { setShowConfirmPrompt(false); setConfirmCodeInput(""); setActionError(null); }}
                              className="px-3 py-3.5 rounded-xl border border-zinc-800 bg-[#08080a] text-zinc-400 hover:text-white transition-colors"
                            >
                              <XCircle className="w-4 h-4" strokeWidth={2} />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => { setShowConfirmPrompt(true); setActionError(null); }}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20 transition-all active:scale-[0.98] tracking-wide"
                          >
                            <Shield className="w-4 h-4" strokeWidth={2} />
                            Confirm Presence
                          </button>
                        )}
                      </>
                    )}
                    {isCustomer && booking.bookerConfirmedCheckIn && (
                      <div className="flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                        Presence Confirmed
                      </div>
                    )}
                    {(isStudioOwner || isCustomer) && (
                      <button onClick={handleCheckOut} disabled={isUpdating}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium rounded-xl border border-red-500/20 bg-[#08080a] text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : <Square className="w-4 h-4" strokeWidth={2} />}
                        End Session
                      </button>
                    )}
                  </>
                )}

                {/* === COMPLETED === */}
                {booking.status === "COMPLETED" && (
                  <>
                    {isCustomer && booking.paymentStatus === "PAYMENT_HELD" && (
                      <button onClick={handleReleasePayment} disabled={isUpdating}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold rounded-xl bg-white text-black hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-lg shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : <DollarSign className="w-4 h-4" strokeWidth={2} />}
                        Approve Payment Release
                      </button>
                    )}
                    {isStudioOwner && booking.paymentStatus === "PAYMENT_HELD" && (
                      <div className="flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium rounded-xl border border-yellow-500/20 bg-yellow-500/10 text-yellow-500">
                        <Clock className="w-4 h-4" strokeWidth={2} />
                        Awaiting payment approval
                      </div>
                    )}
                  </>
                )}

                {/* Shared Actions */}
                {(booking.status === "CONFIRMED" || booking.status === "ACTIVE") && (
                  <button
                    onClick={() => router.push(`/bookings/${booking.id}/chat`)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium rounded-xl border border-zinc-700 bg-[#08080a] text-zinc-300 hover:text-white hover:bg-zinc-900 transition-all active:scale-[0.98] tracking-wide"
                  >
                    <MessageSquare className="w-4 h-4" strokeWidth={2} />
                    Message
                  </button>
                )}

                <button
                  onClick={() => router.push(`/studios/${booking.studioId}`)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium rounded-xl border border-zinc-700 bg-[#08080a] text-zinc-300 hover:text-white hover:bg-zinc-900 transition-all active:scale-[0.98] tracking-wide"
                >
                  <Building2 className="w-4 h-4" strokeWidth={2} />
                  View Studio
                </button>

              </div>
            </div>{/* END Actions */}

            {/* Confirmed: directions, calendar, contact, notifications */}
            {booking.status === "CONFIRMED" && booking.paymentStatus === "PAYMENT_HELD" && isCustomer && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl overflow-hidden">
                <div className="px-5 pt-5 pb-4 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-zinc-400 flex-shrink-0" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-light tracking-wide text-zinc-200">Funds in escrow</p>
                    <p className="text-[11px] font-light mt-0.5 text-zinc-500">Held securely until session completes</p>
                  </div>
                </div>
                <div className="px-5 pb-5 flex flex-col gap-2">
                  <a
                    href={(() => {
                      const { latitude, longitude, streetAddress, location } = booking.studio;
                      if (latitude && longitude) {
                        return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
                      }
                      const dest = streetAddress ? `${streetAddress}, ${location}` : location;
                      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=driving`;
                    })()}
                    target="_blank" rel="noopener noreferrer"
                    className="w-full inline-flex items-center gap-2.5 px-4 py-3 text-sm font-medium rounded-xl border border-zinc-800 bg-[#08080a] text-zinc-300 hover:border-zinc-700 hover:text-white transition-all active:scale-[0.98] tracking-wide"
                  >
                    <Navigation className="w-4 h-4" strokeWidth={1.5} />
                    Get Directions
                    <ExternalLink className="w-3 h-3 opacity-50 ml-auto" strokeWidth={2} />
                  </a>
                  <button
                    onClick={() => setShowCalendarOptions((v) => !v)}
                    className="w-full inline-flex items-center gap-2.5 px-4 py-3 text-sm font-medium rounded-xl border border-zinc-800 bg-[#08080a] text-zinc-300 hover:border-zinc-700 hover:text-white transition-all active:scale-[0.98] tracking-wide"
                  >
                    <CalendarPlus className="w-4 h-4" strokeWidth={1.5} />
                    Add to Calendar
                    {showCalendarOptions ? <ChevronUp className="w-3 h-3 opacity-50 ml-auto" strokeWidth={2} /> : <ChevronDown className="w-3 h-3 opacity-50 ml-auto" strokeWidth={2} />}
                  </button>
                  {showCalendarOptions && (
                    <div className="p-3 rounded-xl border border-zinc-800/60 bg-[#08080a] flex flex-col gap-2 mt-1">
                      <button onClick={handleAddToGoogleCalendar}
                        className="w-full inline-flex items-center gap-2 px-3 py-2 text-xs font-light rounded-lg bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all active:scale-[0.98]"
                      >
                        <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                        Google Calendar
                      </button>
                      <button onClick={handleDownloadICS}
                        className="w-full inline-flex items-center gap-2 px-3 py-2 text-xs font-light rounded-lg bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all active:scale-[0.98]"
                      >
                        <CalendarPlus className="w-3 h-3" strokeWidth={1.5} />
                        Apple / Outlook (.ics)
                      </button>
                    </div>
                  )}
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-zinc-800/60 bg-[#08080a] mt-2">
                    <Bell className="w-4 h-4 flex-shrink-0 text-zinc-500 mt-0.5" strokeWidth={1.5} />
                    <p className="text-xs font-light leading-relaxed text-zinc-500">
                      Enable notifications to get reminded 30 min before check-in opens and when your session starts.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Participants */}
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-5">Participants</p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center border border-zinc-800 bg-[#08080a] flex-shrink-0">
                    <User className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-light text-white truncate">{booking.user.fullName || booking.user.username}</p>
                    <p className="text-xs font-light text-zinc-500">@{booking.user.username} · Artist</p>
                  </div>
                </div>
                <div className="h-[1px] w-full bg-zinc-800" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center border border-zinc-800 bg-[#08080a] flex-shrink-0">
                    <Building2 className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-light text-white truncate">{booking.studio.owner.user.fullName || booking.studio.owner.user.username}</p>
                    <p className="text-xs font-light text-zinc-500">@{booking.studio.owner.user.username} · Owner</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking info */}
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1">Booking ID</p>
                  <p className="text-xs font-mono text-zinc-400 truncate">{booking.id}</p>
                </div>
                <div className="h-[1px] w-full bg-zinc-800" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1">Created</p>
                  <p className="text-xs font-light text-zinc-300">{dayjs(booking.createdAt).format("MMM D, YYYY [at] h:mm A")}</p>
                </div>
                {booking.updatedAt && (
                  <>
                    <div className="h-[1px] w-full bg-zinc-800" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1">Updated</p>
                      <p className="text-xs font-light text-zinc-300">{dayjs(booking.updatedAt).format("MMM D, YYYY [at] h:mm A")}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

          </aside>{/* ─── END RIGHT COLUMN ─── */}

        </div>{/* END grid */}
      </div>{/* END max-w-7xl */}
    </div>
  );
}