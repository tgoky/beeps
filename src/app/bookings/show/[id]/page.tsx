"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/providers/ThemeProvider";
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
  Edit,
  Ban,
  MessageSquare,
} from "lucide-react";
import dayjs from "dayjs";

interface BookingDetails {
  id: string;
  studioId: string;
  userId: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  totalAmount: number;
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

export default function BookingShowPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { theme } = useTheme();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/bookings/${params.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch booking");
        }

        const data = await response.json();
        setBooking(data.booking);
      } catch (err: any) {
        setError(err.message || "Failed to load booking");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooking();
  }, [params.id]);

  const handleUpdateStatus = async (status: string) => {
    if (!booking) return;

    try {
      setIsUpdating(true);
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update booking");
      }

      const data = await response.json();
      setBooking(data.booking);
    } catch (err: any) {
      alert(err.message || "Failed to update booking");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking || !confirm("Are you sure you want to cancel this booking?")) return;

    try {
      setIsUpdating(true);
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel booking");
      }

      router.push("/bookings");
    } catch (err: any) {
      alert(err.message || "Failed to cancel booking");
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
        return <CheckCircle2 className="w-5 h-5 text-green-400" strokeWidth={2.5} />;
      case "COMPLETED":
        return <CheckCircle2 className="w-5 h-5 text-blue-400" strokeWidth={2.5} />;
      case "PENDING":
        return <AlertCircle className="w-5 h-5 text-yellow-400" strokeWidth={2.5} />;
      case "CANCELLED":
        return <XCircle className="w-5 h-5 text-red-400" strokeWidth={2.5} />;
      default:
        return <AlertCircle className={`w-5 h-5 ${theme === "dark" ? "text-zinc-400" : "text-gray-400"}`} strokeWidth={2.5} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
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
        return theme === "dark"
          ? "bg-red-500/10 text-red-400 border-red-500/20"
          : "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return theme === "dark"
          ? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
          : "bg-gray-500/10 text-gray-600 border-gray-500/20";
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

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = dayjs(startTime);
    const end = dayjs(endTime);
    const hours = end.diff(start, 'hour', true);
    return hours;
  };

  // Theme-based text colors
  const textPrimary = theme === "dark" ? "text-white" : "text-gray-900";
  const textSecondary = theme === "dark" ? "text-zinc-400" : "text-gray-600";
  const textTertiary = theme === "dark" ? "text-zinc-500" : "text-gray-500";

  // Theme-based background colors
  const bgPrimary = theme === "dark" ? "bg-black" : "bg-gray-50";
  const bgCard = theme === "dark" ? "bg-zinc-900/40" : "bg-white";

  // Theme-based border colors
  const borderPrimary = theme === "dark" ? "border-zinc-800" : "border-gray-300";
  const borderSecondary = theme === "dark" ? "border-zinc-700" : "border-gray-400";

  // Theme-based button styles
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
              <p className="text-sm font-light tracking-wide">
                Loading booking details...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className={`min-h-screen p-6 transition-colors duration-200 ${bgPrimary} ${textPrimary}`}>
        <div className="max-w-4xl mx-auto">
          <div className={`p-12 rounded-xl text-center border ${borderPrimary} ${bgCard}`}>
            <XCircle className={`w-16 h-16 ${theme === "dark" ? "text-zinc-700" : "text-gray-300"} mx-auto mb-4`} strokeWidth={1.5} />
            <h3 className="text-lg font-light tracking-tight mb-2">
              Booking not found
            </h3>
            <p className="text-sm font-light tracking-wide mb-6">
              {error || "The booking you're looking for doesn't exist"}
            </p>
            <button
              onClick={() => router.push('/bookings')}
              className={`
                inline-flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200
                ${buttonPrimary} tracking-wide active:scale-[0.98]
              `}
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2} />
              <span>Back to Bookings</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const duration = calculateDuration(booking.startTime, booking.endTime);

  return (
    <div className={`min-h-screen p-6 transition-colors duration-200 ${bgPrimary} ${textPrimary}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/bookings')}
            className={`
              inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-all duration-200 mb-6
              ${buttonSecondary} tracking-wide active:scale-[0.98]
            `}
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            <span>Back to Bookings</span>
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              theme === "dark" ? "bg-white" : "bg-black"
            }`}>
              <Calendar className={`w-5 h-5 ${theme === "dark" ? "text-black" : "text-white"}`} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-light tracking-tight">
              Booking Details
            </h1>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className={`
              text-sm font-medium tracking-wide
              px-4 py-2 rounded-full border flex items-center gap-2
              ${getStatusColor(booking.status)}
            `}>
              {getStatusIcon(booking.status)}
              {booking.status}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Studio Information Card */}
          <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`
                  p-3 rounded-lg border ${borderPrimary} ${theme === "dark" ? "bg-black" : "bg-gray-100"}
                  flex items-center justify-center
                `}>
                  <Building2 className={`w-5 h-5 ${theme === "dark" ? "text-white" : "text-gray-900"}`} strokeWidth={2} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-light tracking-tight">
                    {booking.studio.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <MapPin className={`w-4 h-4 ${textTertiary}`} strokeWidth={2} />
                    <p className="text-sm font-light tracking-wide">
                      {booking.studio.location}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-xs font-medium tracking-wider uppercase">
                  Hourly Rate
                </p>
                <p className="text-lg font-light tracking-wide">
                  {formatCurrency(booking.studio.hourlyRate)}/hr
                </p>
              </div>

              {booking.studio.capacity && (
                <div className="space-y-3">
                  <p className="text-xs font-medium tracking-wider uppercase">
                    Capacity
                  </p>
                  <p className="text-sm font-light tracking-wide">
                    {booking.studio.capacity}
                  </p>
                </div>
              )}
            </div>

            {booking.studio.equipment && booking.studio.equipment.length > 0 && (
              <div className="mt-6 pt-6 border-t ${borderPrimary}">
                <p className="text-xs font-medium tracking-wider uppercase mb-3">
                  Equipment Available
                </p>
                <div className="flex flex-wrap gap-2">
                  {booking.studio.equipment.map((item, index) => (
                    <span
                      key={index}
                      className={`
                        text-xs font-light tracking-wide
                        px-3 py-1.5 rounded-full border
                        ${theme === "dark" ? "bg-zinc-900 text-zinc-400 border-zinc-800" : "bg-gray-100 text-gray-600 border-gray-300"}
                      `}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Details Card */}
          <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
            <h3 className="text-lg font-light tracking-tight mb-6">
              Session Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className={`w-4 h-4 ${textTertiary}`} strokeWidth={2} />
                  <p className="text-xs font-medium tracking-wider uppercase">
                    Date
                  </p>
                </div>
                <p className="text-lg font-light tracking-wide">
                  {formatDate(booking.startTime)}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${textTertiary}`} strokeWidth={2} />
                  <p className="text-xs font-medium tracking-wider uppercase">
                    Time
                  </p>
                </div>
                <p className="text-lg font-light tracking-wide">
                  {formatTime(booking.startTime, booking.endTime)}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-medium tracking-wider uppercase">
                  Duration
                </p>
                <p className="text-lg font-light tracking-wide">
                  {duration} {duration === 1 ? 'hour' : 'hours'}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className={`w-4 h-4 ${textTertiary}`} strokeWidth={2} />
                  <p className="text-xs font-medium tracking-wider uppercase">
                    Total Amount
                  </p>
                </div>
                <p className="text-2xl font-light tracking-tight">
                  {formatCurrency(booking.totalAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* Customer & Owner Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Card */}
            <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
              <div className="flex items-center gap-2 mb-4">
                <User className={`w-4 h-4 ${textTertiary}`} strokeWidth={2} />
                <p className="text-xs font-medium tracking-wider uppercase">
                  Customer
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-light tracking-tight">
                  {booking.user.fullName || booking.user.username}
                </p>
                <p className="text-sm font-light tracking-wide">
                  @{booking.user.username}
                </p>
              </div>
            </div>

            {/* Studio Owner Card */}
            <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className={`w-4 h-4 ${textTertiary}`} strokeWidth={2} />
                <p className="text-xs font-medium tracking-wider uppercase">
                  Studio Owner
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-light tracking-tight">
                  {booking.studio.owner.user.fullName || booking.studio.owner.user.username}
                </p>
                <p className="text-sm font-light tracking-wide">
                  @{booking.studio.owner.user.username}
                </p>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          {booking.notes && (
            <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
              <div className="flex items-center gap-2 mb-4">
                <FileText className={`w-4 h-4 ${textTertiary}`} strokeWidth={2} />
                <p className="text-xs font-medium tracking-wider uppercase">
                  Notes
                </p>
              </div>
              <p className="text-sm font-light tracking-wide leading-relaxed">
                {booking.notes}
              </p>
            </div>
          )}

          {/* Metadata Card */}
          <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
            <h3 className="text-sm font-light tracking-tight mb-4">
              Booking Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-xs font-medium tracking-wider uppercase">
                  Booking ID
                </p>
                <p className="text-sm font-light tracking-wide font-mono">
                  {booking.id}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium tracking-wider uppercase">
                  Created
                </p>
                <p className="text-sm font-light tracking-wide">
                  {dayjs(booking.createdAt).format("MMM D, YYYY [at] h:mm A")}
                </p>
              </div>

              {booking.updatedAt && (
                <div className="space-y-2">
                  <p className="text-xs font-medium tracking-wider uppercase">
                    Last Updated
                  </p>
                  <p className="text-sm font-light tracking-wide">
                    {dayjs(booking.updatedAt).format("MMM D, YYYY [at] h:mm A")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push(`/studios/${booking.studioId}`)}
                className={`
                  flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200
                  ${buttonPrimary} tracking-wide flex-1 justify-center
                `}
              >
                <Building2 className="w-4 h-4" strokeWidth={2} />
                <span>View Studio</span>
              </button>

              {booking.status === "CONFIRMED" && (
                <button
                  onClick={() => router.push(`/bookings/${booking.id}/chat`)}
                  className={`
                    flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200
                    ${theme === "dark"
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      : "bg-blue-500/10 border-blue-500/20 text-blue-600"
                    }
                    hover:bg-blue-500/20 hover:border-blue-500/30 active:scale-[0.98] tracking-wide
                  `}
                >
                  <MessageSquare className="w-4 h-4" strokeWidth={2} />
                  <span>Message</span>
                </button>
              )}

              {booking.status === "PENDING" && (
                <>
                  <button
                    onClick={() => handleUpdateStatus("CONFIRMED")}
                    disabled={isUpdating}
                    className={`
                      flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                      ${theme === "dark"
                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                        : "bg-green-500/10 border-green-500/20 text-green-600"
                      }
                      hover:bg-green-500/20 hover:border-green-500/30 active:scale-[0.98]
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                        <span>Confirming...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                        <span>Confirm</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCancelBooking}
                    disabled={isUpdating}
                    className={`
                      flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
                      ${theme === "dark"
                        ? "bg-red-500/10 border-red-500/20 text-red-400"
                        : "bg-red-500/10 border-red-500/20 text-red-600"
                      }
                      hover:bg-red-500/20 hover:border-red-500/30 active:scale-[0.98]
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                        <span>Cancelling...</span>
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4" strokeWidth={2} />
                        <span>Cancel Booking</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
