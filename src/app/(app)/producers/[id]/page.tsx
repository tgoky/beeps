"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { useGetIdentity } from "@refinedev/core";
import { useProducer } from "@/hooks/useProducers";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Camera,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  Clock,
  Globe,
  Headphones,
  Instagram,
  Loader2,
  MapPin,
  MessageCircle,
  Mic2,
  Music2,
  Play,
  Star,
  Trophy,
  Twitter,
  Users,
  X,
  Zap,
  ShieldCheck
} from "lucide-react";

dayjs.extend(isSameOrBefore);

const formatNumber = (num: number): string => {
  if (!num) return "0";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
};

const formatAmount = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

const getCurrencySymbol = (currency: string = "USD") => {
  return (0).toLocaleString('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/[\d.,]/g, '').trim();
};

// ──────────────────────────────────────────────────────────────
// PREMIUM DRAWER: Producer Booking / Request Service
// ──────────────────────────────────────────────────────────────

function ProducerBookingDrawer({
  producerId,
  producerName,
  imageUrl,
  startingPrice,
  currency,
  onClose,
}: {
  producerId: string;
  producerName: string;
  imageUrl: string;
  startingPrice: number;
  currency: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("vision");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const currencySymbol = getCurrencySymbol(currency);

  const [formData, setFormData] = useState({
    title: "",
    desc: "",
    budget: startingPrice ? startingPrice.toString() : "",
  });

  // Calendar State
  const [selectedDate, setSelectedDate] = useState(dayjs().add(7, 'day'));
  const [viewDate, setViewDate] = useState(dayjs());

  const budgetNum = parseFloat(formData.budget) || 0;
  const platformFee = budgetNum * 0.10; // 10% fee
  const totalEscrow = budgetNum + platformFee;

  // Trigger smooth slide-in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 400);
  };

  const generateCalendar = () => {
    const startOfMonth = viewDate.startOf("month");
    const daysInMonth = viewDate.daysInMonth();
    const firstDayOfWeek = startOfMonth.day();

    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.desc.trim()) {
      setError("Please fill in the project title and description.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producerId,
          projectTitle: formData.title,
          projectDescription: formData.desc,
          budget: formData.budget || undefined,
          deadline: selectedDate.toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send request");
      router.push(`/service-requests/${data.serviceRequest.id}`);
      handleClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-md z-[100] transition-opacity duration-500 ease-in-out ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      <div
        className={`fixed top-0 right-0 bottom-0 w-full md:w-[480px] lg:w-[540px] bg-[#030303] border-l border-zinc-800 z-[101] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.8)] sm:rounded-l-3xl overflow-hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md border border-white/20 text-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-colors z-[110] shadow-lg"
        >
          <X size={18} strokeWidth={2} />
        </button>

        {/* Header Image Area */}
        <div className="relative w-full h-[160px] sm:h-[200px] shrink-0 bg-zinc-950 border-b border-zinc-800 group">
          <img
            src={imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${producerId}`}
            alt={producerName}
            className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-luminosity grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/80 to-transparent pointer-events-none" />
          
          <div className="absolute bottom-4 left-6 right-6 flex flex-col pointer-events-none">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
              <ShieldCheck size={14} className="text-zinc-500" />
              Secure Escrow Request
            </div>
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-white flex items-center gap-2 line-clamp-1">
              Hire {producerName}
            </h2>
          </div>
        </div>

        {/* Custom Tabs */}
        <div className="flex border-b border-zinc-800 shrink-0 px-6">
          {["vision", "logistics"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-4 text-sm font-medium transition-colors border-b-2 relative top-[1px] ${
                activeTab === tab ? "border-white text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-8 scrollbar-hide">
          {activeTab === "vision" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                  Project Title <span className="text-white">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full Album Production, Mixing 3 Tracks"
                  className="w-full px-4 py-3.5 rounded-xl outline-none border transition-all text-sm bg-[#08080a] border-zinc-800 focus:border-zinc-500 text-white placeholder:text-zinc-600 font-light tracking-wide"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                  Brief Description <span className="text-white">*</span>
                </label>
                <textarea
                  rows={6}
                  placeholder="Describe your vision, reference tracks, stems availability, and any specific requirements..."
                  className="w-full px-4 py-3.5 rounded-xl outline-none border transition-all resize-none text-sm bg-[#08080a] border-zinc-800 focus:border-zinc-500 text-white placeholder:text-zinc-600 font-light tracking-wide leading-relaxed"
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                />
              </div>
            </div>
          )}

          {activeTab === "logistics" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                  Project Budget ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-light">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    placeholder={startingPrice ? startingPrice.toString() : "0.00"}
                    className="w-full pl-8 pr-4 py-3.5 rounded-xl outline-none border transition-all text-xl bg-[#08080a] border-zinc-800 focus:border-zinc-500 text-white placeholder:text-zinc-600 font-light tracking-wide"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
              </div>

              {/* Authentic Calendar Implementation */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-3 block">
                  Target Deadline
                </label>
                <div className="bg-[#0A0A0A] border border-zinc-800 p-3 sm:p-4 rounded-2xl shadow-inner">
                  {/* Calendar Header */}
                  <div className="flex justify-between items-center mb-3">
                    <button 
                      onClick={() => setViewDate(viewDate.subtract(1, "month"))}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-white hover:text-black hover:border-white transition-all text-zinc-400"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-semibold text-white tracking-wide">
                        {viewDate.format("MMMM")}
                      </span>
                      <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mt-0.5">
                        {viewDate.format("YYYY")}
                      </span>
                    </div>
                    <button 
                      onClick={() => setViewDate(viewDate.add(1, "month"))}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-white hover:text-black hover:border-white transition-all text-zinc-400"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 mb-1 gap-1">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="text-center text-[10px] uppercase font-semibold text-zinc-600 mb-1.5">
                        {day}
                      </div>
                    ))}
                    {generateCalendar().map((day, i) => {
                      if (!day) return <div key={i} className="h-8" />;

                      const dateObj = viewDate.date(day);
                      const isPast = dateObj.isBefore(dayjs().startOf("day"));
                      const isSelected = selectedDate.format("YYYY-MM-DD") === dateObj.format("YYYY-MM-DD");
                      const isToday = dateObj.isSame(dayjs(), 'day');

                      return (
                        <button
                          key={i}
                          disabled={isPast}
                          onClick={() => setSelectedDate(dateObj)}
                          className={`h-8 w-full flex items-center justify-center rounded-lg text-xs font-medium transition-all ${
                            isPast
                              ? "text-zinc-800 cursor-not-allowed"
                              : isSelected
                              ? "bg-white text-black shadow-md shadow-white/20 scale-105 z-10 font-bold"
                              : isToday
                              ? "text-white border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                              : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          )}

          {error && (
            <div className="mt-4 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-light tracking-wide flex items-start gap-3">
              <Zap size={16} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        {/* Sticky Financial Footer */}
        <div className="bg-[#0A0A0A] border-t border-zinc-800 p-4 sm:p-5 shrink-0 mt-auto sm:rounded-bl-2xl">
          <div className="flex justify-between items-end mb-4">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1">Estimated Escrow</span>
              <span className="text-3xl font-light tracking-tighter text-white">
                {formatAmount(totalEscrow, currency)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1">Breakdown</span>
              <span className="text-xs font-light tracking-wide text-zinc-300">
                Budget: {formatAmount(budgetNum, currency)}
              </span>
              <span className="text-xs font-light tracking-wide text-zinc-500 mt-0.5">
                Platform Fee: {formatAmount(platformFee, currency)}
              </span>
            </div>
          </div>
          
          <button
            onClick={activeTab === "vision" ? () => setActiveTab("logistics") : handleSubmit}
            disabled={isSubmitting || (activeTab === "vision" && !formData.title)}
            className={`w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              (activeTab === "vision" && !formData.title)
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-white hover:bg-zinc-200 text-black shadow-lg shadow-white/10 active:scale-[0.98]"
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Processing...
              </div>
            ) : activeTab === "vision" ? (
              "Next: Logistics & Budget"
            ) : (
              <>
                <ShieldCheck size={16} />
                Send Escrow Request
              </>
            )}
          </button>
          <p className="text-center text-[10px] mt-3 font-light tracking-wide text-zinc-500">
            You won't be charged until the producer confirms availability.
          </p>
        </div>
      </div>
    </>
  );
}

function ProducerLoadingState() {
  return (
    <div className="h-full overflow-y-auto bg-black text-white">
      <main className="mx-auto flex min-h-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_370px]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-2xl">
            <div className="mb-6 flex justify-between">
              <div className="h-9 w-9 bg-zinc-900 rounded-full animate-pulse" />
            </div>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
               <div className="h-32 w-32 shrink-0 rounded-full border border-zinc-800 bg-zinc-900 animate-pulse" />
               <div className="flex-1 space-y-4 pt-2">
                 <div className="h-10 w-2/3 bg-zinc-800 animate-pulse rounded-lg" />
                 <div className="h-4 w-1/2 bg-zinc-900 animate-pulse rounded" />
               </div>
            </div>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-zinc-900 rounded-xl animate-pulse" />)}
            </div>
          </div>
          <aside className="hidden space-y-6 lg:block">
            <div className="h-48 rounded-2xl border border-zinc-800 bg-zinc-950 animate-pulse" />
            <div className="h-64 rounded-2xl border border-zinc-800 bg-zinc-950 animate-pulse" />
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function ProducerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const producerId = params.id as string;
  const { data: user } = useGetIdentity<any>();

  const [activeTab, setActiveTab] = useState<"works" | "services" | "about">("works");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: producer, isLoading, error } = useProducer(producerId);
  const isOwnProfile = user?.id === producerId;

  if (isLoading) return <ProducerLoadingState />;

  if (error || !producer) {
    return (
      <div className="flex h-full overflow-y-auto items-center justify-center bg-black px-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center shadow-2xl">
          <Users className="mx-auto mb-4 h-10 w-10 text-zinc-600" />
          <h1 className="text-2xl font-light tracking-tight">Producer not found</h1>
          <p className="mt-2 text-sm font-light tracking-wide text-zinc-500">This profile may have been removed or deactivated.</p>
          <button
            onClick={() => router.push("/producers")}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium tracking-wide text-black transition-colors hover:bg-zinc-200"
          >
            <ArrowLeft size={16} />
            Back to Hub
          </button>
        </div>
      </div>
    );
  }

  const displayName = producer.name || producer.email.split("@")[0];
  const producerCurrency = producer.currency || "USD";
  const genres = producer.genres || [];
  const specialties = producer.specialties || [];
  const beats = producer.beats || [];
  const studios = producer.studios || [];
  const ratingLabel = producer.rating ? Number(producer.rating).toFixed(1) : "New";

  return (
    <div className="h-full overflow-y-auto bg-black text-zinc-200 selection:bg-white selection:text-black">
      <style jsx global>{`
        @keyframes studio-arrive {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <main className="relative mx-auto max-w-7xl px-4 pb-24 pt-5 sm:px-6 lg:px-8">
        <section
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_370px]"
          style={{ animation: "studio-arrive 520ms cubic-bezier(0.32, 0.72, 0, 1) both" }}
        >
          {/* ──────────────────────────────────────────────────────── */}
          {/* LEFT COLUMN: Main Details, Feed, Portfolio               */}
          {/* ──────────────────────────────────────────────────────── */}
          <div className="min-w-0 space-y-6">
            
            {/* HERO IDENTITY CARD */}
            <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden p-6 sm:p-8">
              <div className="absolute inset-0 opacity-10 pointer-events-none [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:32px_32px]" />
              
              <div className="relative z-10 flex items-center justify-between mb-6">
                <button
                  onClick={() => router.back()}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-white backdrop-blur-md"
                >
                  <ArrowLeft size={16} strokeWidth={1.5} />
                </button>

                {producer.isOnline && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs font-light tracking-wide text-zinc-400 backdrop-blur-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                    Online Now
                  </div>
                )}
              </div>

              <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
                <div className="relative shrink-0">
                  <img
                    src={producer.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${producer.id}`}
                    alt={displayName}
                    className="h-32 w-32 md:h-36 md:w-36 rounded-full border border-zinc-800 bg-[#08080a] object-cover shadow-2xl"
                  />
                  {producer.verified && (
                    <div className="absolute bottom-1 right-1 z-20 rounded-full bg-zinc-950 p-0.5">
                      <BadgeCheck size={28} className="text-blue-500" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h1 className="text-4xl font-light tracking-tighter text-white sm:text-5xl truncate">
                      {displayName}
                    </h1>
                    <div className="flex items-center gap-2">
                      <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-[#08080a] text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white">
                        <Instagram size={18} strokeWidth={1.5} />
                      </a>
                      <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-[#08080a] text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white">
                        <Twitter size={18} strokeWidth={1.5} />
                      </a>
                      <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-[#08080a] text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white">
                        <Globe size={18} strokeWidth={1.5} />
                      </a>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-light tracking-wide text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={16} strokeWidth={1.5} /> {producer.location || "Worldwide"}
                    </span>
                    <span className="text-zinc-700 hidden sm:inline">•</span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={16} strokeWidth={1.5} /> Replies within {producer.responseTime || "1 hr"}
                    </span>
                  </div>

                  {genres.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {genres.map((g) => (
                        <span key={g} className="rounded-md border border-zinc-800 bg-[#08080a] px-3 py-1 text-xs font-light tracking-wide text-zinc-300">
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="relative z-10 mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-[#08080a] p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900">
                  <Star className="absolute -right-3 -top-3 h-16 w-16 text-zinc-800/40 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">Rating</div>
                  <div className="truncate text-xl font-light tracking-tight text-white flex items-center gap-2">
                     {ratingLabel} <Star size={16} className="fill-yellow-500 text-yellow-500" />
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-[#08080a] p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900">
                  <Music2 className="absolute -right-3 -top-3 h-16 w-16 text-zinc-800/40 transition-transform duration-500 group-hover:-translate-x-1 group-hover:translate-y-1 group-hover:scale-110" />
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">Tracks</div>
                  <div className="truncate text-xl font-light tracking-tight text-white">{beats.length}</div>
                </div>

                <div className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-[#08080a] p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900">
                  <Users className="absolute -right-3 -top-3 h-16 w-16 text-zinc-800/40 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110" />
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">Followers</div>
                  <div className="truncate text-xl font-light tracking-tight text-white">{formatNumber(producer.followersCount || 0)}</div>
                </div>

                <div className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-[#08080a] p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900">
                  <Play className="absolute -right-3 -top-3 h-16 w-16 text-zinc-800/40 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">Total Plays</div>
                  <div className="truncate text-xl font-light tracking-tight text-white">1.2M</div>
                </div>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex border-b border-zinc-800 overflow-x-auto scrollbar-hide">
              {[
                { id: "works", label: "Discography", icon: Music2 },
                { id: "services", label: "Services", icon: Zap },
                { id: "about", label: "Biography", icon: Users },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-6 text-sm font-medium tracking-wide transition-colors border-b-2 relative top-[1px] whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-white text-white"
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <tab.icon size={16} strokeWidth={activeTab === tab.id ? 2 : 1.5} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT */}
            <div>
              {activeTab === "works" && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 shadow-xl space-y-3">
                  {beats.length > 0 ? (
                    beats.map((beat) => (
                      <div
                        key={beat.id}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-800/50 bg-[#08080a] transition-colors hover:border-zinc-700 hover:bg-zinc-900 cursor-pointer"
                        onClick={() => router.push(`/beats/${beat.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-950 border border-zinc-800">
                            <img
                              src={beat.imageUrl || `https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400`}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              alt={beat.title}
                            />
                            <button className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-5 h-5 text-white fill-white" />
                            </button>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium tracking-wide text-white group-hover:text-purple-400 transition-colors">
                              {beat.title}
                            </h4>
                            <p className="text-xs font-light tracking-wide mt-1 text-zinc-500 flex items-center gap-2">
                              <span>{beat.bpm} BPM</span>
                              <span className="w-1 h-1 rounded-full bg-zinc-700" />
                              <span>{beat.genre?.[0] || "Hip Hop"}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                          <span className="text-base font-light tracking-tight text-white">
                            {formatAmount(beat.price, producerCurrency)}
                          </span>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="px-4 py-2 rounded-lg text-xs font-medium tracking-wide transition-colors bg-white text-black hover:bg-zinc-200"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-16 text-center rounded-xl border border-dashed border-zinc-800 bg-[#08080a]">
                      <Music2 className="w-8 h-8 text-zinc-600 mx-auto mb-3" strokeWidth={1.5} />
                      <p className="text-sm font-light tracking-wide text-zinc-500">No tracks published yet.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "services" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      title: "Mixing & Mastering",
                      price: 150,
                      icon: Headphones,
                      desc: "Professional mixing with analog gear processing and industry standard loudness.",
                    },
                    {
                      title: "Custom Beat Production",
                      price: 300,
                      icon: Music2,
                      desc: "Exclusive instrumental made from scratch to your exact specifications.",
                    },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="p-5 rounded-2xl border transition-all border-zinc-800 bg-zinc-950 hover:border-zinc-700 flex flex-col h-full shadow-xl"
                    >
                      <div className="flex justify-between items-start mb-5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-[#08080a] text-zinc-300">
                          <s.icon size={20} strokeWidth={1.5} />
                        </div>
                        <span className="text-xl font-light tracking-tight text-white">
                          {formatAmount(s.price, producerCurrency)}
                        </span>
                      </div>
                      <h4 className="text-lg font-light tracking-tight text-white mb-2">{s.title}</h4>
                      <p className="text-sm font-light tracking-wide leading-relaxed text-zinc-400 mb-6 flex-1">
                        {s.desc}
                      </p>
                      <button
                        onClick={() => setIsDrawerOpen(true)}
                        className="w-full py-2.5 rounded-xl text-sm font-medium tracking-wide transition-colors border border-zinc-700 bg-zinc-900 text-white hover:bg-white hover:text-black"
                      >
                        Request Service
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "about" && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
                  <h2 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                    <Users size={14} className="text-zinc-400" />
                    Biography
                  </h2>
                  <p className="text-sm font-light tracking-wide leading-relaxed text-zinc-300 mb-8">
                    {producer.bio || "This producer hasn't added a biography yet."}
                  </p>
                  
                  <div className="space-y-8">
                     <div>
                        <h2 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                           Specialties
                        </h2>
                        <div className="flex flex-wrap gap-2">
                           {specialties.length > 0 ? specialties.map(s => (
                              <span key={s} className="rounded-md border border-zinc-800 bg-[#08080a] px-3 py-1.5 text-xs font-light tracking-wide text-zinc-300">{s}</span>
                           )) : <span className="text-sm font-light tracking-wide text-zinc-500">Not specified</span>}
                        </div>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────── */}
          {/* RIGHT COLUMN: Sticky Rate & Booking Action               */}
          {/* ──────────────────────────────────────────────────────── */}
          <aside className="space-y-6 lg:sticky lg:top-5 lg:self-start">
            
            {/* Booking Card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">Starting at</p>
                  <div className="mt-1 flex items-end gap-1">
                    <span className="text-4xl font-light tracking-tighter text-white">
                      {formatAmount(producer.startingPrice || 100, producerCurrency)}
                    </span>
                  </div>
                </div>
                {producer.isOnline && (
                  <div className="rounded-full border border-green-500/20 bg-green-500/10 p-2 text-green-400">
                    <Zap size={18} strokeWidth={1.5} />
                  </div>
                )}
              </div>

              {isOwnProfile ? (
                 <button 
                   onClick={() => router.push(`/producers/edit/${producerId}`)} 
                   className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3.5 text-sm font-semibold tracking-wide text-white transition-all hover:bg-zinc-800 active:scale-[0.98]"
                 >
                   Edit Profile
                 </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-sm font-semibold tracking-wide text-black transition-all hover:bg-zinc-200 active:scale-[0.98] shadow-lg shadow-white/10"
                  >
                    Hire Producer
                  </button>
                  <button className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-[#08080a] px-4 py-3.5 text-sm font-medium tracking-wide text-zinc-300 transition-all hover:bg-zinc-900 hover:text-white">
                    <MessageCircle size={16} strokeWidth={1.5} /> Message
                  </button>
                </>
              )}
            </div>

            {/* Achievements Card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-light tracking-tight text-white">Achievements</h2>
                </div>
                <Trophy className="h-5 w-5 text-zinc-600" strokeWidth={1.5} />
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-[#08080a] p-3">
                  <div className="rounded-lg bg-green-500/10 p-2">
                    <CheckCircle2 size={16} className="text-green-500" strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-light tracking-wide text-zinc-300">Verified Pro Member</span>
                </li>
                <li className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-[#08080a] p-3">
                  <div className="rounded-lg bg-blue-500/10 p-2">
                    <Star size={16} className="text-blue-400" strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-light tracking-wide text-zinc-300">Top Rated Seller</span>
                </li>
              </ul>
            </div>

            {/* Affiliated Studios Card */}
            {studios.length > 0 && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-light tracking-tight text-white">Affiliated Studios</h2>
                  </div>
                  <Briefcase className="h-5 w-5 text-zinc-600" strokeWidth={1.5} />
                </div>
                <div className="space-y-3">
                  {studios.map((studio) => (
                    <div 
                      key={studio.id} 
                      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-[#08080a] p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
                      onClick={() => router.push(`/studios?id=${studio.id}`)}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-500 transition-colors group-hover:border-zinc-600">
                        <MapPin size={16} strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-medium text-zinc-200 transition-colors group-hover:text-white">
                          {studio.name}
                        </h4>
                        <p className="truncate text-xs font-light tracking-wide text-zinc-500">
                          {studio.location}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </section>
      </main>

      {isDrawerOpen && (
        <ProducerBookingDrawer 
          producerId={producerId}
          producerName={displayName}
          imageUrl={producer.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${producerId}`}
          startingPrice={producer.startingPrice || 100}
          currency={producerCurrency}
          onClose={() => setIsDrawerOpen(false)}
        />
      )}
    </div>
  );
}