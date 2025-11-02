"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Star, CheckCircle2, Map, Grid, Navigation, Zap, X, Mic2, Maximize2, Minimize2 } from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";

type Studio = {
  id: number;
  name: string;
  location: string;
  price: string;
  rating: number;
  equipment: string[];
  image: string;
  lat: number;
  lon: number;
};

// Sample studio data - replace with your actual data
const studioData: Studio[] = [
  {
    id: 1,
    name: "Sunset Sound Studios",
    location: "Los Angeles, CA",
    price: "$150/hr",
    rating: 4.9,
    equipment: ["SSL Console", "Pro Tools", "Neumann U87"],
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80",
    lat: 34.0522,
    lon: -118.2437
  },
  {
    id: 2,
    name: "Electric Lady Studios",
    location: "New York, NY",
    price: "$200/hr",
    rating: 5.0,
    equipment: ["Neve Console", "Logic Pro", "Telefunken U47"],
    image: "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800&q=80",
    lat: 40.7282,
    lon: -73.9942
  },
  {
    id: 3,
    name: "Abbey Road Studios",
    location: "London, UK",
    price: "$300/hr",
    rating: 5.0,
    equipment: ["API Console", "Ableton Live", "AKG C414"],
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
    lat: 51.5320,
    lon: -0.1778
  },
  {
    id: 4,
    name: "Ocean Way Recording",
    location: "Nashville, TN",
    price: "$175/hr",
    rating: 4.8,
    equipment: ["Solid State Logic", "Pro Tools HDX", "Shure SM7B"],
    image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=80",
    lat: 36.1627,
    lon: -86.7816
  }
];

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

  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [filteredStudios, setFilteredStudios] = useState<Studio[]>(studioData);
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

  // Filter studios
  useEffect(() => {
    let filtered = studioData;

    if (userLocation && radius < 1000) {
      filtered = filtered.filter((studio) => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lon,
          studio.lat,
          studio.lon
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

    setFilteredStudios(filtered);
  }, [userLocation, radius, locationFilter, searchQuery]);

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
  const MapView = () => {
    const mapCenter = getMapCenter();
    
    // Calculate bounds for all studios
    const bounds = {
      minLat: Math.min(...filteredStudios.map(s => s.lat), userLocation?.lat || Infinity),
      maxLat: Math.max(...filteredStudios.map(s => s.lat), userLocation?.lat || -Infinity),
      minLon: Math.min(...filteredStudios.map(s => s.lon), userLocation?.lon || Infinity),
      maxLon: Math.max(...filteredStudios.map(s => s.lon), userLocation?.lon || -Infinity),
    };

    const latRange = bounds.maxLat - bounds.minLat || 1;
    const lonRange = bounds.maxLon - bounds.minLon || 1;

    // Add padding to bounds (10%)
    const padding = 0.15;
    const paddedBounds = {
      minLat: bounds.minLat - latRange * padding,
      maxLat: bounds.maxLat + latRange * padding,
      minLon: bounds.minLon - lonRange * padding,
      maxLon: bounds.maxLon + lonRange * padding,
    };

    const paddedLatRange = paddedBounds.maxLat - paddedBounds.minLat;
    const paddedLonRange = paddedBounds.maxLon - paddedBounds.minLon;

    // Convert lat/lon to pixel coordinates
    const getPosition = (lat: number, lon: number) => {
      const x = ((lon - paddedBounds.minLon) / paddedLonRange) * 100;
      const y = ((paddedBounds.maxLat - lat) / paddedLatRange) * 100;
      return { x: `${x}%`, y: `${y}%` };
    };

    return (
      <div className={`relative h-[700px] rounded-xl overflow-hidden border shadow-2xl ${
        theme === "dark" 
          ? "border-zinc-800/50 bg-black" 
          : "border-gray-300 bg-gray-100"
      }`}>
        {/* Map Background Layer */}
        <div className="absolute inset-0">
          {/* Theme-aware map background */}
          <div className={`absolute inset-0 ${
            theme === "dark" ? "bg-[#1a1a1a]" : "bg-[#f8fafc]"
          }`}>
            {/* Topographic-style contours */}
            <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="contours" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                  <ellipse cx="100" cy="100" rx="80" ry="80" fill="none" stroke={theme === "dark" ? "#ffffff" : "#000000"} strokeWidth="0.5"/>
                  <ellipse cx="100" cy="100" rx="60" ry="60" fill="none" stroke={theme === "dark" ? "#ffffff" : "#000000"} strokeWidth="0.5"/>
                  <ellipse cx="100" cy="100" rx="40" ry="40" fill="none" stroke={theme === "dark" ? "#ffffff" : "#000000"} strokeWidth="0.5"/>
                  <ellipse cx="100" cy="100" rx="20" ry="20" fill="none" stroke={theme === "dark" ? "#ffffff" : "#000000"} strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#contours)" />
            </svg>

            {/* Road network overlay */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="road-glow">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Major highways */}
              <g opacity={theme === "dark" ? "0.25" : "0.15"} filter="url(#road-glow)">
                <line x1="0" y1="20%" x2="100%" y2="20%" stroke="#fbbf24" strokeWidth="3"/>
                <line x1="0" y1="40%" x2="100%" y2="45%" stroke="#fbbf24" strokeWidth="3"/>
                <line x1="0" y1="60%" x2="100%" y2="55%" stroke="#fbbf24" strokeWidth="3"/>
                <line x1="0" y1="80%" x2="100%" y2="80%" stroke="#fbbf24" strokeWidth="3"/>
                
                <line x1="20%" y1="0" x2="20%" y2="100%" stroke="#fbbf24" strokeWidth="3"/>
                <line x1="40%" y1="0" x2="45%" y2="100%" stroke="#fbbf24" strokeWidth="3"/>
                <line x1="60%" y1="0" x2="55%" y2="100%" stroke="#fbbf24" strokeWidth="3"/>
                <line x1="80%" y1="0" x2="80%" y2="100%" stroke="#fbbf24" strokeWidth="3"/>
              </g>

              {/* Secondary roads */}
              <g opacity={theme === "dark" ? "0.15" : "0.1"}>
                <line x1="0" y1="30%" x2="100%" y2="32%" stroke="#d97706" strokeWidth="2"/>
                <line x1="0" y1="50%" x2="100%" y2="48%" stroke="#d97706" strokeWidth="2"/>
                <line x1="0" y1="70%" x2="100%" y2="68%" stroke="#d97706" strokeWidth="2"/>
                
                <line x1="30%" y1="0" x2="32%" y2="100%" stroke="#d97706" strokeWidth="2"/>
                <line x1="50%" y1="0" x2="48%" y2="100%" stroke="#d97706" strokeWidth="2"/>
                <line x1="70%" y1="0" x2="68%" y2="100%" stroke="#d97706" strokeWidth="2"/>
              </g>

              {/* Curved roads */}
              <g opacity={theme === "dark" ? "0.2" : "0.12"}>
                <path d="M 0 30 Q 25 20, 50 30 T 100 30" stroke="#92400e" strokeWidth="2" fill="none"/>
                <path d="M 0 70 Q 25 80, 50 70 T 100 70" stroke="#92400e" strokeWidth="2" fill="none"/>
                <path d="M 30 0 Q 20 25, 30 50 T 30 100" stroke="#92400e" strokeWidth="2" fill="none"/>
                <path d="M 70 0 Q 80 25, 70 50 T 70 100" stroke="#92400e" strokeWidth="2" fill="none"/>
              </g>

              {/* Diagonal roads */}
              <g opacity={theme === "dark" ? "0.12" : "0.08"}>
                <line x1="0" y1="0" x2="100%" y2="100%" stroke="#78350f" strokeWidth="1.5"/>
                <line x1="100%" y1="0" x2="0" y2="100%" stroke="#78350f" strokeWidth="1.5"/>
                <line x1="20%" y1="0" x2="100%" y2="80%" stroke="#78350f" strokeWidth="1"/>
                <line x1="0" y1="20%" x2="80%" y2="100%" stroke="#78350f" strokeWidth="1"/>
              </g>
            </svg>

            {/* Area zones - simulate neighborhoods/districts */}
            <div className="absolute inset-0">
              {/* Northwest zone */}
              <div className={`absolute top-0 left-0 w-1/3 h-1/3 rounded-full blur-3xl ${
                theme === "dark" 
                  ? "bg-gradient-to-br from-emerald-950/10 to-transparent" 
                  : "bg-gradient-to-br from-emerald-100/20 to-transparent"
              }`} />
              {/* Northeast zone */}
              <div className={`absolute top-0 right-0 w-1/3 h-1/3 rounded-full blur-3xl ${
                theme === "dark" 
                  ? "bg-gradient-to-bl from-blue-950/10 to-transparent" 
                  : "bg-gradient-to-bl from-blue-100/20 to-transparent"
              }`} />
              {/* Southwest zone */}
              <div className={`absolute bottom-0 left-0 w-1/3 h-1/3 rounded-full blur-3xl ${
                theme === "dark" 
                  ? "bg-gradient-to-tr from-purple-950/10 to-transparent" 
                  : "bg-gradient-to-tr from-purple-100/20 to-transparent"
              }`} />
              {/* Southeast zone */}
              <div className={`absolute bottom-0 right-0 w-1/3 h-1/3 rounded-full blur-3xl ${
                theme === "dark" 
                  ? "bg-gradient-to-tl from-orange-950/10 to-transparent" 
                  : "bg-gradient-to-tl from-orange-100/20 to-transparent"
              }`} />
              {/* Central zone */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 rounded-full blur-3xl ${
                theme === "dark" 
                  ? "bg-gradient-radial from-zinc-800/5 to-transparent" 
                  : "bg-gradient-radial from-gray-300/10 to-transparent"
              }`} />
            </div>

            {/* Grid overlay */}
            <div className={`absolute inset-0 ${
              theme === "dark" ? "opacity-[0.03]" : "opacity-[0.02]"
            }`}>
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="fine-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke={theme === "dark" ? "#ffffff" : "#000000"} strokeWidth="0.3"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#fine-grid)" />
              </svg>
            </div>
          </div>

          {/* Subtle vignette */}
          <div className={`absolute inset-0 bg-gradient-radial from-transparent via-transparent ${
            theme === "dark" ? "to-black/60" : "to-white/40"
          }`} />
        </div>

        {/* District/Area Labels */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-12 left-12 px-4 py-2 rounded-lg backdrop-blur-md border ${
            theme === "dark" 
              ? "bg-black/30 border-zinc-700/20" 
              : "bg-white/30 border-gray-300/50"
          }`}>
            <span className={`text-xs font-light tracking-[0.25em] uppercase ${
              theme === "dark" ? "text-zinc-500" : "text-gray-600"
            }`}>Northwest District</span>
          </div>
          <div className={`absolute top-12 right-12 px-4 py-2 rounded-lg backdrop-blur-md border ${
            theme === "dark" 
              ? "bg-black/30 border-zinc-700/20" 
              : "bg-white/30 border-gray-300/50"
          }`}>
            <span className={`text-xs font-light tracking-[0.25em] uppercase ${
              theme === "dark" ? "text-zinc-500" : "text-gray-600"
            }`}>Northeast District</span>
          </div>
          <div className={`absolute bottom-12 left-12 px-4 py-2 rounded-lg backdrop-blur-md border ${
            theme === "dark" 
              ? "bg-black/30 border-zinc-700/20" 
              : "bg-white/30 border-gray-300/50"
          }`}>
            <span className={`text-xs font-light tracking-[0.25em] uppercase ${
              theme === "dark" ? "text-zinc-500" : "text-gray-600"
            }`}>Southwest District</span>
          </div>
          <div className={`absolute bottom-12 right-12 px-4 py-2 rounded-lg backdrop-blur-md border ${
            theme === "dark" 
              ? "bg-black/30 border-zinc-700/20" 
              : "bg-white/30 border-gray-300/50"
          }`}>
            <span className={`text-xs font-light tracking-[0.25em] uppercase ${
              theme === "dark" ? "text-zinc-500" : "text-gray-600"
            }`}>Southeast District</span>
          </div>
        </div>

        {/* Studio Markers */}
        {filteredStudios.map((studio) => {
          const position = getPosition(studio.lat, studio.lon);
          const isSelected = selectedStudio?.id === studio.id;
          const isHovered = hoveredStudio === studio.id;
          const distance = userLocation 
            ? calculateDistance(userLocation.lat, userLocation.lon, studio.lat, studio.lon)
            : null;

          return (
            <button
              key={studio.id}
              onClick={() => setSelectedStudio(studio)}
              onMouseEnter={() => setHoveredStudio(studio.id)}
              onMouseLeave={() => setHoveredStudio(null)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-20"
              style={{ left: position.x, top: position.y }}
            >
              {/* Range circle indicator */}
              {(isSelected || isHovered) && (
                <>
                  <div className="absolute inset-0 -m-8 rounded-full border border-red-500/20 animate-pulse" />
                  <div className="absolute inset-0 -m-12 rounded-full border border-red-500/10" />
                </>
              )}

              {/* Pulse animations */}
              {(isSelected || isHovered) && (
                <div className={`absolute inset-0 -m-4 rounded-full border-2 transition-all duration-500 ${
                  isSelected 
                    ? "border-white animate-ping opacity-40" 
                    : "border-red-400 animate-pulse opacity-30"
                }`} />
              )}
              
              {/* Marker pin */}
              <div className="relative flex flex-col items-center">
                {/* Pin body */}
                <div className={`
                  relative transition-all duration-300
                  ${isSelected ? "scale-125" : isHovered ? "scale-110" : "scale-100"}
                `}>
                  {/* Pin shape */}
                  <div className="relative">
                    <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={isSelected || isHovered ? "drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "drop-shadow-[0_0_4px_rgba(239,68,68,0.6)]"}>
                      <path d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 40 16 40C16 40 32 24.837 32 16C32 7.163 24.837 0 16 0Z" 
                        fill={isSelected ? "#ffffff" : isHovered ? "#fca5a5" : "#ef4444"}
                        className="transition-colors duration-300"
                      />
                      <circle cx="16" cy="15" r="6" 
                        fill={isSelected ? "#000000" : "#ffffff"}
                        className="transition-colors duration-300"
                      />
                    </svg>
                  </div>
                </div>

                {/* Distance label */}
                {distance !== null && (isSelected || isHovered) && (
                  <div className={`
                    mt-1 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wider whitespace-nowrap
                    transition-all duration-300 backdrop-blur-md
                    ${isSelected 
                      ? theme === "dark"
                        ? "bg-white/90 text-black border border-white shadow-lg" 
                        : "bg-black/90 text-white border border-gray-800 shadow-lg"
                      : theme === "dark"
                        ? "bg-black/80 text-white border border-zinc-700"
                        : "bg-white/90 text-black border border-gray-300"
                    }
                  `}>
                    {Math.round(distance)} mi
                  </div>
                )}

                {/* Studio name */}
                {(isSelected || isHovered) && (
                  <div className={`
                    mt-1 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide whitespace-nowrap
                    transition-all duration-300 backdrop-blur-md max-w-[200px] truncate
                    ${isSelected 
                      ? theme === "dark"
                        ? "bg-white/90 text-black border border-white shadow-lg" 
                        : "bg-black/90 text-white border border-gray-800 shadow-lg"
                      : theme === "dark"
                        ? "bg-black/80 text-white border border-zinc-700"
                        : "bg-white/90 text-black border border-gray-300"
                    }
                  `}>
                    {studio.name}
                  </div>
                )}
              </div>
            </button>
          );
        })}

        {/* User Location Marker */}
        {userLocation && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30"
            style={{
              left: getPosition(userLocation.lat, userLocation.lon).x,
              top: getPosition(userLocation.lat, userLocation.lon).y
            }}
          >
            {/* Pulse rings */}
            <div className="absolute inset-0 -m-6 rounded-full bg-blue-500/15 animate-ping" />
            <div className="absolute inset-0 -m-9 rounded-full bg-blue-500/10 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-0 -m-12 rounded-full bg-blue-500/5 animate-ping" style={{ animationDuration: '3s' }} />
            
            {/* User marker */}
            <div className="relative w-5 h-5 rounded-full bg-blue-500 ring-4 ring-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.8)]">
              <div className="absolute inset-0 rounded-full bg-blue-400 blur-sm" />
              <div className="absolute inset-1 rounded-full bg-white" />
            </div>
            
            {/* Label */}
            <div className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wider whitespace-nowrap backdrop-blur-md shadow-lg ${
              theme === "dark"
                ? "text-blue-400 bg-black/90 border border-blue-500/50"
                : "text-blue-600 bg-white/90 border border-blue-500/30"
            }`}>
              Your Location
            </div>
          </div>
        )}

        {/* Selected Studio Card */}
        {selectedStudio && (
          <div className={`absolute top-6 right-6 w-80 rounded-xl border overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 z-40 backdrop-blur-md shadow-2xl ${
            theme === "dark"
              ? "border-zinc-800/50 bg-black/95"
              : "border-gray-300 bg-white/95"
          }`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedStudio(null);
              }}
              className={`absolute top-3 right-3 z-20 p-1.5 rounded-lg backdrop-blur-sm shadow-lg transition-all duration-200 ${
                theme === "dark"
                  ? "bg-zinc-900/90 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-white/20"
                  : "bg-gray-100/90 border border-gray-300 text-gray-600 hover:text-black hover:bg-gray-200 hover:border-gray-400"
              }`}
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>

            <div className="relative h-52 overflow-hidden">
              <img
                alt={selectedStudio.name}
                src={selectedStudio.image}
                className="w-full h-full object-cover scale-100 transition-transform duration-700 hover:scale-105"
                style={{ objectPosition: 'center' }}
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${
                theme === "dark" 
                  ? "from-black via-black/40 to-transparent" 
                  : "from-white via-white/40 to-transparent"
              }`} />
              
              <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide backdrop-blur-md shadow-lg ${
                theme === "dark"
                  ? "bg-white/15 text-white border border-white/30"
                  : "bg-black/15 text-black border border-black/30"
              }`}>
                {selectedStudio.price}
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className={`text-base font-medium tracking-wide leading-snug ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {selectedStudio.name}
                  </h3>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" strokeWidth={2} />
                    <span className={`text-sm font-medium ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      {selectedStudio.rating}
                    </span>
                  </div>
                </div>

                <div className={`flex items-center gap-1.5 text-xs font-light tracking-wide ${
                  theme === "dark" ? "text-zinc-400" : "text-gray-600"
                }`}>
                  <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>
                    {selectedStudio.location}
                    {userLocation && (
                      <span className={`ml-1.5 ${
                        theme === "dark" ? "text-zinc-500" : "text-gray-500"
                      }`}>
                        • {Math.round(calculateDistance(userLocation.lat, userLocation.lon, selectedStudio.lat, selectedStudio.lon))} mi away
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className={`flex items-center gap-1.5 text-xs font-medium tracking-wide ${
                  theme === "dark" ? "text-zinc-400" : "text-gray-600"
                }`}>
                  <Mic2 className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>Featured Gear</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedStudio.equipment.slice(0, 3).map((item, idx) => (
                    <span
                      key={idx}
                      className={`px-2.5 py-1.5 text-[10px] font-medium tracking-wide rounded-md backdrop-blur-sm ${
                        theme === "dark"
                          ? "bg-zinc-900/80 text-zinc-300 border border-zinc-800/80"
                          : "bg-gray-100/80 text-gray-700 border border-gray-300/80"
                      }`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => router.push(`/studios/create/${selectedStudio.id}`)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold rounded-lg border transition-all duration-200 tracking-wide shadow-lg ${
                  theme === "dark"
                    ? "bg-white border-white text-black hover:bg-zinc-100 active:scale-[0.98]"
                    : "bg-black border-black text-white hover:bg-gray-800 active:scale-[0.98]"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                Book Studio
              </button>
            </div>
          </div>
        )}

        {/* Map Controls */}
        <div className="absolute bottom-6 left-6 flex gap-2 z-30">
          <button
            onClick={getUserLocation}
            disabled={isLoadingLocation}
            className={`p-3 rounded-lg border backdrop-blur-md shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === "dark"
                ? "border-zinc-800/50 bg-black/90 text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-black"
                : "border-gray-300/50 bg-white/90 text-gray-600 hover:text-black hover:border-gray-400 hover:bg-white"
            }`}
          >
            <Navigation className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {/* Legend */}
        <div className={`absolute bottom-6 right-6 px-4 py-3.5 rounded-lg border backdrop-blur-md shadow-lg space-y-2.5 z-30 ${
          theme === "dark"
            ? "border-zinc-800/50 bg-black/90"
            : "border-gray-300/50 bg-white/90"
        }`}>
          <div className={`flex items-center gap-2.5 text-xs font-medium tracking-wide ${
            theme === "dark" ? "text-zinc-300" : "text-gray-700"
          }`}>
            <div className="w-3 h-3 bg-red-500 rounded-sm shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
            <span>Studios</span>
          </div>
          {userLocation && (
            <div className={`flex items-center gap-2.5 text-xs font-medium tracking-wide ${
              theme === "dark" ? "text-zinc-300" : "text-gray-700"
            }`}>
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              <span>You</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Grid View
  const GridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredStudios.map((studio) => {
        const distance = userLocation 
          ? calculateDistance(userLocation.lat, userLocation.lon, studio.lat, studio.lon)
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
                src={studio.image}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-light tracking-wide backdrop-blur-sm ${
                theme === "dark"
                  ? "bg-black/80 text-white border border-zinc-800"
                  : "bg-white/80 text-black border border-gray-300"
              }`}>
                {studio.price}
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