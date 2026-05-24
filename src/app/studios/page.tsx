"use client";

import { useState, useEffect, useMemo, useRef, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  Star,
  Plus,
  Navigation,
  X,
  Mic2,
  Minimize2,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  BadgeCheck,
} from "lucide-react";
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
  description?: string | null;
  capacity?: string;
  verificationStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
};

const EMPTY_STUDIOS: Studio[] = [];

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

// Simple hash function to turn an ID into a consistent number
const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

// Improved getPosition with Hash Jitter
const getPosition = (lat: number, lon: number, studioId: string) => {
  const mapMinX = 20, mapMaxX = 80;
  const mapMinY = 20, mapMaxY = 80;
  
  // Use the studio ID to generate a consistent but pseudo-random offset
  const hash = hashString(studioId);
  const jitterX = (hash % 10) - 5; // Spread between -5% and +5%
  const jitterY = ((hash >> 2) % 10) - 5; 

  const x = mapMinX + (Math.abs(lon * 100) % (mapMaxX - mapMinX)) + jitterX;
  const y = mapMinY + (Math.abs(lat * 100) % (mapMaxY - mapMinY)) + jitterY;
  
  return { x, y };
};

// Price filter options
const FILTER_OPTIONS = [
  { label: "Budget", min: 0, max: 25, text: "Under $25/hr" },
  { label: "Standard", min: 25, max: 50, text: "$25 - $50/hr" },
  { label: "Premium", min: 50, max: 100, text: "$50 - $100/hr" },
  { label: "Pro", min: 100, max: 9999, text: "$100+/hr" },
];

type SortOrder = "price_asc" | "rating_desc" | "nearest" | null;

// --- ISOLATED COMPONENTS FOR PERFORMANCE ---

// 1. Memoized Map Marker
const MapMarker = memo(({ 
  studio, 
  isSelected, 
  isHovered, 
  onSelect, 
  onHover 
}: { 
  studio: Studio; 
  isSelected: boolean; 
  isHovered: boolean; 
  onSelect: (s: Studio) => void; 
  onHover: (id: string | null) => void;
}) => {
  const pos = studio.latitude && studio.longitude 
    ? getPosition(studio.latitude, studio.longitude, studio.id) 
    : { x: 50, y: 50 };

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all duration-200 will-change-transform pointer-events-auto"
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, zIndex: isSelected || isHovered ? 50 : 10 }}
      onClick={(e) => { e.stopPropagation(); onSelect(studio); }}
      onPointerEnter={() => onHover(studio.id)}
      onPointerLeave={() => onHover(null)}
    >
      <div className={`relative flex flex-col items-center justify-center transition-transform duration-200 ${isSelected || isHovered ? "scale-110" : "scale-100"}`}>
        {(isSelected || isHovered) && (
          <div className="absolute bottom-[140%] mb-1 px-3 py-1.5 text-xs font-medium whitespace-nowrap bg-zinc-900 text-white rounded-lg shadow-xl border border-zinc-800">
            {studio.name}
            <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 rotate-45 border-r border-b bg-zinc-900 border-zinc-800" />
          </div>
        )}
        <div className={`w-9 h-9 flex items-center justify-center rounded-full border-2 relative z-10 shadow-lg transition-colors ${isSelected ? "bg-white border-white text-black" : "bg-zinc-900 border-zinc-700 text-white"}`}>
          {isSelected ? <Mic2 size={16} strokeWidth={2} /> : <span className="text-xs font-bold">${studio.hourlyRate}</span>}
        </div>
        <div className="px-2 py-0.5 rounded-md mt-1 bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 text-zinc-300 shadow-md">
          <span className="text-[10px] font-medium leading-none whitespace-nowrap block truncate max-w-[80px]">
            {studio.location.split(",")[0]}
          </span>
        </div>
      </div>
    </div>
  );
});
MapMarker.displayName = "MapMarker";

