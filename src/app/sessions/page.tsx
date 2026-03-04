"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActiveSessions, useCheckIn, useCheckOut, useReleasePayment } from "@/hooks/useBookings";
import { useTheme } from "@/providers/ThemeProvider";
import { createBrowserClient } from "@supabase/ssr";
import {
  Radio,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Play,
  Square,
  Timer,
  User,
  Building2,
  QrCode,
  Banknote,
  ArrowRight,
  RefreshCw,
  Zap,
} from "lucide-react";
import dayjs from "dayjs";

export default function SessionsDashboardPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { data, isLoading, error, refetch } = useActiveSessions(true);
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const releasePayment = useReleasePayment();
  const [now, setNow] = useState(new Date());

  // Live clock - update every second for real-time session timers
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Theme styles (matching bookings page patterns)
  const textPrimary = theme === "dark" ? "text-white" : "text-gray-900";
  const textSecondary = theme === "dark" ? "text-zinc-400" : "text-gray-600";
  const textTertiary = theme === "dark" ? "text-zinc-500" : "text-gray-500";
  const bgPrimary = theme === "dark" ? "bg-black" : "bg-gray-50";
  const bgCard = theme === "dark" ? "bg-zinc-900/40" : "bg-white";
  const borderPrimary = theme === "dark" ? "border-zinc-800" : "border-gray-300";
  const buttonPrimary = theme === "dark"
    ? "bg-white border-white text-black hover:bg-zinc-100 active:scale-[0.98]"
    : "bg-black border-black text-white hover:bg-gray-800 active:scale-[0.98]";

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  const handleCheckIn = async (bookingId: string) => {
    try {
      await checkIn.mutateAsync({ bookingId });
    } catch (err: any) {
      alert(err.message || "Failed to check in");
    }
  };

  const handleCheckOut = async (bookingId: string) => {
    if (!confirm("Are you sure you want to end this session?")) return;
    try {
      await checkOut.mutateAsync(bookingId);
    } catch (err: any) {
      alert(err.message || "Failed to check out");
    }
  };

  const handleReleasePayment = async (bookingId: string) => {
    if (!confirm("Release payment to your account? This cannot be undone.")) return;
    try {
      await releasePayment.mutateAsync(bookingId);
    } catch (err: any) {
      alert(err.message || "Failed to release payment");
    }
  };

  const sessions = data?.sessions || [];
  const summary = data?.summary || { active: 0, upcoming: 0, overtime: 0, total: 0 };

  return (
    <div className={`min-h-screen p-6 transition-colors duration-200 ${bgPrimary} ${textPrimary}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-8">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              theme === "dark" ? "bg-white" : "bg-black"
            }`}>
              <Radio className={`w-5 h-5 ${theme === "dark" ? "text-black" : "text-white"}`} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-light tracking-tight">Sessions</h1>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-4xl font-light tracking-tight">Live Dashboard</h2>
              <p className={`text-base font-light tracking-wide ${textSecondary}`}>
                Manage active and upcoming studio sessions in real-time
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className={`p-3 rounded-lg border transition-all duration-200 ${borderPrimary} ${textTertiary} hover:${textPrimary}`}
            >
              <RefreshCw className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-4 h-4 text-green-400" strokeWidth={2.5} />
              <p className={`text-sm font-light tracking-wide ${textSecondary}`}>Active Now</p>
            </div>
            <p className="text-3xl font-light tracking-tight text-green-400">{summary.active}</p>
          </div>

          <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-4 h-4 text-blue-400" strokeWidth={2.5} />
              <p className={`text-sm font-light tracking-wide ${textSecondary}`}>Upcoming (24h)</p>
            </div>
            <p className="text-3xl font-light tracking-tight text-blue-400">{summary.upcoming}</p>
          </div>

          <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" strokeWidth={2.5} />
              <p className={`text-sm font-light tracking-wide ${textSecondary}`}>Overtime</p>
            </div>
            <p className="text-3xl font-light tracking-tight text-orange-400">{summary.overtime}</p>
          </div>

          <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
            <div className="flex items-center gap-3 mb-2">
              <Timer className="w-4 h-4" strokeWidth={2.5} />
              <p className={`text-sm font-light tracking-wide ${textSecondary}`}>Total</p>
            </div>
            <p className="text-3xl font-light tracking-tight">{summary.total}</p>
          </div>
        </div>

        {/* Sessions List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="space-y-4 text-center">
              <Loader2 className={`w-8 h-8 animate-spin mx-auto`} strokeWidth={2.5} />
              <p className={`text-sm font-light tracking-wide ${textSecondary}`}>Loading sessions...</p>
            </div>
          </div>
        ) : error ? (
          <div className={`p-6 rounded-xl border ${theme === "dark" ? "border-red-500/50 bg-red-500/10" : "border-red-500/30 bg-red-500/5"}`}>
            <p className="text-sm font-light tracking-wide">Failed to load sessions. Please try again.</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className={`p-12 rounded-xl text-center border ${borderPrimary} ${bgCard}`}>
            <Radio className={`w-16 h-16 ${theme === "dark" ? "text-zinc-700" : "text-gray-300"} mx-auto mb-4`} strokeWidth={1.5} />
            <h3 className="text-lg font-light tracking-tight mb-2">No active sessions</h3>
            <p className={`text-sm font-light tracking-wide ${textSecondary} mb-6`}>
              Sessions will appear here when artists check in for their bookings
            </p>
            <button
              onClick={() => router.push("/bookings")}
              className={`inline-flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 ${buttonPrimary} tracking-wide`}
            >
              <span>View All Bookings</span>
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session: any) => {
              const info = session.sessionInfo;
              const isActive = info.isActive;
              const isOvertime = info.isOvertime;
              const hourlyRate = parseFloat(session.studio.hourlyRate || "0");

              // Calculate live overtime cost
              const liveOvertimeMinutes = isOvertime ? info.overtimeMinutes : 0;
              const liveOvertimeCost = (liveOvertimeMinutes / 60) * hourlyRate;
              const totalWithOvertime = parseFloat(session.totalAmount) + liveOvertimeCost;

              // Progress bar percentage
              const progressPct = isActive
                ? Math.min(100, (info.elapsedMinutes / info.totalMinutes) * 100)
                : 0;

              return (
                <div
                  key={session.id}
                  className={`
                    p-6 rounded-xl border transition-all duration-200
                    ${isOvertime
                      ? theme === "dark" ? "border-orange-500/30 bg-orange-500/5" : "border-orange-500/20 bg-orange-50"
                      : isActive
                      ? theme === "dark" ? "border-green-500/30 bg-green-500/5" : "border-green-500/20 bg-green-50"
                      : `${borderPrimary} ${bgCard}`
                    }
                  `}
                >
                  {/* Session Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {/* Status indicator */}
                      <div className={`
                        relative w-12 h-12 rounded-lg flex items-center justify-center
                        ${isOvertime
                          ? "bg-orange-500/20"
                          : isActive
                          ? "bg-green-500/20"
                          : theme === "dark" ? "bg-zinc-800" : "bg-gray-100"
                        }
                      `}>
                        {isActive && (
                          <span className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full animate-pulse ${isOvertime ? "bg-orange-400" : "bg-green-400"}`} />
                        )}
                        <Building2 className={`w-5 h-5 ${isOvertime ? "text-orange-400" : isActive ? "text-green-400" : textSecondary}`} strokeWidth={2} />
                      </div>

                      <div>
                        <h3 className="text-lg font-light tracking-tight">{session.studio.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <User className={`w-3.5 h-3.5 ${textTertiary}`} strokeWidth={2} />
                          <span className={`text-sm font-light ${textSecondary}`}>
                            {session.user.fullName || session.user.username}
                          </span>
                          <span className={`
                            text-xs font-medium px-2 py-0.5 rounded-full border
                            ${isOvertime
                              ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                              : isActive
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            }
                          `}>
                            {isOvertime ? "OVERTIME" : isActive ? "IN SESSION" : `Starts in ${formatMinutes(info.startsIn)}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Live timer */}
                    {isActive && (
                      <div className="text-right">
                        <p className={`text-2xl font-mono font-light tracking-tight ${isOvertime ? "text-orange-400" : "text-green-400"}`}>
                          {isOvertime ? `+${formatMinutes(liveOvertimeMinutes)}` : formatMinutes(info.timeRemaining)}
                        </p>
                        <p className={`text-xs font-light ${textTertiary}`}>
                          {isOvertime ? "overtime" : "remaining"}
                        </p>
                      </div>
                    )}

                    {!isActive && info.startsIn !== null && (
                      <div className="text-right">
                        <p className="text-2xl font-mono font-light tracking-tight text-blue-400">
                          {formatMinutes(info.startsIn)}
                        </p>
                        <p className={`text-xs font-light ${textTertiary}`}>until start</p>
                      </div>
                    )}
                  </div>

                  {/* Progress bar for active sessions */}
                  {isActive && (
                    <div className="mb-4">
                      <div className={`h-1.5 rounded-full ${theme === "dark" ? "bg-zinc-800" : "bg-gray-200"} overflow-hidden`}>
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${isOvertime ? "bg-orange-400" : "bg-green-400"}`}
                          style={{ width: `${Math.min(progressPct, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className={`text-xs font-light ${textTertiary}`}>
                          {dayjs(session.checkedInAt || session.startTime).format("h:mm A")}
                        </span>
                        <span className={`text-xs font-light ${textTertiary}`}>
                          {info.elapsedMinutes}m / {info.totalMinutes}m
                        </span>
                        <span className={`text-xs font-light ${textTertiary}`}>
                          {dayjs(session.endTime).format("h:mm A")}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Session details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className={`text-xs font-medium tracking-wider uppercase ${textTertiary}`}>Scheduled</p>
                      <p className="text-sm font-light mt-1">
                        {dayjs(session.startTime).format("h:mm A")} - {dayjs(session.endTime).format("h:mm A")}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs font-medium tracking-wider uppercase ${textTertiary}`}>Duration</p>
                      <p className="text-sm font-light mt-1">{formatMinutes(info.totalMinutes)}</p>
                    </div>
                    <div>
                      <p className={`text-xs font-medium tracking-wider uppercase ${textTertiary}`}>Base Amount</p>
                      <p className="text-sm font-light mt-1">{formatCurrency(parseFloat(session.totalAmount))}</p>
                    </div>
                    <div>
                      <p className={`text-xs font-medium tracking-wider uppercase ${textTertiary}`}>
                        {isOvertime ? "Total (w/ overtime)" : "Payment"}
                      </p>
                      <p className={`text-sm font-light mt-1 ${isOvertime ? "text-orange-400" : ""}`}>
                        {isOvertime ? formatCurrency(totalWithOvertime) : formatCurrency(parseFloat(session.totalAmount))}
                      </p>
                    </div>
                  </div>

                  {/* QR Code hint */}
                  {session.qrCode && !isActive && (
                    <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg ${theme === "dark" ? "bg-zinc-800/50" : "bg-gray-100"}`}>
                      <QrCode className={`w-4 h-4 ${textTertiary}`} strokeWidth={2} />
                      <span className={`text-xs font-light ${textSecondary}`}>
                        QR Code: {session.qrCode}
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className={`flex flex-wrap gap-3 pt-4 border-t ${borderPrimary}`}>
                    {/* Check In - for upcoming/confirmed sessions */}
                    {session.status === "CONFIRMED" && (
                      <button
                        onClick={() => handleCheckIn(session.id)}
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
                        {checkIn.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                        ) : (
                          <Play className="w-4 h-4" strokeWidth={2} />
                        )}
                        <span>Start Session</span>
                      </button>
                    )}

                    {/* Check Out - for active sessions */}
                    {session.status === "ACTIVE" && (
                      <button
                        onClick={() => handleCheckOut(session.id)}
                        disabled={checkOut.isPending}
                        className={`
                          flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                          ${isOvertime
                            ? theme === "dark"
                              ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
                              : "bg-orange-500/10 border-orange-500/20 text-orange-600"
                            : theme === "dark"
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

                    {/* View Booking Details */}
                    <button
                      onClick={() => router.push(`/bookings/show/${session.id}`)}
                      className={`
                        flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                        ${buttonPrimary}
                      `}
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
