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
  SlidersHorizontal, CheckCheck, X, Trash2, Lock, Wallet, CreditCard, MapPin, DollarSign
} from "lucide-react";
import dayjs from "dayjs";

type BookingType = "all" | "studio" | "equipment" | "service" | "beat";
type ViewMode = "customer" | "provider";
type StatusFilter = "all" | "pending" | "confirmed" | "active" | "cancelled" | "completed";

// --- Custom Brutalist Tooltip Component ---
const Tooltip = ({ text }: { text: string }) => (
  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-black text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap shadow-2xl">
    {text}
    <svg className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 text-white" viewBox="0 0 10 10">
      <polygon points="0,0 10,0 5,5" fill="currentColor" />
    </svg>
  </span>
);

export default function BookingsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("customer");
  const [bookingType, setBookingType] = useState<BookingType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [updatingServiceRequest, setUpdatingServiceRequest] = useState(false);
  const [qrCodeInput, setQrCodeInput] = useState<string>("");
  const [showQrPrompt, setShowQrPrompt] = useState<string | null>(null);
  const [confirmCodeInput, setConfirmCodeInput] = useState<string>("");
  const [showConfirmPrompt, setShowConfirmPrompt] = useState<string | null>(null);

  const { data: customerBookingsData } = useAllBookings("customer");
  const { data: providerBookingsData } = useAllBookings("provider");
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

  const uniqueCombinedBookings = Array.from(
    new Map(allCombinedBookings.map(b => [b.id, b])).values()
  );

  const allBookings = bookingsData
    ? [
        ...bookingsData.studioBookings,
        ...bookingsData.equipmentRentals,
        ...bookingsData.serviceRequests,
        ...bookingsData.beatPurchases,
      ]
    : [];

  const filteredBookings = allBookings.filter((booking) => {
    if (bookingType !== "all") {
      const typeMap = { studio: "STUDIO_BOOKING", equipment: "EQUIPMENT_RENTAL", service: "SERVICE_REQUEST", beat: "BEAT_PURCHASE" };
      if (booking.type !== typeMap[bookingType]) return false;
    }
    if (statusFilter !== "all") {
      const bookingStatus = (booking as any).status?.toLowerCase();
      if (bookingStatus !== statusFilter) return false;
    }
    return true;
  });

  const stats = {
    total: uniqueCombinedBookings.length,
    pending: uniqueCombinedBookings.filter((b: any) => b.status === "PENDING").length,
    confirmed: uniqueCombinedBookings.filter((b: any) => b.status === "CONFIRMED" || b.status === "ACCEPTED").length,
    active: uniqueCombinedBookings.filter((b: any) => b.status === "ACTIVE").length,
    completed: uniqueCombinedBookings.filter((b: any) => b.status === "COMPLETED").length,
    cancelled: uniqueCombinedBookings.filter((b: any) => b.status === "CANCELLED" || b.status === "REJECTED").length,
  };

  // --- Guided Status Indicators ---
  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING": 
        return (
          <div className="group relative flex items-center gap-2 text-zinc-500 text-[9px] font-black uppercase tracking-widest cursor-help w-max">
            <Clock className="w-5 h-5" /> PENDING <Tooltip text="Awaiting provider confirmation" />
          </div>
        );
      case "CONFIRMED":
      case "ACCEPTED": 
        return (
          <div className="group relative flex items-center gap-2 text-white text-[9px] font-black uppercase tracking-widest cursor-help w-max">
            <CheckCircle2 className="w-5 h-5" /> CONFIRMED <Tooltip text="Accepted and ready for session" />
          </div>
        );
      case "ACTIVE": 
        return (
          <div className="group relative flex items-center gap-2 text-white text-[9px] font-black uppercase tracking-widest cursor-help w-max">
            <Zap className="w-5 h-5 fill-white" /> IN SESSION <Tooltip text="Session is currently ongoing" />
          </div>
        );
      case "COMPLETED": 
        return (
          <div className="group relative flex items-center gap-2 text-zinc-500 text-[9px] font-black uppercase tracking-widest cursor-help w-max">
            <CheckCheck className="w-5 h-5" /> COMPLETED <Tooltip text="Session ended successfully" />
          </div>
        );
      case "CANCELLED":
      case "REJECTED": 
        return (
          <div className="group relative flex items-center gap-2 text-zinc-600 text-[9px] font-black uppercase tracking-widest cursor-help w-max">
            <XCircle className="w-5 h-5" /> CANCELLED <Tooltip text="Booking was cancelled or rejected" />
          </div>
        );
      default: 
        return <div className="flex items-center gap-2 text-zinc-600 text-[9px] font-black uppercase tracking-widest">UNKNOWN</div>;
    }
  };

  const getPaymentBadge = (status: string) => {
    if (status === "PAYMENT_HELD") {
      return (
        <div className="group relative flex items-center gap-2 text-white text-[9px] font-black uppercase tracking-widest cursor-help w-max">
          <Lock className="w-5 h-5" /> ESCROW SECURED <Tooltip text="Funds held securely until completion" />
        </div>
      );
    }
    if (status === "PAYMENT_RELEASED") {
      return (
        <div className="group relative flex items-center gap-2 text-zinc-500 text-[9px] font-black uppercase tracking-widest cursor-help w-max">
          <Wallet className="w-5 h-5" /> PAID OUT <Tooltip text="Funds successfully released to provider" />
        </div>
      );
    }
    return (
      <div className="group relative flex items-center gap-2 text-zinc-500 text-[9px] font-black uppercase tracking-widest cursor-help w-max">
        <CreditCard className="w-5 h-5" /> LOGGED <Tooltip text="Payment logged but not captured" />
      </div>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "STUDIO_BOOKING": return <Building2 className="w-6 h-6 text-white" strokeWidth={1.5} />;
      case "EQUIPMENT_RENTAL": return <Guitar className="w-6 h-6 text-white" strokeWidth={1.5} />;
      case "SERVICE_REQUEST": return <Briefcase className="w-6 h-6 text-white" strokeWidth={1.5} />;
      case "BEAT_PURCHASE": return <Music2 className="w-6 h-6 text-white" strokeWidth={1.5} />;
      default: return <Calendar className="w-6 h-6 text-white" strokeWidth={1.5} />;
    }
  };

  const formatDate = (dateString: string) => dayjs(dateString).format("MMM D, YYYY");
  const formatTime = (startTime: string, endTime?: string) => {
    if (!endTime) return dayjs(startTime).format("HH:mm");
    return `${dayjs(startTime).format("HH:mm")} - ${dayjs(endTime).format("HH:mm")}`;
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

  // Base subtle action class
  const actionBtnClass = "flex items-center justify-center gap-2 bg-transparent text-zinc-500 hover:text-white transition-colors outline-none disabled:opacity-50 shrink-0 text-[10px] font-black uppercase tracking-widest whitespace-nowrap p-0 border-none";
  // Standout Green Action
  const payBtnClass = "flex items-center justify-center gap-2 bg-green-500 text-black hover:bg-green-400 transition-colors outline-none disabled:opacity-50 shrink-0 text-[10px] font-black uppercase tracking-widest whitespace-nowrap px-3 py-2";
  // Standout Red Action
  const cancelBtnClass = "flex items-center justify-center gap-2 bg-red-500 text-black hover:bg-red-400 transition-colors outline-none disabled:opacity-50 shrink-0 text-[10px] font-black uppercase tracking-widest whitespace-nowrap px-3 py-2";

  return (
    <div className="min-h-screen bg-[#030303] text-white px-4 md:px-8 pt-4 pb-12 w-full overflow-x-hidden selection:bg-white selection:text-black">
      
      {/* HEADER SECTION - Pushed Up */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Bookings</h1>
        </div>
        
        {/* VIEW MODE TOGGLE - Zero Borders, Black & White */}
        <div className="flex items-center gap-8 shrink-0">
          <button
            onClick={() => setViewMode("customer")}
            className={`text-[11px] font-black uppercase tracking-widest transition-colors outline-none bg-transparent border-none p-0 ${
              viewMode === "customer" ? "text-white" : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            CUSTOMER
          </button>
          <button
            onClick={() => setViewMode("provider")}
            className={`text-[11px] font-black uppercase tracking-widest transition-colors outline-none bg-transparent border-none p-0 ${
              viewMode === "provider" ? "text-white" : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            PROVIDER
          </button>
        </div>
      </div>

      {/* FILTER BAR - Flex Wrap instead of Scroll */}
      <div className="flex flex-wrap items-center gap-6 border-b border-white/10 mb-8 pb-3">
        <div className="flex items-center pr-6 border-r border-white/10 shrink-0">
          <SlidersHorizontal className="w-5 h-5 text-zinc-500" />
        </div>

        <button onClick={() => setStatusFilter("all")} className={`text-[10px] font-black uppercase tracking-widest outline-none bg-transparent border-none p-0 whitespace-nowrap transition-colors ${statusFilter === "all" ? "text-white" : "text-zinc-600 hover:text-zinc-400"}`}>
          ALL ({stats.total})
        </button>
        {stats.active > 0 && (
          <button onClick={() => setStatusFilter("active")} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest outline-none bg-transparent border-none p-0 whitespace-nowrap transition-colors ${statusFilter === "active" ? "text-white" : "text-zinc-600 hover:text-zinc-400"}`}>
            <Zap className="w-4 h-4" /> ACTIVE ({stats.active})
          </button>
        )}
        <button onClick={() => setStatusFilter("pending")} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest outline-none bg-transparent border-none p-0 whitespace-nowrap transition-colors ${statusFilter === "pending" ? "text-white" : "text-zinc-600 hover:text-zinc-400"}`}>
          <Clock className="w-4 h-4" /> PENDING ({stats.pending})
        </button>
        <button onClick={() => setStatusFilter("confirmed")} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest outline-none bg-transparent border-none p-0 whitespace-nowrap transition-colors ${statusFilter === "confirmed" ? "text-white" : "text-zinc-600 hover:text-zinc-400"}`}>
          <CheckCircle2 className="w-4 h-4" /> CONFIRMED ({stats.confirmed})
        </button>
        <button onClick={() => setStatusFilter("completed")} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest outline-none bg-transparent border-none p-0 whitespace-nowrap transition-colors ${statusFilter === "completed" ? "text-white" : "text-zinc-600 hover:text-zinc-400"}`}>
          <CheckCheck className="w-4 h-4" /> COMPLETED ({stats.completed})
        </button>

        {/* TYPE DROPDOWN */}
        <select
          value={bookingType}
          onChange={(e) => setBookingType(e.target.value as BookingType)}
          className="md:ml-auto bg-transparent text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:text-white outline-none cursor-pointer appearance-none shrink-0 border-none p-0"
        >
          <option value="all" className="bg-black">All Items</option>
          <option value="studio" className="bg-black">Studios</option>
          <option value="equipment" className="bg-black">Equipment</option>
          <option value="service" className="bg-black">Services</option>
          <option value="beat" className="bg-black">Beats</option>
        </select>
      </div>

      {/* BOOKINGS LIST */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500 mb-4" strokeWidth={1.5} />
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">System Error. Could not load data.</span>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Calendar className="w-10 h-10 text-zinc-800 mb-4" strokeWidth={1.5} />
          <span className="text-[10px] font-black tracking-widest uppercase text-zinc-600">Log Empty</span>
        </div>
      ) : (
        <div className="flex flex-col">
          
          {/* Table Header (Desktop) */}
          <div className="hidden md:flex items-center gap-4 py-4 border-b border-white/20 text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">
            <div className="w-[30%]">Item Details</div>
            <div className="w-[20%]">Schedule</div>
            <div className="w-[20%]">Status</div>
            <div className="w-[30%] text-right pr-2">Actions</div>
          </div>

          {/* Rows */}
          <div className="flex flex-col">
            {filteredBookings.map((booking: any) => {
              const sessionInfo = (booking as any).sessionInfo;
              const routeMap: any = { STUDIO_BOOKING: `/bookings/show/${booking.id}`, EQUIPMENT_RENTAL: `/equipment/show/${booking.equipmentId}`, SERVICE_REQUEST: `/service-requests/${booking.id}`, BEAT_PURCHASE: `/beats/show/${booking.beatId}` };
              const detailRoute = routeMap[booking.type] || "/bookings";
              const counterpart = viewMode === "customer" ? booking.providerName : booking.customerName;
              const isStudio = booking.type === "STUDIO_BOOKING";
              const amount = formatCurrency(booking.totalAmount || booking.amount || booking.budget || 0);

              const isStudioOwner = currentUser?.id === (booking as any).studio?.owner?.userId;
              const isCustomer = currentUser?.id === (booking as any).userId;
              const isProducer = currentUser?.id === (booking as any).producerId;
              const isClient = currentUser?.id === (booking as any).userId;

              return (
                <div 
                  key={booking.id} 
                  onClick={() => router.push(detailRoute)}
                  className="flex flex-col md:flex-row md:items-center py-5 border-b border-white/10 last:border-b-0 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                >
                  
                  {/* Col 1: Icon + Details */}
                  <div className="w-full md:w-[30%] flex items-center gap-4 min-w-0 pr-4">
                    <div className="shrink-0 flex items-center justify-center">
                      {getTypeIcon(booking.type)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-white uppercase tracking-widest truncate">
                        {booking.itemName}
                      </span>
                      {counterpart && (
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1 truncate">
                          @{counterpart}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Col 2: Schedule */}
                  <div className="w-full md:w-[20%] flex flex-col mt-4 md:mt-0">
                    <span className="text-xs font-bold text-white uppercase tracking-widest">
                      {isStudio ? formatDate(booking.startTime) : formatDate(booking.createdAt)}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                      {isStudio ? formatTime(booking.startTime, booking.endTime) : "LOGGED"}
                    </span>
                  </div>

                  {/* Col 3: Status Text + Tooltips */}
                  <div className="w-full md:w-[20%] flex flex-col items-start gap-3 mt-4 md:mt-0">
                    {getStatusBadge(booking.status)}
                    {sessionInfo?.paymentStatus && sessionInfo.paymentStatus !== "UNPAID" && getPaymentBadge(sessionInfo.paymentStatus)}
                  </div>

                  {/* Col 4: Inline Actions & Amount */}
                  <div className="w-full md:w-[30%] flex items-center justify-between md:justify-end gap-6 mt-6 md:mt-0" onClick={(e) => e.stopPropagation()}>
                    
                    {/* Inline Actions Array */}
                    <div className="flex items-center gap-4">
                      {(() => {
                        const actions: any[] = [];

                        if (booking.type === "SERVICE_REQUEST") {
                          if (isProducer && booking.status === "PENDING") {
                            actions.push(
                              <button key="acc" onClick={(e) => { e.stopPropagation(); handleUpdateServiceRequest(booking.id, "ACCEPTED"); }} disabled={updatingServiceRequest} className={payBtnClass}>
                                {updatingServiceRequest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} ACCEPT
                              </button>,
                              <button key="rej" onClick={(e) => { e.stopPropagation(); handleUpdateServiceRequest(booking.id, "REJECTED"); }} disabled={updatingServiceRequest} className={cancelBtnClass}>
                                <X className="w-4 h-4" /> REJECT
                              </button>
                            );
                          }
                          if (isProducer && booking.status === "ACCEPTED") {
                            actions.push(
                              <button key="start" onClick={(e) => { e.stopPropagation(); handleUpdateServiceRequest(booking.id, "IN_PROGRESS"); }} disabled={updatingServiceRequest} className={actionBtnClass}>
                                <Play className="w-5 h-5 fill-current" />
                              </button>
                            );
                          }
                          if (isProducer && booking.status === "IN_PROGRESS") {
                            actions.push(
                              <button key="done" onClick={(e) => { e.stopPropagation(); handleUpdateServiceRequest(booking.id, "COMPLETED"); }} disabled={updatingServiceRequest} className={actionBtnClass}>
                                <CheckCheck className="w-5 h-5" />
                              </button>
                            );
                          }
                          if (isClient && (booking.status === "PENDING" || booking.status === "ACCEPTED")) {
                            actions.push(
                              <button key="cnc" onClick={(e) => { e.stopPropagation(); handleUpdateServiceRequest(booking.id, "CANCELLED"); }} disabled={updatingServiceRequest} className={cancelBtnClass}>
                                <Trash2 className="w-4 h-4" /> CANCEL
                              </button>
                            );
                          }
                          if (booking.status === "CONFIRMED" || booking.status === "ACTIVE" || booking.status === "ACCEPTED" || booking.status === "IN_PROGRESS") {
                            actions.push(
                              <button key="msg" onClick={(e) => { e.stopPropagation(); router.push(`/messages/${isProducer ? (booking as any).userId : (booking as any).producerId}`); }} className={actionBtnClass}>
                                <MessageCircle className="w-5 h-5" />
                              </button>
                            );
                          }
                        }

                        if (booking.type === "STUDIO_BOOKING") {
                          if (booking.status === "PENDING" && isCustomer) {
                            actions.push(
                              <button key="pay1" onClick={(e) => { e.stopPropagation(); payBooking.mutate({ bookingId: booking.id }); }} disabled={payBooking.isPending} className={payBtnClass}>
                                {payBooking.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />} PAY 
                              </button>
                            );
                          }
                          if (booking.status === "PENDING" && isStudioOwner) {
                            actions.push(
                              <button key="acc1" onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ bookingId: booking.id, status: "CONFIRMED" }); }} disabled={updateStatus.isPending} className={payBtnClass}>
                                {updateStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} ACCEPT
                              </button>
                            );
                          }
                          if (booking.status === "PENDING" && (isStudioOwner || isCustomer)) {
                            actions.push(
                              <button key="cnc1" onClick={(e) => { e.stopPropagation(); cancelBooking.mutate(booking.id); }} disabled={cancelBooking.isPending} className={cancelBtnClass}>
                                <X className="w-4 h-4" /> {isStudioOwner ? "REJECT" : "CANCEL"}
                              </button>
                            );
                          }
                          if (booking.status === "CONFIRMED" && isCustomer && (!sessionInfo?.paymentStatus || sessionInfo?.paymentStatus === "UNPAID")) {
                            actions.push(
                              <button key="pay2" onClick={(e) => { e.stopPropagation(); payBooking.mutate({ bookingId: booking.id }); }} disabled={payBooking.isPending} className={payBtnClass}>
                                {payBooking.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />} PAY NOW
                              </button>
                            );
                          }
                          
                          // QR Flow
                          if (booking.status === "CONFIRMED" && isStudioOwner && sessionInfo?.paymentStatus === "PAYMENT_HELD") {
                            if (showQrPrompt === booking.id) {
                              actions.push(
                                <div key="qr" className="flex items-center gap-2 border-b border-zinc-600 pb-1" onClick={(e) => e.stopPropagation()}>
                                  <input type="text" placeholder="SCAN QR" value={qrCodeInput} onChange={(e) => setQrCodeInput(e.target.value)} className="w-20 bg-transparent text-[10px] font-black uppercase tracking-widest text-white outline-none placeholder:text-zinc-600" />
                                  <button onClick={() => checkIn.mutate({ bookingId: booking.id, qrCode: qrCodeInput.trim() }, { onSuccess: () => { setShowQrPrompt(null); setQrCodeInput(""); } })} disabled={checkIn.isPending || !qrCodeInput.trim()} className="text-white hover:text-green-400 outline-none">
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => setShowQrPrompt(null)} className="text-zinc-500 hover:text-white outline-none"><X className="w-4 h-4" /></button>
                                </div>
                              );
                            } else {
                              actions.push(
                                <button key="strt" onClick={(e) => { e.stopPropagation(); setShowQrPrompt(booking.id); }} disabled={checkIn.isPending} className={actionBtnClass}>
                                  <Play className="w-5 h-5 fill-current" />
                                </button>
                              );
                            }
                          }

                          // Code Flow
                          if (booking.status === "ACTIVE" && isCustomer && sessionInfo && !sessionInfo.bookerConfirmedCheckIn) {
                            if (showConfirmPrompt === booking.id) {
                              actions.push(
                                <div key="code" className="flex items-center gap-2 border-b border-zinc-600 pb-1" onClick={(e) => e.stopPropagation()}>
                                  <input type="text" placeholder="CODE" maxLength={6} value={confirmCodeInput} onChange={(e) => setConfirmCodeInput(e.target.value.toUpperCase())} className="w-16 bg-transparent text-[10px] font-black uppercase tracking-widest text-white outline-none text-center placeholder:text-zinc-600" />
                                  <button onClick={() => confirmCheckIn.mutate({ bookingId: booking.id, confirmationCode: confirmCodeInput.trim() }, { onSuccess: () => { setShowConfirmPrompt(null); setConfirmCodeInput(""); } })} disabled={confirmCheckIn.isPending || !confirmCodeInput.trim()} className="text-white hover:text-green-400 outline-none">
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => setShowConfirmPrompt(null)} className="text-zinc-500 hover:text-white outline-none"><X className="w-4 h-4" /></button>
                                </div>
                              );
                            } else {
                              actions.push(
                                <button key="cfrm" onClick={(e) => { e.stopPropagation(); setShowConfirmPrompt(booking.id); }} className={actionBtnClass}>
                                  <MapPin className="w-5 h-5" />
                                </button>
                              );
                            }
                          }

                          if (booking.status === "ACTIVE" && (isStudioOwner || isCustomer)) {
                            actions.push(
                              <button key="end" onClick={(e) => { e.stopPropagation(); if (confirm("End Session?")) checkOut.mutate(booking.id); }} disabled={checkOut.isPending} className={actionBtnClass}>
                                {checkOut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Square className="w-5 h-5 fill-current" />}
                              </button>
                            );
                          }

                          if (booking.status === "COMPLETED" && isCustomer && sessionInfo?.paymentStatus === "PAYMENT_HELD") {
                            actions.push(
                              <button key="rel" onClick={(e) => { e.stopPropagation(); if (confirm("Approve payment release?")) releasePayment.mutate(booking.id); }} disabled={releasePayment.isPending} className={payBtnClass}>
                                {releasePayment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} RELEASE
                              </button>
                            );
                          }

                          if ((booking.status === "CONFIRMED" || booking.status === "ACTIVE") && isCustomer) {
                            actions.push(
                              <button key="msg" onClick={(e) => { e.stopPropagation(); router.push(`/bookings/${booking.id}/chat`); }} className={actionBtnClass}>
                                <MessageCircle className="w-5 h-5" />
                              </button>
                            );
                          }
                        }

                        return actions;
                      })()}
                    </div>

                    {/* Amount */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="hidden lg:block w-px h-6 bg-white/20" />
                      <span className="text-[13px] font-black text-white w-20 text-right tracking-widest">
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
  );
}