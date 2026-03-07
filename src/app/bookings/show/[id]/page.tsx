"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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

export default function BookingShowPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const bookingId = params?.id;
  const { theme } = useTheme();
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

  const handleAction = async (action: () => Promise<Response>, successMessage?: string) => {
    if (!booking) return;
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
    } catch (err: any) {
      setActionError(err.message || "Something went wrong");
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

  const handleCheckIn = (qrCode: string) => handleAction(() =>
    fetch(`/api/bookings/${booking!.id}/check-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrCode }),
    })
  );

  const handleConfirmCheckIn = (confirmationCode: string) => handleAction(() =>
    fetch(`/api/bookings/${booking!.id}/confirm-check-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmationCode }),
    })
  );

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

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED": return <CheckCircle2 className="w-5 h-5 text-green-400" strokeWidth={2.5} />;
      case "COMPLETED": return <CheckCircle2 className="w-5 h-5 text-blue-400" strokeWidth={2.5} />;
      case "PENDING": return <AlertCircle className="w-5 h-5 text-yellow-400" strokeWidth={2.5} />;
      case "ACTIVE": return <Play className="w-5 h-5 text-emerald-400" strokeWidth={2.5} />;
      case "CANCELLED": return <XCircle className="w-5 h-5 text-red-400" strokeWidth={2.5} />;
      default: return <AlertCircle className={`w-5 h-5 ${theme === "dark" ? "text-zinc-400" : "text-gray-400"}`} strokeWidth={2.5} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED": return theme === "dark" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-green-500/10 text-green-600 border-green-500/20";
      case "COMPLETED": return theme === "dark" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "PENDING": return theme === "dark" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "ACTIVE": return theme === "dark" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "CANCELLED": return theme === "dark" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-red-500/10 text-red-600 border-red-500/20";
      default: return theme === "dark" ? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" : "bg-gray-500/10 text-gray-600 border-gray-500/20";
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
      case "PAYMENT_RELEASED": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "PAYMENT_HELD": case "PAYMENT_CAPTURED": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "REFUNDED": return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return theme === "dark" ? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" : "bg-gray-500/10 text-gray-500 border-gray-500/20";
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

  const textPrimary = theme === "dark" ? "text-white" : "text-gray-900";
  const textTertiary = theme === "dark" ? "text-zinc-500" : "text-gray-500";
  const bgPrimary = theme === "dark" ? "bg-black" : "bg-gray-50";
  const bgCard = theme === "dark" ? "bg-zinc-900/40" : "bg-white";
  const borderPrimary = theme === "dark" ? "border-zinc-800" : "border-gray-300";
  const buttonPrimary = theme === "dark"
    ? "bg-white border-white text-black hover:bg-zinc-100 active:scale-[0.98]"
    : "bg-black border-black text-white hover:bg-gray-800 active:scale-[0.98]";
  const buttonSecondary = theme === "dark"
    ? "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white hover:bg-black"
    : "bg-gray-50 border-gray-300 text-gray-600 hover:border-gray-400 hover:text-black hover:bg-white";

  if (isLoading) {
    return (
      <div className={`min-h-screen p-6 transition-colors duration-200 ${bgPrimary} ${textPrimary}`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-24">
            <div className="space-y-4 text-center">
              <Loader2 className={`w-8 h-8 animate-spin ${theme === "dark" ? "text-white" : "text-gray-900"} mx-auto`} strokeWidth={2.5} />
              <p className="text-sm font-light tracking-wide">Loading booking details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    const isAuthError = error?.toLowerCase().includes("unauthorized") || error?.toLowerCase().includes("forbidden");
    return (
      <div className={`min-h-screen p-6 transition-colors duration-200 ${bgPrimary} ${textPrimary}`}>
        <div className="max-w-4xl mx-auto">
          <div className={`p-12 rounded-xl text-center border ${borderPrimary} ${bgCard}`}>
            <XCircle className={`w-16 h-16 ${theme === "dark" ? "text-zinc-700" : "text-gray-300"} mx-auto mb-4`} strokeWidth={1.5} />
            <h3 className="text-lg font-light tracking-tight mb-2">
              {isAuthError ? "Access denied" : "Booking not found"}
            </h3>
            <p className="text-sm font-light tracking-wide mb-6">
              {error || "The booking you're looking for doesn't exist"}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => router.push('/bookings')} className={`inline-flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 ${buttonPrimary} tracking-wide`}>
                <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                <span>Back to Bookings</span>
              </button>
              <button onClick={() => fetchBooking()} className={`inline-flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 ${buttonSecondary} tracking-wide`}>
                <span>Try Again</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const duration = calculateDuration(booking.startTime, booking.endTime);
  const isCustomer = currentUser?.id === booking.userId;
  const isStudioOwner = currentUser?.id === booking.studio.owner.userId;

  return (
    <div className={`min-h-screen p-6 transition-colors duration-200 ${bgPrimary} ${textPrimary}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => router.push('/bookings')} className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-all duration-200 mb-6 ${buttonSecondary} tracking-wide active:scale-[0.98]`}>
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            <span>Back to Bookings</span>
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${theme === "dark" ? "bg-white" : "bg-black"}`}>
              <Calendar className={`w-5 h-5 ${theme === "dark" ? "text-black" : "text-white"}`} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-light tracking-tight">Booking Details</h1>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-sm font-medium tracking-wide px-4 py-2 rounded-full border flex items-center gap-2 ${getStatusColor(booking.status)}`}>
              {getStatusIcon(booking.status)}
              {booking.status === "ACTIVE" ? "In Session" : booking.status}
            </span>
            {booking.paymentStatus && booking.paymentStatus !== "UNPAID" && (
              <span className={`text-sm font-medium tracking-wide px-4 py-2 rounded-full border flex items-center gap-2 ${getPaymentStatusColor(booking.paymentStatus)}`}>
                <DollarSign className="w-4 h-4" strokeWidth={2} />
                {getPaymentStatusLabel(booking.paymentStatus)}
              </span>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Error Banner */}
          {actionError && (
            <div className={`p-4 rounded-xl border ${theme === "dark" ? "border-red-500/30 bg-red-500/10" : "border-red-500/20 bg-red-50"}`}>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" strokeWidth={2} />
                <p className="text-sm font-light tracking-wide text-red-400">{actionError}</p>
                <button onClick={() => setActionError(null)} className="ml-auto text-red-400 hover:text-red-300">
                  <XCircle className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
            </div>
          )}

          {/* QR Code Card - Show to customer after payment */}
          {booking.qrCode && isCustomer && (booking.status === "CONFIRMED" || booking.status === "ACTIVE") && (
            <div className={`p-6 rounded-xl border ${theme === "dark" ? "border-purple-500/20 bg-purple-500/5" : "border-purple-500/20 bg-purple-50"}`}>
              <div className="flex items-center gap-3 mb-4">
                <QrCode className="w-5 h-5 text-purple-400" strokeWidth={2} />
                <h3 className="text-lg font-light tracking-tight">Your Check-In QR Code</h3>
              </div>
              <p className="text-sm font-light tracking-wide mb-4 text-purple-400">
                Show this code to the studio owner when you arrive to start your session.
              </p>
              <div className={`p-4 rounded-lg border ${theme === "dark" ? "bg-black border-purple-500/20" : "bg-white border-purple-200"} text-center`}>
                <p className="text-2xl font-mono font-medium tracking-widest">{booking.qrCode}</p>
              </div>
            </div>
          )}

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
              <div className={`p-6 rounded-xl border ${
                isOvertime
                  ? theme === "dark" ? "border-orange-500/20 bg-orange-500/5" : "border-orange-500/20 bg-orange-50"
                  : theme === "dark" ? "border-emerald-500/20 bg-emerald-500/5" : "border-emerald-500/20 bg-emerald-50"
              }`}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${isOvertime ? "bg-orange-400" : "bg-emerald-400"}`} />
                    <h3 className="text-lg font-light tracking-tight">
                      {isOvertime ? "Session Overtime" : "Session In Progress"}
                    </h3>
                  </div>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${
                    isOvertime ? "bg-orange-500/10 border-orange-500/20" : "bg-green-500/10 border-green-500/20"
                  }`}>
                    <p className={`text-2xl font-mono font-medium tabular-nums tracking-tight ${isOvertime ? "text-orange-400" : "text-green-400"}`}>
                      {isOvertime ? "+" : ""}{countdown}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className={`relative h-2 rounded-full ${theme === "dark" ? "bg-zinc-800" : "bg-gray-200"} overflow-hidden`}>
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                        isOvertime
                          ? "bg-gradient-to-r from-orange-500 to-red-500"
                          : progressPct > 80
                          ? "bg-gradient-to-r from-green-500 to-yellow-500"
                          : "bg-gradient-to-r from-green-500 to-emerald-400"
                      }`}
                      style={{ width: `${Math.min(progressPct, 100)}%` }}
                    />
                    {progressPct <= 100 && (
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 shadow-lg transition-all duration-1000 ease-linear ${
                          isOvertime ? "bg-orange-400 border-orange-300" : "bg-green-400 border-green-300"
                        }`}
                        style={{ left: `calc(${Math.min(progressPct, 100)}% - 7px)` }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className={`text-xs font-light ${textTertiary}`}>
                      {dayjs(booking.checkedInAt).format("h:mm A")}
                    </span>
                    <span className={`text-xs font-medium ${isOvertime ? "text-orange-400" : progressPct > 80 ? "text-yellow-400" : "text-green-400"}`}>
                      {Math.round(progressPct)}%
                    </span>
                    <span className={`text-xs font-light ${textTertiary}`}>
                      {dayjs(booking.endTime).format("h:mm A")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className={`text-xs ${textTertiary} mb-1`}>Elapsed</p>
                    <p className="text-sm font-mono tabular-nums font-light">{elapsed}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${textTertiary} mb-1`}>Scheduled End</p>
                    <p className="text-sm font-light">{dayjs(booking.endTime).format("h:mm A")}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${textTertiary} mb-1`}>Presence Confirmed</p>
                    <p className={`text-sm font-light ${booking.bookerConfirmedCheckIn ? "text-green-400" : "text-yellow-400"}`}>
                      {booking.bookerConfirmedCheckIn ? "Yes" : "Pending"}
                    </p>
                  </div>
                  {isOvertime && (
                    <div>
                      <p className={`text-xs ${textTertiary} mb-1`}>Overtime</p>
                      <p className="text-sm font-mono tabular-nums font-light text-orange-400">+{countdown}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Session Complete Summary */}
          {booking.status === "COMPLETED" && booking.checkedInAt && (
            <div className={`p-6 rounded-xl border ${theme === "dark" ? "border-blue-500/20 bg-blue-500/5" : "border-blue-500/20 bg-blue-50"}`}>
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-5 h-5 text-blue-400" strokeWidth={2} />
                <h3 className="text-lg font-light tracking-tight">Session Completed</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className={`text-xs ${textTertiary} mb-1`}>Checked In</p>
                  <p className="text-sm font-light">{dayjs(booking.checkedInAt).format("h:mm A")}</p>
                </div>
                {booking.checkedOutAt && (
                  <div>
                    <p className={`text-xs ${textTertiary} mb-1`}>Checked Out</p>
                    <p className="text-sm font-light">{dayjs(booking.checkedOutAt).format("h:mm A")}</p>
                  </div>
                )}
                {booking.actualSessionMinutes != null && (
                  <div>
                    <p className={`text-xs ${textTertiary} mb-1`}>Actual Duration</p>
                    <p className="text-sm font-light">{formatDurationHMS(booking.actualSessionMinutes)}</p>
                  </div>
                )}
                {booking.proRataAmount != null && (
                  <div>
                    <p className={`text-xs ${textTertiary} mb-1`}>Final Amount</p>
                    <p className="text-sm font-light">{formatCurrency(booking.proRataAmount)}</p>
                  </div>
                )}
                {booking.overtimeMinutes && booking.overtimeMinutes > 0 ? (
                  <div>
                    <p className={`text-xs ${textTertiary} mb-1`}>Overtime</p>
                    <p className="text-sm font-light text-orange-400">+{formatDurationHMS(booking.overtimeMinutes)} ({formatCurrency(booking.overtimeAmount || 0)})</p>
                  </div>
                ) : null}
                {booking.endedBy && (
                  <div>
                    <p className={`text-xs ${textTertiary} mb-1`}>Ended By</p>
                    <p className="text-sm font-light">{booking.endedBy === "STUDIO_OWNER" ? "Studio Owner" : "Artist"}</p>
                  </div>
                )}
              </div>
              {booking.earlyEndReason && (
                <div className="mt-4 pt-4 border-t border-blue-500/20">
                  <p className={`text-xs ${textTertiary} mb-1`}>Early End Reason</p>
                  <p className="text-sm font-light">{booking.earlyEndReason}</p>
                </div>
              )}
            </div>
          )}

          {/* Studio Information Card */}
          <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg border ${borderPrimary} ${theme === "dark" ? "bg-black" : "bg-gray-100"} flex items-center justify-center`}>
                  <Building2 className={`w-5 h-5 ${theme === "dark" ? "text-white" : "text-gray-900"}`} strokeWidth={2} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-light tracking-tight">{booking.studio.name}</h3>
                  <div className="flex items-center gap-2">
                    <MapPin className={`w-4 h-4 ${textTertiary}`} strokeWidth={2} />
                    <p className="text-sm font-light tracking-wide">{booking.studio.location}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-xs font-medium tracking-wider uppercase">Hourly Rate</p>
                <p className="text-lg font-light tracking-wide">{formatCurrency(booking.studio.hourlyRate)}/hr</p>
              </div>
              {booking.studio.capacity && (
                <div className="space-y-3">
                  <p className="text-xs font-medium tracking-wider uppercase">Capacity</p>
                  <p className="text-sm font-light tracking-wide">{booking.studio.capacity}</p>
                </div>
              )}
            </div>
            {booking.studio.equipment && booking.studio.equipment.length > 0 && (
              <div className={`mt-6 pt-6 border-t ${borderPrimary}`}>
                <p className="text-xs font-medium tracking-wider uppercase mb-3">Equipment Available</p>
                <div className="flex flex-wrap gap-2">
                  {booking.studio.equipment.map((item, index) => (
                    <span key={index} className={`text-xs font-light tracking-wide px-3 py-1.5 rounded-full border ${theme === "dark" ? "bg-zinc-900 text-zinc-400 border-zinc-800" : "bg-gray-100 text-gray-600 border-gray-300"}`}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Details Card */}
          <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
            <h3 className="text-lg font-light tracking-tight mb-6">Session Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className={`w-4 h-4 ${textTertiary}`} strokeWidth={2} />
                  <p className="text-xs font-medium tracking-wider uppercase">Date</p>
                </div>
                <p className="text-lg font-light tracking-wide">{formatDate(booking.startTime)}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${textTertiary}`} strokeWidth={2} />
                  <p className="text-xs font-medium tracking-wider uppercase">Time</p>
                </div>
                <p className="text-lg font-light tracking-wide">{formatTime(booking.startTime, booking.endTime)}</p>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-medium tracking-wider uppercase">Duration</p>
                <p className="text-lg font-light tracking-wide">{duration} {duration === 1 ? 'hour' : 'hours'}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className={`w-4 h-4 ${textTertiary}`} strokeWidth={2} />
                  <p className="text-xs font-medium tracking-wider uppercase">Total Amount</p>
                </div>
                <p className="text-2xl font-light tracking-tight">{formatCurrency(booking.totalAmount)}</p>
              </div>
            </div>
          </div>

          {/* Customer & Owner Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
              <div className="flex items-center gap-2 mb-4">
                <User className={`w-4 h-4 ${textTertiary}`} strokeWidth={2} />
                <p className="text-xs font-medium tracking-wider uppercase">Artist</p>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-light tracking-tight">{booking.user.fullName || booking.user.username}</p>
                <p className="text-sm font-light tracking-wide">@{booking.user.username}</p>
              </div>
            </div>
            <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className={`w-4 h-4 ${textTertiary}`} strokeWidth={2} />
                <p className="text-xs font-medium tracking-wider uppercase">Studio Owner</p>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-light tracking-tight">{booking.studio.owner.user.fullName || booking.studio.owner.user.username}</p>
                <p className="text-sm font-light tracking-wide">@{booking.studio.owner.user.username}</p>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          {booking.notes && (
            <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
              <div className="flex items-center gap-2 mb-4">
                <FileText className={`w-4 h-4 ${textTertiary}`} strokeWidth={2} />
                <p className="text-xs font-medium tracking-wider uppercase">Notes</p>
              </div>
              <p className="text-sm font-light tracking-wide leading-relaxed">{booking.notes}</p>
            </div>
          )}

          {/* Metadata Card */}
          <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
            <h3 className="text-sm font-light tracking-tight mb-4">Booking Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-xs font-medium tracking-wider uppercase">Booking ID</p>
                <p className="text-sm font-light tracking-wide font-mono">{booking.id}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium tracking-wider uppercase">Created</p>
                <p className="text-sm font-light tracking-wide">{dayjs(booking.createdAt).format("MMM D, YYYY [at] h:mm A")}</p>
              </div>
              {booking.updatedAt && (
                <div className="space-y-2">
                  <p className="text-xs font-medium tracking-wider uppercase">Last Updated</p>
                  <p className="text-sm font-light tracking-wide">{dayjs(booking.updatedAt).format("MMM D, YYYY [at] h:mm A")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
            <div className="flex flex-wrap gap-3">
              {/* View Studio */}
              <button
                onClick={() => router.push(`/studios/${booking.studioId}`)}
                className={`flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 ${buttonPrimary} tracking-wide`}
              >
                <Building2 className="w-4 h-4" strokeWidth={2} />
                <span>View Studio</span>
              </button>

              {/* Message - available for confirmed/active */}
              {(booking.status === "CONFIRMED" || booking.status === "ACTIVE") && (
                <button
                  onClick={() => router.push(`/bookings/${booking.id}/chat`)}
                  className={`flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 ${theme === "dark" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-500/10 border-blue-500/20 text-blue-600"} hover:bg-blue-500/20 hover:border-blue-500/30 active:scale-[0.98] tracking-wide`}
                >
                  <MessageSquare className="w-4 h-4" strokeWidth={2} />
                  <span>Message</span>
                </button>
              )}

              {/* === PENDING STATUS === */}
              {booking.status === "PENDING" && (
                <>
                  {/* Customer: Pay to hold in escrow */}
                  {isCustomer && (
                    <button
                      onClick={handlePayBooking}
                      disabled={isUpdating}
                      className={`flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide ${theme === "dark" ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-purple-500/10 border-purple-500/20 text-purple-600"} hover:bg-purple-500/20 hover:border-purple-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : <DollarSign className="w-4 h-4" strokeWidth={2} />}
                      <span>Pay & Confirm</span>
                    </button>
                  )}

                  {/* Studio owner: Accept the booking */}
                  {isStudioOwner && (
                    <button
                      onClick={handleAcceptBooking}
                      disabled={isUpdating}
                      className={`flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide ${theme === "dark" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-green-500/10 border-green-500/20 text-green-600"} hover:bg-green-500/20 hover:border-green-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : <CheckCircle2 className="w-4 h-4" strokeWidth={2} />}
                      <span>Accept Booking</span>
                    </button>
                  )}

                  {/* Both: Cancel/Reject */}
                  {(isCustomer || isStudioOwner) && (
                    <button
                      onClick={handleCancelBooking}
                      disabled={isUpdating}
                      className={`flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide ${theme === "dark" ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-500/10 border-red-500/20 text-red-600"} hover:bg-red-500/20 hover:border-red-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : <Ban className="w-4 h-4" strokeWidth={2} />}
                      <span>{isStudioOwner ? 'Reject Booking' : 'Cancel Booking'}</span>
                    </button>
                  )}
                </>
              )}

              {/* === CONFIRMED STATUS === */}
              {booking.status === "CONFIRMED" && (
                <>
                  {/* Customer: Pay if not yet paid (owner accepted first) */}
                  {isCustomer && booking.paymentStatus === "UNPAID" && (
                    <button
                      onClick={handlePayBooking}
                      disabled={isUpdating}
                      className={`flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide ${theme === "dark" ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-purple-500/10 border-purple-500/20 text-purple-600"} hover:bg-purple-500/20 hover:border-purple-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : <DollarSign className="w-4 h-4" strokeWidth={2} />}
                      <span>Pay Now</span>
                    </button>
                  )}

                  {/* Studio owner: Start session with QR code */}
                  {isStudioOwner && booking.paymentStatus === "PAYMENT_HELD" && (
                    <>
                      {showQrPrompt ? (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            placeholder="Enter artist's QR code"
                            value={qrCodeInput}
                            onChange={(e) => setQrCodeInput(e.target.value)}
                            className={`flex-1 px-4 py-3 text-sm font-light rounded-lg border transition-all duration-200 ${theme === "dark" ? "bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600" : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"} tracking-wide focus:outline-none focus:ring-1 ${theme === "dark" ? "focus:ring-white" : "focus:ring-black"}`}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && qrCodeInput.trim()) {
                                handleCheckIn(qrCodeInput.trim());
                                setShowQrPrompt(false);
                                setQrCodeInput("");
                              }
                            }}
                          />
                          <button
                            onClick={() => { if (qrCodeInput.trim()) { handleCheckIn(qrCodeInput.trim()); setShowQrPrompt(false); setQrCodeInput(""); } }}
                            disabled={isUpdating || !qrCodeInput.trim()}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide ${theme === "dark" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-green-500/10 border-green-500/20 text-green-600"} hover:bg-green-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : <Check className="w-4 h-4" strokeWidth={2} />}
                            <span>Confirm</span>
                          </button>
                          <button onClick={() => { setShowQrPrompt(false); setQrCodeInput(""); }} className={`px-3 py-3 text-sm rounded-lg border transition-all duration-200 ${theme === "dark" ? "border-zinc-800 text-zinc-400 hover:text-white" : "border-gray-300 text-gray-600 hover:text-black"}`}>
                            <XCircle className="w-4 h-4" strokeWidth={2} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowQrPrompt(true)}
                          disabled={isUpdating}
                          className={`flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide ${theme === "dark" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-green-500/10 border-green-500/20 text-green-600"} hover:bg-green-500/20 hover:border-green-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <Play className="w-4 h-4" strokeWidth={2} />
                          <span>Start Session</span>
                        </button>
                      )}
                    </>
                  )}

                  {/* Cancel for unpaid confirmed */}
                  {booking.paymentStatus === "UNPAID" && (isCustomer || isStudioOwner) && (
                    <button
                      onClick={handleCancelBooking}
                      disabled={isUpdating}
                      className={`flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide ${theme === "dark" ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-500/10 border-red-500/20 text-red-600"} hover:bg-red-500/20 hover:border-red-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : <Ban className="w-4 h-4" strokeWidth={2} />}
                      <span>Cancel</span>
                    </button>
                  )}
                </>
              )}

              {/* === ACTIVE STATUS === */}
              {booking.status === "ACTIVE" && (
                <>
                  {/* Artist: Confirm presence with code */}
                  {isCustomer && !booking.bookerConfirmedCheckIn && (
                    <>
                      {showConfirmPrompt ? (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            placeholder="Enter 6-digit code"
                            value={confirmCodeInput}
                            onChange={(e) => setConfirmCodeInput(e.target.value.toUpperCase())}
                            maxLength={6}
                            className={`flex-1 px-4 py-3 text-sm font-mono font-light rounded-lg border transition-all duration-200 ${theme === "dark" ? "bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600" : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"} tracking-widest text-center focus:outline-none focus:ring-1 ${theme === "dark" ? "focus:ring-white" : "focus:ring-black"}`}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && confirmCodeInput.trim()) {
                                handleConfirmCheckIn(confirmCodeInput.trim());
                                setShowConfirmPrompt(false);
                                setConfirmCodeInput("");
                              }
                            }}
                          />
                          <button
                            onClick={() => { if (confirmCodeInput.trim()) { handleConfirmCheckIn(confirmCodeInput.trim()); setShowConfirmPrompt(false); setConfirmCodeInput(""); } }}
                            disabled={isUpdating || !confirmCodeInput.trim()}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide ${theme === "dark" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-green-500/10 border-green-500/20 text-green-600"} hover:bg-green-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : <Check className="w-4 h-4" strokeWidth={2} />}
                            <span>Verify</span>
                          </button>
                          <button onClick={() => { setShowConfirmPrompt(false); setConfirmCodeInput(""); }} className={`px-3 py-3 text-sm rounded-lg border transition-all duration-200 ${theme === "dark" ? "border-zinc-800 text-zinc-400 hover:text-white" : "border-gray-300 text-gray-600 hover:text-black"}`}>
                            <XCircle className="w-4 h-4" strokeWidth={2} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowConfirmPrompt(true)}
                          className={`flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide ${theme === "dark" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" : "bg-yellow-500/10 border-yellow-500/20 text-yellow-600"} hover:bg-yellow-500/20 hover:border-yellow-500/30 active:scale-[0.98]`}
                        >
                          <Shield className="w-4 h-4" strokeWidth={2} />
                          <span>Confirm Presence</span>
                        </button>
                      )}
                    </>
                  )}

                  {/* Confirmed check-in badge */}
                  {isCustomer && booking.bookerConfirmedCheckIn && (
                    <div className="flex items-center gap-2 px-4 py-3 text-sm rounded-lg border bg-green-500/10 border-green-500/20 text-green-400">
                      <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                      <span>Presence Confirmed</span>
                    </div>
                  )}

                  {/* Both: End Session */}
                  {(isStudioOwner || isCustomer) && (
                    <button
                      onClick={handleCheckOut}
                      disabled={isUpdating}
                      className={`flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide ${theme === "dark" ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-500/10 border-red-500/20 text-red-600"} hover:bg-red-500/20 hover:border-red-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : <Square className="w-4 h-4" strokeWidth={2} />}
                      <span>End Session</span>
                    </button>
                  )}
                </>
              )}

              {/* === COMPLETED STATUS === */}
              {booking.status === "COMPLETED" && (
                <>
                  {/* Artist: Approve payment release */}
                  {isCustomer && booking.paymentStatus === "PAYMENT_HELD" && (
                    <button
                      onClick={handleReleasePayment}
                      disabled={isUpdating}
                      className={`flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide ${theme === "dark" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-green-500/10 border-green-500/20 text-green-600"} hover:bg-green-500/20 hover:border-green-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : <DollarSign className="w-4 h-4" strokeWidth={2} />}
                      <span>Approve Payment</span>
                    </button>
                  )}

                  {/* Studio owner: Waiting for artist approval */}
                  {isStudioOwner && booking.paymentStatus === "PAYMENT_HELD" && (
                    <div className="flex items-center gap-2 px-4 py-3 text-sm rounded-lg border bg-yellow-500/10 border-yellow-500/20 text-yellow-400">
                      <Clock className="w-4 h-4" strokeWidth={2} />
                      <span>Awaiting artist payment approval</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}