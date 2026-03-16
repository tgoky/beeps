"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  GripHorizontal,
  ArrowUpRight,
  BadgeCheck,
} from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";
import { usePermissions } from "@/hooks/usePermissions";
import { useStudios } from "@/hooks/useStudios";

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
  const { theme } = useTheme();
  const { permissions } = usePermissions();
  const isDark = theme === "dark";

  const { data: studios = [], isLoading: isLoadingStudios } = useStudios();

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

  // Theme colors
  const colors = {
    bg: isDark ? "#000" : "#FFF",
    card: isDark ? "#121212" : "#FFF",
    text: isDark ? "#FFF" : "#000",
    subtext: "#8E8E93",
    border: isDark ? "#333" : "#E5E5EA",
    accent: isDark ? "#FFF" : "#000",
    input: isDark ? "#1A1A1A" : "#F2F2F7",
  };

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

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      data = data.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q) ||
          (s.description || "").toLowerCase().includes(q)
      );
    }

    // Country filter
    if (filterCountry) {
      data = data.filter((s) => s.country === filterCountry);
    }

    // City filter
    if (filterCity) {
      data = data.filter((s) => s.city === filterCity);
    }

    // Price filter
    if (selectedFilterIndex !== null && FILTER_OPTIONS[selectedFilterIndex]) {
      const range = FILTER_OPTIONS[selectedFilterIndex];
      data = data.filter(
        (s) => s.hourlyRate >= range.min && s.hourlyRate < range.max
      );
    }

    // Sort
    if (sortOrder === "price_asc") {
      data.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
    } else if (sortOrder === "rating_desc") {
      data.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortOrder === "nearest" && userLocation) {
      data.sort((a, b) => {
        const distA = a.latitude && a.longitude
          ? calculateDistance(userLocation.lat, userLocation.lon, a.latitude, a.longitude)
          : Infinity;
        const distB = b.latitude && b.longitude
          ? calculateDistance(userLocation.lat, userLocation.lon, b.latitude, b.longitude)
          : Infinity;
        return distA - distB;
      });
    }

    return data;
  }, [studios, searchQuery, selectedFilterIndex, sortOrder, userLocation, filterCountry, filterCity]);

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

  // Auto-expand sheet on search focus
  const handleSearchFocus = () => {
    setSearchFocused(true);
    setIsExpanded(true);
  };

  const handleSearchBlur = () => {
    setSearchFocused(false);
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        height: "100vh",
        backgroundColor: colors.bg,
      }}
    >
      {/* ═══════════════════════════════════════════ */}
      {/* MAP BACKGROUND LAYER                        */}
      {/* ═══════════════════════════════════════════ */}
      <div
        className="absolute inset-0 transition-all duration-500 ease-out"
        style={{ paddingBottom: isExpanded ? "90vh" : "55vh" }}
      >
        <div
          className={`relative w-full h-full overflow-hidden select-none ${
            isDark ? "bg-[#0f172a]" : "bg-[#a5c5d9]"
          }`}
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
              transform: `scale(${mapZoom}) translate(${mapOffset.x / mapZoom}px, ${mapOffset.y / mapZoom}px) ${
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
              <defs>
                <filter
                  id="land-shadow"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feDropShadow
                    dx="0"
                    dy="1"
                    stdDeviation="0.5"
                    floodOpacity="0.2"
                  />
                </filter>
              </defs>
              <path
                d="M 15 0 L 100 0 L 100 100 L 30 100 C 30 100 25 80 40 70 C 55 60 50 40 30 35 C 10 30 5 15 15 0 Z"
                fill={isDark ? "#18181b" : "#e5e7eb"}
                filter="url(#land-shadow)"
              />
              <path
                d="M 60 0 L 100 0 L 100 40 Q 80 50 60 30 Q 50 15 60 0 Z"
                fill={isDark ? "#14532d" : "#c4d7a8"}
                opacity="0.8"
              />
              <path
                d="M 60 55 L 75 55 L 75 65 L 60 65 Z"
                fill={isDark ? "#14532d" : "#c4d7a8"}
                opacity="0.8"
              />
              <path
                d="M 70 80 L 100 80 L 100 100 L 70 100 Z"
                fill={isDark ? "#27272a" : "#d1d5db"}
              />
              <path
                d="M 30 100 C 30 100 25 80 40 70 C 55 60 50 40 30 35 C 10 30 5 15 15 0 L 12 0 C 2 15 8 32 28 38 C 48 44 52 62 38 72 C 22 82 28 100 28 100 Z"
                fill={isDark ? "#451a03" : "#fde047"}
                opacity="0.6"
              />
            </svg>

            {/* Roads */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <g
                stroke={isDark ? "#3f3f46" : "#ffffff"}
                strokeWidth="0.8"
              >
                {[45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95].map((x) => (
                  <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="100" />
                ))}
                {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((y) => (
                  <line key={`h-${y}`} x1="20" y1={y} x2="100" y2={y} />
                ))}
              </g>
              <path
                d="M 40 0 L 40 100 M 0 45 L 100 45"
                stroke={isDark ? "#52525b" : "#ffffff"}
                strokeWidth="2"
              />
              <g fill="none">
                <path
                  d="M 20 0 Q 30 50 80 60 L 100 65"
                  stroke={isDark ? "#000000" : "#a3a3a3"}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 60 100 L 60 40 Q 60 20 100 10"
                  stroke={isDark ? "#000000" : "#a3a3a3"}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 20 0 Q 30 50 80 60 L 100 65"
                  stroke={isDark ? "#ca8a04" : "#fcd34d"}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M 60 100 L 60 40 Q 60 20 100 10"
                  stroke={isDark ? "#ca8a04" : "#fcd34d"}
                  strokeWidth="2"
                  strokeLinecap="round"
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
                  className={`absolute shadow-sm ${
                    isDark
                      ? "bg-zinc-700 shadow-black"
                      : "bg-gray-300 shadow-gray-400"
                  }`}
                  style={{
                    left: `${b.l}%`,
                    top: `${b.t}%`,
                    width: `${b.w}%`,
                    height: `${b.h}%`,
                    borderRadius: "2px",
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
                      isSelected || isHovered ? "scale-125" : "scale-100"
                    }`}
                  >
                    {(isSelected || isHovered) && (
                      <div
                        className={`absolute bottom-[140%] mb-2 px-2 py-1 text-[9px] font-black uppercase tracking-widest whitespace-nowrap rounded shadow-lg border-2 ${
                          isDark
                            ? "bg-zinc-900 text-white border-zinc-700"
                            : "bg-white text-black border-black"
                        }`}
                      >
                        {studio.name}
                        <div
                          className={`absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2 h-2 rotate-45 border-r-2 border-b-2 ${
                            isDark
                              ? "bg-zinc-900 border-zinc-700"
                              : "bg-white border-black"
                          }`}
                        />
                      </div>
                    )}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-lg relative z-10 ${
                        isSelected
                          ? isDark
                            ? "bg-white border-black text-black"
                            : "bg-black border-white text-white"
                          : isDark
                            ? "bg-zinc-800 border-zinc-600 text-zinc-400"
                            : "bg-white border-black text-black"
                      }`}
                    >
                      {isSelected ? (
                        <Mic2 size={14} strokeWidth={3} />
                      ) : (
                        <span className="text-[9px] font-bold tracking-tighter">
                          ${studio.hourlyRate}
                        </span>
                      )}
                    </div>
                    <div
                      className={`w-0.5 h-2 ${isDark ? "bg-white/30" : "bg-black/40"}`}
                    />
                    <div
                      className={`px-1.5 py-0.5 rounded-[3px] border shadow-sm mt-[-1px] ${
                        isDark
                          ? "bg-black/90 border-zinc-700 text-zinc-500"
                          : "bg-white/90 border-gray-300 text-gray-500"
                      }`}
                    >
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
                  <div className="absolute inset-0 bg-blue-500/30 blur-md rounded-full animate-pulse" />
                  <Navigation
                    size={20}
                    className="fill-blue-500 text-white drop-shadow-md transform rotate-45"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Map HUD - Top Right */}
          <div className="absolute top-3 right-3 z-30 flex flex-col gap-1.5">
            <button
              onClick={() => setTiltMode(!tiltMode)}
              className={`px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider shadow-lg transition-all border ${
                isDark
                  ? "bg-zinc-900/90 border-zinc-700 text-white backdrop-blur-sm"
                  : "bg-white/90 border-gray-200 text-black backdrop-blur-sm"
              }`}
            >
              {tiltMode ? "3D" : "2D"}
            </button>
          </div>

          {/* Map HUD - Bottom Right */}
          <div className="absolute bottom-3 right-3 flex flex-col gap-1 z-30">
            <div
              className={`flex flex-col rounded-lg overflow-hidden border shadow-lg backdrop-blur-sm ${
                isDark
                  ? "bg-zinc-900/90 border-zinc-700"
                  : "bg-white/90 border-gray-200"
              }`}
            >
              <button
                onClick={() => setMapZoom((z) => Math.min(z + 0.5, 4))}
                className={`p-2 border-b transition-colors ${
                  isDark ? "hover:bg-zinc-800 border-zinc-700" : "hover:bg-gray-100 border-gray-200"
                }`}
              >
                <Maximize2
                  size={14}
                  className={isDark ? "text-white" : "text-black"}
                />
              </button>
              <button
                onClick={() => setMapZoom((z) => Math.max(z - 0.5, 0.8))}
                className={`p-2 transition-colors ${
                  isDark ? "hover:bg-zinc-800" : "hover:bg-gray-100"
                }`}
              >
                <Minimize2
                  size={14}
                  className={isDark ? "text-white" : "text-black"}
                />
              </button>
            </div>
          </div>

          {/* Map HUD - Top Left floating actions */}
          <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5">
            {/* Recenter button */}
            <button
              onClick={getUserLocation}
              disabled={isLoadingLocation}
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border backdrop-blur-sm transition-all ${
                isDark
                  ? "bg-zinc-900/90 border-zinc-700 text-white"
                  : "bg-white/90 border-gray-200 text-black"
              } ${isLoadingLocation ? "opacity-50" : ""}`}
            >
              <Navigation size={14} />
            </button>

            {/* Create Studio button */}
            {permissions.canCreateStudios && (
              <button
                onClick={() => router.push("/studios/list-studio")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold shadow-lg backdrop-blur-sm transition-all border border-transparent ${
                  isDark
                    ? "bg-white text-black hover:bg-zinc-200"
                    : "bg-black text-white hover:bg-zinc-800"
                }`}
              >
                <Plus size={12} strokeWidth={2.5} />
                List Studio
              </button>
            )}
          </div>

          {/* Loading overlay */}
          {isLoadingStudios && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-50">
              <div
                className={`animate-spin rounded-full h-8 w-8 border-3 border-t-transparent ${
                  isDark ? "border-white" : "border-black"
                }`}
              />
            </div>
          )}

          {/* Selected Studio Card */}
          {selectedStudio && (
            <div className="absolute top-3 left-12 z-40 w-64 animate-in slide-in-from-left-4 duration-300">
              <div
                className={`relative overflow-hidden rounded-xl border shadow-2xl ${
                  isDark
                    ? "bg-zinc-900/95 border-zinc-700 backdrop-blur-md"
                    : "bg-white/95 border-gray-200 backdrop-blur-md"
                }`}
              >
                <div className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h3
                      className={`text-sm font-bold leading-tight flex items-center gap-1 ${
                        isDark ? "text-white" : "text-black"
                      }`}
                    >
                      {selectedStudio.name}
                      {selectedStudio.verificationStatus === "VERIFIED" && (
                        <BadgeCheck size={14} className="text-blue-500 shrink-0" />
                      )}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudio(null);
                      }}
                      className={`p-0.5 rounded-full transition-colors ${
                        isDark
                          ? "hover:bg-zinc-800 text-zinc-400"
                          : "hover:bg-gray-100 text-gray-400"
                      }`}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="relative h-20 w-full mb-2 rounded-lg overflow-hidden">
                    <img
                      src={
                        selectedStudio.imageUrl ||
                        "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80"
                      }
                      className="w-full h-full object-cover"
                      alt={selectedStudio.name}
                    />
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 rounded">
                      <span className="text-[8px] text-white font-medium">
                        {selectedStudio.location}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <Star
                        size={12}
                        className="text-yellow-400 fill-yellow-400"
                      />
                      <span
                        className={`text-xs font-semibold ${
                          isDark ? "text-white" : "text-black"
                        }`}
                      >
                        {selectedStudio.rating ? Number(selectedStudio.rating).toFixed(1) : "New"}
                      </span>
                    </div>
                    <div
                      className={`text-sm font-bold ${
                        isDark ? "text-white" : "text-black"
                      }`}
                    >
                      ${selectedStudio.hourlyRate}
                      <span
                        className={`text-[9px] font-normal ${
                          isDark ? "text-zinc-500" : "text-gray-400"
                        }`}
                      >
                        /hr
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/studios/create/${selectedStudio.id}`);
                    }}
                    className={`w-full py-2 text-xs font-bold rounded-lg transition-all active:scale-95 ${
                      isDark
                        ? "bg-white text-black hover:bg-zinc-200"
                        : "bg-black text-white hover:bg-zinc-800"
                    }`}
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
      {/* BOTTOM SHEET - COMPACT VERSION              */}
      {/* ═══════════════════════════════════════════ */}
      <div
        ref={sheetRef}
        className={`absolute left-0 right-0 bottom-0 z-40 transition-all duration-500 flex flex-col border-t ${
          isDark
            ? "bg-zinc-950/95 border-zinc-800 backdrop-blur-xl shadow-[0_-12px_40px_rgba(0,0,0,0.8)]"
            : "bg-white/95 border-gray-200 backdrop-blur-xl shadow-[0_-12px_40px_rgba(0,0,0,0.12)]"
        }`}
        style={{
          height: isExpanded ? "90vh" : "50vh",
          borderTopLeftRadius: "24px",
          borderTopRightRadius: "24px",
          transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)"
        }}
      >
        {/* Drag Handle Area */}
        <div
          className="w-full cursor-grab active:cursor-grabbing touch-none flex flex-col items-center pt-2 pb-3 shrink-0"
          onPointerDown={handleSheetPointerDown}
          onPointerMove={handleSheetPointerMove}
          onPointerUp={handleSheetPointerUp}
        >
          <div
            className={`w-10 h-1 rounded-full mb-1 ${
              isDark ? "bg-zinc-600" : "bg-gray-300"
            }`}
          />
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-0.5 rounded-full transition-colors ${
              isDark ? "text-zinc-500 hover:text-white hover:bg-zinc-800" : "text-gray-400 hover:text-black hover:bg-gray-100"
            }`}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>

        {/* Sheet Content Container */}
        <div className="flex flex-col flex-1 px-4 overflow-hidden">
          
          {/* Search Row - NO BORDER */}
          <div className="relative z-50 shrink-0 mb-3">
            <div
              className={`flex items-center rounded-xl transition-all duration-300 ${
                searchFocused
                  ? isDark
                    ? "bg-zinc-800 shadow-md"
                    : "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                  : isDark
                    ? "bg-zinc-900/80 hover:bg-zinc-800 shadow-sm"
                    : "bg-gray-100/80 hover:bg-gray-100 shadow-sm"
              }`}
            >
              <Search
                size={16}
                className="ml-3 shrink-0"
                style={{ color: isDark ? "#A1A1AA" : "#9CA3AF" }}
              />
              <input
                type="text"
                placeholder="Where are you recording?"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  updateSearchSuggestions(e.target.value);
                }}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                className={`flex-1 px-2 py-2.5 text-[13px] font-medium bg-transparent outline-none placeholder:font-normal ${
                  isDark ? "text-white placeholder:text-zinc-500" : "text-black placeholder:text-gray-500"
                }`}
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`pr-3 pl-2 py-2.5 flex items-center justify-center transition-colors ${
                  showFilters 
                    ? (isDark ? "text-white" : "text-black") 
                    : (isDark ? "text-zinc-500" : "text-gray-400")
                }`}
              >
                <SlidersHorizontal size={16} />
              </button>
            </div>

            {/* Search Suggestions Dropdown */}
            {searchSuggestions.length > 0 && (
              <div
                className={`absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50 ${
                  isDark ? "bg-zinc-800 shadow-2xl" : "bg-white border border-gray-100 shadow-xl"
                }`}
              >
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className={`flex items-center gap-2 w-full px-3 py-2.5 text-left transition-colors ${
                      isDark ? "hover:bg-zinc-700" : "hover:bg-gray-50"
                    } ${index > 0 ? (isDark ? "border-t border-zinc-700/50" : "border-t border-gray-100") : ""}`}
                    onClick={() => {
                      setSearchQuery(suggestion);
                      setSearchSuggestions([]);
                    }}
                  >
                    <div className={`p-1.5 rounded-full ${isDark ? "bg-zinc-900" : "bg-gray-100"}`}>
                      <MapPin size={12} className={isDark ? "text-zinc-400" : "text-gray-500"} />
                    </div>
                    <span className={`text-[13px] font-medium ${isDark ? "text-zinc-200" : "text-gray-800"}`}>
                      {suggestion}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Area */}
          <div className={`transition-all duration-300 overflow-hidden shrink-0 ${showFilters ? "max-h-64 opacity-100 mb-3" : "max-h-0 opacity-0 mb-0"}`}>
            {/* Location Filters */}
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-zinc-500" : "text-gray-500"}`}>
              Location
            </p>
            <div className="flex gap-2 mb-3">
              <select
                value={filterCountry}
                onChange={(e) => {
                  setFilterCountry(e.target.value);
                  setFilterCity("");
                }}
                className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                  isDark
                    ? "bg-zinc-900 border-zinc-800 text-zinc-300"
                    : "bg-gray-50 border-gray-200 text-gray-700"
                }`}
              >
                <option value="">All Countries</option>
                {availableCountries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {availableCities.length > 0 && (
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                    isDark
                      ? "bg-zinc-900 border-zinc-800 text-zinc-300"
                      : "bg-gray-50 border-gray-200 text-gray-700"
                  }`}
                >
                  <option value="">All Cities</option>
                  {availableCities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Price Range */}
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-zinc-500" : "text-gray-500"}`}>
              Price Range
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
              {FILTER_OPTIONS.map((option, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedFilterIndex(selectedFilterIndex === i ? null : i)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                    selectedFilterIndex === i
                      ? isDark
                        ? "bg-white text-black"
                        : "bg-black text-white"
                      : isDark
                        ? "bg-transparent text-zinc-300 hover:bg-zinc-800"
                        : "bg-transparent text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {option.text}
                </button>
              ))}
            </div>

            <div className="flex gap-4 mt-3 pl-1">
              <button
                onClick={() => setSortOrder(sortOrder === "price_asc" ? null : "price_asc")}
                className={`text-[11px] font-semibold transition-colors ${
                  sortOrder === "price_asc" ? (isDark ? "text-white" : "text-black") : (isDark ? "text-zinc-500 hover:text-zinc-300" : "text-gray-500 hover:text-gray-700")
                }`}
              >
                Lowest Price
              </button>
              <button
                onClick={() => setSortOrder(sortOrder === "rating_desc" ? null : "rating_desc")}
                className={`text-[11px] font-semibold transition-colors ${
                  sortOrder === "rating_desc" ? (isDark ? "text-white" : "text-black") : (isDark ? "text-zinc-500 hover:text-zinc-300" : "text-gray-500 hover:text-gray-700")
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
                className={`text-[11px] font-semibold transition-colors ${
                  sortOrder === "nearest" ? (isDark ? "text-white" : "text-black") : (isDark ? "text-zinc-500 hover:text-zinc-300" : "text-gray-500 hover:text-gray-700")
                }`}
              >
                Nearest
              </button>
            </div>
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between mt-1 mb-3 shrink-0">
            <h3 className={`text-[14px] font-bold ${isDark ? "text-white" : "text-black"}`}>
              {filteredStudios.length} {filteredStudios.length === 1 ? "Studio" : "Studios"}
            </h3>
            {permissions.canBookStudios && !permissions.canCreateStudios && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${isDark ? "bg-zinc-900 text-zinc-400" : "bg-gray-100 text-gray-500"}`}>
                <Mic2 size={12} />
                <span className="text-[9px] font-medium">Book ready</span>
              </div>
            )}
          </div>

          {/* Studio List - COMPACT */}
          <div className="flex-1 overflow-y-auto -mx-4 px-4 pb-6 scrollbar-hide">
            {filteredStudios.length > 0 ? (
              filteredStudios.map((studio, index) => {
                const distance =
                  userLocation && studio.latitude && studio.longitude
                    ? calculateDistance(userLocation.lat, userLocation.lon, studio.latitude, studio.longitude)
                    : null;

                return (
                  <div
                    key={studio.id}
                    className={`group flex items-center gap-3 py-3 cursor-pointer transition-all duration-200 ${
                      index > 0 ? (isDark ? "border-t border-zinc-800/50" : "border-t border-gray-100") : ""
                    }`}
                    onClick={() => router.push(`/studios/create/${studio.id}`)}
                    onMouseEnter={() => setHoveredStudio(studio.id)}
                    onMouseLeave={() => setHoveredStudio(null)}
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-zinc-800 relative shadow-sm">
                      <img
                        src={studio.imageUrl || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&q=80"}
                        alt={studio.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <h4 className={`text-[13px] font-semibold truncate flex items-center gap-1 ${isDark ? "text-white" : "text-black"}`}>
                          {studio.name}
                          {studio.verificationStatus === "VERIFIED" && (
                            <BadgeCheck size={14} className="text-blue-500 shrink-0" />
                          )}
                        </h4>
                        <div className={`flex items-baseline gap-0.5 shrink-0 ${isDark ? "text-white" : "text-black"}`}>
                          <span className="text-[12px] font-bold">${studio.hourlyRate}</span>
                          <span className={`text-[9px] ${isDark ? "text-zinc-500" : "text-gray-500"}`}>/hr</span>
                        </div>
                      </div>
                      
                      <p className={`text-[11px] truncate mb-1 ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
                        {studio.location.split(",")[0]}
                        {distance !== null && <span> • {Math.round(distance)} mi</span>}
                      </p>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Star size={10} className="text-black dark:text-white fill-black dark:fill-white" />
                          <span className={`text-[11px] font-semibold ${isDark ? "text-white" : "text-black"}`}>
                            {studio.rating ? Number(studio.rating).toFixed(1) : "New"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className={`p-3 rounded-full mb-2 ${isDark ? "bg-zinc-900 text-zinc-600" : "bg-gray-100 text-gray-400"}`}>
                  <Search size={20} />
                </div>
                <h4 className={`text-[13px] font-semibold mb-0.5 ${isDark ? "text-zinc-300" : "text-gray-700"}`}>
                  No studios found
                </h4>
                <p className={`text-[11px] ${isDark ? "text-zinc-500" : "text-gray-500"}`}>
                  {searchQuery ? `Try adjusting "${searchQuery}"` : "Try adjusting your filters"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
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