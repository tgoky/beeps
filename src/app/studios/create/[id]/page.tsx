"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../../../../providers/ThemeProvider";
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
} from "lucide-react";

export default function BookStudio({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { theme } = useTheme();
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
      <div className={`min-h-screen flex items-center justify-center ${
        theme === "dark" ? "bg-gray-950" : "bg-gray-50"
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className={`text-sm ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>
            Loading studio details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !studio) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === "dark" ? "bg-gray-950" : "bg-gray-50"
      }`}>
        <div className="text-center">
          <h1 className={`text-xl font-semibold mb-2 ${
            theme === "dark" ? "text-gray-200" : "text-gray-900"
          }`}>
            Studio not found
          </h1>
          <p className={`text-sm mb-4 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>
            {error instanceof Error ? error.message : "The studio you're looking for doesn't exist."}
          </p>
          <button
            onClick={() => router.push("/studios")}
            className={`text-sm ${
              theme === "dark" ? "text-purple-400" : "text-purple-600"
            }`}
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

  // Check if a time slot is available
  const isTimeSlotAvailable = (time: string) => {
    if (!studio.bookings || studio.bookings.length === 0) return true;

    // Parse the time slot
    const timeParts = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeParts) return true;

    let hours = parseInt(timeParts[1]);
    const minutes = parseInt(timeParts[2]);
    const period = timeParts[3].toUpperCase();

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    const slotStart = selectedDate.hour(hours).minute(minutes).second(0);
    const slotEnd = slotStart.add(sessionLength, "hour");

    // Check against existing bookings
    return !studio.bookings.some((booking) => {
      const bookingStart = dayjs(booking.startTime);
      const bookingEnd = dayjs(booking.endTime);
      const bookingDate = bookingStart.format("YYYY-MM-DD");
      const selectedDateStr = selectedDate.format("YYYY-MM-DD");

      // Only check bookings on the selected date
      if (bookingDate !== selectedDateStr) return false;

      // Check if time slots overlap
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

  // Check if the selected time slot is available
  if (!isTimeSlotAvailable(selectedTime)) {
    setBookingError("This time slot is already booked. Please select a different time.");
    showToast("This time slot is already booked", "error");
    return;
  }

  try {
    setBookingLoading(true);
    setBookingError("");

    // Parse selected time to 24-hour format
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

    // Create start and end times
    const startTime = selectedDate
      .hour(hours)
      .minute(minutes)
      .second(0)
      .toDate();

    const endTime = selectedDate
      .hour(hours)
      .minute(minutes)
      .add(sessionLength, "hour")
      .second(0)
      .toDate();

    // Make API call to create booking
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        studioId: studio.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: "",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // ✅ FIX: Properly extract error message
      const errorMessage = typeof data.error === 'string' 
        ? data.error 
        : data.error?.message || data.message || "Failed to create booking";
      
      throw new Error(errorMessage);
    }

    // Show success toast
    showToast("Booking request submitted! You'll be notified when the studio owner responds.", "success");
    router.push("/bookings");
  } catch (error: any) {
    console.error("Booking error:", error);
    
    // ✅ FIX: Ensure we display a string, not an object
    const errorMessage = error.message || "Failed to create booking. Please try again.";
    setBookingError(errorMessage);
    showToast(errorMessage, "error");
  } finally {
    setBookingLoading(false);
  }
};


  return (
    <div className={`min-h-screen ${
      theme === "dark" ? "bg-gray-950" : "bg-gray-50"
    }`}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/studios")}
            className={`flex items-center gap-2 text-sm mb-4 transition-all duration-200 ${
              theme === "dark" 
                ? "text-gray-400 hover:text-gray-200" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to studios
          </button>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <h1 className={`text-2xl font-bold mb-2 ${
                theme === "dark" ? "text-gray-100" : "text-gray-900"
              }`}>
                {studio.name}
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <MapPin className={`w-4 h-4 ${
                    theme === "dark" ? "text-gray-500" : "text-gray-600"
                  }`} />
                  <span className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}>
                    {studio.location}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  <span className={`text-sm font-medium ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}>
                    {studio.rating}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <DollarSign className={`w-4 h-4 ${
                    theme === "dark" ? "text-gray-500" : "text-gray-600"
                  }`} />
                  <span className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}>
                    ${studio.hourlyRate}/hour
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Studio Image */}
            <div className={`
              rounded-xl overflow-hidden border transition-all duration-200
              ${theme === "dark"
                ? "bg-gray-900/40 border-gray-800/60"
                : "bg-white/50 border-gray-200/60"
              }
            `}>
              {studio.imageUrl ? (
                <img
                  src={studio.imageUrl}
                  alt={studio.name}
                  className="w-full h-64 lg:h-80 object-cover"
                />
              ) : (
                <div className={`w-full h-64 lg:h-80 flex items-center justify-center ${
                  theme === "dark" ? "bg-gray-800/40" : "bg-gray-100"
                }`}>
                  <Mic2 className={`w-16 h-16 ${
                    theme === "dark" ? "text-gray-600" : "text-gray-400"
                  }`} />
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className={`
              rounded-xl border backdrop-blur-sm
             ${theme === "dark" 
  ? "bg-gray-950 border-gray-800/60"  // ← Use gray-950 instead
  : "bg-white/50 border-gray-200/60"
}
            `}>
             <div className={`flex border-b ${
  theme === "dark" ? "border-gray-800/60" : "border-gray-200/60"
}`}>
                {["details", "equipment", "reviews"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`
                      flex-1 px-6 py-3 text-sm font-medium transition-all duration-200
                    ${activeTab === tab
  ? theme === "dark"
    ? "text-purple-400 border-b-2 border-purple-400 bg-transparent"
    : "text-purple-600 border-b-2 border-purple-600 bg-transparent"
  : theme === "dark"
    ? "text-gray-500 hover:text-gray-300 bg-transparent hover:bg-gray-800/40"
    : "text-gray-600 hover:text-gray-900 bg-transparent hover:bg-gray-100"
}
                    `}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === "details" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className={`text-lg font-semibold mb-3 ${
                        theme === "dark" ? "text-gray-200" : "text-gray-900"
                      }`}>
                        About this studio
                      </h3>
                      <p className={`text-sm leading-relaxed ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}>
                        {studio.description || "Professional recording studio with state-of-the-art equipment and comfortable environment for artists and producers."}
                      </p>
                    </div>

                    <div>
                      <h3 className={`text-lg font-semibold mb-3 ${
                        theme === "dark" ? "text-gray-200" : "text-gray-900"
                      }`}>
                        Amenities
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {amenities.map((amenity, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-2 p-3 rounded-lg border transition-all duration-200 ${
                              theme === "dark"
                                ? "bg-gray-800/40 border-gray-700/60 text-gray-300"
                                : "bg-gray-50/50 border-gray-200/60 text-gray-700"
                            }`}
                          >
                            <amenity.icon className="w-4 h-4" />
                            <span className="text-sm">{amenity.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "equipment" && (
                  <div className="space-y-4">
                    <h3 className={`text-lg font-semibold ${
                      theme === "dark" ? "text-gray-200" : "text-gray-900"
                    }`}>
                      Featured Equipment
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {studio.equipment.map((item, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-2 p-3 rounded-lg border transition-all duration-200 ${
                            theme === "dark"
                              ? "bg-gray-800/40 border-gray-700/60 text-gray-300"
                              : "bg-gray-50/50 border-gray-200/60 text-gray-700"
                          }`}
                        >
                          <CheckCircle2 className={`w-4 h-4 ${
                            theme === "dark" ? "text-green-500" : "text-green-600"
                          }`} />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {activeTab === "reviews" && (
  <div className="space-y-4">
    <h3 className={`text-lg font-semibold ${
      theme === "dark" ? "text-gray-200" : "text-gray-900"
    }`}>
      Customer Reviews
    </h3>
    {studio.reviews && studio.reviews.length > 0 ? (
      studio.reviews.map((review) => (
        <div
          key={review.id}
          className={`p-4 rounded-lg border transition-all duration-200 ${
            theme === "dark"
              ? "bg-gray-800/40 border-gray-700/60"
              : "bg-gray-50/50 border-gray-200/60"
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
              {review.author?.username?.[0]?.toUpperCase() || 
               review.author?.fullName?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${
                  theme === "dark" ? "text-gray-200" : "text-gray-900"
                }`}>
                  {review.author?.fullName || review.author?.username || "Anonymous"}
                </span>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  <span className={`text-xs ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}>
                    {review.rating}
                  </span>
                </div>
              </div>
              <span className={`text-xs ${
                theme === "dark" ? "text-gray-500" : "text-gray-500"
              }`}>
                {dayjs(review.createdAt).format("MMMM D, YYYY")}
              </span>
            </div>
          </div>
          <p className={`text-sm ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>
            {review.comment || "Great studio with amazing equipment and atmosphere!"}
          </p>
        </div>
      ))
    ) : (
      <p className={`text-sm text-center py-8 ${
        theme === "dark" ? "text-gray-500" : "text-gray-500"
      }`}>
        No reviews yet
      </p>
    )}
  </div>
)}
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className={`
              rounded-xl border backdrop-blur-sm sticky top-6
              ${theme === "dark" 
                ? "bg-gray-900/40 border-gray-800/60" 
                : "bg-white/50 border-gray-200/60"
              }
            `}>
              <div className="p-6">
                <h3 className={`text-lg font-semibold mb-4 ${
                  theme === "dark" ? "text-gray-200" : "text-gray-900"
                }`}>
                  Book This Studio
                </h3>

                {/* Date Selection */}
             

             {/* Date Selection */}
<div className="mb-6">
  <div className="flex items-center justify-between mb-2">
    <label className={`text-sm font-medium ${
      theme === "dark" ? "text-gray-300" : "text-gray-700"
    }`}>
      Select Date
    </label>
    <button
      onClick={() => setShowCalendar(!showCalendar)}
      className={`text-xs px-2 py-1 rounded transition-all duration-200 ${
        theme === "dark"
          ? "bg-black text-purple-400 hover:bg-gray-800/40"
          : "text-purple-600 hover:bg-gray-100"
      }`}
    >
      {showCalendar ? "Pick specific date" : "Show calendar"}
    </button>
  </div>
  
  {showCalendar ? (
    <>
      <div className="grid grid-cols-7 gap-2">
        {/* Generate next 14 days */}
        {Array.from({ length: 14 }, (_, i) => {
          const date = dayjs().add(i, 'day');
          const isSelected = selectedDate.format("YYYY-MM-DD") === date.format("YYYY-MM-DD");
          
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(date)}
              className={`
                flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-200
                ${isSelected
                  ? theme === "dark"
                    ? "bg-purple-500/20 text-purple-400 border-purple-500/40"
                    : "bg-purple-50 text-purple-600 border-purple-200"
                  : theme === "dark"
                    ? "bg-gray-800/40 text-gray-400 border-gray-700/60 hover:border-gray-600"
                    : "bg-gray-50/50 text-gray-600 border-gray-200/60 hover:border-gray-300"
                }
              `}
            >
              <span className="text-xs font-medium">{date.format("ddd")}</span>
              <span className={`text-sm font-semibold ${
                isSelected 
                  ? theme === "dark" ? "text-purple-300" : "text-purple-700"
                  : ""
              }`}>
                {date.format("D")}
              </span>
            </button>
          );
        })}
      </div>
      <p className={`text-xs mt-2 ${
        theme === "dark" ? "text-gray-500" : "text-gray-500"
      }`}>
        Selected: {selectedDate.format("MMMM D, YYYY")}
      </p>
    </>
  ) : (
    <input
      type="date"
      value={selectedDate.format("YYYY-MM-DD")}
      onChange={(e) => setSelectedDate(dayjs(e.target.value))}
      min={dayjs().format("YYYY-MM-DD")}
      className={`w-full p-3 rounded-lg border transition-all duration-200 ${
        theme === "dark"
          ? "bg-gray-800/40 border-gray-700/60 text-gray-300 [color-scheme:dark]"
          : "bg-gray-50/50 border-gray-200/60 text-gray-700"
      }`}
    />
  )}
</div>


                {/* Time Slots */}
              {/* Time Slots */}
<div className="mb-6">
  <div className="flex items-center justify-between mb-2">
    <label className={`text-sm font-medium ${
      theme === "dark" ? "text-gray-300" : "text-gray-700"
    }`}>
      Available Times
    </label>
    <button
      onClick={() => setShowTimeSlots(!showTimeSlots)}
      className={`text-xs px-2 py-1 rounded transition-all duration-200 ${
        theme === "dark"
          ? "bg-black text-purple-400 hover:bg-gray-800/40"
          : "text-purple-600 hover:bg-gray-100"
      }`}
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
          className={`
            py-2 text-xs rounded-lg border transition-all duration-200 relative
            ${!isAvailable
              ? theme === "dark"
                ? "bg-red-500/10 text-red-400/50 border-red-500/20 cursor-not-allowed line-through"
                : "bg-red-50 text-red-600/50 border-red-200 cursor-not-allowed line-through"
              : selectedTime === time
              ? theme === "dark"
                ? "bg-purple-500/20 text-purple-400 border-purple-500/40"
                : "bg-purple-50 text-purple-600 border-purple-200"
              : theme === "dark"
                ? "bg-gray-800/40 text-gray-400 border-gray-700/60 hover:border-gray-600"
                : "bg-gray-50/50 text-gray-600 border-gray-200/60 hover:border-gray-300"
            }
          `}
        >
          {time}
          {!isAvailable && (
            <span className="absolute top-0 right-0 -mt-1 -mr-1 text-[10px] bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
              ✕
            </span>
          )}
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
            // Convert "10:00 AM" to "10:00" (24-hour format)
            const match = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (!match) return "";
            let hours = parseInt(match[1]);
            const minutes = match[2];
            const period = match[3].toUpperCase();
            
            // Convert to 24-hour format
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
    className={`w-full p-3 rounded-lg border transition-all duration-200 ${
      theme === "dark"
        ? "bg-gray-800/40 border-gray-700/60 text-gray-300 [color-scheme:dark]"
        : "bg-gray-50/50 border-gray-200/60 text-gray-700"
    }`}
  />
)}
{showTimeSlots && studio.bookings && studio.bookings.length > 0 && (
  <p className={`text-xs mt-2 ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
    <span className="text-red-400">✕</span> = Already booked
  </p>
)}
</div>                {/* Session Length */}
                <div className="mb-6">
                  <label className={`text-sm font-medium mb-2 block ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Session Length
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[2, 4, 8].map((hours) => (
                      <button
                        key={hours}
                        onClick={() => setSessionLength(hours)}
                        className={`
                          py-2 text-xs rounded-lg border transition-all duration-200
                          ${sessionLength === hours
                            ? theme === "dark"
                              ? "bg-purple-500/20 text-purple-400 border-purple-500/40"
                              : "bg-purple-50 text-purple-600 border-purple-200"
                            : theme === "dark"
                              ? "bg-gray-800/40 text-gray-400 border-gray-700/60 hover:border-gray-600"
                              : "bg-gray-50/50 text-gray-600 border-gray-200/60 hover:border-gray-300"
                          }
                        `}
                      >
                        {hours} hours
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Summary */}
                <div className={`p-4 rounded-lg mb-6 ${
                  theme === "dark"
                    ? "bg-gray-800/40 border border-gray-700/60"
                    : "bg-gray-50/50 border border-gray-200/60"
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}>
                      {sessionLength} hours × ${studio.hourlyRate}/hr
                    </span>
                    <span className={`text-sm font-medium ${
                      theme === "dark" ? "text-gray-300" : "text-gray-900"
                    }`}>
                      ${estimatedTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}>
                      Service fee
                    </span>
                    <span className={`text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}>
                      ${(estimatedTotal * 0.1).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t mt-3 pt-3 flex justify-between items-center">
                    <span className={`font-semibold ${
                      theme === "dark" ? "text-gray-200" : "text-gray-900"
                    }`}>
                      Total
                    </span>
                    <span className={`font-semibold ${
                      theme === "dark" ? "text-gray-200" : "text-gray-900"
                    }`}>
                      ${(estimatedTotal * 1.1).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Error Message */}
                {bookingError && (
                  <div className={`mb-4 p-3 rounded-lg ${
                    theme === "dark"
                      ? "bg-red-500/10 border border-red-500/20 text-red-400"
                      : "bg-red-50 border border-red-200 text-red-600"
                  }`}>
                    <p className="text-xs">{bookingError}</p>
                  </div>
                )}

                {/* Book Button */}
                <button
                  onClick={handleBooking}
                  disabled={!selectedTime || bookingLoading}
                  className={`
                    w-full py-3 rounded-lg font-semibold transition-all duration-200
                    flex items-center justify-center gap-2
                    ${!selectedTime || bookingLoading
                      ? theme === "dark"
                        ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : theme === "dark"
                        ? "bg-purple-600 hover:bg-purple-700 text-white active:scale-95"
                        : "bg-purple-600 hover:bg-purple-700 text-white active:scale-95"
                    }
                  `}
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

                <p className={`text-center text-xs mt-3 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-500"
                }`}>
                  You will only be charged when the studio confirms
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}