"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/providers/ToastProvider";
import { useStudio } from "@/hooks/useStudios";
import dayjs from "dayjs";
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
} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("booking"); // 'booking', 'details', 'equipment'
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // Booking State
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [viewDate, setViewDate] = useState(dayjs()); // Controls the calendar month view
  const [selectedTime, setSelectedTime] = useState("");
  const [sessionLength, setSessionLength] = useState(2);

  // Image Carousel State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Trigger smooth slide-in animation
  useEffect(() => {
    requestAnimationFrame(() => setIsOpen(true));
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 500);
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

  // Calendar Generation
  const generateCalendar = () => {
    const startOfMonth = viewDate.startOf("month");
    const daysInMonth = viewDate.daysInMonth();
    const firstDayOfWeek = startOfMonth.day(); // 0 = Sunday

    const days = [];
    // Pad empty days at start of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    // Add actual days (JUST the numbers)
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
        <div className="w-full md:w-[90vw] max-w-6xl bg-[#030303] border-l border-white/10 h-full flex items-center justify-center pointer-events-auto">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin w-6 h-6 border-2 border-white/20 border-t-white rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Loading Studio...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !studio) {
    return (
      <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
        <div className="w-full md:w-[90vw] max-w-6xl bg-[#030303] border-l border-white/10 h-full flex flex-col items-center justify-center p-8 pointer-events-auto">
          <span className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-4">
            Studio Not Found
          </span>
          <button
            onClick={handleClose}
            className="px-6 py-3 border border-white/20 text-[9px] font-black uppercase tracking-widest text-white hover:bg-white hover:text-black transition-colors"
          >
            Close Drawer
          </button>
        </div>
      </div>
    );
  }

  const estimatedTotal = studio.hourlyRate * sessionLength;
  const timeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM",
  ];

  const isTimeSlotAvailable = (time: string) => {
    if (!studio.bookings || studio.bookings.length === 0) return true;
    const timeParts = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeParts) return true;

    let hours = parseInt(timeParts[1]);
    const minutes = parseInt(timeParts[2]);
    const period = timeParts[3].toUpperCase();

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    const slotStart = selectedDate.hour(hours).minute(minutes).second(0);
    const slotEnd = slotStart.add(sessionLength, "hour");

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
      setBookingError("PLEASE SELECT A TIME SLOT");
      return;
    }
    if (!isTimeSlotAvailable(selectedTime)) {
      setBookingError("SLOT ALREADY BOOKED");
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
          studioId: studio.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          notes: "",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || data.error || "Failed to create booking");
      }

      showToast("BOOKING REQUEST SUBMITTED", "success");
      router.push("/bookings");
    } catch (error: any) {
      setBookingError(error.message || "FAILED TO BOOK");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] transition-opacity duration-500 ease-out ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      <div
        className={`fixed top-0 right-0 bottom-0 w-full md:w-[90vw] max-w-6xl bg-[#030303] border-l border-white/10 z-[101] flex flex-col md:flex-row transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Absolute Close Button - Always Top Right */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-10 h-10 bg-black border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors z-[110]"
        >
          <X size={16} strokeWidth={2} />
        </button>

        {/* ═══════════════════════════════════════════ */}
        {/* LEFT PANEL: IMAGE CAROUSEL & META HEADER    */}
        {/* ═══════════════════════════════════════════ */}
        <div className="relative w-full md:w-1/2 h-64 md:h-full bg-[#0A0A0A] shrink-0 border-b md:border-b-0 md:border-r border-white/10 group flex flex-col">
          <div className="relative flex-1 w-full h-full">
            {images.length > 0 ? (
              <>
                <img
                  src={images[currentImageIndex]}
                  alt={`${studio.name} - ${currentImageIndex + 1}`}
                  className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-luminosity transition-opacity duration-300"
                />
                {images.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={prevImage}
                      className="w-10 h-10 bg-black/50 border border-white/20 text-white flex items-center justify-center hover:bg-black hover:border-white transition-colors backdrop-blur-md"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="w-10 h-10 bg-black/50 border border-white/20 text-white flex items-center justify-center hover:bg-black hover:border-white transition-colors backdrop-blur-md"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
                {images.length > 1 && (
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {images.map((_, i) => (
                      <div
                        key={i}
                        className={`h-0.5 transition-all ${
                          i === currentImageIndex ? "w-6 bg-white" : "w-3 bg-white/30"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-[#111]">
                <Mic2 className="text-zinc-700 w-16 h-16" />
              </div>
            )}
            
            {/* Brutalist Gradient Overlay to make text readable */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/40 to-black/30 pointer-events-none" />

            <div className="absolute bottom-6 left-6 right-6 flex flex-col pointer-events-none">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                {studio.name}
                {studio.verificationStatus === "VERIFIED" && (
                  <BadgeCheck size={32} className="text-white shrink-0" />
                )}
              </h2>
              <div className="flex items-center gap-4 text-[11px] md:text-xs font-bold uppercase tracking-widest text-zinc-300 mt-4">
                <span className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 border border-white/10">
                  <MapPin size={12} /> {studio.location.split(",")[0]}
                </span>
                <span className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 border border-white/10">
                  <Star size={12} className="fill-current" /> {studio.rating || "NEW"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* RIGHT PANEL: CONTENT & BOOKING FLOW         */}
        {/* ═══════════════════════════════════════════ */}
        <div className="w-full md:w-1/2 flex flex-col h-[calc(100vh-16rem)] md:h-full bg-[#030303]">
          
          {/* Brutalist Tabs */}
          <div className="flex border-b border-white/10 shrink-0 mt-2 md:mt-16">
            {["booking", "details", "equipment"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-colors border-r border-white/10 last:border-r-0 ${
                  activeTab === tab
                    ? "bg-white text-black"
                    : "bg-black text-zinc-500 hover:text-white hover:bg-[#111]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            {activeTab === "booking" && (
              <div className="space-y-10">
                
                {/* 1. Full Grid Calendar */}
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-white mb-4 border-b border-white/10 pb-2">
                    1. Select Date
                  </span>
                  
                  <div className="border border-white/10 bg-[#0A0A0A] p-4">
                    {/* Calendar Header / Nav */}
                    <div className="flex justify-between items-center mb-6">
                      <button 
                        onClick={() => setViewDate(viewDate.subtract(1, "month"))}
                        className="w-8 h-8 flex items-center justify-center border border-white/10 hover:bg-white hover:text-black text-white transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-[11px] font-black uppercase tracking-widest text-white">
                        {viewDate.format("MMMM YYYY")}
                      </span>
                      <button 
                        onClick={() => setViewDate(viewDate.add(1, "month"))}
                        className="w-8 h-8 flex items-center justify-center border border-white/10 hover:bg-white hover:text-black text-white transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    {/* Days of Week */}
                    <div className="grid grid-cols-7 mb-2">
                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                        <div key={day} className="text-center text-[8px] font-black uppercase tracking-widest text-zinc-600">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {generateCalendar().map((day, i) => {
                        if (!day) return <div key={i} className="aspect-square" />;
                        
                        const dateObj = viewDate.date(day);
                        const isPast = dateObj.isBefore(dayjs().startOf("day"));
                        const isSelected = selectedDate.format("YYYY-MM-DD") === dateObj.format("YYYY-MM-DD");

                        return (
                          <button
                            key={i}
                            disabled={isPast}
                            onClick={() => setSelectedDate(dateObj)}
                            className={`aspect-square flex items-center justify-center text-[10px] font-black transition-colors ${
                              isPast
                                ? "text-zinc-800 cursor-not-allowed"
                                : isSelected
                                ? "bg-white text-black"
                                : "bg-[#111] text-zinc-400 hover:bg-zinc-800 hover:text-white border border-transparent hover:border-white/20"
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
                  <span className="block text-[10px] font-black uppercase tracking-widest text-white mb-4 border-b border-white/10 pb-2">
                    2. Session Length
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 4, 8].map((hours) => (
                      <button
                        key={hours}
                        onClick={() => setSessionLength(hours)}
                        className={`py-3 text-[10px] font-black uppercase tracking-widest border transition-colors ${
                          sessionLength === hours
                            ? "bg-white border-white text-black"
                            : "bg-[#0A0A0A] border-white/10 text-zinc-500 hover:border-white/40 hover:text-white"
                        }`}
                      >
                        {hours} HRS
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Time Slots */}
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-white mb-4 border-b border-white/10 pb-2">
                    3. Select Time
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {timeSlots.map((time) => {
                      const isAvailable = isTimeSlotAvailable(time);
                      return (
                        <button
                          key={time}
                          onClick={() => isAvailable && setSelectedTime(time)}
                          disabled={!isAvailable}
                          className={`py-3 text-[9px] font-black uppercase tracking-widest border transition-colors relative ${
                            !isAvailable
                              ? "bg-black border-red-900/30 text-zinc-800 cursor-not-allowed line-through"
                              : selectedTime === time
                              ? "bg-white border-white text-black"
                              : "bg-[#0A0A0A] border-white/10 text-zinc-400 hover:border-white/50 hover:text-white"
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {bookingError && (
                  <div className="p-4 border border-red-500/30 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest">
                    ERROR: {bookingError}
                  </div>
                )}
              </div>
            )}

            {activeTab === "details" && (
              <div className="space-y-10">
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-white mb-4 border-b border-white/10 pb-2">
                    About the space
                  </span>
                  <p className="text-xs leading-relaxed text-zinc-400 font-medium">
                    {studio.description ||
                      "NO DESCRIPTION PROVIDED BY THE STUDIO OWNER."}
                  </p>
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-white mb-4 border-b border-white/10 pb-2">
                    Amenities
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Wifi, label: "High-speed WiFi" },
                      { icon: Car, label: "Free Parking" },
                      { icon: Coffee, label: "Coffee Bar" },
                      { icon: Volume2, label: "Sound Proof" },
                    ].map((amenity, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-4 bg-[#0A0A0A] border border-white/5 text-zinc-300"
                      >
                        <amenity.icon size={14} className="text-zinc-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          {amenity.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "equipment" && (
              <div className="space-y-4">
                <span className="block text-[10px] font-black uppercase tracking-widest text-white mb-4 border-b border-white/10 pb-2">
                  Available Gear
                </span>
                {studio.equipment && studio.equipment.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {studio.equipment.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-4 bg-[#0A0A0A] border border-white/5 hover:border-white/20 transition-colors"
                      >
                        <CheckCircle2 size={14} className="text-white shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 border border-dashed border-white/10 flex items-center justify-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                      NO EQUIPMENT LISTED
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* STICKY FOOTER (Right side only)             */}
          {/* ═══════════════════════════════════════════ */}
          <div className="bg-black border-t border-white/10 p-6 shrink-0 mt-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                  Total (Est.)
                </span>
                <span className="text-xl md:text-2xl font-black text-white">
                  ${estimatedTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                  Rate
                </span>
                <span className="text-[11px] font-black text-white">
                  {sessionLength} HRS @ ${studio.hourlyRate}/HR
                </span>
              </div>
            </div>
            <button
              onClick={handleBooking}
              disabled={!selectedTime || bookingLoading || activeTab !== "booking"}
              className={`w-full py-5 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                !selectedTime || activeTab !== "booking"
                  ? "bg-[#111] text-zinc-600 border border-white/5 cursor-not-allowed"
                  : "bg-white text-black hover:bg-zinc-200 hover:scale-[0.99]"
              }`}
            >
              {bookingLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  PROCESSING...
                </div>
              ) : activeTab !== "booking" ? (
                "RETURN TO BOOKING TAB"
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  REQUEST TO BOOK
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}