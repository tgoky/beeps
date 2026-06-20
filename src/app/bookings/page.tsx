"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  useAllBookings, useUpdateBookingStatus, useCancelBooking, 
  useCheckIn, useCheckOut, usePayBooking, useReleasePayment, useConfirmCheckIn 
} from "@/hooks/useBookings";
import { createBrowserClient } from "@supabase/ssr";
import { useUserBySupabaseId } from "@/hooks/api/useUserData";
import {
  Calendar, Clock, CheckCircle2, XCircle,
  Music2, Briefcase, Building2, Guitar,
  Zap, Check, Play, Square, MessageCircle, Loader2,
  CheckCheck, X, Lock, Wallet, CreditCard, MapPin, Download
} from "lucide-react";
import dayjs from "dayjs";

type BookingType = "studio" | "service" | "equipment" | "beat";
type ViewMode = "customer" | "provider";
type StatusFilter = "all" | "pending" | "confirmed" | "active" | "cancelled" | "completed";

const Tooltip = ({ text }: { text: string }) => (
  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-zinc-800 text-zinc-200 text-xs rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
    {text}
    <svg className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 text-zinc-800" viewBox="0 0 10 10">
      <polygon points="0,0 10,0 5,5" fill="currentColor" />
    </svg>
  </span>
);