// 2. Interactive Map Component (Isolates drag state from list/sheet)
type InteractiveMapProps = {
  filteredStudios: Studio[];
  selectedStudio: Studio | null;
  setSelectedStudio: (studio: Studio | null) => void;
  hoveredStudio: string | null;
  setHoveredStudio: (id: string | null) => void;
  userLocation: { lat: number; lon: number } | null;
  isLoadingLocation: boolean;
  getUserLocation: () => void;
  permissions: { canCreateStudios?: boolean } | null | undefined;
};

// 2. Interactive Map Component (Isolates drag state from list/sheet)
// 2. Interactive Map Component (Isolates drag state from list/sheet)
const InteractiveMap = ({
  filteredStudios,
  selectedStudio,
  setSelectedStudio,
  hoveredStudio,
  setHoveredStudio,
  userLocation,
  isLoadingLocation,
  getUserLocation,
  permissions,
  isExpanded
}: any) => {
  const router = useRouter();
  const [mapZoom, setMapZoom] = useState(1.2);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [isMapDragging, setIsMapDragging] = useState(false);
  const [tiltMode, setTiltMode] = useState(false);
  const mapDragStart = useRef({ x: 0, y: 0 });

  const handleMapPointerDown = useCallback((e: React.PointerEvent) => {
    setIsMapDragging(true);
    mapDragStart.current = { x: e.clientX - mapOffset.x, y: e.clientY - mapOffset.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [mapOffset]);

  const handleMapPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isMapDragging) return;
    e.preventDefault();
    setMapOffset({ x: e.clientX - mapDragStart.current.x, y: e.clientY - mapDragStart.current.y });
  }, [isMapDragging]);

  const handleMapPointerUp = useCallback((e: React.PointerEvent) => {
    setIsMapDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const handleMapWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    setMapZoom((z) => Math.min(Math.max(z - e.deltaY * 0.001, 0.4), 4));
  }, []);

  return (
    <div
      className="absolute inset-0 transition-all duration-500 ease-out"
      style={{ paddingBottom: isExpanded ? "75vh" : "42vh" }}
    >
      <style>{`
        /* Smooth, slow ambient background shift */
        @keyframes subtle-drift {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }
        /* Low Altitude Parallax Fog Drift */
        @keyframes fog-roll {
          0% { transform: translate(0, 0); }
          100% { transform: translate(-10%, -10%); }
        }
      `}</style>
      <div
        className="relative w-full h-full overflow-hidden select-none bg-[#0a0a0c]"
        onWheel={handleMapWheel}
        onPointerDown={handleMapPointerDown}
        onPointerMove={handleMapPointerMove}
        onPointerUp={handleMapPointerUp}
        onPointerCancel={handleMapPointerUp}
        style={{ 
          cursor: isMapDragging ? "grabbing" : "grab", 
          touchAction: "none" 
        }}
      >
        <div
          className="absolute inset-0 w-full h-full will-change-transform"
          style={{
            transformStyle: "preserve-3d",
            transformOrigin: "center 70%",
            transform: `scale(${mapZoom}) translate(${mapOffset.x / mapZoom}px, ${mapOffset.y / mapZoom}px) ${
              tiltMode ? "perspective(1200px) rotateX(45deg)" : ""
            }`,
            transition: isMapDragging ? "none" : "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        >
          {/* Subtle noise texture base */}
          <div
            className="absolute inset-[-200%] w-[500%] h-[500%] opacity-[0.02] pointer-events-none mix-blend-screen"
            style={{ 
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' fill='%23ffffff'/%3E%3C/svg%3E")` 
            }}
          />

          {/* Land Mass & World Extension */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 transition-opacity duration-500 opacity-80" viewBox="0 0 100 100" overflow="visible">
            {/* Massive Base Continent (Prevents empty background voids) */}
            <rect x="-500" y="-500" width="1100" height="1100" fill="#111215" />
            
            {/* Extended Outer Geography */}
            <path d="M -500 -500 L -20 -500 Q -50 50 -10 500 L -500 500 Z" fill="#0d0e11" />
            <path d="M 120 -500 L 600 -500 L 600 600 L 140 600 Q 100 100 120 -500 Z" fill="#0d0e11" />
            <path d="M 140 -200 L 600 -200 L 600 600 Q 130 100 140 -200 Z" fill="#17181c" />
            <path d="M -500 -500 L 600 -500 L 600 -30 Q 100 -80 -500 -30 Z" fill="#14151a" />
            
            {/* Main Central Map (Left untouched so markers spawn correctly) */}
            <path d="M 15 0 L 100 0 L 100 100 L 30 100 C 30 100 25 80 40 70 C 55 60 50 40 30 35 C 10 30 5 15 15 0 Z" fill="#121317" />
            <path d="M 60 0 L 100 0 L 100 40 Q 80 50 60 30 Q 50 15 60 0 Z" fill="#18191e" />
            <path d="M 60 55 L 75 55 L 75 65 L 60 65 Z" fill="#1c1d22" />
            <path d="M 70 80 L 100 80 L 100 100 L 70 100 Z" fill="#15161a" />
            <path d="M 30 100 C 30 100 25 80 40 70 C 55 60 50 40 30 35 C 10 30 5 15 15 0 L 12 0 C 2 15 8 32 28 38 C 48 44 52 62 38 72 C 22 82 28 100 28 100 Z" fill="#0d0e11" />
          </svg>

          {/* Roads & Infrastructure */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" overflow="visible">
            <g stroke="#1f1f24" strokeWidth="0.4" opacity="0.6">
              {/* Extended Grid Lines */}
              {[-400, -300, -200, -100, -80, -60, -40, -20, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 300, 400, 500].map((y) => <line key={`h-${y}`} x1="-500" y1={y} x2="600" y2={y} />)}
              {[-400, -300, -200, -100, -80, -60, -40, -20, 0, 15, 25, 35, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 120, 140, 160, 180, 200, 300, 400, 500].map((x) => <line key={`v-${x}`} x1={x} y1="-500" x2={x} y2="600" />)}
            </g>
            
            {/* Extended Center Coordinates Guide */}
            <path d="M -500 45 L 600 45 M 40 -500 L 40 600" stroke="#2e2e36" strokeWidth="1.2" strokeDasharray="5,5" opacity="0.6" />
            
            {/* Extended Roads */}
            <g fill="none">
              {/* East-West road - linearly extended to bounds */}
              <path d="M -500 -280 L -50 0 Q 30 50 80 60 L 250 65 L 600 80" stroke="#0a0a0c" strokeWidth="4" strokeLinecap="round" />
              <path d="M -500 -280 L -50 0 Q 30 50 80 60 L 250 65 L 600 80" stroke="#3f3f46" strokeWidth="1.2" strokeLinecap="round" />
              
              {/* North-South road - linearly extended to bounds */}
              <path d="M 60 600 L 60 40 Q 60 20 150 -50 L 500 -322" stroke="#0a0a0c" strokeWidth="4" strokeLinecap="round" />
              <path d="M 60 600 L 60 40 Q 60 20 150 -50 L 500 -322" stroke="#3f3f46" strokeWidth="1.2" strokeLinecap="round" />
            </g>
          </svg>

          {/* Minimalist Buildings */}
          <div className="absolute inset-0 pointer-events-none opacity-60 z-10">
            {[
              { l: 42, t: 47, w: 4, h: 4 }, { l: 47, t: 47, w: 4, h: 6 }, { l: 42, t: 53, w: 9, h: 4 },
              { l: 55, t: 48, w: 8, h: 8 }, { l: 65, t: 25, w: 5, h: 5 }, { l: 82, t: 75, w: 6, h: 10 },
              { l: 35, t: 20, w: 4, h: 4 }, { l: 90, t: 15, w: 5, h: 5 },
            ].map((b, i) => (
              <div 
                key={i} 
                className="absolute bg-[#18181b] border border-[#27272a] rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.4)]" 
                style={{ left: `${b.l}%`, top: `${b.t}%`, width: `${b.w}%`, height: `${b.h}%` }} 
              />
            ))}
          </div>

          {/* Clean Low-Altitude Fog */}
          <div 
            className="absolute inset-0 pointer-events-none z-15"
            style={{
              transform: tiltMode ? 'translateZ(40px)' : 'translateZ(0px)',
              transition: 'transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)',
              transformStyle: 'preserve-3d'
            }}
          >
            <div 
              className="absolute inset-[-100%] w-[300%] h-[300%] mix-blend-screen opacity-[0.06]"
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='fog'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.012' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23fog)' fill='%23ffffff'/%3E%3C/svg%3E")`,
                animation: 'fog-roll 60s linear infinite'
              }}
            />
          </div>

          {/* MARKERS & USER LOCATION */}
          <div 
            className="absolute inset-0 pointer-events-none z-30"
            style={{
              transform: tiltMode ? 'translateZ(60px)' : 'translateZ(0px)',
              transition: 'transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)',
              transformStyle: 'preserve-3d'
            }}
          >
            {filteredStudios.map((studio: Studio) => (
              <MapMarker
                key={studio.id}
                studio={studio}
                isSelected={selectedStudio?.id === studio.id}
                isHovered={hoveredStudio === studio.id}
                onSelect={setSelectedStudio}
                onHover={setHoveredStudio}
              />
            ))}
            
            {/* User Location */}
            {userLocation && (
              <div className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto" style={{ left: "35%", top: "40%" }}>
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-full animate-pulse" />
                  <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Clean Vignette & Depth Overlay */}
        <div className="absolute inset-0 pointer-events-none z-25 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(5,5,5,0.75)_120%)]" />
        </div>

        {/* Map HUD Controls */}
        <div className="absolute top-4 right-4 z-30 flex flex-col gap-2 pointer-events-auto">
          <button
            onClick={() => setTiltMode(!tiltMode)}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors shadow-lg"
          >
            {tiltMode ? "3D" : "2D"}
          </button>
        </div>

        <div className="absolute bottom-4 right-4 flex flex-col z-30 shadow-lg rounded-lg overflow-hidden border border-zinc-800 pointer-events-auto">
          <button
            onClick={() => setMapZoom((z) => Math.min(z + 0.5, 4))}
            className="w-10 h-10 flex items-center justify-center bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors border-b border-zinc-800"
          >
            <Plus size={18} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setMapZoom((z) => Math.max(z - 0.5, 0.4))}
            className="w-10 h-10 flex items-center justify-center bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Minimize2 size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="absolute top-4 left-4 z-30 flex flex-col gap-3 pointer-events-auto">
          <button
            onClick={getUserLocation}
            disabled={isLoadingLocation}
            className={`w-10 h-10 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors shadow-lg ${isLoadingLocation ? "opacity-50" : ""}`}
          >
            <Navigation size={18} strokeWidth={1.5} />
          </button>
          {permissions?.canCreateStudios && (
            <button
              onClick={() => router.push("/studios/list-studio")}
              className="px-4 py-2.5 text-sm font-medium rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-lg"
            >
              <Plus size={16} strokeWidth={2} />
              List Studio
            </button>
          )}
        </div>

        {/* Selected Studio Floating Card */}
        {selectedStudio && (
          <div className="absolute top-4 left-16 z-40 w-64 animate-in slide-in-from-left-4 duration-300 pointer-events-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-sm font-medium text-white flex items-center gap-1.5 line-clamp-1">
                    {selectedStudio.name}
                    {selectedStudio.verificationStatus === "VERIFIED" && <BadgeCheck size={14} className="text-blue-400 shrink-0" />}
                  </h3>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedStudio(null); }}
                    className="text-zinc-500 hover:text-white transition-colors ml-2"
                  >
                    <X size={16} strokeWidth={1.5} />
                  </button>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5 text-yellow-500">
                    <Star size={12} className="fill-current" />
                    <span className="text-sm font-medium">
                      {selectedStudio.rating ? Number(selectedStudio.rating).toFixed(1) : "New"}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-white">
                    ${selectedStudio.hourlyRate}
                    <span className="text-xs font-normal text-zinc-500">/hr</span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); router.push(`/studios/${selectedStudio.id}`); }}
                  className="w-full py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
                >
                  View Studio
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
InteractiveMap.displayName = "InteractiveMap";


