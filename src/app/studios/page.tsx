"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  MapPin,
  Star,
  Plus,
  Navigation,
  X,
  Mic2,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  BadgeCheck,
} from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";
import { usePermissions } from "@/hooks/usePermissions";
import { useStudios } from "@/hooks/useStudios";

import StudioBookingDrawer from "../../components/StudioBookingDrawer";

type Studio = {
  id: string;
  name: string;
  location: string;
  streetAddress: string | null;
  hourlyRate: number;
  rating: number;
  equipment: string[];
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  country: string | null;
  state: string | null;
  city: string | null;
  description?: string;
  capacity?: string;
  verificationStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
};

// Haversine formula (miles)
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Price filter options
const FILTER_OPTIONS = [
  { label: "Budget", min: 0, max: 25, text: "Under $25/hr" },
  { label: "Standard", min: 25, max: 50, text: "$25 - $50/hr" },
  { label: "Premium", min: 50, max: 100, text: "$50 - $100/hr" },
  { label: "Pro", min: 100, max: 9999, text: "$100+/hr" },
];

type SortOrder = "price_asc" | "rating_desc" | "nearest" | null;

export default function StudioList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { theme } = useTheme();
  const { permissions } = usePermissions();
  const isDark = theme === "dark";

  const { data: studios = [], isLoading: isLoadingStudios } = useStudios();

  // URL State for Drawer
  const drawerStudioId = searchParams.get("id");

  // Drawer Handlers (Shallow Routing)
  const openDrawer = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("id", id);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const closeDrawer = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  // Location state
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [selectedFilterIndex, setSelectedFilterIndex] = useState<number | null>(
    null
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Location filter state
  const [filterCountry, setFilterCountry] = useState("");
  const [filterCity, setFilterCity] = useState("");

  // Bottom sheet state
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Map state
  const [selectedStudio, setSelectedStudio] = useState<Studio | null>(null);
  const [hoveredStudio, setHoveredStudio] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState(1.2);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [isMapDragging, setIsMapDragging] = useState(false);
  const mapDragStart = useRef({ x: 0, y: 0 });
  const [tiltMode, setTiltMode] = useState(false);

  // Get user location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setIsLoadingLocation(false);
      },
      () => setIsLoadingLocation(false)
    );
  }, []);

  // Search suggestions
  const updateSearchSuggestions = useCallback(
    (query: string) => {
      if (!query || query.length < 2) {
        setSearchSuggestions([]);
        return;
      }
      const q = query.toLowerCase();
      const suggestions = new Set<string>();
      studios.forEach((studio) => {
        const loc = studio.location || "";
        if (loc.toLowerCase().includes(q)) {
          const parts = loc.split(",").map((p) => p.trim());
          parts.forEach((p) => {
            if (p.toLowerCase().includes(q)) suggestions.add(p);
          });
        }
      });
      setSearchSuggestions(Array.from(suggestions).slice(0, 5));
    },
    [studios]
  );

  // Extract unique countries and cities for filter dropdowns
  const availableCountries = useMemo(() => {
    const countries = new Set<string>();
    studios.forEach((s) => {
      if (s.country) countries.add(s.country);
    });
    return Array.from(countries).sort();
  }, [studios]);

  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    studios.forEach((s) => {
      if (s.city && (!filterCountry || s.country === filterCountry)) {
        cities.add(s.city);
      }
    });
    return Array.from(cities).sort();
  }, [studios, filterCountry]);

  // Filtered & sorted data
  const filteredStudios = useMemo(() => {
    let data = [...studios];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      data = data.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q) ||
          (s.description || "").toLowerCase().includes(q)
      );
    }

    if (filterCountry) {
      data = data.filter((s) => s.country === filterCountry);
    }

    if (filterCity) {
      data = data.filter((s) => s.city === filterCity);
    }

    if (selectedFilterIndex !== null && FILTER_OPTIONS[selectedFilterIndex]) {
      const range = FILTER_OPTIONS[selectedFilterIndex];
      data = data.filter(
        (s) => s.hourlyRate >= range.min && s.hourlyRate < range.max
      );
    }

    if (sortOrder === "price_asc") {
      data.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
    } else if (sortOrder === "rating_desc") {
      data.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortOrder === "nearest" && userLocation) {
      data.sort((a, b) => {
        const distA =
          a.latitude && a.longitude
            ? calculateDistance(
                userLocation.lat,
                userLocation.lon,
                a.latitude,
                a.longitude
              )
            : Infinity;
        const distB =
          b.latitude && b.longitude
            ? calculateDistance(
                userLocation.lat,
                userLocation.lon,
                b.latitude,
                b.longitude
              )
            : Infinity;
        return distA - distB;
      });
    }

    return data;
  }, [
    studios,
    searchQuery,
    selectedFilterIndex,
    sortOrder,
    userLocation,
    filterCountry,
    filterCity,
  ]);

  // Bottom sheet drag handlers
  const handleSheetPointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true);
      dragStartY.current = e.clientY;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    []
  );

  const handleSheetPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const dy = e.clientY - dragStartY.current;
      if (Math.abs(dy) > 40) {
        if (dy < 0) setIsExpanded(true);
        else setIsExpanded(false);
        setIsDragging(false);
      }
    },
    [isDragging]
  );

  const handleSheetPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Map drag handlers
  const handleMapMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsMapDragging(true);
      mapDragStart.current = {
        x: e.clientX - mapOffset.x,
        y: e.clientY - mapOffset.y,
      };
    },
    [mapOffset]
  );

  const handleMapMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isMapDragging) return;
      e.preventDefault();
      setMapOffset({
        x: e.clientX - mapDragStart.current.x,
        y: e.clientY - mapDragStart.current.y,
      });
    },
    [isMapDragging]
  );

  const handleMapMouseUp = useCallback(() => setIsMapDragging(false), []);

  const handleMapWheel = useCallback(
    (e: React.WheelEvent) => {
      e.stopPropagation();
      setMapZoom((z) => Math.min(Math.max(z - e.deltaY * 0.001, 0.8), 4));
    },
    []
  );

  // Map position projection
  const getPosition = (lat: number, lon: number, index: number = 0) => {
    const mapMinX = 25,
      mapMaxX = 85;
    const mapMinY = 15,
      mapMaxY = 80;
    const jitterX = (index * 1.5) % 3;
    const jitterY = (index * 1.5) % 3;
    const x =
      mapMinX + (Math.abs(lon * 100) % (mapMaxX - mapMinX)) + jitterX;
    const y =
      mapMinY + (Math.abs(lat * 100) % (mapMaxY - mapMinY)) + jitterY;
    return { x, y };
  };

  const handleSearchFocus = () => {
    setSearchFocused(true);
    setIsExpanded(true);
  };

  const handleSearchBlur = () => {
    setSearchFocused(false);
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-[#030303] selection:bg-white selection:text-black"
      style={{ height: "100vh" }}
    >
      {/* ═══════════════════════════════════════════ */}
      {/* MAP BACKGROUND LAYER                        */}
      {/* ═══════════════════════════════════════════ */}
      <div
        className="absolute inset-0 transition-all duration-500 ease-out"
        // PERFECT BALANCE: 62vh leaves 38% for the map, pushing the sheet up enough to reveal cards fully
        style={{ paddingBottom: isExpanded ? "75vh" : "42vh" }}
      >
        <div
          className={`relative w-full h-full overflow-hidden select-none bg-[#0f172a]`}
          onWheel={handleMapWheel}
          onMouseDown={handleMapMouseDown}
          onMouseMove={handleMapMouseMove}
          onMouseUp={handleMapMouseUp}
          onMouseLeave={handleMapMouseUp}
          style={{ cursor: isMapDragging ? "grabbing" : "grab" }}
        >
          <div
            className="absolute inset-0 w-full h-full origin-center will-change-transform"
            style={{
              transform: `scale(${mapZoom}) translate(${
                mapOffset.x / mapZoom
              }px, ${mapOffset.y / mapZoom}px) ${
                tiltMode ? "perspective(1000px) rotateX(35deg)" : ""
              }`,
              transition: isMapDragging
                ? "none"
                : "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
          >
            {/* Water Texture */}
            <div
              className="absolute inset-[-100%] w-[300%] h-[300%] opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Land Mass */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path
                d="M 15 0 L 100 0 L 100 100 L 30 100 C 30 100 25 80 40 70 C 55 60 50 40 30 35 C 10 30 5 15 15 0 Z"
                fill="#18181b"
              />
              <path
                d="M 60 0 L 100 0 L 100 40 Q 80 50 60 30 Q 50 15 60 0 Z"
                fill="#14532d"
                opacity="0.8"
              />
              <path
                d="M 60 55 L 75 55 L 75 65 L 60 65 Z"
                fill="#14532d"
                opacity="0.8"
              />
              <path
                d="M 70 80 L 100 80 L 100 100 L 70 100 Z"
                fill="#27272a"
              />
              <path
                d="M 30 100 C 30 100 25 80 40 70 C 55 60 50 40 30 35 C 10 30 5 15 15 0 L 12 0 C 2 15 8 32 28 38 C 48 44 52 62 38 72 C 22 82 28 100 28 100 Z"
                fill="#451a03"
                opacity="0.6"
              />
            </svg>

            {/* Roads */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <g stroke="#3f3f46" strokeWidth="0.8">
                {[45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95].map((x) => (
                  <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="100" />
                ))}
                {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((y) => (
                  <line key={`h-${y}`} x1="20" y1={y} x2="100" y2={y} />
                ))}
              </g>
              <path
                d="M 40 0 L 40 100 M 0 45 L 100 45"
                stroke="#52525b"
                strokeWidth="2"
              />
              <g fill="none">
                <path
                  d="M 20 0 Q 30 50 80 60 L 100 65"
                  stroke="#000000"
                  strokeWidth="3.5"
                  strokeLinecap="square"
                />
                <path
                  d="M 60 100 L 60 40 Q 60 20 100 10"
                  stroke="#000000"
                  strokeWidth="3.5"
                  strokeLinecap="square"
                />
                <path
                  d="M 20 0 Q 30 50 80 60 L 100 65"
                  stroke="#ca8a04"
                  strokeWidth="2"
                  strokeLinecap="square"
                />
                <path
                  d="M 60 100 L 60 40 Q 60 20 100 10"
                  stroke="#ca8a04"
                  strokeWidth="2"
                  strokeLinecap="square"
                />
              </g>
            </svg>

            {/* Buildings */}
            <div className="absolute inset-0 pointer-events-none opacity-90">
              {[
                { l: 42, t: 47, w: 4, h: 4 },
                { l: 47, t: 47, w: 4, h: 6 },
                { l: 42, t: 53, w: 9, h: 4 },
                { l: 55, t: 48, w: 8, h: 8 },
                { l: 65, t: 25, w: 5, h: 5 },
                { l: 82, t: 75, w: 6, h: 10 },
                { l: 35, t: 20, w: 4, h: 4 },
                { l: 90, t: 15, w: 5, h: 5 },
              ].map((b, i) => (
                <div
                  key={i}
                  className="absolute bg-zinc-800"
                  style={{
                    left: `${b.l}%`,
                    top: `${b.t}%`,
                    width: `${b.w}%`,
                    height: `${b.h}%`,
                  }}
                />
              ))}
            </div>

            {/* Studio Markers */}
            {filteredStudios.map((studio, index) => {
              const pos =
                studio.latitude && studio.longitude
                  ? getPosition(studio.latitude, studio.longitude, index)
                  : { x: 50, y: 50 };
              const isSelected = selectedStudio?.id === studio.id;
              const isHovered = String(hoveredStudio) === String(studio.id);

              return (
                <div
                  key={studio.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all duration-200 will-change-transform"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    zIndex: isSelected || isHovered ? 50 : 10 + index,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStudio(studio);
                  }}
                  onMouseEnter={() => setHoveredStudio(studio.id)}
                  onMouseLeave={() => setHoveredStudio(null)}
                >
                  <div
                    className={`relative flex flex-col items-center justify-center transition-transform duration-200 ${
                      isSelected || isHovered ? "scale-110" : "scale-100"
                    }`}
                  >
                    {(isSelected || isHovered) && (
                      <div className="absolute bottom-[140%] mb-1 px-2 py-1 text-[9px] font-black uppercase tracking-widest whitespace-nowrap bg-black text-white border border-white/20">
                        {studio.name}
                        <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-1.5 h-1.5 rotate-45 border-r border-b bg-black border-white/20" />
                      </div>
                    )}
                    <div
                      className={`w-8 h-8 flex items-center justify-center border relative z-10 ${
                        isSelected
                          ? "bg-white border-white text-black"
                          : "bg-black border-white/20 text-white"
                      }`}
                    >
                      {isSelected ? (
                        <Mic2 size={14} strokeWidth={2} />
                      ) : (
                        <span className="text-[9px] font-bold tracking-tighter">
                          ${studio.hourlyRate}
                        </span>
                      )}
                    </div>
                    <div className="w-px h-3 bg-white/40" />
                    <div className="px-1.5 py-0.5 border mt-[-1px] bg-black/90 border-white/10 text-zinc-400">
                      <span className="text-[7px] font-black uppercase tracking-wider leading-none whitespace-nowrap block">
                        {studio.location.split(",")[0]}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* User Location */}
            {userLocation && (
              <div
                className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: "35%", top: "40%" }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 blur-sm animate-pulse" />
                  <Navigation
                    size={16}
                    className="fill-white text-white transform rotate-45"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Map HUD - Sharp, Bordered Controls */}
          <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
            <button
              onClick={() => setTiltMode(!tiltMode)}
              className="w-10 h-10 flex items-center justify-center text-[9px] font-bold uppercase tracking-wider bg-black border border-white/10 text-white hover:bg-white hover:text-black transition-colors"
            >
              {tiltMode ? "3D" : "2D"}
            </button>
          </div>

          <div className="absolute bottom-4 right-4 flex flex-col gap-px z-30">
            <div className="flex flex-col border border-white/10">
              <button
                onClick={() => setMapZoom((z) => Math.min(z + 0.5, 4))}
                className="w-10 h-10 flex items-center justify-center bg-black hover:bg-white text-white hover:text-black transition-colors border-b border-white/10"
              >
                <Plus size={16} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setMapZoom((z) => Math.max(z - 0.5, 0.8))}
                className="w-10 h-10 flex items-center justify-center bg-black hover:bg-white text-white hover:text-black transition-colors"
              >
                <Minimize2 size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
            <button
              onClick={getUserLocation}
              disabled={isLoadingLocation}
              className={`w-10 h-10 flex items-center justify-center bg-black border border-white/10 text-white hover:bg-white hover:text-black transition-colors ${
                isLoadingLocation ? "opacity-50" : ""
              }`}
            >
              <Navigation size={16} strokeWidth={1.5} />
            </button>

            {permissions.canCreateStudios && (
              <button
                onClick={() => router.push("/studios/list-studio")}
                className="px-4 py-2.5 text-[9px] font-black uppercase tracking-widest bg-white text-black hover:bg-zinc-300 transition-colors flex items-center gap-1.5"
              >
                <Plus size={12} strokeWidth={2.5} />
                List Studio
              </button>
            )}
          </div>

          {isLoadingStudios && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
              <div className="animate-spin h-8 w-8 border-2 border-t-transparent border-white" />
            </div>
          )}

          {/* Sharp Selected Studio Card */}
          {selectedStudio && (
            <div className="absolute top-4 left-16 z-40 w-56 animate-in slide-in-from-left-4 duration-300">
              <div className="bg-black border border-white/20">
                <div className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-1.5 line-clamp-1">
                      {selectedStudio.name}
                      {selectedStudio.verificationStatus === "VERIFIED" && (
                        <BadgeCheck size={10} className="text-white shrink-0" />
                      )}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudio(null);
                      }}
                      className="text-zinc-500 hover:text-white transition-colors"
                    >
                      <X size={12} strokeWidth={1.5} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Star size={8} className="fill-current" />
                      <span className="text-[8px] font-bold">
                        {selectedStudio.rating
                          ? Number(selectedStudio.rating).toFixed(1)
                          : "NEW"}
                      </span>
                    </div>
                    <div className="text-[11px] font-black text-white">
                      ${selectedStudio.hourlyRate}
                      <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest">
                        /hr
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDrawer(selectedStudio.id);
                    }}
                    className="w-full py-2 bg-white text-black text-[8px] font-black uppercase tracking-widest hover:bg-zinc-300 transition-colors"
                  >
                    Book Session
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* BOTTOM SHEET - BRUTALIST & BALANCED HEIGHT  */}
      {/* ═══════════════════════════════════════════ */}
      <div
        ref={sheetRef}
        className="absolute left-0 right-0 bottom-0 z-40 transition-all duration-500 flex flex-col bg-[#030303] border-t border-white/10"
        style={{
          // Sheet defaults to 62vh. This is the sweet spot that pushes the cards up completely above the fold.
          height: isExpanded ? "90vh" : "58vh",
          transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Sharp Drag Handle */}
        <div
          className="w-full cursor-grab active:cursor-grabbing touch-none flex flex-col items-center pt-2 pb-2 shrink-0"
          onPointerDown={handleSheetPointerDown}
          onPointerMove={handleSheetPointerMove}
          onPointerUp={handleSheetPointerUp}
        >
          {/* Faint indicator line above the button */}
          <div className="w-12 h-0.5 bg-white/10 mb-2" />

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            // 👇 Clean black background, wider rectangle, NO border, and bright white text
            className="bg-black border-none outline-none px-7 py-1 flex items-center justify-center text-white/90 hover:text-white transition-colors"
          >
            {isExpanded ? (
              // Icon color inherits from button 'text-white/90'
              <ChevronDown size={14} strokeWidth={1.5} />
            ) : (
              <ChevronUp size={14} strokeWidth={1.5} />
            )}
          </button>
        </div>
        <div className="flex flex-col flex-1 px-4 lg:px-8 overflow-hidden pt-2">
          {/* Brutalist Search Row - NO BORDERS WHATSOEVER */}
          <div className="relative z-50 shrink-0 mb-4">
            <div className="flex items-center bg-[#111111] rounded-sm">
              <Search size={14} className="ml-4 shrink-0 text-zinc-500" />
              <input
                type="text"
                placeholder="WHERE ARE YOU RECORDING?"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  updateSearchSuggestions(e.target.value);
                }}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                className="flex-1 px-3 py-3.5 text-[10px] font-bold uppercase tracking-widest bg-transparent outline-none ring-0 border-none text-white placeholder:text-zinc-600 focus:ring-0 focus:outline-none"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`pr-4 pl-3 py-3.5 flex items-center justify-center transition-colors bg-transparent border-none outline-none ${
                  showFilters ? "text-white" : "text-zinc-500 hover:text-white"
                }`}
              >
                <SlidersHorizontal size={14} />
              </button>
            </div>

            {searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#111111] z-50 rounded-sm">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-white/5 transition-colors ${
                      index > 0 ? "border-t border-white/5" : ""
                    }`}
                    onClick={() => {
                      setSearchQuery(suggestion);
                      setSearchSuggestions([]);
                    }}
                  >
                    <MapPin size={12} className="text-zinc-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                      {suggestion}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Area */}
          <div
            className={`transition-all duration-300 overflow-hidden shrink-0 ${
              showFilters
                ? "max-h-64 opacity-100 mb-4 border-b border-white/5 pb-4"
                : "max-h-0 opacity-0 mb-0"
            }`}
          >
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <span className="block text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-1.5">
                  Country
                </span>
                <select
                  value={filterCountry}
                  onChange={(e) => {
                    setFilterCountry(e.target.value);
                    setFilterCity("");
                  }}
                  className="w-full px-3 py-2 bg-black border border-white/10 text-[9px] font-bold uppercase tracking-widest text-white outline-none focus:border-white/30 cursor-pointer"
                >
                  <option value="">ALL COUNTRIES</option>
                  {availableCountries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {availableCities.length > 0 && (
                <div>
                  <span className="block text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-1.5">
                    City
                  </span>
                  <select
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-white/10 text-[9px] font-bold uppercase tracking-widest text-white outline-none focus:border-white/30 cursor-pointer"
                  >
                    <option value="">ALL CITIES</option>
                    {availableCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <span className="block text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-2">
              Price
            </span>
            <div className="flex flex-wrap gap-2 mb-4">
              {FILTER_OPTIONS.map((option, i) => (
                <button
                  key={i}
                  onClick={() =>
                    setSelectedFilterIndex(
                      selectedFilterIndex === i ? null : i
                    )
                  }
                  className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-widest transition-all border ${
                    selectedFilterIndex === i
                      ? "bg-white text-black border-white"
                      : "bg-black text-zinc-500 border-white/10 hover:text-white hover:border-white/40"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() =>
                  setSortOrder(
                    sortOrder === "price_asc" ? null : "price_asc"
                  )
                }
                className={`text-[9px] font-bold uppercase tracking-widest transition-colors pb-1 border-b ${
                  sortOrder === "price_asc"
                    ? "text-white border-white"
                    : "text-zinc-600 border-transparent hover:text-zinc-400"
                }`}
              >
                Lowest Price
              </button>
              <button
                onClick={() =>
                  setSortOrder(
                    sortOrder === "rating_desc" ? null : "rating_desc"
                  )
                }
                className={`text-[9px] font-bold uppercase tracking-widest transition-colors pb-1 border-b ${
                  sortOrder === "rating_desc"
                    ? "text-white border-white"
                    : "text-zinc-600 border-transparent hover:text-zinc-400"
                }`}
              >
                Highest Rated
              </button>
              <button
                onClick={() => {
                  if (sortOrder === "nearest") {
                    setSortOrder(null);
                  } else {
                    getUserLocation();
                    setSortOrder("nearest");
                  }
                }}
                className={`text-[9px] font-bold uppercase tracking-widest transition-colors pb-1 border-b ${
                  sortOrder === "nearest"
                    ? "text-white border-white"
                    : "text-zinc-600 border-transparent hover:text-zinc-400"
                }`}
              >
                Nearest
              </button>
            </div>
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">
              {filteredStudios.length}{" "}
              {filteredStudios.length === 1 ? "RESULT" : "RESULTS"}
            </h3>
            {permissions.canBookStudios && !permissions.canCreateStudios && (
              <div className="flex items-center gap-1.5 px-2 py-1 border border-white/10 text-zinc-400">
                {/* <Mic2 size={10} /> */}
                {/* <span className="text-[8px] font-black uppercase tracking-widest">BOOK READY</span> */}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* COMPACT SQUARE GRID FEED                    */}
          {/* ═══════════════════════════════════════════ */}
          <div className="flex-1 overflow-y-auto pb-6 scrollbar-hide">
            {filteredStudios.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredStudios.map((studio) => {
                  const distance =
                    userLocation && studio.latitude && studio.longitude
                      ? calculateDistance(
                          userLocation.lat,
                          userLocation.lon,
                          studio.latitude,
                          studio.longitude
                        )
                      : null;

                  return (
                    <div
                      key={studio.id}
                      className="group flex flex-col bg-black border border-white/10 hover:border-white/40 transition-colors duration-300 cursor-pointer"
                      onClick={() => openDrawer(studio.id)}
                      onMouseEnter={() => setHoveredStudio(studio.id)}
                      onMouseLeave={() => setHoveredStudio(null)}
                    >
                      {/* SQUARE IMAGE CONTAINER */}
                      <div className="relative w-full aspect-square overflow-hidden bg-[#0A0A0A]">
                        <img
                          src={
                            studio.imageUrl ||
                            "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&q=80"
                          }
                          alt={studio.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {studio.verificationStatus === "VERIFIED" && (
                          <div className="absolute top-2 right-2 bg-black/90 p-1 border border-white/10">
                            <BadgeCheck size={10} className="text-white" />
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/90 px-1.5 py-0.5 border border-white/10">
                          <span className="text-[7px] font-black tracking-widest uppercase text-white flex items-center gap-1">
                            <Star size={7} className="fill-white" />
                            {studio.rating
                              ? Number(studio.rating).toFixed(1)
                              : "NEW"}
                          </span>
                        </div>
                      </div>

                      {/* COMPACT META DATA */}
                      <div className="p-3 flex flex-col gap-1.5 flex-grow bg-[#050505]">
                        <div className="flex justify-between items-start">
                          <h4 className="text-[9px] font-bold uppercase tracking-widest text-white line-clamp-1 pr-2">
                            {studio.name}
                          </h4>
                          <span className="text-[9px] font-black text-white shrink-0">
                            ${studio.hourlyRate}
                          </span>
                        </div>

                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 truncate">
                          {studio.location.split(",")[0]}
                        </p>

                        {distance !== null && (
                          <p className="text-[7px] font-bold uppercase tracking-widest text-zinc-600 mt-auto pt-1.5 border-t border-white/5">
                            {Math.round(distance)} MI AWAY
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 border border-white/5 border-dashed">
                <Search
                  size={20}
                  className="text-zinc-700 mb-3"
                  strokeWidth={1.5}
                />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                  NO STUDIOS FOUND
                </h4>
                <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-600">
                  {searchQuery
                    ? `TRY ADJUSTING "${searchQuery}"`
                    : "ADJUST YOUR FILTERS"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* STUDIO BOOKING DRAWER                       */}
      {/* ═══════════════════════════════════════════ */}
      {drawerStudioId && (
        <StudioBookingDrawer
          studioId={drawerStudioId}
          onClose={closeDrawer}
        />
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}