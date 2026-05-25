"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/providers/ToastProvider";
import { useStudio } from "@/hooks/useStudios";
import { formatAmount } from "@/lib/currency";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import {
  X,
  Star,
  MapPin,
  CheckCircle2,
  Mic2,
  Wifi,
  Car,
  Coffee,
  Volume2,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock
} from "lucide-react";

// Extend dayjs for proper time comparisons
dayjs.extend(isSameOrBefore);

export default function StudioBookingDrawer({
  studioId,
  onClose,
}: {
  studioId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { data: studio, isLoading, error } = useStudio(studioId);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("booking"); 
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // Booking State
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [viewDate, setViewDate] = useState(dayjs()); // For month navigation
  const [selectedTime, setSelectedTime] = useState("");
  const [sessionLength, setSessionLength] = useState(2);

  // Image Carousel State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Trigger smooth slide-in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 400); // Wait for slide-out transition before unmounting
  };

  const images = studio?.imageUrls?.length
    ? studio.imageUrls
    : studio?.imageUrl
    ? [studio.imageUrl]
    : [];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // --------------------------------------------------------
  // PREMIUM CALENDAR GENERATION
  // --------------------------------------------------------
  const generateCalendar = () => {
    const startOfMonth = viewDate.startOf("month");
    const daysInMonth = viewDate.daysInMonth();
    const firstDayOfWeek = startOfMonth.day(); // 0 = Sunday

    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const timeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM",
  ];

  const isTimeSlotAvailable = (time: string) => {
    const timeParts = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeParts) return false;

    let hours = parseInt(timeParts[1]);
    const minutes = parseInt(timeParts[2]);
    const period = timeParts[3].toUpperCase();

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    const slotStart = selectedDate.hour(hours).minute(minutes).second(0);
    const slotEnd = slotStart.add(sessionLength, "hour");

    const isToday = selectedDate.isSame(dayjs(), 'day');
    if (isToday && slotStart.isBefore(dayjs())) return false; 

    if (!studio?.bookings || studio.bookings.length === 0) return true;

    return !studio.bookings.some((booking) => {
      const bookingStart = dayjs(booking.startTime);
      const bookingEnd = dayjs(booking.endTime);
      
      if (bookingStart.format("YYYY-MM-DD") !== selectedDate.format("YYYY-MM-DD"))
        return false;

      return (
        (slotStart.isBefore(bookingEnd) && slotEnd.isAfter(bookingStart)) ||
        slotStart.isSame(bookingStart) ||
        slotEnd.isSame(bookingEnd)
      );
    });
  };

  const handleBooking = async () => {
    if (!selectedTime) {
      setBookingError("Please select an available time slot.");
      return;
    }
    if (!isTimeSlotAvailable(selectedTime)) {
      setBookingError("This slot is no longer available.");
      return;
    }

    try {
      setBookingLoading(true);
      setBookingError("");

      const timeParts = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      let hours = parseInt(timeParts![1]);
      const minutes = parseInt(timeParts![2]);
      if (timeParts![3].toUpperCase() === "PM" && hours !== 12) hours += 12;
      if (timeParts![3].toUpperCase() === "AM" && hours === 12) hours = 0;

      const startTime = selectedDate.hour(hours).minute(minutes).second(0).toDate();
      const endTime = selectedDate.hour(hours).minute(minutes).add(sessionLength, "hour").second(0).toDate();

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioId: studio?.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          notes: "",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || data.error || "Failed to create booking");
      }

      showToast("Booking request submitted successfully!", "success");
      handleClose(); // Close drawer on success
      router.push("/bookings");
    } catch (error: any) {
      setBookingError(error.message || "Failed to book session.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
        <div className="w-full md:w-[480px] lg:w-[540px] bg-[#030303] border-l border-zinc-800 h-full flex flex-col pointer-events-auto sm:rounded-l-2xl shadow-2xl animate-pulse">
          <div className="h-64 bg-zinc-900 shrink-0 w-full" />
          <div className="p-6 space-y-4">
            <div className="h-8 bg-zinc-900 rounded-lg w-2/3" />
            <div className="h-4 bg-zinc-900 rounded w-1/3" />
            <div className="h-20 bg-zinc-900 rounded-xl w-full mt-8" />
            <div className="h-40 bg-zinc-900 rounded-xl w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !studio) {
    return (
      <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
        <div className="w-full md:w-[480px] lg:w-[540px] bg-[#030303] border-l border-zinc-800 h-full flex flex-col items-center justify-center p-8 pointer-events-auto sm:rounded-l-2xl shadow-2xl">
          <span className="text-sm font-medium text-red-400 mb-4">Studio Not Found</span>
          <button onClick={handleClose} className="px-6 py-2.5 rounded-xl border border-zinc-700 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
            Close Drawer
          </button>
        </div>
      </div>
    );
  }

  const studioCurrency = studio.currency || "USD";
  const estimatedTotal = studio.hourlyRate * sessionLength;

  return (
    <>
      {/* Smooth Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-md z-[100] transition-opacity duration-500 ease-in-out ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* Sleek Side Drawer Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full md:w-[480px] lg:w-[540px] bg-[#030303] border-l border-zinc-800 z-[101] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.8)] sm:rounded-l-3xl overflow-hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Floating Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md border border-white/20 text-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-colors z-[110] shadow-lg"
        >
          <X size={18} strokeWidth={2} />
        </button>

        {/* ═══════════════════════════════════════════ */}
        {/* TOP IMAGE HEADER (Shrunk)                   */}
        {/* ═══════════════════════════════════════════ */}
        <div className="relative w-full h-[160px] sm:h-[200px] shrink-0 bg-zinc-950 border-b border-zinc-800 group">
          {images.length > 0 ? (
            <>
              <img
                src={images[currentImageIndex]}
                alt={`${studio.name} - ${currentImageIndex + 1}`}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
              />
              {images.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={prevImage} className="w-10 h-10 rounded-full bg-black/40 border border-white/20 text-white flex items-center justify-center hover:bg-black/60 hover:scale-105 transition-all backdrop-blur-md">
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={nextImage} className="w-10 h-10 rounded-full bg-black/40 border border-white/20 text-white flex items-center justify-center hover:bg-black/60 hover:scale-105 transition-all backdrop-blur-md">
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
              {images.length > 1 && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-md">
                  {images.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentImageIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-zinc-900">
              <Mic2 className="text-zinc-700 w-16 h-16" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/60 to-transparent pointer-events-none" />

          <div className="absolute bottom-4 left-6 right-6 flex flex-col pointer-events-none">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2 line-clamp-1">
              {studio.name}
              {studio.verificationStatus === "VERIFIED" && <BadgeCheck size={24} className="text-blue-500 shrink-0" />}
            </h2>
            <div className="flex items-center gap-3 text-xs font-medium text-zinc-300 mt-2">
              <span className="flex items-center gap-1.5 bg-zinc-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-800">
                <MapPin size={14} className="text-zinc-400" /> {studio.location.split(",")[0]}
              </span>
              <span className="flex items-center gap-1.5 bg-zinc-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-800">
                <Star size={14} className="fill-yellow-500 text-yellow-500" /> {studio.rating || "New"}
              </span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* DRAWER CONTENT (Scrollable, Reduced Padding)*/}
        {/* ═══════════════════════════════════════════ */}
        <div className="flex border-b border-zinc-800 shrink-0 px-6">
          {["booking", "details", "equipment"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-4 text-sm font-medium transition-colors border-b-2 relative top-[1px] ${
                activeTab === tab ? "border-purple-400 text-purple-400" : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-8 scrollbar-hide">
          {activeTab === "booking" && (
            <div className="space-y-6">
              
              {/* 1. Artistic, Compact Calendar Grid */}
              <div>
                <h3 className="text-sm font-medium text-zinc-200 mb-3 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-zinc-500" /> Select Date
                </h3>
                
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
                          onClick={() => {
                            setSelectedDate(dateObj);
                            setSelectedTime(""); // Reset time on new date selection
                          }}
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

              {/* 2. Session Length */}
              <div>
                <h3 className="text-sm font-medium text-zinc-200 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-500" /> Session Length
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 4, 8].map((hours) => (
                    <button
                      key={hours}
                      onClick={() => {
                        setSessionLength(hours);
                        setSelectedTime(""); 
                      }}
                      className={`py-2 sm:py-3 text-sm font-medium rounded-xl border transition-all ${
                        sessionLength === hours
                          ? "bg-white border-white text-black shadow-sm"
                          : "bg-[#0A0A0A] border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                      }`}
                    >
                      {hours} {hours === 1 ? 'hr' : 'hrs'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Time Slots */}
              <div>
                <h3 className="text-sm font-medium text-zinc-200 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-500" /> Available Times on {selectedDate.format("MMM D")}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((time) => {
                    const isAvailable = isTimeSlotAvailable(time);
                    return (
                      <button
                        key={time}
                        onClick={() => isAvailable && setSelectedTime(time)}
                        disabled={!isAvailable}
                        className={`py-2 sm:py-3 text-sm font-medium rounded-xl border transition-colors relative ${
                          !isAvailable
                            ? "bg-red-500/5 border-red-500/10 text-red-500/30 cursor-not-allowed line-through"
                            : selectedTime === time
                            ? "bg-purple-500/20 text-purple-400 border-purple-500/40"
                            : "bg-[#0A0A0A] border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>

              {bookingError && (
                <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm flex items-center gap-2">
                  <X size={18} />
                  {bookingError}
                </div>
              )}
            </div>
          )}

          {activeTab === "details" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-sm font-semibold text-zinc-200 mb-3">About the space</h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  {studio.description || "No description provided by the studio owner."}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-200 mb-3">Amenities</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Wifi, label: "High-speed WiFi" },
                    { icon: Car, label: "Free Parking" },
                    { icon: Coffee, label: "Coffee Bar" },
                    { icon: Volume2, label: "Sound Proof" },
                  ].map((amenity, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-300"
                    >
                      <amenity.icon size={18} className="text-zinc-500" />
                      <span className="text-sm">{amenity.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "equipment" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h3 className="text-sm font-semibold text-zinc-200 mb-3">Available Gear</h3>
              {studio.equipment && studio.equipment.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {studio.equipment.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800"
                    >
                      <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                      <span className="text-sm text-zinc-300">{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 border border-dashed border-zinc-800 rounded-xl flex items-center justify-center bg-zinc-900/30">
                  <span className="text-sm text-zinc-500">No equipment listed for this studio.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* STICKY FOOTER (Compressed Flow)             */}
        {/* ═══════════════════════════════════════════ */}
        <div className="bg-[#0A0A0A] border-t border-zinc-800 p-4 sm:p-5 shrink-0 mt-auto sm:rounded-bl-2xl">
          <div className="flex justify-between items-end mb-3">
            <div className="flex flex-col">
              <span className="text-[11px] text-zinc-500 mb-0.5">Total (Estimated)</span>
              <span className="text-2xl font-bold text-white tracking-tight">
                {formatAmount(estimatedTotal, studioCurrency)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[11px] text-zinc-500 mb-0.5">Rate Breakdown</span>
              <span className="text-xs font-medium text-zinc-300">
                {sessionLength} hrs @ {formatAmount(studio.hourlyRate, studioCurrency)}/hr
              </span>
            </div>
          </div>
          
          <button
            onClick={handleBooking}
            disabled={!selectedTime || bookingLoading || activeTab !== "booking"}
            className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              !selectedTime || activeTab !== "booking"
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-white hover:bg-zinc-200 text-black shadow-lg shadow-white/10 active:scale-[0.98]"
            }`}
          >
            {bookingLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Processing...
              </div>
            ) : activeTab !== "booking" ? (
              "Return to Booking"
            ) : (
              <>
                <CheckCircle2 size={16} />
                Request to Book
              </>
            )}
          </button>
          <p className="text-center text-[10px] mt-2.5 text-zinc-500">
            You won't be charged until the studio confirms.
          </p>
        </div>
      </div>
      
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