export default function BookingsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("customer");
  const [bookingType, setBookingType] = useState<BookingType>("studio");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [updatingServiceRequest, setUpdatingServiceRequest] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  // Smart Role Routing State
  const [hasSetDefaults, setHasSetDefaults] = useState(false);

  // Specific States
  const [qrCodeInput, setQrCodeInput] = useState<string>("");
  const [showQrPrompt, setShowQrPrompt] = useState<string | null>(null);
  const [confirmCodeInput, setConfirmCodeInput] = useState<string>("");
  const [showConfirmPrompt, setShowConfirmPrompt] = useState<string | null>(null);
  const [deliveryCodeInput, setDeliveryCodeInput] = useState<string>("");
  const [showDeliveryPrompt, setShowDeliveryPrompt] = useState<string | null>(null);

  const { data: bookingsData, isLoading, error } = useAllBookings(viewMode);
  
  const updateStatus = useUpdateBookingStatus();
  const cancelBooking = useCancelBooking();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const payBooking = usePayBooking();
  const releasePayment = useReleasePayment();
  const confirmCheckIn = useConfirmCheckIn();

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

  // SMART UI ROUTING: Automatically select the right tab based on what the user does
  useEffect(() => {
    if (currentUser && !hasSetDefaults) {
      if (currentUser.primaryRole === "PRODUCER") {
        setViewMode("provider");
        setBookingType("service");
      } else if (currentUser.primaryRole === "STUDIO_OWNER") {
        setViewMode("provider");
        setBookingType("studio");
      }
      setHasSetDefaults(true);
    }
  }, [currentUser, hasSetDefaults]);

  const allBookings = bookingsData
    ? [
        ...bookingsData.studioBookings,
        ...bookingsData.equipmentRentals,
        ...bookingsData.serviceRequests,
        ...bookingsData.beatPurchases,
      ]
    : [];

  const typeMap = { 
    studio: "STUDIO_BOOKING", 
    equipment: "EQUIPMENT_RENTAL", 
    service: "SERVICE_REQUEST", 
    beat: "BEAT_PURCHASE" 
  };

  const filteredBookings = allBookings.filter((booking) => {
    if (booking.type !== typeMap[bookingType]) return false;
    if (statusFilter !== "all") {
      const bookingStatus = (booking as any).status?.toLowerCase();
      if (bookingStatus !== statusFilter) return false;
    }
    return true;
  });

  const currentCategoryBookings = allBookings.filter(b => b.type === typeMap[bookingType]);
  const stats = {
    total: currentCategoryBookings.length,
    pending: currentCategoryBookings.filter((b: any) => b.status === "PENDING").length,
    confirmed: currentCategoryBookings.filter((b: any) => b.status === "CONFIRMED" || b.status === "ACCEPTED").length,
    active: currentCategoryBookings.filter((b: any) => b.status === "ACTIVE" || b.status === "IN_PROGRESS").length,
    completed: currentCategoryBookings.filter((b: any) => b.status === "COMPLETED" || b.status === "DELIVERED").length,
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING": 
        return (
          <div className="group relative flex items-center gap-2 px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium w-max cursor-help">
            <Clock className="w-3.5 h-3.5" /> Pending <Tooltip text="Awaiting provider confirmation" />
          </div>
        );
      case "CONFIRMED":
      case "ACCEPTED": 
        return (
          <div className="group relative flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium w-max cursor-help">
            <CheckCircle2 className="w-3.5 h-3.5" /> {status === "ACCEPTED" ? "Accepted" : "Confirmed"} <Tooltip text="Ready to proceed" />
          </div>
        );
      case "ACTIVE": 
      case "IN_PROGRESS":
        return (
          <div className="group relative flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium w-max cursor-help">
            <Zap className="w-3.5 h-3.5 fill-purple-400" /> In Progress <Tooltip text="Currently ongoing" />
          </div>
        );
      case "DELIVERED":
        return (
          <div className="group relative flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium w-max cursor-help">
            <Download className="w-3.5 h-3.5" /> Delivered <Tooltip text="Awaiting client approval to release funds" />
          </div>
        );
      case "COMPLETED": 
        return (
          <div className="group relative flex items-center gap-2 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium w-max cursor-help">
            <CheckCheck className="w-3.5 h-3.5" /> Completed <Tooltip text="Finished successfully" />
          </div>
        );
      case "CANCELLED":
      case "REJECTED": 
        return (
          <div className="group relative flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-800/50 text-zinc-400 text-xs font-medium w-max cursor-help border border-zinc-700">
            <XCircle className="w-3.5 h-3.5" /> {status === "REJECTED" ? "Rejected" : "Cancelled"} <Tooltip text="Cancelled or rejected" />
          </div>
        );
      default: 
        return <div className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs font-medium w-max">Unknown</div>;
    }
  };

  const getPaymentBadge = (status: string) => {
    if (status === "PAYMENT_HELD") {
      return (
        <div className="group relative flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium w-max cursor-help border border-emerald-500/20">
          <Lock className="w-3.5 h-3.5" /> Escrow Secured <Tooltip text="Funds held securely until completion" />
        </div>
      );
    }
    if (status === "PAYMENT_RELEASED") {
      return (
        <div className="group relative flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-800/50 text-zinc-400 text-xs font-medium w-max cursor-help border border-zinc-700/50">
          <Wallet className="w-3.5 h-3.5" /> Paid Out <Tooltip text="Funds successfully released" />
        </div>
      );
    }
    return (
      <div className="group relative flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-800/50 text-zinc-400 text-xs font-medium w-max cursor-help border border-zinc-700/50">
        <CreditCard className="w-3.5 h-3.5" /> Logged <Tooltip text="Payment logged but not captured" />
      </div>
    );
  };

  const formatDate = (dateString: string) => dayjs(dateString).format("MMM D, YYYY");
  const formatTime = (startTime: string, endTime?: string) => {
    if (!endTime) return dayjs(startTime).format("h:mm A");
    return `${dayjs(startTime).format("h:mm A")} - ${dayjs(endTime).format("h:mm A")}`;
  };
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const handleUpdateServiceRequest = async (requestId: string, status: string) => {
    try {
      setUpdatingServiceRequest(true);
      const res = await fetch(`/api/service-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to update");
      window.location.reload();
    } catch (error: any) {
      alert(error.message || "Failed to update service request");
      setUpdatingServiceRequest(false);
    }
  };

  const handleServiceLifecycleAction = async (requestId: string, action: "pay" | "deliver" | "confirm-delivery", payload?: any) => {
    try {
      setProcessingAction(requestId + action);
      const res = await fetch(`/api/service-requests/${requestId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload ? JSON.stringify(payload) : undefined,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action}`);
      
      if (action === "pay" && data.url) {
        window.location.href = data.url; 
      } else {
        window.location.reload();
      }
    } catch (error: any) {
      alert(error.message || `Failed to ${action}`);
    } finally {
      setProcessingAction(null);
    }
  };

  const actionBtnClass = "p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0 outline-none disabled:opacity-50";
  const payBtnClass = "flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black font-medium text-sm hover:bg-zinc-200 transition-colors shrink-0 outline-none disabled:opacity-50 border border-transparent";
  const outlineBtnClass = "flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white font-medium text-sm hover:bg-zinc-800 transition-colors shrink-0 outline-none disabled:opacity-50 border border-zinc-700";
  const cancelBtnClass = "flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 font-medium text-sm hover:bg-red-500/20 transition-colors shrink-0 outline-none disabled:opacity-50";

  return (
    <div className="h-full overflow-y-auto bg-[#030303] text-white">
      <div className="max-w-[1600px] mx-auto p-6 md:p-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Orders & Bookings</h1>
            <p className="text-sm text-zinc-400">Manage your distinct marketplace interactions.</p>
          </div>
          
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("customer")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                viewMode === "customer" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Buying
            </button>
            <button
              onClick={() => setViewMode("provider")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                viewMode === "provider" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Selling
            </button>
          </div>
        </div>

        <div className="flex overflow-x-auto border-b border-zinc-800 mb-8 scrollbar-hide">
          <button 
            onClick={() => { setBookingType("studio"); setStatusFilter("all"); }}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${bookingType === "studio" ? "border-white text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
          >
            <Building2 className="w-4 h-4" /> Studio Sessions
          </button>
          <button 
            onClick={() => { setBookingType("service"); setStatusFilter("all"); }}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${bookingType === "service" ? "border-purple-400 text-purple-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
          >
            <Briefcase className="w-4 h-4" /> Producer Services
          </button>
          <button 
            onClick={() => { setBookingType("equipment"); setStatusFilter("all"); }}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${bookingType === "equipment" ? "border-orange-400 text-orange-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
          >
            <Guitar className="w-4 h-4" /> Equipment Rentals
          </button>
          <button 
            onClick={() => { setBookingType("beat"); setStatusFilter("all"); }}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${bookingType === "beat" ? "border-green-400 text-green-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
          >
            <Music2 className="w-4 h-4" /> Beat Purchases
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          <button onClick={() => setStatusFilter("all")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${statusFilter === "all" ? "bg-white text-black" : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200"}`}>
            All <span className={`px-1.5 py-0.5 rounded-full text-xs ${statusFilter === "all" ? "bg-black/10" : "bg-zinc-800"}`}>{stats.total}</span>
          </button>
          {stats.active > 0 && (
            <button onClick={() => setStatusFilter("active")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${statusFilter === "active" ? "bg-purple-500 text-white" : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200"}`}>
              <Zap className="w-4 h-4" /> In Progress <span className={`px-1.5 py-0.5 rounded-full text-xs ${statusFilter === "active" ? "bg-black/20" : "bg-zinc-800"}`}>{stats.active}</span>
            </button>
          )}
          <button onClick={() => setStatusFilter("pending")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${statusFilter === "pending" ? "bg-yellow-500 text-black" : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200"}`}>
            Pending <span className={`px-1.5 py-0.5 rounded-full text-xs ${statusFilter === "pending" ? "bg-black/10" : "bg-zinc-800"}`}>{stats.pending}</span>
          </button>
          <button onClick={() => setStatusFilter("confirmed")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${statusFilter === "confirmed" ? "bg-blue-500 text-white" : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200"}`}>
            Accepted/Confirmed <span className={`px-1.5 py-0.5 rounded-full text-xs ${statusFilter === "confirmed" ? "bg-black/20" : "bg-zinc-800"}`}>{stats.confirmed}</span>
          </button>
          <button onClick={() => setStatusFilter("completed")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${statusFilter === "completed" ? "bg-green-500 text-black" : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200"}`}>
            Completed <span className={`px-1.5 py-0.5 rounded-full text-xs ${statusFilter === "completed" ? "bg-black/10" : "bg-zinc-800"}`}>{stats.completed}</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-zinc-950 border border-zinc-800 rounded-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500 mb-4" strokeWidth={2} />
            <p className="text-zinc-400 text-sm">Loading data...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center bg-red-500/10 border border-red-500/20 rounded-2xl">
            <span className="text-sm font-medium text-red-400">Failed to load bookings. Please try again.</span>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-zinc-950 border border-zinc-800 rounded-2xl border-dashed">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 border border-zinc-800">
              {bookingType === "studio" && <Building2 className="w-8 h-8 text-zinc-500" strokeWidth={1.5} />}
              {bookingType === "service" && <Briefcase className="w-8 h-8 text-purple-900/50" strokeWidth={1.5} />}
              {bookingType === "equipment" && <Guitar className="w-8 h-8 text-orange-900/50" strokeWidth={1.5} />}
              {bookingType === "beat" && <Music2 className="w-8 h-8 text-green-900/50" strokeWidth={1.5} />}
            </div>
            <h3 className="text-lg font-medium text-zinc-200 mb-1">No {bookingType} records found</h3>
            <p className="text-sm text-zinc-500">You do not have any matching items in this view.</p>
          </div>
        ) : (
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            
            <div className="hidden md:flex items-center gap-4 px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <div className="w-[35%]">Details</div>
              <div className="w-[20%]">Schedule</div>
              <div className="w-[20%]">Status</div>
              <div className="w-[25%] text-right pr-4">Amount & Actions</div>
            </div>

            <div className="flex flex-col divide-y divide-zinc-800">
              {filteredBookings.map((booking: any) => {
                const sessionInfo = (booking as any).sessionInfo;
                const routeMap: any = { 
                  STUDIO_BOOKING: `/bookings/show/${booking.id}`, 
                  EQUIPMENT_RENTAL: `/equipment/show/${booking.equipmentId}`, 
                  SERVICE_REQUEST: `/service-requests/${booking.id}`, 
                  BEAT_PURCHASE: `/beats/show/${booking.beatId}` 
                };
                const detailRoute = routeMap[booking.type] || "/bookings";
                const counterpart = viewMode === "customer" ? booking.providerName : booking.customerName;
                const amount = formatCurrency(booking.totalAmount || booking.amount || booking.budget || 0);
                
                const unifiedPaymentStatus = sessionInfo?.paymentStatus || booking.paymentStatus || "UNPAID";

                const isStudioOwner = currentUser?.id === (booking as any).studio?.owner?.userId;
                const isCustomer = currentUser?.id === (booking as any).userId || currentUser?.id === (booking as any).clientId;
                const isProducer = currentUser?.id === (booking as any).producerId;

                return (
                  <div 
                    key={booking.id} 
                    onClick={() => router.push(detailRoute)}
                    className="flex flex-col md:flex-row md:items-center px-6 py-5 hover:bg-zinc-900/50 transition-colors cursor-pointer group"
                  >
                    
                    <div className="w-full md:w-[35%] flex items-center gap-4 pr-4">
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 transition-colors ${
                        booking.type === "STUDIO_BOOKING" ? "bg-zinc-900 border-zinc-800" :
                        booking.type === "SERVICE_REQUEST" ? "bg-purple-500/10 border-purple-500/20" :
                        booking.type === "EQUIPMENT_RENTAL" ? "bg-orange-500/10 border-orange-500/20" :
                        "bg-green-500/10 border-green-500/20"
                      }`}>
                        {booking.type === "STUDIO_BOOKING" && <Building2 className="w-5 h-5 text-white" />}
                        {booking.type === "SERVICE_REQUEST" && <Briefcase className="w-5 h-5 text-purple-400" />}
                        {booking.type === "EQUIPMENT_RENTAL" && <Guitar className="w-5 h-5 text-orange-400" />}
                        {booking.type === "BEAT_PURCHASE" && <Music2 className="w-5 h-5 text-green-400" />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-white truncate mb-1">
                          {booking.itemName}
                        </span>
                        {counterpart && (
                          <span className="text-xs text-zinc-400 truncate flex items-center gap-1">
                            {viewMode === 'customer' ? 'With' : 'For'} <span className="font-medium text-zinc-300">@{counterpart}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-full md:w-[20%] flex flex-col mt-4 md:mt-0 gap-1 text-sm">
                      <div className="flex items-center gap-2 text-zinc-200">
                        <Calendar className="w-4 h-4 text-zinc-500" />
                        <span>
                          {booking.type === "STUDIO_BOOKING" ? formatDate(booking.startTime) : 
                           booking.type === "SERVICE_REQUEST" && booking.deadline ? `Due: ${formatDate(booking.deadline)}` : 
                           formatDate(booking.createdAt)}
                        </span>
                      </div>
                      {booking.type === "STUDIO_BOOKING" && (
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Clock className="w-4 h-4 text-zinc-500" />
                          <span>{formatTime(booking.startTime, booking.endTime)}</span>
                        </div>
                      )}
                    </div>

                    <div className="w-full md:w-[20%] flex flex-col items-start gap-2 mt-4 md:mt-0">
                      {getStatusBadge(booking.status)}
                      {unifiedPaymentStatus !== "UNPAID" && getPaymentBadge(unifiedPaymentStatus)}
                    </div>

                    <div className="w-full md:w-[25%] flex items-center justify-between md:justify-end gap-6 mt-6 md:mt-0" onClick={(e) => e.stopPropagation()}>
                      
                      <div className="flex items-center gap-2">
                        {(() => {
                          const actions: any[] = [];

                          if (booking.type === "SERVICE_REQUEST") {
                            if (isProducer) {
                              if (booking.status === "PENDING") {
                                actions.push(
                                  <button key="acc" onClick={(e) => { e.stopPropagation(); handleUpdateServiceRequest(booking.id, "ACCEPTED"); }} disabled={updatingServiceRequest} className={payBtnClass}>
                                    Accept Request
                                  </button>,
                                  <button key="rej" onClick={(e) => { e.stopPropagation(); handleUpdateServiceRequest(booking.id, "REJECTED"); }} disabled={updatingServiceRequest} className={cancelBtnClass}>
                                    Reject
                                  </button>
                                );
                              }
                              if (booking.status === "ACCEPTED" && unifiedPaymentStatus === "UNPAID") {
                                actions.push(<span key="wait-fund" className="text-xs text-zinc-500">Awaiting Escrow Funding</span>);
                              }
                              if (booking.status === "ACCEPTED" && unifiedPaymentStatus === "PAYMENT_HELD") {
                                actions.push(
                                  <button key="start" onClick={(e) => { e.stopPropagation(); handleUpdateServiceRequest(booking.id, "IN_PROGRESS"); }} disabled={updatingServiceRequest} className={outlineBtnClass} title="Start Project">
                                    <Play className="w-4 h-4" /> Start Project
                                  </button>
                                );
                              }
                              if (booking.status === "IN_PROGRESS") {
                                actions.push(
                                  <button key="deliv" onClick={(e) => { e.stopPropagation(); handleServiceLifecycleAction(booking.id, "deliver"); }} disabled={processingAction === booking.id + "deliver"} className={payBtnClass}>
                                    {processingAction === booking.id + "deliver" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deliver Files"}
                                  </button>
                                );
                              }
                            }

                            if (isCustomer) {
                              if (booking.status === "PENDING") {
                                actions.push(
                                  <button key="cnc" onClick={(e) => { e.stopPropagation(); handleUpdateServiceRequest(booking.id, "CANCELLED"); }} disabled={updatingServiceRequest} className={cancelBtnClass}>
                                    Cancel
                                  </button>
                                );
                              }
                              if (booking.status === "ACCEPTED" && unifiedPaymentStatus === "UNPAID") {
                                actions.push(
                                  <button key="pay" onClick={(e) => { e.stopPropagation(); handleServiceLifecycleAction(booking.id, "pay"); }} disabled={processingAction === booking.id + "pay"} className={payBtnClass}>
                                    {processingAction === booking.id + "pay" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fund Escrow"}
                                  </button>
                                );
                              }
                              if (booking.status === "DELIVERED") {
                                if (showDeliveryPrompt === booking.id) {
                                  actions.push(
                                    <div key="code" className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1" onClick={(e) => e.stopPropagation()}>
                                      <input type="text" placeholder="Auth Code" maxLength={6} value={deliveryCodeInput} onChange={(e) => setDeliveryCodeInput(e.target.value.toUpperCase())} className="w-20 bg-transparent text-sm text-white outline-none text-center placeholder:text-zinc-600" />
                                      <button onClick={() => handleServiceLifecycleAction(booking.id, "confirm-delivery", { deliveryCode: deliveryCodeInput.trim() })} disabled={processingAction === booking.id + "confirm-delivery" || !deliveryCodeInput.trim()} className="p-1 rounded bg-green-500/20 text-green-500 hover:bg-green-500/30">
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => setShowDeliveryPrompt(null)} className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
                                    </div>
                                  );
                                } else {
                                  actions.push(
                                    <button key="conf" onClick={(e) => { e.stopPropagation(); setShowDeliveryPrompt(booking.id); }} className={payBtnClass}>
                                      Release Funds
                                    </button>
                                  );
                                }
                              }
                            }

                            if (["CONFIRMED", "ACTIVE", "ACCEPTED", "IN_PROGRESS", "DELIVERED"].includes(booking.status)) {
                              actions.push(
                                <button key="msg" onClick={(e) => { e.stopPropagation(); router.push(`/messages/${isProducer ? (booking as any).clientId : (booking as any).producerId}`); }} className={actionBtnClass} title="Message">
                                  <MessageCircle className="w-5 h-5" />
                                </button>
                              );
                            }
                          }

                          if (booking.type === "STUDIO_BOOKING") {
                            if (booking.status === "PENDING" && isCustomer) {
                              actions.push(
                                <button key="pay1" onClick={(e) => { e.stopPropagation(); payBooking.mutate({ bookingId: booking.id }); }} disabled={payBooking.isPending} className={payBtnClass}>
                                  {payBooking.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pay Deposit"}
                                </button>
                              );
                            }
                            if (booking.status === "PENDING" && isStudioOwner) {
                              actions.push(
                                <button key="acc1" onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ bookingId: booking.id, status: "CONFIRMED" }); }} disabled={updateStatus.isPending} className={payBtnClass}>
                                  {updateStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Session"}
                                </button>
                              );
                            }
                            if (booking.status === "PENDING" && (isStudioOwner || isCustomer)) {
                              actions.push(
                                <button key="cnc1" onClick={(e) => { e.stopPropagation(); cancelBooking.mutate(booking.id); }} disabled={cancelBooking.isPending} className={cancelBtnClass}>
                                  {isStudioOwner ? "Reject" : "Cancel"}
                                </button>
                              );
                            }
                            if (booking.status === "CONFIRMED" && isCustomer && unifiedPaymentStatus === "UNPAID") {
                              actions.push(
                                <button key="pay2" onClick={(e) => { e.stopPropagation(); payBooking.mutate({ bookingId: booking.id }); }} disabled={payBooking.isPending} className={payBtnClass}>
                                  {payBooking.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pay Full Amount"}
                                </button>
                              );
                            }
                            
                            if (booking.status === "CONFIRMED" && isStudioOwner && unifiedPaymentStatus === "PAYMENT_HELD") {
                              if (showQrPrompt === booking.id) {
                                actions.push(
                                  <div key="qr" className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1" onClick={(e) => e.stopPropagation()}>
                                    <input type="text" placeholder="Scan QR" value={qrCodeInput} onChange={(e) => setQrCodeInput(e.target.value)} className="w-24 bg-transparent text-sm text-white outline-none px-2 placeholder:text-zinc-600" />
                                    <button onClick={() => checkIn.mutate({ bookingId: booking.id, qrCode: qrCodeInput.trim() }, { onSuccess: () => { setShowQrPrompt(null); setQrCodeInput(""); } })} disabled={checkIn.isPending || !qrCodeInput.trim()} className="p-1 rounded bg-green-500/20 text-green-500 hover:bg-green-500/30">
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setShowQrPrompt(null)} className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
                                  </div>
                                );
                              } else {
                                actions.push(
                                  <button key="strt" onClick={(e) => { e.stopPropagation(); setShowQrPrompt(booking.id); }} disabled={checkIn.isPending} className={actionBtnClass} title="Start Studio Session">
                                    <Play className="w-5 h-5 fill-current" />
                                  </button>
                                );
                              }
                            }

                            if (booking.status === "ACTIVE" && isCustomer && sessionInfo && !sessionInfo.bookerConfirmedCheckIn) {
                              if (showConfirmPrompt === booking.id) {
                                actions.push(
                                  <div key="code" className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1" onClick={(e) => e.stopPropagation()}>
                                    <input type="text" placeholder="Code" maxLength={6} value={confirmCodeInput} onChange={(e) => setConfirmCodeInput(e.target.value.toUpperCase())} className="w-16 bg-transparent text-sm text-white outline-none text-center placeholder:text-zinc-600" />
                                    <button onClick={() => confirmCheckIn.mutate({ bookingId: booking.id, confirmationCode: confirmCodeInput.trim() }, { onSuccess: () => { setShowConfirmPrompt(null); setConfirmCodeInput(""); } })} disabled={confirmCheckIn.isPending || !confirmCodeInput.trim()} className="p-1 rounded bg-green-500/20 text-green-500 hover:bg-green-500/30">
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setShowConfirmPrompt(null)} className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
                                  </div>
                                );
                              } else {
                                actions.push(
                                  <button key="cfrm" onClick={(e) => { e.stopPropagation(); setShowConfirmPrompt(booking.id); }} className={actionBtnClass} title="Confirm Location">
                                    <MapPin className="w-5 h-5" />
                                  </button>
                                );
                              }
                            }

                            if (booking.status === "ACTIVE" && (isStudioOwner || isCustomer)) {
                              actions.push(
                                <button key="end" onClick={(e) => { e.stopPropagation(); if (confirm("End Session?")) checkOut.mutate(booking.id); }} disabled={checkOut.isPending} className={actionBtnClass} title="End Session">
                                  {checkOut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Square className="w-5 h-5 fill-current" />}
                                </button>
                              );
                            }

                            if (booking.status === "COMPLETED" && isCustomer && unifiedPaymentStatus === "PAYMENT_HELD") {
                              actions.push(
                                <button key="rel" onClick={(e) => { e.stopPropagation(); if (confirm("Approve payment release?")) releasePayment.mutate(booking.id); }} disabled={releasePayment.isPending} className={payBtnClass}>
                                  {releasePayment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Release Funds"}
                                </button>
                              );
                            }

                            if ((booking.status === "CONFIRMED" || booking.status === "ACTIVE") && isCustomer) {
                              actions.push(
                                <button key="msg" onClick={(e) => { e.stopPropagation(); router.push(`/bookings/${booking.id}/chat`); }} className={actionBtnClass} title="Message Studio">
                                  <MessageCircle className="w-5 h-5" />
                                </button>
                              );
                            }
                          }

                          return actions;
                        })()}
                      </div>

                      {/* Amount */}
                      <div className="flex flex-col items-end min-w-[80px]">
                        <span className="text-sm font-semibold text-white">
                          {amount}
                        </span>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}