// --- MAIN PAGE COMPONENT ---

export default function StudioList() {
  const router = useRouter();
  const { permissions } = usePermissions();

  // Location state
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number; } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [selectedFilterIndex, setSelectedFilterIndex] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Location filter state
  const [filterCountry, setFilterCountry] = useState("");
  const [filterCity, setFilterCity] = useState("");

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data: studiosData, isLoading: isLoadingStudios } = useStudios({
    search: debouncedSearch || undefined,
    country: filterCountry || undefined,
    city: filterCity || undefined,
    minRate: selectedFilterIndex !== null ? FILTER_OPTIONS[selectedFilterIndex].min : undefined,
    maxRate:
      selectedFilterIndex !== null && FILTER_OPTIONS[selectedFilterIndex].max < 9999
        ? FILTER_OPTIONS[selectedFilterIndex].max
        : undefined,
  });
  const studios = studiosData?.studios ?? EMPTY_STUDIOS;

  // Bottom sheet state
  const [isExpanded, setIsExpanded] = useState(false);
  const isDraggingSheet = useRef(false);
  const dragStartY = useRef(0);

  // Main shared map state
  const [selectedStudio, setSelectedStudio] = useState<Studio | null>(null);
  const [hoveredStudio, setHoveredStudio] = useState<string | null>(null);

  // Get user location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
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

  const filteredStudios = useMemo(() => {
    const data = [...studios];
    if (sortOrder === "price_asc") {
      data.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
    } else if (sortOrder === "rating_desc") {
      data.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortOrder === "nearest" && userLocation) {
      data.sort((a, b) => {
        const distA =
          a.latitude && a.longitude
            ? calculateDistance(userLocation.lat, userLocation.lon, a.latitude, a.longitude)
            : Infinity;
        const distB =
          b.latitude && b.longitude
            ? calculateDistance(userLocation.lat, userLocation.lon, b.latitude, b.longitude)
            : Infinity;
        return distA - distB;
      });
    }
    return data;
  }, [studios, sortOrder, userLocation]);

  const handleSheetPointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingSheet.current = true;
    dragStartY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handleSheetPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingSheet.current) return;
    const dy = e.clientY - dragStartY.current;
    if (Math.abs(dy) > 40) {
      if (dy < 0) setIsExpanded(true);
      else setIsExpanded(false);
      isDraggingSheet.current = false;
    }
  }, []);

  const handleSheetPointerUp = useCallback(() => {
    isDraggingSheet.current = false;
  }, []);

  return (
    <div className="relative w-full overflow-hidden bg-[#030303] selection:bg-white selection:text-black" style={{ height: "100vh" }}>
      
      {/* EXTRACTED MAP LAYER (Prevents List Re-renders) */}
      <InteractiveMap 
        filteredStudios={filteredStudios}
        selectedStudio={selectedStudio}
        setSelectedStudio={setSelectedStudio}
        hoveredStudio={hoveredStudio}
        setHoveredStudio={setHoveredStudio}
        userLocation={userLocation}
        isLoadingLocation={isLoadingLocation}
        getUserLocation={getUserLocation}
        permissions={permissions}
      />

      {isLoadingStudios && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 pointer-events-none">
          <div className="animate-spin h-8 w-8 border-2 border-t-transparent border-white rounded-full" />
        </div>
      )}

      {/* BOTTOM SHEET */}
      <div
        className="absolute left-0 right-0 bottom-0 z-40 flex flex-col bg-[#030303] border-t border-zinc-800 rounded-t-3xl shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.5)] transition-transform duration-500 will-change-transform"
        style={{
          height: "90vh",
          transform: isExpanded ? "translate3d(0, 0, 0)" : "translate3d(0, 32vh, 0)",
          transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Drag Handle */}
        <div
          className="w-full cursor-grab active:cursor-grabbing touch-none flex flex-col items-center pt-3 pb-3 shrink-0"
          onPointerDown={handleSheetPointerDown}
          onPointerMove={handleSheetPointerMove}
          onPointerUp={handleSheetPointerUp}
          onPointerCancel={handleSheetPointerUp}
        >
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-zinc-800/50 hover:bg-zinc-700 transition-colors rounded-full px-6 py-1 outline-none text-zinc-400 hover:text-white"
          >
            {isExpanded ? <ChevronDown size={18} strokeWidth={2} /> : <ChevronUp size={18} strokeWidth={2} />}
          </button>
        </div>

        <div className="flex flex-col flex-1 px-4 lg:px-8 overflow-hidden pt-1">
          {/* Search Row */}
          <div className="relative z-50 shrink-0 mb-5">
            <div className="flex items-center bg-zinc-900 rounded-xl border border-zinc-800">
              <Search size={18} className="ml-4 shrink-0 text-zinc-500" />
              <input
                type="text"
                placeholder="Where are you recording?"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  updateSearchSuggestions(e.target.value);
                }}
                onFocus={() => setIsExpanded(true)}
                className="flex-1 px-4 py-3.5 text-sm font-light bg-transparent outline-none ring-0 border-none text-white placeholder-zinc-500 focus:ring-0"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`pr-4 pl-3 py-3.5 flex items-center justify-center transition-colors bg-transparent border-none outline-none ${showFilters ? "text-white" : "text-zinc-500 hover:text-white"}`}
              >
                <SlidersHorizontal size={18} />
              </button>
            </div>

            {searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 z-50 rounded-xl shadow-xl overflow-hidden">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-zinc-800 transition-colors ${index > 0 ? "border-t border-zinc-800/50" : ""}`}
                    onClick={() => { setSearchQuery(suggestion); setSearchSuggestions([]); }}
                  >
                    <MapPin size={14} className="text-zinc-500" />
                    <span className="text-sm font-medium text-zinc-300">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Area */}
          <div className={`transition-all duration-300 overflow-hidden shrink-0 ${showFilters ? "max-h-80 opacity-100 mb-5 border-b border-zinc-800 pb-5" : "max-h-0 opacity-0 mb-0"}`}>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <span className="block text-sm font-medium text-zinc-400 mb-2">Country</span>
                <select
                  value={filterCountry}
                  onChange={(e) => { setFilterCountry(e.target.value); setFilterCity(""); }}
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm font-light text-white outline-none focus:border-zinc-600 cursor-pointer"
                >
                  <option value="">All Countries</option>
                  {availableCountries.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {availableCities.length > 0 && (
                <div>
                  <span className="block text-sm font-medium text-zinc-400 mb-2">City</span>
                  <select
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm font-light text-white outline-none focus:border-zinc-600 cursor-pointer"
                  >
                    <option value="">All Cities</option>
                    {availableCities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </div>

            <span className="block text-sm font-medium text-zinc-400 mb-3">Price</span>
            <div className="flex flex-wrap gap-2 mb-6">
              {FILTER_OPTIONS.map((option, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedFilterIndex(selectedFilterIndex === i ? null : i)}
                  className={`px-4 py-2 text-xs font-medium rounded-lg transition-all border ${selectedFilterIndex === i ? "bg-white text-black border-white" : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex gap-6">
              <button
                onClick={() => setSortOrder(sortOrder === "price_asc" ? null : "price_asc")}
                className={`text-sm font-medium transition-colors pb-1 border-b-2 ${sortOrder === "price_asc" ? "text-white border-white" : "text-zinc-500 border-transparent hover:text-zinc-300"}`}
              >
                Lowest Price
              </button>
              <button
                onClick={() => setSortOrder(sortOrder === "rating_desc" ? null : "rating_desc")}
                className={`text-sm font-medium transition-colors pb-1 border-b-2 ${sortOrder === "rating_desc" ? "text-white border-white" : "text-zinc-500 border-transparent hover:text-zinc-300"}`}
              >
                Highest Rated
              </button>
              <button
                onClick={() => { if (sortOrder === "nearest") setSortOrder(null); else { getUserLocation(); setSortOrder("nearest"); } }}
                className={`text-sm font-medium transition-colors pb-1 border-b-2 ${sortOrder === "nearest" ? "text-white border-white" : "text-zinc-500 border-transparent hover:text-zinc-300"}`}
              >
                Nearest to Me
              </button>
            </div>
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h3 className="text-sm font-medium text-zinc-400">
              {filteredStudios.length} {filteredStudios.length === 1 ? "Result" : "Results"}
            </h3>
          </div>

          {/* GRID FEED */}
          <div
            className="flex-1 overflow-y-auto scrollbar-hide"
            style={{ paddingBottom: isExpanded ? "1.5rem" : "calc(32vh + 1.5rem)" }}
          >
            {filteredStudios.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredStudios.map((studio) => {
                  const distance = userLocation && studio.latitude && studio.longitude
                    ? calculateDistance(userLocation.lat, userLocation.lon, studio.latitude, studio.longitude)
                    : null;

                  return (
                   
                 <div
  key={studio.id}
  className="group flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 hover:bg-zinc-800 transition-all duration-300 cursor-pointer overflow-hidden"
  onClick={() => router.push(`/studios/${studio.id}`)}
  onMouseEnter={() => setHoveredStudio(studio.id)}
  onMouseLeave={() => setHoveredStudio(null)}
>
  {/* IMAGE CONTAINER - Shorter height */}
  <div className="relative w-full h-32 overflow-hidden bg-zinc-950">
    <img
      src={studio.imageUrl || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&q=80"}
      alt={studio.name}
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
    />
    {studio.verificationStatus === "VERIFIED" && (
      <div className="absolute top-2 right-2 rounded-full backdrop-blur-md bg-black/50 p-1">
        <BadgeCheck size={10} className="text-blue-400" />
      </div>
    )}
    <div className="absolute bottom-2 left-2 rounded-md bg-black/60 backdrop-blur-md px-1.5 py-0.5 flex items-center gap-0.5">
      <Star size={8} className="fill-yellow-500 text-yellow-500" />
      <span className="text-[10px] font-medium text-white">
        {studio.rating ? Number(studio.rating).toFixed(1) : "New"}
      </span>
    </div>
  </div>

  {/* META DATA - Compact */}
  <div className="p-2 flex flex-col gap-1 flex-grow">
    <div className="flex justify-between items-start gap-1">
      <h4 className="text-xs font-medium text-white line-clamp-1">
        {studio.name}
      </h4>
      <span className="text-xs font-semibold text-white shrink-0">
        ${studio.hourlyRate}
      </span>
    </div>

    <p className="text-[11px] font-light text-zinc-400 truncate">
      {studio.location.split(",")[0]}
    </p>

    {distance !== null && (
      <p className="text-[10px] font-light text-zinc-500 mt-0.5 pt-0.5 border-t border-zinc-800/50">
        {Math.round(distance)} miles away
      </p>
    )}
  </div>
</div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 border border-zinc-800 border-dashed rounded-xl">
                <Search size={24} className="text-zinc-600 mb-3" strokeWidth={1.5} />
                <h4 className="text-sm font-medium text-zinc-300 mb-1">
                  No Studios Found
                </h4>
                <p className="text-xs font-light text-zinc-500">
                  {searchQuery ? `Try adjusting "${searchQuery}"` : "Adjust your filters"}
                </p>
              </div>
            )}
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
