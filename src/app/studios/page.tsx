"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Star, CheckCircle2, Map, Plus , Grid, Navigation, Zap, X, Mic2, Maximize2, Minimize2 } from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";
import { usePermissions } from "@/hooks/usePermissions";
import { useStudios } from "@/hooks/useStudios";


type Studio = {
  id: string;
  name: string;
  location: string;
  hourlyRate: number;
  rating: number;
  equipment: string[];
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  description?: string;
  capacity?: string;
};

// Haversine formula to calculate distance between two coordinates (in miles)
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
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function StudioList() {
  const router = useRouter();
  const { theme } = useTheme();
   const { permissions, isArtist, isProducer, canAccess } = usePermissions();


  // Fetch studios with React Query
  const { data: studios = [], isLoading: isLoadingStudios } = useStudios();

  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [radius, setRadius] = useState(1000);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [viewMode, setViewMode] = useState<"map" | "grid">("map");
  const [selectedStudio, setSelectedStudio] = useState<Studio | null>(null);
  const [hoveredStudio, setHoveredStudio] = useState<number | null>(null);
  const [mapZoom, setMapZoom] = useState(4);

  // Get user's location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lon: longitude });
          setMapZoom(10);
          setIsLoadingLocation(false);
        },
        (error) => {
          setIsLoadingLocation(false);
          alert("Unable to retrieve location. Please allow location access.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  // Filter studios with useMemo for performance
  const filteredStudios = useMemo(() => {
    let filtered = studios;

    if (userLocation && radius < 1000) {
      filtered = filtered.filter((studio) => {
        if (!studio.latitude || !studio.longitude) return false;
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lon,
          studio.latitude,
          studio.longitude
        );
        return distance <= radius;
      });
    }

    if (locationFilter !== "all") {
      filtered = filtered.filter((studio) =>
        studio.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (searchQuery) {
      filtered = filtered.filter((studio) =>
        studio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        studio.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [studios, userLocation, radius, locationFilter, searchQuery]);

  // Calculate map center from all filtered studios
  const getMapCenter = () => {
    if (userLocation) {
      return userLocation;
    }
    if (filteredStudios.length === 0) {
      return { lat: 39.8283, lon: -98.5795 }; // Center of USA
    }
    const avgLat = filteredStudios.reduce((sum, s) => sum + s.lat, 0) / filteredStudios.length;
    const avgLon = filteredStudios.reduce((sum, s) => sum + s.lon, 0) / filteredStudios.length;
    return { lat: avgLat, lon: avgLon };
  };

  // Enhanced Map View with Real Map Background
 

  // Enhanced Map View with "GTA/Satellite Navigation" Aesthetic
  const MapView = () => {
    // --- State for Map Interaction ---
    const [zoom, setZoom] = useState(1.2);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [tiltMode, setTiltMode] = useState(false); // Toggle between Top-down and 3D Tilt

    // --- Interaction Handlers ---
    const handleWheel = (e: React.WheelEvent) => {
      e.stopPropagation();
      // Zoom limits: 0.8x to 4x
      const newZoom = Math.min(Math.max(zoom - e.deltaY * 0.001, 0.8), 4);
      setZoom(newZoom);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    // --- Projection Logic ---
    // Since we are using a drawn SVG map, we map coordinates to the visual layout.
    // In a real app with Mapbox/Leaflet, this is handled by the library.
    const getPosition = (lat: number, lon: number) => {
      // Deterministic pseudo-random placement based on lat/lon to keep them stable
      // This spreads markers nicely across the "Land" part of our drawn map
      const seedX = (Math.abs(lon) * 1000) % 100;
      const seedY = (Math.abs(lat) * 1000) % 100;
      
      // Map to the "City" area (20-90% X, 10-80% Y)
      return { 
        x: 20 + (seedX * 0.7), 
        y: 10 + (seedY * 0.7) 
      };
    };

    return (
      <div 
        className={`relative h-[750px] w-full rounded-xl overflow-hidden border-4 shadow-2xl transition-colors duration-300 group select-none ${
          theme === "dark" 
            ? "border-zinc-800 bg-[#0f172a]" // Deep Ocean Blue (Night)
            : "border-white bg-[#a5c5d9]" // Classic GTA Water Blue (Day)
        }`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* --- 1. The Interactive Map Surface --- */}
        <div 
          className="absolute inset-0 w-full h-full origin-center will-change-transform"
          style={{
            transform: `
              scale(${zoom}) 
              translate(${offset.x / zoom}px, ${offset.y / zoom}px)
              ${tiltMode ? 'perspective(1000px) rotateX(35deg)' : ''}
            `,
            transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
        >
          {/* A. Water Texture (Subtle Noise) */}
          <div className="absolute inset-[-100%] w-[300%] h-[300%] opacity-[0.04] pointer-events-none" 
               style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
          />

          {/* B. Land Mass Layer (Coastal City Shape) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <filter id="land-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="0.5" floodOpacity="0.2" />
              </filter>
            </defs>

            {/* Mainland */}
            <path 
              d="M 15 0 L 100 0 L 100 100 L 30 100 C 30 100 25 80 40 70 C 55 60 50 40 30 35 C 10 30 5 15 15 0 Z" 
              fill={theme === "dark" ? "#18181b" : "#e5e7eb"} // Zinc-900 vs Gray-200
              filter="url(#land-shadow)"
            />
            
            {/* Greenery / Hills (Top Right) */}
            <path 
              d="M 60 0 L 100 0 L 100 40 Q 80 50 60 30 Q 50 15 60 0 Z" 
              fill={theme === "dark" ? "#14532d" : "#c4d7a8"} // Green-900 vs Pale Green
              opacity="0.8"
            />
            
            {/* City Park (Central) */}
            <path 
              d="M 60 55 L 75 55 L 75 65 L 60 65 Z" 
              fill={theme === "dark" ? "#14532d" : "#c4d7a8"}
              opacity="0.8"
            />

            {/* Industrial District (Bottom Right - darker) */}
            <path 
              d="M 70 80 L 100 80 L 100 100 L 70 100 Z" 
              fill={theme === "dark" ? "#27272a" : "#d1d5db"} 
            />

            {/* Beach (Along the coast curve) */}
            <path 
              d="M 30 100 C 30 100 25 80 40 70 C 55 60 50 40 30 35 C 10 30 5 15 15 0 L 12 0 C 2 15 8 32 28 38 C 48 44 52 62 38 72 C 22 82 28 100 28 100 Z" 
              fill={theme === "dark" ? "#451a03" : "#fde047"} // Dark Brown vs Yellow Sand
              opacity="0.6"
            />
          </svg>

          {/* C. Roads Infrastructure */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* 1. Local Streets (Grid) */}
            <g stroke={theme === "dark" ? "#3f3f46" : "#ffffff"} strokeWidth="0.8">
              {/* Vertical Streets */}
              {[45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95].map(x => (
                <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="100" />
              ))}
              {/* Horizontal Streets */}
              {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(y => (
                <line key={`h-${y}`} x1="20" y1={y} x2="100" y2={y} />
              ))}
            </g>

            {/* 2. Main Arteries (Thicker White/Grey) */}
            <path 
              d="M 40 0 L 40 100 M 0 45 L 100 45" 
              stroke={theme === "dark" ? "#52525b" : "#ffffff"} 
              strokeWidth="2"
            />

            {/* 3. Highways (Yellow/Orange with Outline) */}
            <g fill="none">
              {/* Highway Outline (Black/Dark) */}
              <path 
                d="M 20 0 Q 30 50 80 60 L 100 65" 
                stroke={theme === "dark" ? "#000000" : "#a3a3a3"} 
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <path 
                d="M 60 100 L 60 40 Q 60 20 100 10" 
                stroke={theme === "dark" ? "#000000" : "#a3a3a3"} 
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Highway Inner Color */}
              <path 
                d="M 20 0 Q 30 50 80 60 L 100 65" 
                stroke={theme === "dark" ? "#ca8a04" : "#fcd34d"} 
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path 
                d="M 60 100 L 60 40 Q 60 20 100 10" 
                stroke={theme === "dark" ? "#ca8a04" : "#fcd34d"} 
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          </svg>

          {/* D. Building Blocks (2D Top Down shapes) */}
          <div className="absolute inset-0 pointer-events-none opacity-90">
            {[
              // Downtown Cluster
              { l: 42, t: 47, w: 4, h: 4 }, { l: 47, t: 47, w: 4, h: 6 },
              { l: 42, t: 53, w: 9, h: 4 }, { l: 55, t: 48, w: 8, h: 8 },
              // Scattered
              { l: 65, t: 25, w: 5, h: 5 }, { l: 82, t: 75, w: 6, h: 10 },
              { l: 35, t: 20, w: 4, h: 4 }, { l: 90, t: 15, w: 5, h: 5 },
            ].map((b, i) => (
              <div 
                key={i}
                className={`absolute shadow-sm ${
                  theme === "dark" ? "bg-zinc-700 shadow-black" : "bg-gray-300 shadow-gray-400"
                }`}
                style={{
                  left: `${b.l}%`, top: `${b.t}%`, width: `${b.w}%`, height: `${b.h}%`,
                  borderRadius: '2px'
                }}
              />
            ))}
          </div>

          {/* E. Map Markers (Studios) */}
          {filteredStudios.map((studio) => {
             // Calculate visual position
             const pos = studio.latitude && studio.longitude 
               ? getPosition(studio.latitude, studio.longitude)
               : { x: 50, y: 50 };

             const isSelected = selectedStudio?.id === studio.id;
             const isHovered = hoveredStudio === studio.id;

             return (
               <div
                 key={studio.id}
                 className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all duration-200 will-change-transform"
                 style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                 onClick={(e) => { e.stopPropagation(); setSelectedStudio(studio); }}
                 onMouseEnter={() => setHoveredStudio(studio.id)}
                 onMouseLeave={() => setHoveredStudio(null)}
               >
                 <div className={`
                   relative flex flex-col items-center justify-center transition-transform duration-200
                   ${isSelected ? "scale-125 z-50" : isHovered ? "scale-110 z-40" : "scale-100 z-10"}
                 `}>
                   
                   {/* Hover Label (GTA Style Box) */}
                   {(isSelected || isHovered) && (
                     <div className={`
                       absolute bottom-full mb-3 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]
                       ${theme === "dark" 
                         ? "bg-zinc-900 text-white border border-zinc-700" 
                         : "bg-white text-black border border-black"
                       }
                     `}>
                       {studio.name}
                     </div>
                   )}

                   {/* The Icon Blip */}
                   <div className={`
                     w-9 h-9 rounded-full flex items-center justify-center border-2 shadow-lg
                     ${isSelected 
                       ? "bg-black border-white text-white dark:bg-white dark:border-black dark:text-black" 
                       : theme === "dark"
                         ? "bg-zinc-800 border-zinc-600 text-zinc-400"
                         : "bg-white border-black text-black"
                     }
                   `}>
                     {isSelected 
                        ? <Mic2 size={16} strokeWidth={3} /> 
                        : <span className="text-[10px] font-bold tracking-tighter">${studio.hourlyRate}</span>
                     }
                   </div>
                   
                   {/* "Ground Stick" Shadow */}
                   <div className="w-0.5 h-3 bg-black/40" />
                   <div className="w-5 h-1.5 bg-black/20 rounded-full blur-[2px]" />
                 </div>
               </div>
             );
          })}
          
          {/* User Location Arrow */}
          {userLocation && (
            <div 
              className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `35%`, top: `40%` }} // Mock position on the "beach" road
            >
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/30 blur-md rounded-full animate-pulse" />
                <Navigation 
                  size={24} 
                  className="fill-blue-500 text-white drop-shadow-md transform rotate-45" 
                />
              </div>
            </div>
          )}
        </div>

        {/* --- 2. HUD (Heads Up Display) --- */}
        
        {/* Top Right: Compass/Tilt Toggle */}
        <div className="absolute top-8 right-8 z-30 flex flex-col gap-2">
            <button 
              onClick={() => setTiltMode(!tiltMode)}
              className={`px-3 py-2 rounded font-black text-[10px] uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all border-2 ${
                theme === "dark" ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-black text-black"
              }`}
            >
              {tiltMode ? "3D View" : "Top Down"}
            </button>
        </div>

        {/* Bottom Right: Zoom Controls */}
        <div className="absolute bottom-8 right-8 flex flex-col gap-2 z-30">
          <div className={`flex flex-col rounded overflow-hidden border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
            theme === "dark" ? "bg-zinc-900 border-zinc-700" : "bg-white border-black"
          }`}>
            <button onClick={() => setZoom(z => Math.min(z + 0.5, 4))} className="p-3 hover:bg-gray-100 dark:hover:bg-zinc-800 border-b-2 dark:border-zinc-700">
              <Maximize2 size={18} strokeWidth={2.5} className={theme === "dark" ? "text-white" : "text-black"} />
            </button>
            <button onClick={() => setZoom(z => Math.max(z - 0.5, 0.8))} className="p-3 hover:bg-gray-100 dark:hover:bg-zinc-800">
              <Minimize2 size={18} strokeWidth={2.5} className={theme === "dark" ? "text-white" : "text-black"} />
            </button>
          </div>
        </div>

        {/* Bottom Left: Legend */}
        <div className="absolute bottom-8 left-8 z-30 pointer-events-none">
          <div className={`px-4 py-3 border-l-[6px] shadow-lg ${
            theme === "dark" ? "bg-black/80 border-white text-white" : "bg-white/95 border-black text-black"
          }`}>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">District</div>
            <div className="text-xl font-black uppercase tracking-tighter leading-none">Vinewood Hills</div>
          </div>
        </div>

        {/* Center Overlay: Loading State */}
        {isLoadingStudios && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-50">
             <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent dark:border-white dark:border-t-transparent" />
          </div>
        )}

        {/* --- 3. Selected Studio Card (Mission Info Style) --- */}
        {selectedStudio && (
          <div className="absolute top-8 left-8 z-40 w-80 animate-in slide-in-from-left-4 duration-300">
            <div className={`
              relative overflow-hidden border-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.25)]
              ${theme === "dark" ? "bg-zinc-900 border-zinc-600" : "bg-white border-black"}
            `}>
               {/* Decorative Header Bar */}
               <div className="h-1.5 w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600" />
               
               <div className="p-5">
                 <div className="flex justify-between items-start mb-4">
                   <h2 className={`text-2xl font-black uppercase tracking-tighter leading-none ${theme === "dark" ? "text-white" : "text-black"}`}>
                     {selectedStudio.name}
                   </h2>
                   <button 
                     onClick={(e) => { e.stopPropagation(); setSelectedStudio(null); }} 
                     className={`p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded ${theme === "dark" ? "text-white" : "text-black"}`}
                   >
                     <X size={20} strokeWidth={3} />
                   </button>
                 </div>

                 {/* Image Box */}
                 <div className="relative h-36 w-full mb-4 border-2 border-dashed border-gray-400 dark:border-zinc-700 p-1">
                    <div className="w-full h-full relative overflow-hidden bg-gray-200">
                      <img 
                        src={selectedStudio.imageUrl || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80"} 
                        className="w-full h-full object-cover transition-all duration-700 hover:scale-110 grayscale hover:grayscale-0"
                      />
                      {/* Location Tag Overlay */}
                      <div className="absolute bottom-0 left-0 bg-black text-white text-[9px] font-bold px-2 py-1 uppercase tracking-widest">
                        {selectedStudio.location}
                      </div>
                    </div>
                 </div>

                 {/* Stats Grid */}
                 <div className="grid grid-cols-2 gap-4 border-b-2 border-dotted border-gray-300 dark:border-zinc-700 pb-4 mb-4">
                   <div>
                     <div className="text-[9px] font-bold uppercase text-gray-500 mb-1">Reputation</div>
                     <div className="flex items-center gap-0.5">
                       {[...Array(5)].map((_, i) => (
                         <Star 
                           key={i} 
                           size={12} 
                           className={i < Math.floor(selectedStudio.rating) 
                             ? "fill-black text-black dark:fill-white dark:text-white" 
                             : "text-gray-300 dark:text-zinc-700"} 
                         />
                       ))}
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="text-[9px] font-bold uppercase text-gray-500 mb-1">Rate</div>
                     <div className={`text-xl font-black ${theme === "dark" ? "text-white" : "text-black"}`}>
                       ${selectedStudio.hourlyRate}<span className="text-xs font-bold text-gray-400">/hr</span>
                     </div>
                   </div>
                 </div>

                 {/* Action Button */}
                 <button 
                   onClick={(e) => { e.stopPropagation(); router.push(`/studios/create/${selectedStudio.id}`); }}
                   className={`
                     w-full py-3.5 text-sm font-black uppercase tracking-[0.2em] border-2 transition-transform active:scale-95
                     ${theme === "dark" 
                       ? "bg-white text-black border-white hover:bg-gray-200" 
                       : "bg-black text-white border-black hover:bg-zinc-800"
                     }
                   `}
                 >
                   Book Session
                 </button>
               </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  
  // Grid View
  const GridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredStudios.map((studio) => {
        const distance = userLocation && studio.latitude && studio.longitude
          ? calculateDistance(userLocation.lat, userLocation.lon, studio.latitude, studio.longitude)
          : null;

        return (
          <div
            key={studio.id}
            className={`group rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-lg active:scale-[0.98] ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60"
                : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
            }`}
            onClick={() => router.push(`/studios/create/${studio.id}`)}
          >
            <div className="relative h-44 overflow-hidden">
              <img
                alt={studio.name}
                src={studio.imageUrl || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80"}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-light tracking-wide backdrop-blur-sm ${
                theme === "dark"
                  ? "bg-black/80 text-white border border-zinc-800"
                  : "bg-white/80 text-black border border-gray-300"
              }`}>
                ${studio.hourlyRate}/hr
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className={`text-sm font-light tracking-wide line-clamp-1 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {studio.name}
                  </h3>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" strokeWidth={2} />
                    <span className={`text-xs font-light ${
                      theme === "dark" ? "text-zinc-400" : "text-gray-600"
                    }`}>
                      {studio.rating}
                    </span>
                  </div>
                </div>

                <div className={`flex items-center gap-1.5 text-xs font-light tracking-wide ${
                  theme === "dark" ? "text-zinc-500" : "text-gray-600"
                }`}>
                  <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
                  <span className="line-clamp-1">
                    {studio.location}
                    {distance !== null && (
                      <span className={`ml-1 ${
                        theme === "dark" ? "text-zinc-600" : "text-gray-500"
                      }`}>• {Math.round(distance)}mi</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className={`flex items-center gap-1.5 text-xs font-light tracking-wide ${
                  theme === "dark" ? "text-zinc-500" : "text-gray-600"
                }`}>
                  <Mic2 className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>Featured Gear</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {studio.equipment.slice(0, 3).map((item, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-1 text-[10px] font-light tracking-wide rounded border ${
                        theme === "dark"
                          ? "bg-zinc-900 text-zinc-400 border-zinc-800"
                          : "bg-gray-100 text-gray-700 border-gray-300"
                      }`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <button
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                  theme === "dark"
                    ? "bg-white border-white text-black hover:bg-zinc-100"
                    : "bg-black border-black text-white hover:bg-gray-800"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                     router.push(`/studios/create/${studio.id}`);
                }}
              >
                <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                Book Studio
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className={`min-h-screen p-6 transition-colors duration-200 ${
      theme === "dark" 
        ? "bg-black text-white" 
        : "bg-gray-50 text-gray-900"
    }`}>
      <div className="max-w-[1400px] mx-auto space-y-6">
       {/* Header with conditional action button */}
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-3xl font-light tracking-tight mb-1">
      Recording Studios
    </h1>
    <p className={`text-sm font-light tracking-wide ${
      theme === "dark" ? "text-zinc-500" : "text-gray-600"
    }`}>
      Discover professional studios near you
    </p>
  </div>

  <div className="flex items-center gap-3">
    {/* Conditional Action Button based on permissions */}
    {permissions.canCreateStudios ? (
      <button
        onClick={() => router.push('/studios/list-studio')}
        className={`
          flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide
          ${theme === "dark"
            ? "bg-white border-white text-black hover:bg-zinc-100"
            : "bg-black border-black text-white hover:bg-gray-800"
          }
          active:scale-95
        `}
      >
        <Plus className="w-4 h-4" strokeWidth={2} />
        Create Studio Listing
      </button>
    ) : permissions.canBookStudios ? (
      <div className={`flex items-center gap-2 px-4 py-2.5 text-xs rounded-lg border ${
        theme === "dark"
          ? "bg-zinc-900/40 border-zinc-800 text-zinc-400"
          : "bg-gray-100 border-gray-300 text-gray-600"
      }`}>
        <Mic2 className="w-3.5 h-3.5" strokeWidth={2} />
        <span>Browse to book studios</span>
      </div>
    ) : null}

    {/* View Mode Toggle - Your existing toggle */}
    <div className={`flex items-center gap-1 p-1 rounded-lg border backdrop-blur-sm ${
      theme === "dark"
        ? "border-zinc-800 bg-zinc-900/40"
        : "border-gray-300 bg-white/40"
    }`}>
      <button
        onClick={() => setViewMode("grid")}
        className={`
          flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200 tracking-wide
          ${viewMode === "grid"
            ? theme === "dark"
              ? "bg-white text-black"
              : "bg-black text-white"
            : theme === "dark"
              ? "text-zinc-400 hover:text-white"
              : "text-gray-600 hover:text-black"
          }
        `}
      >
        <Grid className="w-4 h-4" strokeWidth={2} />
        Grid
      </button>
      <button
        onClick={() => setViewMode("map")}
        className={`
          flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200 tracking-wide
          ${viewMode === "map"
            ? theme === "dark"
              ? "bg-white text-black"
              : "bg-black text-white"
            : theme === "dark"
              ? "text-zinc-400 hover:text-white"
              : "text-gray-600 hover:text-black"
          }
        `}
      >
        <Map className="w-4 h-4" strokeWidth={2} />
        Map
      </button>
    </div>
  </div>
</div>

        <div className={`flex flex-wrap gap-3 p-4 rounded-xl border backdrop-blur-sm ${
          theme === "dark"
            ? "border-zinc-800 bg-zinc-900/40"
            : "border-gray-300 bg-white/40"
        }`}>
          <div className="relative flex-1 min-w-[240px]">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              theme === "dark" ? "text-zinc-500" : "text-gray-500"
            }`} strokeWidth={2} />
            <input
              type="text"
              placeholder="Search studios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 text-sm font-light rounded-lg border tracking-wide focus:outline-none transition-all duration-200 ${
                theme === "dark"
                  ? "border-zinc-800 bg-zinc-950 text-white placeholder-zinc-600 focus:border-white"
                  : "border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-gray-900"
              }`}
            />
          </div>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className={`px-4 py-3 text-sm font-light rounded-lg border tracking-wide cursor-pointer focus:outline-none transition-all duration-200 ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-950 text-white focus:border-white"
                : "border-gray-300 bg-white text-gray-900 focus:border-gray-900"
            }`}
          >
            <option value="all">All Locations</option>
            <option value="los angeles">Los Angeles</option>
            <option value="new york">New York</option>
            <option value="london">London</option>
            <option value="nashville">Nashville</option>
          </select>

          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className={`px-4 py-3 text-sm font-light rounded-lg border tracking-wide cursor-pointer focus:outline-none transition-all duration-200 ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-950 text-white focus:border-white"
                : "border-gray-300 bg-white text-gray-900 focus:border-gray-900"
            }`}
          >
            <option value={25}>25 miles</option>
            <option value={50}>50 miles</option>
            <option value={100}>100 miles</option>
            <option value={1000}>All distances</option>
          </select>

          <button
            onClick={getUserLocation}
            disabled={isLoadingLocation}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === "dark"
                ? "bg-white border-white text-black hover:bg-zinc-100"
                : "bg-black border-black text-white hover:bg-gray-800"
            }`}
          >
            <Navigation className="w-4 h-4" strokeWidth={2} />
            {isLoadingLocation ? "Locating..." : "My Location"}
          </button>
        </div>

        <div className={`text-sm font-light tracking-wide ${
          theme === "dark" ? "text-zinc-500" : "text-gray-600"
        }`}>
          <span>
            {filteredStudios.length} {filteredStudios.length === 1 ? "studio" : "studios"} found
            {userLocation && radius < 1000 && ` within ${radius} miles`}
          </span>
        </div>

        {/* Permission Notice */}
{!permissions.canBookStudios && !permissions.canCreateStudios && (
  <div className={`p-4 rounded-lg border ${
    theme === "dark"
      ? "bg-zinc-900/40 border-zinc-800"
      : "bg-gray-100 border-gray-300"
  }`}>
    <p className={`text-sm font-light tracking-wide ${
      theme === "dark" ? "text-zinc-400" : "text-gray-600"
    }`}>
      You&apos;re browsing studios. Are you an artist and you have a recording studio? create clubs to enable listings.
    </p>
  </div>
)}

        {filteredStudios.length > 0 ? (
          viewMode === "map" ? <MapView /> : <GridView />
        ) : (
          <div className={`text-center py-20 rounded-xl border backdrop-blur-sm ${
            theme === "dark"
              ? "border-zinc-800 bg-zinc-900/40"
              : "border-gray-300 bg-white/40"
          }`}>
            <Zap className={`w-12 h-12 mx-auto mb-4 ${
              theme === "dark" ? "text-zinc-700" : "text-gray-400"
            }`} strokeWidth={1.5} />
            <p className={`text-sm font-light tracking-wide mb-1 ${
              theme === "dark" ? "text-zinc-400" : "text-gray-600"
            }`}>
              No studios found
            </p>
            <p className={`text-xs font-light tracking-wide ${
              theme === "dark" ? "text-zinc-600" : "text-gray-500"
            }`}>
              Try adjusting your filters or search radius
            </p>
          </div>
        )}
      </div>
    </div>
  );
}