"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../../../providers/ToastProvider";
import { useStudio } from "../../../../hooks/useStudios";
import dayjs from "dayjs";
import {
  Star,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  Calendar,
  Mic2,
  ArrowLeft,
  Wifi,
  Car,
  Coffee,
  Users,
  Volume2,
  BadgeCheck,
} from "lucide-react";

export default function BookStudio({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { showToast } = useToast();

  const { data: studio, isLoading, error } = useStudio(params.id);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedTime, setSelectedTime] = useState("");
  const [sessionLength, setSessionLength] = useState(2);
  const [activeTab, setActiveTab] = useState("details");
  const [showCalendar, setShowCalendar] = useState(true);
  const [showTimeSlots, setShowTimeSlots] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto flex items-center justify-center bg-[#030303]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-zinc-400">Loading studio details...</p>
        </div>
      </div>
    );
  }

  if (error || !studio) {
    return (
      <div className="h-full overflow-y-auto flex items-center justify-center bg-[#030303]">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2 text-white">Studio not found</h1>
          <p className="text-sm mb-4 text-zinc-400">
            {error instanceof Error ? error.message : "The studio you're looking for doesn't exist."}
          </p>
          <button
            onClick={() => router.push("/studios")}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            Return to studios
          </button>
        </div>
      </div>
    );
  }

  const hourlyRate = studio.hourlyRate;
  const estimatedTotal = hourlyRate * sessionLength;

  const timeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
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
      const bookingDate = bookingStart.format("YYYY-MM-DD");
      const selectedDateStr = selectedDate.format("YYYY-MM-DD");

      if (bookingDate !== selectedDateStr) return false;

      return (
        (slotStart.isBefore(bookingEnd) && slotEnd.isAfter(bookingStart)) ||
        (slotStart.isSame(bookingStart)) ||
        (slotEnd.isSame(bookingEnd))
      );
    });
  };

  const amenities = [
    { icon: Wifi, label: "High-speed WiFi" },
    { icon: Car, label: "Free Parking" },
    { icon: Coffee, label: "Coffee Bar" },
    { icon: Users, label: "Green Room" },
    { icon: Volume2, label: "Sound Proof" },
  ];

  const handleBooking = async () => {
    if (!selectedTime) {
      setBookingError("Please select a time slot");
      return;
    }

    if (!isTimeSlotAvailable(selectedTime)) {
      setBookingError("This time slot is already booked. Please select a different time.");
      showToast("This time slot is already booked", "error");
      return;
    }

    try {
      setBookingLoading(true);
      setBookingError("");

      const timeParts = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!timeParts) {
        setBookingError("Invalid time format");
        return;
      }

      let hours = parseInt(timeParts[1]);
      const minutes = parseInt(timeParts[2]);
      const period = timeParts[3].toUpperCase();

      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;

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

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = typeof data.error === 'string' 
          ? data.error 
          : data.error?.message || data.message || "Failed to create booking";
        throw new Error(errorMessage);
      }

      showToast("Booking request submitted! You'll be notified when the studio owner responds.", "success");
      router.push("/bookings");
    } catch (error: any) {
      console.error("Booking error:", error);
      const errorMessage = error.message || "Failed to create booking. Please try again.";
      setBookingError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#030303] text-white">
      <div className="max-w-7xl mx-auto p-6 md:p-8">
        
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/studios")}
            className="flex items-center gap-2 text-sm mb-6 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to studios
          </button>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold mb-3 flex items-center gap-2 text-white tracking-tight">
                {studio.name}
                {(studio as any).verificationStatus === "VERIFIED" && (
                  <BadgeCheck size={24} className="text-blue-500 shrink-0" />
                )}
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{studio.location}</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  <span className="text-sm font-medium">{studio.rating}</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">${studio.hourlyRate}/hour</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Studio Image */}
            <div className="rounded-xl overflow-hidden border border-zinc-800 bg-[#0A0A0A]">
              {studio.imageUrl ? (
                <img
                  src={studio.imageUrl}
                  alt={studio.name}
                  className="w-full h-64 lg:h-80 object-cover"
                />
              ) : (
                <div className="w-full h-64 lg:h-80 flex items-center justify-center bg-zinc-900/50">
                  <Mic2 className="w-16 h-16 text-zinc-600" />
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="rounded-xl border border-zinc-800 bg-[#0A0A0A]">
              <div className="flex border-b border-zinc-800 overflow-x-auto scrollbar-hide">
                {["details", "equipment", "reviews"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 min-w-[120px] px-6 py-4 text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? "text-purple-400 border-b-2 border-purple-400"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === "details" && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-zinc-200">About this studio</h3>
                      <p className="text-sm leading-relaxed text-zinc-400">
                        {studio.description || "Professional recording studio with state-of-the-art equipment and comfortable environment for artists and producers."}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-zinc-200">Amenities</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {amenities.map((amenity, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-300"
                          >
                            <amenity.icon className="w-4 h-4 text-zinc-500" />
                            <span className="text-sm">{amenity.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "equipment" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-zinc-200 mb-2">Featured Equipment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {studio.equipment.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-300"
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-zinc-200 mb-2">Customer Reviews</h3>
                    {studio.reviews && studio.reviews.length > 0 ? (
                      <div className="space-y-3">
                        {studio.reviews.map((review) => (
                          <div key={review.id} className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
                                {review.author?.username?.[0]?.toUpperCase() || review.author?.fullName?.[0]?.toUpperCase() || "U"}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-zinc-200">
                                    {review.author?.fullName || review.author?.username || "Anonymous"}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                    <span className="text-xs text-zinc-400">{review.rating}</span>
                                  </div>
                                </div>
                                <span className="text-xs text-zinc-500">
                                  {dayjs(review.createdAt).format("MMMM D, YYYY")}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-zinc-400">
                              {review.comment || "Great studio with amazing equipment and atmosphere!"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center border border-zinc-800 border-dashed rounded-lg bg-zinc-900/30">
                        <p className="text-sm text-zinc-500">No reviews yet for this studio.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-zinc-800 bg-[#0A0A0A] sticky top-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-6 text-white">Book This Studio</h3>

                {/* Date Selection - NOW HORIZONTALLY SCROLLABLE */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-zinc-300">Select Date</label>
                    <button
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="text-xs px-2 py-1 rounded bg-zinc-900 text-purple-400 hover:bg-zinc-800 transition-colors"
                    >
                      {showCalendar ? "Pick specific date" : "Show calendar"}
                    </button>
                  </div>
                  
                  {showCalendar ? (
                    <>
                      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide snap-x">
                        {Array.from({ length: 14 }, (_, i) => {
                          const date = dayjs().add(i, 'day');
                          const isSelected = selectedDate.format("YYYY-MM-DD") === date.format("YYYY-MM-DD");
                          
                          return (
                            <button
                              key={i}
                              onClick={() => setSelectedDate(date)}
                              className={`flex-shrink-0 w-16 flex flex-col items-center justify-center p-2.5 rounded-lg border transition-colors snap-start ${
                                isSelected
                                  ? "bg-purple-500/20 text-purple-400 border-purple-500/40"
                                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600"
                              }`}
                            >
                              <span className="text-xs font-medium mb-1">{date.format("ddd")}</span>
                              <span className={`text-base font-semibold ${isSelected ? "text-purple-300" : "text-zinc-200"}`}>
                                {date.format("D")}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs mt-2 text-zinc-500">
                        Selected: <span className="text-zinc-300">{selectedDate.format("MMMM D, YYYY")}</span>
                      </p>
                    </>
                  ) : (
                    <input
                      type="date"
                      value={selectedDate.format("YYYY-MM-DD")}
                      onChange={(e) => setSelectedDate(dayjs(e.target.value))}
                      min={dayjs().format("YYYY-MM-DD")}
                      className="w-full p-3 rounded-lg border bg-zinc-900 border-zinc-800 text-white [color-scheme:dark] outline-none focus:border-purple-500 transition-colors"
                    />
                  )}
                </div>

                {/* Time Slots */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-zinc-300">Available Times</label>
                    <button
                      onClick={() => setShowTimeSlots(!showTimeSlots)}
                      className="text-xs px-2 py-1 rounded bg-zinc-900 text-purple-400 hover:bg-zinc-800 transition-colors"
                    >
                      {showTimeSlots ? "Enter custom time" : "Show time slots"}
                    </button>
                  </div>
                  
                  {showTimeSlots ? (
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map((time) => {
                        const isAvailable = isTimeSlotAvailable(time);
                        return (
                          <button
                            key={time}
                            onClick={() => isAvailable && setSelectedTime(time)}
                            disabled={!isAvailable}
                            className={`py-2.5 text-xs rounded-lg border transition-colors relative ${
                              !isAvailable
                                ? "bg-red-500/5 text-red-500/40 border-red-500/10 cursor-not-allowed line-through"
                                : selectedTime === time
                                  ? "bg-purple-500/20 text-purple-400 border-purple-500/40"
                                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600"
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <input
                      type="time"
                      value={
                        selectedTime
                          ? (() => {
                              const match = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
                              if (!match) return "";
                              let hours = parseInt(match[1]);
                              const minutes = match[2];
                              const period = match[3].toUpperCase();
                              if (period === "PM" && hours !== 12) hours += 12;
                              if (period === "AM" && hours === 12) hours = 0;
                              return `${hours.toString().padStart(2, "0")}:${minutes}`;
                            })()
                          : ""
                      }
                      onChange={(e) => {
                        const time24 = e.target.value;
                        if (!time24) return;
                        const [hours, minutes] = time24.split(":");
                        const hour = parseInt(hours);
                        const period = hour >= 12 ? "PM" : "AM";
                        const hour12 = hour % 12 || 12;
                        setSelectedTime(`${hour12}:${minutes} ${period}`);
                      }}
                      className="w-full p-3 rounded-lg border bg-zinc-900 border-zinc-800 text-white [color-scheme:dark] outline-none focus:border-purple-500 transition-colors"
                    />
                  )}
                  {showTimeSlots && studio.bookings && studio.bookings.length > 0 && (
                    <p className="text-xs mt-3 text-zinc-500">
                      <span className="text-red-500/70 line-through mr-1">12:00 PM</span> = Already booked
                    </p>
                  )}
                </div>

                {/* Session Length */}
                <div className="mb-6">
                  <label className="text-sm font-medium mb-3 block text-zinc-300">
                    Session Length
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[2, 4, 8].map((hours) => (
                      <button
                        key={hours}
                        onClick={() => setSessionLength(hours)}
                        className={`py-2.5 text-xs rounded-lg border transition-colors ${
                          sessionLength === hours
                            ? "bg-purple-500/20 text-purple-400 border-purple-500/40"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600"
                        }`}
                      >
                        {hours} hours
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Summary */}
                <div className="p-4 rounded-lg mb-6 bg-zinc-900/50 border border-zinc-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-zinc-400">
                      {sessionLength} hours × ${studio.hourlyRate}/hr
                    </span>
                    <span className="text-sm font-medium text-zinc-200">
                      ${estimatedTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Service fee</span>
                    <span className="text-sm text-zinc-400">
                      ${(estimatedTotal * 0.1).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-zinc-800 mt-3 pt-3 flex justify-between items-center">
                    <span className="font-semibold text-white">Total</span>
                    <span className="font-semibold text-white">
                      ${(estimatedTotal * 1.1).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Error Message */}
                {bookingError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    <p className="text-xs">{bookingError}</p>
                  </div>
                )}

                {/* Book Button */}
                <button
                  onClick={handleBooking}
                  disabled={!selectedTime || bookingLoading}
                  className={`w-full py-3.5 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    !selectedTime || bookingLoading
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-500 text-white active:scale-95"
                  }`}
                >
                  {bookingLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Request to Book
                    </>
                  )}
                </button>

                <p className="text-center text-xs mt-4 text-zinc-500">
                  You will only be charged when the studio confirms
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}