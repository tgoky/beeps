"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStudio } from "@/hooks/useStudios";
import StudioBookingDrawer from "@/components/StudioBookingDrawer";
import { formatAmount } from "@/lib/currency";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Headphones,
  Loader2,
  MapPin,
  Mic2,
  Navigation,
  ShieldCheck,
  Star,
  Users,
  Volume2,
  Wifi,
  X,
} from "lucide-react";

type StudioWithGallery = NonNullable<ReturnType<typeof useStudio>["data"]> & {
  imageUrls?: string[] | null;
};

const fallbackImage =
  "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1600&q=85";

const amenityItems = [
  { icon: Wifi, label: "High-speed WiFi" },
  { icon: Headphones, label: "Monitoring ready" },
  { icon: Coffee, label: "Lounge access" },
  { icon: Volume2, label: "Treated room" },
];

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const radiusInMiles = 3958.8;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radiusInMiles * c;
};

function StudioLoadingState() {
  return (
    <div className="h-full overflow-y-auto bg-black text-white">
      <main className="mx-auto flex min-h-full max-w-7xl flex-col px-4 pt-5 pb-24 sm:px-6 lg:px-8">
        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <div className="relative h-[48vh] min-h-[340px] animate-pulse rounded-t-2xl bg-zinc-900">
               {/* Skeleton for floating nav */}
               <div className="absolute left-4 top-4 h-10 w-10 rounded-full bg-zinc-800" />
               <div className="absolute left-16 top-4 hidden h-10 w-32 rounded-full bg-zinc-800 sm:block" />
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-24 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900" />
              ))}
            </div>
          </div>

          <aside className="hidden space-y-6 lg:block">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="h-8 w-32 animate-pulse rounded-lg bg-zinc-800" />
              <div className="mt-6 h-14 animate-pulse rounded-xl bg-zinc-800" />
            </div>
            <div className="h-64 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-950" />
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function StudioProfilePage() {
  const router = useRouter();
  const { id } = useParams();
  const { data, isLoading, error } = useStudio(id as string);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  const studio = data as StudioWithGallery | undefined;

  const images = useMemo(() => {
    if (!studio) return [];
    const gallery = studio.imageUrls?.filter(Boolean) ?? [];
    if (gallery.length > 0) return gallery;
    return studio.imageUrl ? [studio.imageUrl] : [fallbackImage];
  }, [studio]);

  if (isLoading) {
    return <StudioLoadingState />;
  }

  if (error || !studio) {
    return (
      <div className="flex h-full overflow-y-auto items-center justify-center bg-black px-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center shadow-2xl">
          <Mic2 className="mx-auto mb-4 h-10 w-10 text-zinc-600" />
          <h1 className="text-2xl font-light tracking-tight">Studio not found</h1>
          <p className="mt-2 text-sm font-light tracking-wide text-zinc-500">This studio may have moved, expired, or been taken offline.</p>
          <button
            onClick={() => router.push("/studios")}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium tracking-wide text-black transition-colors hover:bg-zinc-200"
          >
            <ArrowLeft size={16} />
            Back to studios
          </button>
        </div>
      </div>
    );
  }

  const ratingLabel = studio.rating ? Number(studio.rating).toFixed(1) : "New";
  const reviewCount = studio._count?.reviews ?? studio.reviews?.length ?? 0;
  const bookingCount = studio._count?.bookings ?? 0;
  const capacity = studio.capacity || "Private session";
  const totalPreview = studio.hourlyRate * 2;
  const studioCurrency = studio.currency || "USD";
  const canCalculateDistance = studio.latitude !== null && studio.longitude !== null;
  const distance =
    userLocation && studio.latitude !== null && studio.longitude !== null
      ? calculateDistance(userLocation.lat, userLocation.lon, studio.latitude, studio.longitude)
      : null;
  const distanceLabel =
    distance === null
      ? null
      : distance < 10
      ? `${distance.toFixed(1)} mi`
      : `${Math.round(distance)} mi`;
  const distanceTone =
    distance === null
      ? "Your location hidden"
      : distance <= 5
      ? "Very close"
      : distance <= 20
      ? "Nearby"
      : "Plan travel";

  const nextImage = () => setCurrentImageIdx((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIdx((prev) => (prev - 1 + images.length) % images.length);
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Location is not available in this browser.");
      return;
    }

    setIsLoadingLocation(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setIsLoadingLocation(false);
      },
      () => {
        setLocationError("Allow location access to estimate distance.");
        setIsLoadingLocation(false);
      }
    );
  };

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
      `}</style>

      <main className="relative mx-auto max-w-7xl px-4 pb-24 pt-5 sm:px-6 lg:px-8">
        <section
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_370px]"
          style={{ animation: "studio-arrive 520ms cubic-bezier(0.32, 0.72, 0, 1) both" }}
        >
          {/* Left Column: Main Details, Profile, Gear */}
          <div className="min-w-0 space-y-6">
            {/* Hero Image & Primary Details Card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
              <div className="relative h-[420px] w-full overflow-hidden rounded-t-2xl border-b border-zinc-800 bg-zinc-900 lg:h-[500px]">
                <img
                  src={images[0]}
                  alt={studio.name}
                  className="h-full w-full object-cover"
                />

                {/* Floating Navigation (Left) */}
                <div className="absolute left-4 top-4 z-20 flex items-center gap-3">
                  <button
                    onClick={() => router.back()}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/65"
                    aria-label="Go back"
                  >
                    <ArrowLeft size={18} strokeWidth={1.5} />
                  </button>

                  <div className="hidden h-10 items-center gap-2 rounded-full border border-white/15 bg-black/45 px-4 text-xs font-light tracking-wide text-white shadow-lg backdrop-blur-md sm:flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
                    Live availability
                  </div>
                </div>

                {/* Floating Gallery Button (Right) */}
                <button
                  onClick={() => setShowGallery(true)}
                  className="absolute right-4 top-4 z-20 inline-flex h-10 items-center gap-2 rounded-lg border border-white/15 bg-black/45 px-4 text-xs font-light tracking-wide text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/65"
                >
                  <Camera size={15} strokeWidth={1.5} />
                  {images.length} photo{images.length === 1 ? "" : "s"}
                </button>
              </div>

              <div className="p-5 sm:p-7 lg:p-9">
                {studio.verificationStatus === "VERIFIED" && (
                  <div className="mb-4 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-300/25 bg-sky-300/10 px-3 py-1.5 text-xs font-medium tracking-wide text-sky-200">
                      <BadgeCheck size={14} />
                      Verified room
                    </span>
                  </div>
                )}

                <h1 className="max-w-4xl text-4xl font-light tracking-tighter text-white sm:text-5xl lg:text-6xl">
                  {studio.name}
                </h1>

                {/* Studio Description UI Area */}
                <div className="mt-8 rounded-xl border border-zinc-800/60 bg-[#08080a] p-5">
                  <h2 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                    <Mic2 size={14} className="text-zinc-400" />
                    Studio Description
                  </h2>
                  <p className="max-w-3xl text-sm font-light tracking-wide leading-relaxed text-zinc-300 sm:text-base">
                    {studio.description || "A focused recording environment for writing, tracking, mixing, and session work. Perfectly equipped to handle professional audio production."}
                  </p>
                </div>

                {/* Stat Cards - Dark Stealth Theme */}
                <div className="mt-6 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
                  {/* Rating Card */}
                  <div className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-[#08080a] p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900">
                    <Star className="absolute -right-3 -top-3 h-16 w-16 text-zinc-800/40 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                      <Star size={14} className="text-zinc-500" strokeWidth={1.5} /> Rating
                    </div>
                    <div className="truncate text-xl font-light tracking-tight text-white">{ratingLabel}</div>
                  </div>

                  {/* Capacity Card */}
                  <div className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-[#08080a] p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900">
                    <Users className="absolute -right-3 -top-3 h-16 w-16 text-zinc-800/40 transition-transform duration-500 group-hover:-translate-x-1 group-hover:translate-y-1 group-hover:scale-110" />
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                      <Users size={14} className="text-zinc-500" strokeWidth={1.5} /> Capacity
                    </div>
                    <div className="truncate text-xl font-light tracking-tight text-white">{capacity}</div>
                  </div>

                  {/* Rate Card */}
                  <div className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-[#08080a] p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900">
                    <Clock className="absolute -right-3 -top-3 h-16 w-16 text-zinc-800/40 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110" />
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                      <Clock size={14} className="text-zinc-500" strokeWidth={1.5} /> Hourly
                    </div>
                    <div className="truncate text-xl font-light tracking-tight text-white">{formatAmount(studio.hourlyRate, studioCurrency)}</div>
                  </div>

                  {/* Availability Status Card */}
                  <div className="group relative overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5 transition-colors hover:border-emerald-400/30 sm:col-span-3">
                    <ShieldCheck className="absolute -right-4 -top-6 h-24 w-24 text-emerald-500/10 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110" />
                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-300/80">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/80 opacity-75" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                          </span>
                          Availability Status
                        </div>
                        <div className="text-2xl font-light tracking-tight text-white">
                          {bookingCount ? `${bookingCount}+ sessions requested` : "Ready to be booked"}
                        </div>
                        <p className="mt-1 text-sm font-light tracking-wide leading-5 text-zinc-400">
                          Send a request now. You will not be charged until the studio confirms.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsDrawerOpen(true)}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-5 py-3 text-sm font-medium tracking-wide text-emerald-100 transition-colors hover:bg-emerald-400/15"
                      >
                        <CalendarDays size={16} strokeWidth={1.5} />
                        View times
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Room Profile Card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl sm:p-6">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-light tracking-tight text-white">Room Profile</h2>
                  <p className="mt-1 text-sm font-light tracking-wide text-zinc-500">Core details for planning the session.</p>
                </div>
                <Mic2 className="h-6 w-6 text-zinc-600" strokeWidth={1.5} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {amenityItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-[#08080a] p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-zinc-400">
                      <item.icon size={18} strokeWidth={1.5} />
                    </div>
                    <span className="text-sm font-light tracking-wide text-zinc-300">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Gear Card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl sm:p-6">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-light tracking-tight text-white">Available Gear</h2>
                  <p className="mt-1 text-sm font-light tracking-wide text-zinc-500">Equipment listed by the studio.</p>
                </div>
                <Headphones className="h-6 w-6 text-zinc-600" strokeWidth={1.5} />
              </div>

              {studio.equipment && studio.equipment.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {studio.equipment.map((item, index) => (
                    <div key={`${item}-${index}`} className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-[#08080a] p-4">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                      <span className="text-sm font-light tracking-wide leading-5 text-zinc-300">{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-800 bg-[#08080a] p-8 text-center text-sm font-light tracking-wide text-zinc-500">
                  No specific equipment has been listed yet.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Rate & Independent Location Card */}
          <aside className="space-y-6 lg:sticky lg:top-5 lg:self-start">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">Session rate</p>
                  <div className="mt-1 flex items-end gap-1">
                    <span className="text-4xl font-light tracking-tighter text-white">{formatAmount(studio.hourlyRate, studioCurrency)}</span>
                    <span className="mb-1.5 text-sm font-light tracking-wide text-zinc-500">/hr</span>
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-1 text-zinc-400">
                    <Star size={14} className="fill-current text-zinc-400" />
                    <span className="text-sm font-medium tracking-wide">{ratingLabel}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] font-light tracking-wide text-zinc-500">{reviewCount} review{reviewCount === 1 ? "" : "s"}</p>
                </div>
              </div>

              <button
                onClick={() => setIsDrawerOpen(true)}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-sm font-semibold tracking-wide text-black transition-all hover:bg-zinc-200 active:scale-[0.98]"
              >
                <CalendarDays size={17} strokeWidth={1.5} />
                Check availability
              </button>

              <p className="mt-3 text-center text-xs font-light tracking-wide text-zinc-500">Estimated two-hour session: {formatAmount(totalPreview, studioCurrency)}</p>
            </div>

            {/* Distance-aware Location Card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-light tracking-tight text-white">Distance & Location</h2>
                  <p className="mt-1 text-xs font-light tracking-wide text-zinc-500">Uses your current position only to estimate travel distance.</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-[#08080a] text-zinc-400">
                  <Navigation size={18} strokeWidth={1.5} />
                </div>
              </div>
              
              <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#08080a]">
                <div className="relative h-52">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_45%,rgba(59,130,246,0.14),transparent_22%),radial-gradient(circle_at_72%_52%,rgba(16,185,129,0.12),transparent_22%),linear-gradient(135deg,#101014,#050506)]" />
                  <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px]" />
                  <div className="absolute left-[30%] top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                    <div className="absolute h-20 w-20 rounded-full border border-blue-300/15 bg-blue-300/5" />
                    <Navigation className="relative h-6 w-6 fill-blue-300 text-blue-300 drop-shadow-xl" />
                    <span className="relative mt-2 rounded-full border border-blue-300/15 bg-black/40 px-2 py-1 text-[10px] font-medium tracking-wide text-blue-100 backdrop-blur-sm">
                      Your position
                    </span>
                  </div>
                  <div className="absolute left-[30%] right-[28%] top-1/2 h-px -translate-y-1/2 overflow-hidden">
                    <div className="h-px w-full border-t border-dashed border-zinc-500/60" />
                    <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                  </div>
                  <div className="absolute right-[22%] top-1/2 flex -translate-y-1/2 flex-col items-center">
                    <div className="absolute h-24 w-24 rounded-full border border-emerald-300/15 bg-emerald-300/5" />
                    <MapPin className="relative h-8 w-8 fill-emerald-300 text-black drop-shadow-xl" />
                    <span className="relative mt-2 rounded-full border border-emerald-300/15 bg-black/40 px-2 py-1 text-[10px] font-medium tracking-wide text-emerald-100 backdrop-blur-sm">
                      Studio
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-black/45 p-3 backdrop-blur-md">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">You to studio</p>
                        <div className="mt-1 text-2xl font-light tracking-tight text-white">
                          {distanceLabel || "--"}
                        </div>
                      </div>
                      <span className="rounded-full border border-zinc-700 bg-zinc-950/80 px-3 py-1.5 text-[11px] font-medium tracking-wide text-zinc-300">
                        {distanceTone}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-zinc-800 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">Studio address</p>
                      <p className="mt-2 text-sm font-light tracking-wide text-zinc-200">{studio.location}</p>
                      {studio.streetAddress && <p className="mt-1 text-xs font-light tracking-wide text-zinc-500">{studio.streetAddress}</p>}
                      {distanceLabel && (
                        <p className="mt-2 text-[11px] font-light tracking-wide text-zinc-500">
                          Your exact address is not shown here or saved from this check.
                        </p>
                      )}
                      {locationError && <p className="mt-2 text-[11px] font-light tracking-wide text-amber-300/80">{locationError}</p>}
                      {!canCalculateDistance && (
                        <p className="mt-2 text-[11px] font-light tracking-wide text-zinc-500">This studio has not added precise map coordinates yet.</p>
                      )}
                    </div>
                    <button
                      onClick={getUserLocation}
                      disabled={isLoadingLocation || !canCalculateDistance}
                      className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium tracking-wide text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoadingLocation ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                      {distanceLabel ? "Refresh" : "Use my location"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </main>

      {isDrawerOpen && <StudioBookingDrawer studioId={studio.id} onClose={() => setIsDrawerOpen(false)} />}

      {showGallery && images.length > 0 && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white backdrop-blur-xl">
          <div className="flex shrink-0 items-center justify-between p-5">
            <span className="text-sm font-light tracking-wide text-zinc-400">
              {currentImageIdx + 1} / {images.length}
            </span>
            <button
              onClick={() => setShowGallery(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
              aria-label="Close gallery"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center p-4">
            <img src={images[currentImageIdx]} alt={`${studio.name} gallery`} className="max-h-full max-w-full select-none object-contain" />
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-white hover:text-black"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={22} strokeWidth={1.5} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-white hover:text-black"
                  aria-label="Next image"
                >
                  <ChevronRight size={22} strokeWidth={1.5} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}