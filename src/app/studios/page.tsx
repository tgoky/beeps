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
 // Enhanced Map View with Flat Building Icons, Better Landmarks, and Premium Hover Effects
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
        ? "border-zinc-800/50 bg-[#0a0a0a]" 
        : "border-gray-300 bg-[#f5f5f0]"
    }`}>
      {/* Map Background Layer */}
      <div className="absolute inset-0">
        {/* Base map with texture */}
        <div className="absolute inset-0">
          
          {/* Subtle texture overlay */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />

          {/* Grid Streets Pattern - THINNER for dark theme */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* Softer road glow for dark theme */}
              <filter id="road-glow">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Major Highways - Thinner for dark theme */}
            <g opacity={theme === "dark" ? "0.25" : "0.35"} filter="url(#road-glow)">
              {/* Horizontal highways */}
              <line x1="0" y1="15%" x2="100%" y2="15%" 
                stroke="#fbbf24" 
                strokeWidth={theme === "dark" ? "2.5" : "5"} 
                strokeLinecap="round"/>
              <line x1="0" y1="35%" x2="100%" y2="37%" 
                stroke="#fbbf24" 
                strokeWidth={theme === "dark" ? "2.5" : "5"} 
                strokeLinecap="round"/>
              <line x1="0" y1="55%" x2="100%" y2="53%" 
                stroke="#fbbf24" 
                strokeWidth={theme === "dark" ? "2.5" : "5"} 
                strokeLinecap="round"/>
              <line x1="0" y1="75%" x2="100%" y2="75%" 
                stroke="#fbbf24" 
                strokeWidth={theme === "dark" ? "2.5" : "5"} 
                strokeLinecap="round"/>
              <line x1="0" y1="85%" x2="100%" y2="87%" 
                stroke="#fbbf24" 
                strokeWidth={theme === "dark" ? "2.5" : "5"} 
                strokeLinecap="round"/>
              
              {/* Vertical highways */}
              <line x1="12%" y1="0" x2="12%" y2="100%" 
                stroke="#fbbf24" 
                strokeWidth={theme === "dark" ? "2.5" : "5"} 
                strokeLinecap="round"/>
              <line x1="28%" y1="0" x2="30%" y2="100%" 
                stroke="#fbbf24" 
                strokeWidth={theme === "dark" ? "2.5" : "5"} 
                strokeLinecap="round"/>
              <line x1="50%" y1="0" x2="50%" y2="100%" 
                stroke="#fbbf24" 
                strokeWidth={theme === "dark" ? "2.5" : "5"} 
                strokeLinecap="round"/>
              <line x1="72%" y1="0" x2="70%" y2="100%" 
                stroke="#fbbf24" 
                strokeWidth={theme === "dark" ? "2.5" : "5"} 
                strokeLinecap="round"/>
              <line x1="88%" y1="0" x2="88%" y2="100%" 
                stroke="#fbbf24" 
                strokeWidth={theme === "dark" ? "2.5" : "5"} 
                strokeLinecap="round"/>
            </g>

            {/* Secondary Roads - Thinner */}
            <g opacity={theme === "dark" ? "0.18" : "0.25"}>
              {/* Horizontal roads */}
              {[8, 22, 28, 42, 48, 62, 68, 82, 92].map((y, i) => (
                <line key={`h-${i}`} x1="0" y1={`${y}%`} x2="100%" y2={`${y + (i % 2)}%`} 
                  stroke="#f97316" 
                  strokeWidth={theme === "dark" ? "1.5" : "3"} 
                  strokeLinecap="round"/>
              ))}
              
              {/* Vertical roads */}
              {[6, 18, 24, 36, 42, 56, 64, 76, 82, 94].map((x, i) => (
                <line key={`v-${i}`} x1={`${x}%`} y1="0" x2={`${x + (i % 2)}%`} y2="100%" 
                  stroke="#f97316" 
                  strokeWidth={theme === "dark" ? "1.5" : "3"} 
                  strokeLinecap="round"/>
              ))}
            </g>

            {/* Minor Streets - Much thinner */}
            <g opacity={theme === "dark" ? "0.08" : "0.15"}>
              {[4, 10, 16, 20, 26, 32, 38, 44, 50, 56, 60, 66, 70, 78, 84, 90, 96].map((y, i) => (
                <line key={`minor-h-${i}`} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} 
                  stroke={theme === "dark" ? "#3f3f46" : "#a8a29e"} 
                  strokeWidth={theme === "dark" ? "0.5" : "1.5"} 
                  strokeLinecap="round"/>
              ))}
              
              {[3, 9, 15, 21, 27, 33, 39, 45, 51, 57, 63, 69, 75, 81, 87, 93, 99].map((x, i) => (
                <line key={`minor-v-${i}`} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" 
                  stroke={theme === "dark" ? "#3f3f46" : "#a8a29e"} 
                  strokeWidth={theme === "dark" ? "0.5" : "1.5"} 
                  strokeLinecap="round"/>
              ))}
            </g>

            {/* Curved Roads */}
            <g opacity={theme === "dark" ? "0.15" : "0.2"}>
              <path d="M 0 25 Q 25 15, 50 25 T 100 25" 
                stroke="#ea580c" 
                strokeWidth={theme === "dark" ? "1.5" : "3"} 
                fill="none" 
                strokeLinecap="round"/>
              <path d="M 0 65 Q 25 75, 50 65 T 100 65" 
                stroke="#ea580c" 
                strokeWidth={theme === "dark" ? "1.5" : "3"} 
                fill="none" 
                strokeLinecap="round"/>
              <path d="M 25 0 Q 15 25, 25 50 T 25 100" 
                stroke="#ea580c" 
                strokeWidth={theme === "dark" ? "1.5" : "3"} 
                fill="none" 
                strokeLinecap="round"/>
              <path d="M 75 0 Q 85 25, 75 50 T 75 100" 
                stroke="#ea580c" 
                strokeWidth={theme === "dark" ? "1.5" : "3"} 
                fill="none" 
                strokeLinecap="round"/>
            </g>

            {/* Road Lane Markings */}
            <g opacity={theme === "dark" ? "0.05" : "0.1"}>
              <line x1="0" y1="15%" x2="100%" y2="15%" 
                stroke="#ffffff" 
                strokeWidth="0.3" 
                strokeDasharray="4 4"/>
              <line x1="0" y1="55%" x2="100%" y2="53%" 
                stroke="#ffffff" 
                strokeWidth="0.3" 
                strokeDasharray="4 4"/>
              <line x1="50%" y1="0" x2="50%" y2="100%" 
                stroke="#ffffff" 
                strokeWidth="0.3" 
                strokeDasharray="4 4"/>
            </g>
          </svg>

          {/* Flat Building Icons */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Downtown cluster - Skyscrapers */}
            {[
              { x: 8, y: 10, type: 'tall' },
              { x: 12, y: 8, type: 'tower' },
              { x: 15, y: 11, type: 'building' },
              { x: 18, y: 9, type: 'tall' },
              { x: 10, y: 16, type: 'building' },
              { x: 14, y: 17, type: 'tower' },
            ].map((building, i) => (
              <div key={`downtown-icon-${i}`} className="absolute" style={{
                left: `${building.x}%`,
                top: `${building.y}%`,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={`${
                  theme === "dark" ? "opacity-40" : "opacity-50"
                }`}>
                  {building.type === 'tower' && (
                    <path d="M6 2h4v20H6zm8 4h4v16h-4z" fill={theme === "dark" ? "#52525b" : "#9ca3af"} />
                  )}
                  {building.type === 'tall' && (
                    <path d="M7 3h10v18H7z" fill={theme === "dark" ? "#3f3f46" : "#a3a3a3"} />
                  )}
                  {building.type === 'building' && (
                    <path d="M4 8h16v14H4z" fill={theme === "dark" ? "#27272a" : "#d4d4d4"} />
                  )}
                  {/* Windows */}
                  <rect x="8" y="6" width="2" height="2" fill={theme === "dark" ? "#fbbf24" : "#f59e0b"} opacity="0.3" />
                  <rect x="14" y="6" width="2" height="2" fill={theme === "dark" ? "#fbbf24" : "#f59e0b"} opacity="0.3" />
                  <rect x="8" y="10" width="2" height="2" fill={theme === "dark" ? "#fbbf24" : "#f59e0b"} opacity="0.2" />
                  <rect x="14" y="10" width="2" height="2" fill={theme === "dark" ? "#fbbf24" : "#f59e0b"} opacity="0.4" />
                  <rect x="8" y="14" width="2" height="2" fill={theme === "dark" ? "#fbbf24" : "#f59e0b"} opacity="0.3" />
                  <rect x="14" y="14" width="2" height="2" fill={theme === "dark" ? "#fbbf24" : "#f59e0b"} opacity="0.2" />
                </svg>
              </div>
            ))}

            {/* Midtown cluster */}
            {[
              { x: 45, y: 40, type: 'tower' },
              { x: 50, y: 38, type: 'tall' },
              { x: 54, y: 42, type: 'building' },
              { x: 47, y: 46, type: 'building' },
              { x: 51, y: 47, type: 'tower' },
            ].map((building, i) => (
              <div key={`midtown-icon-${i}`} className="absolute" style={{
                left: `${building.x}%`,
                top: `${building.y}%`,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={`${
                  theme === "dark" ? "opacity-40" : "opacity-50"
                }`}>
                  {building.type === 'tower' && (
                    <path d="M6 2h4v20H6zm8 4h4v16h-4z" fill={theme === "dark" ? "#52525b" : "#9ca3af"} />
                  )}
                  {building.type === 'tall' && (
                    <path d="M7 3h10v18H7z" fill={theme === "dark" ? "#3f3f46" : "#a3a3a3"} />
                  )}
                  {building.type === 'building' && (
                    <path d="M4 8h16v14H4z" fill={theme === "dark" ? "#27272a" : "#d4d4d4"} />
                  )}
                  <rect x="8" y="6" width="2" height="2" fill={theme === "dark" ? "#fbbf24" : "#f59e0b"} opacity="0.3" />
                  <rect x="14" y="6" width="2" height="2" fill={theme === "dark" ? "#fbbf24" : "#f59e0b"} opacity="0.2" />
                  <rect x="8" y="10" width="2" height="2" fill={theme === "dark" ? "#fbbf24" : "#f59e0b"} opacity="0.4" />
                  <rect x="14" y="10" width="2" height="2" fill={theme === "dark" ? "#fbbf24" : "#f59e0b"} opacity="0.3" />
                </svg>
              </div>
            ))}

            {/* Suburban houses */}
            {[
              { x: 75, y: 70 }, { x: 78, y: 68 }, { x: 81, y: 71 },
              { x: 77, y: 74 }, { x: 80, y: 75 },
            ].map((house, i) => (
              <div key={`house-${i}`} className="absolute" style={{
                left: `${house.x}%`,
                top: `${house.y}%`,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={`${
                  theme === "dark" ? "opacity-35" : "opacity-45"
                }`}>
                  <path d="M12 3L4 9v12h16V9z" fill={theme === "dark" ? "#3f3f46" : "#d4d4d4"} />
                  <rect x="9" y="13" width="6" height="8" fill={theme === "dark" ? "#27272a" : "#a3a3a3"} />
                  <rect x="10" y="15" width="2" height="2" fill={theme === "dark" ? "#fbbf24" : "#f59e0b"} opacity="0.4" />
                </svg>
              </div>
            ))}

            {/* Scattered smaller buildings */}
            {[
              { x: 32, y: 20 }, { x: 65, y: 25 }, { x: 25, y: 60 },
              { x: 60, y: 65 }, { x: 38, y: 78 }, { x: 85, y: 45 },
              { x: 20, y: 85 }, { x: 90, y: 20 },
            ].map((building, i) => (
              <div key={`scattered-${i}`} className="absolute" style={{
                left: `${building.x}%`,
                top: `${building.y}%`,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={`${
                  theme === "dark" ? "opacity-30" : "opacity-40"
                }`}>
                  <path d="M4 8h16v14H4z" fill={theme === "dark" ? "#3f3f46" : "#d4d4d4"} />
                  <rect x="9" y="11" width="2" height="2" fill={theme === "dark" ? "#fbbf24" : "#f59e0b"} opacity="0.3" />
                  <rect x="13" y="11" width="2" height="2" fill={theme === "dark" ? "#fbbf24" : "#f59e0b"} opacity="0.2" />
                </svg>
              </div>
            ))}
          </div>

          {/* Enhanced Landmarks */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Central Park - with real trees and paths */}
            <div 
              className={`absolute rounded-lg overflow-hidden ${
                theme === "dark" ? "bg-emerald-950/30" : "bg-emerald-100/60"
              }`}
              style={{
                left: "68%",
                top: "8%",
                width: "12%",
                height: "12%",
                border: theme === "dark" ? "1px solid #065f46" : "1px solid #6ee7b7",
                boxShadow: theme === "dark" 
                  ? "inset 0 2px 8px rgba(16, 185, 129, 0.1)" 
                  : "inset 0 2px 8px rgba(16, 185, 129, 0.2)",
              }}
            >
              {/* Park paths */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <path d="M 10 50 Q 30 30, 50 50 T 90 50" 
                  stroke={theme === "dark" ? "#064e3b" : "#a7f3d0"} 
                  strokeWidth="2" 
                  fill="none" 
                  opacity="0.4" />
                <path d="M 50 10 Q 30 30, 50 50 T 50 90" 
                  stroke={theme === "dark" ? "#064e3b" : "#a7f3d0"} 
                  strokeWidth="2" 
                  fill="none" 
                  opacity="0.4" />
              </svg>

              {/* Tree icons instead of dots */}
              {[
                { x: 20, y: 25 },
                { x: 35, y: 50 },
                { x: 50, y: 30 },
                { x: 65, y: 60 },
                { x: 75, y: 35 },
                { x: 30, y: 70 },
                { x: 80, y: 70 },
                { x: 55, y: 65 },
              ].map((tree, i) => (
                <div 
                  key={`tree-${i}`}
                  className="absolute animate-pulse"
                  style={{
                    left: `${tree.x}%`,
                    top: `${tree.y}%`,
                    animationDelay: `${i * 0.4}s`,
                    animationDuration: '4s',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="6" fill="#10b981" opacity="0.6" />
                    <rect x="11" y="12" width="2" height="8" fill="#065f46" opacity="0.5" />
                  </svg>
                </div>
              ))}

              {/* Pond */}
              <div 
                className="absolute rounded-full"
                style={{
                  left: "40%",
                  top: "45%",
                  width: "20%",
                  height: "20%",
                  background: theme === "dark" 
                    ? "radial-gradient(circle, #1e3a8a 0%, #0c4a6e 100%)" 
                    : "radial-gradient(circle, #93c5fd 0%, #3b82f6 100%)",
                  opacity: 0.4,
                }}
              />
            </div>

            {/* Stadium with detailed structure */}
            <div 
              className={`absolute rounded-full overflow-hidden ${
                theme === "dark" ? "bg-purple-950/30" : "bg-purple-100/60"
              }`}
              style={{
                left: "15%",
                top: "78%",
                width: "8%",
                height: "10%",
                border: theme === "dark" ? "2px solid #6b21a8" : "2px solid #d8b4fe",
                boxShadow: theme === "dark"
                  ? "0 0 20px rgba(168, 85, 247, 0.3), inset 0 2px 8px rgba(168, 85, 247, 0.2)"
                  : "0 0 20px rgba(168, 85, 247, 0.2), inset 0 2px 8px rgba(168, 85, 247, 0.3)",
              }}
            >
              {/* Stadium field */}
              <div 
                className="absolute inset-[15%] rounded-full"
                style={{
                  backgroundColor: theme === "dark" ? "#065f46" : "#86efac",
                  opacity: 0.3,
                }}
              />
              
              {/* Stadium lights */}
              <div className="absolute inset-0 animate-pulse" style={{ animationDuration: '2s' }}>
                <div className="absolute top-[10%] left-[50%] w-2 h-2 rounded-full bg-yellow-400/80 blur-sm" />
                <div className="absolute bottom-[10%] left-[50%] w-2 h-2 rounded-full bg-yellow-400/80 blur-sm" />
                <div className="absolute top-[50%] left-[10%] w-2 h-2 rounded-full bg-yellow-400/80 blur-sm" />
                <div className="absolute top-[50%] right-[10%] w-2 h-2 rounded-full bg-yellow-400/80 blur-sm" />
              </div>
            </div>

            {/* Water body - Lake/River with details */}
            <div 
              className={`absolute rounded-lg overflow-hidden ${
                theme === "dark" ? "bg-blue-950/30" : "bg-blue-100/60"
              }`}
              style={{
                left: "28%",
                top: "48%",
                width: "10%",
                height: "8%",
                border: theme === "dark" ? "1px solid #1e40af" : "1px solid #93c5fd",
                boxShadow: theme === "dark"
                  ? "inset 0 2px 8px rgba(59, 130, 246, 0.2)"
                  : "inset 0 2px 8px rgba(59, 130, 246, 0.3)",
              }}
            >
              {/* Water waves */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <path d="M 0 30 Q 25 20, 50 30 T 100 30" 
                  stroke={theme === "dark" ? "#1e40af" : "#60a5fa"} 
                  strokeWidth="1" 
                  fill="none" 
                  opacity="0.3"
                  className="animate-pulse"
                />
                <path d="M 0 50 Q 25 40, 50 50 T 100 50" 
                  stroke={theme === "dark" ? "#1e40af" : "#60a5fa"} 
                  strokeWidth="1" 
                  fill="none" 
                  opacity="0.3"
                  className="animate-pulse"
                  style={{ animationDelay: '0.5s' }}
                />
                <path d="M 0 70 Q 25 60, 50 70 T 100 70" 
                  stroke={theme === "dark" ? "#1e40af" : "#60a5fa"} 
                  strokeWidth="1" 
                  fill="none" 
                  opacity="0.3"
                  className="animate-pulse"
                  style={{ animationDelay: '1s' }}
                />
              </svg>

              {/* Boats */}
              <div className="absolute top-[30%] left-[20%] w-2 h-1 bg-white/40 rounded-sm" />
              <div className="absolute top-[60%] left-[70%] w-2 h-1 bg-white/40 rounded-sm" />
            </div>

            {/* Shopping Mall */}
            <div 
              className={`absolute rounded-md overflow-hidden ${
                theme === "dark" ? "bg-amber-950/30" : "bg-amber-100/60"
              }`}
              style={{
                left: "82%",
                top: "52%",
                width: "7%",
                height: "9%",
                border: theme === "dark" ? "1px solid #92400e" : "1px solid #fcd34d",
              }}
            >
              {/* Mall icon */}
              <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" className="p-2">
                <rect x="4" y="8" width="16" height="12" fill={theme === "dark" ? "#78350f" : "#fbbf24"} opacity="0.3" />
                <rect x="7" y="11" width="3" height="4" fill={theme === "dark" ? "#fbbf24" : "#f59e0b"} opacity="0.4" />
                <rect x="14" y="11" width="3" height="4" fill={theme === "dark" ? "#fbbf24" : "#f59e0b"} opacity="0.4" />
              </svg>
            </div>

            {/* Airport */}
            <div 
              className={`absolute rounded-lg overflow-hidden ${
                theme === "dark" ? "bg-gray-900/30" : "bg-gray-200/60"
              }`}
              style={{
                left: "5%",
                top: "30%",
                width: "8%",
                height: "6%",
                border: theme === "dark" ? "1px solid #27272a" : "1px solid #d4d4d8",
              }}
            >
              {/* Runway */}
              <div 
                className="absolute top-1/2 left-0 right-0 h-[20%]"
                style={{
                  backgroundColor: theme === "dark" ? "#3f3f46" : "#a1a1aa",
                  opacity: 0.5,
                }}
              />
              {/* Plane icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <path d="M12 2l-8 8h5v8h6v-8h5z" fill={theme === "dark" ? "#71717a" : "#52525b"} opacity="0.6" />
              </svg>
            </div>

            {/* Train Station */}
            <div 
              className={`absolute rounded-md overflow-hidden ${
                theme === "dark" ? "bg-red-950/30" : "bg-red-100/60"
              }`}
              style={{
                left: "45%",
                top: "85%",
                width: "6%",
                height: "7%",
                border: theme === "dark" ? "1px solid #7f1d1d" : "1px solid #fca5a5",
              }}
            >
              {/* Train tracks */}
              <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none">
                <line x1="8" y1="0" x2="8" y2="24" stroke={theme === "dark" ? "#7f1d1d" : "#ef4444"} strokeWidth="1" opacity="0.4" />
                <line x1="16" y1="0" x2="16" y2="24" stroke={theme === "dark" ? "#7f1d1d" : "#ef4444"} strokeWidth="1" opacity="0.4" />
                <rect x="6" y="10" width="12" height="6" fill={theme === "dark" ? "#991b1b" : "#f87171"} opacity="0.4" />
              </svg>
            </div>
          </div>

          {/* Animated Traffic Lights */}
          <div className="absolute inset-0 pointer-events-none">
            {[
              { x: 12, y: 15, phase: 0 }, { x: 28, y: 15, phase: 1 }, { x: 50, y: 15, phase: 2 }, { x: 72, y: 15, phase: 0 },
              { x: 12, y: 35, phase: 1 }, { x: 28, y: 37, phase: 2 }, { x: 50, y: 37, phase: 0 }, { x: 72, y: 35, phase: 1 },
              { x: 12, y: 55, phase: 2 }, { x: 28, y: 53, phase: 0 }, { x: 50, y: 53, phase: 1 }, { x: 72, y: 55, phase: 2 },
              { x: 12, y: 75, phase: 0 }, { x: 28, y: 75, phase: 1 }, { x: 50, y: 75, phase: 2 }, { x: 72, y: 75, phase: 0 },
            ].map((light, i) => {
              const colors = ['#22c55e', '#fbbf24', '#ef4444'];
              const currentColor = colors[(i + light.phase) % 3];
              
              return (
                <div
                  key={`traffic-${i}`}
                  className="absolute animate-pulse"
                  style={{
                    left: `${light.x}%`,
                    top: `${light.y}%`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '2s',
                  }}
                >
                  <div 
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: currentColor,
                      boxShadow: theme === "dark"
                        ? `0 0 8px ${currentColor}, 0 0 4px ${currentColor}`
                        : `0 0 6px ${currentColor}`,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Area zones - more subtle */}
          <div className="absolute inset-0 pointer-events-none mix-blend-soft-light opacity-60">
            <div className={`absolute top-0 left-0 w-1/3 h-1/3 rounded-full blur-3xl ${
              theme === "dark" 
                ? "bg-gradient-to-br from-pink-950/15 to-transparent" 
                : "bg-gradient-to-br from-pink-100/30 to-transparent"
            }`} />
            <div className={`absolute top-0 right-0 w-1/3 h-1/3 rounded-full blur-3xl ${
              theme === "dark" 
                ? "bg-gradient-to-bl from-cyan-950/15 to-transparent" 
                : "bg-gradient-to-bl from-cyan-100/30 to-transparent"
            }`} />
            <div className={`absolute bottom-0 left-0 w-1/3 h-1/3 rounded-full blur-3xl ${
              theme === "dark" 
                ? "bg-gradient-to-tr from-violet-950/15 to-transparent" 
                : "bg-gradient-to-tr from-violet-100/30 to-transparent"
            }`} />
            <div className={`absolute bottom-0 right-0 w-1/3 h-1/3 rounded-full blur-3xl ${
              theme === "dark" 
                ? "bg-gradient-to-tl from-amber-950/15 to-transparent" 
                : "bg-gradient-to-tl from-amber-100/30 to-transparent"
            }`} />
          </div>

          {/* Subtle vignette */}
          <div className={`absolute inset-0 bg-gradient-radial from-transparent via-transparent ${
            theme === "dark" ? "to-black/30" : "to-white/20"
          }`} />
        </div>
      </div>

      {/* District Labels */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-8 left-8 px-3 py-2 rounded-lg backdrop-blur-md border ${
          theme === "dark" 
            ? "bg-black/50 border-pink-900/30" 
            : "bg-white/40 border-pink-300/50"
        }`}>
          <span className={`text-[10px] font-medium tracking-[0.2em] uppercase ${
            theme === "dark" ? "text-pink-400/80" : "text-pink-600"
          }`}>Entertainment District</span>
        </div>
        
        <div className={`absolute top-8 right-8 px-3 py-2 rounded-lg backdrop-blur-md border ${
          theme === "dark" 
            ? "bg-black/50 border-cyan-900/30" 
            : "bg-white/40 border-cyan-300/50"
        }`}>
          <span className={`text-[10px] font-medium tracking-[0.2em] uppercase ${
            theme === "dark" ? "text-cyan-400/80" : "text-cyan-600"
          }`}>Tech Hub</span>
        </div>
        
        <div className={`absolute bottom-8 left-8 px-3 py-2 rounded-lg backdrop-blur-md border ${
          theme === "dark" 
            ? "bg-black/50 border-violet-900/30" 
            : "bg-white/40 border-violet-300/50"
        }`}>
          <span className={`text-[10px] font-medium tracking-[0.2em] uppercase ${
            theme === "dark" ? "text-violet-400/80" : "text-violet-600"
          }`}>Arts Quarter</span>
        </div>
        
        <div className={`absolute bottom-8 right-8 px-3 py-2 rounded-lg backdrop-blur-md border ${
          theme === "dark" 
            ? "bg-black/50 border-amber-900/30" 
            : "bg-white/40 border-amber-300/50"
        }`}>
          <span className={`text-[10px] font-medium tracking-[0.2em] uppercase ${
            theme === "dark" ? "text-amber-400/80" : "text-amber-600"
          }`}>Business District</span>
        </div>
      </div>

      {/* Studio Markers with PREMIUM Hover Effects */}
      {filteredStudios.map((studio) => {
        if (!studio.latitude || !studio.longitude) return null;
        const position = getPosition(studio.latitude, studio.longitude);
        const isSelected = selectedStudio?.id === studio.id;
        const isHovered = hoveredStudio === studio.id;
        const distance = userLocation
          ? calculateDistance(userLocation.lat, userLocation.lon, studio.latitude, studio.longitude)
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
            {/* Sonar/Radar pulse rings - BEEPING effect */}
            {!isSelected && !isHovered && (
              <>
                <div 
                  className="absolute inset-0 -m-8 rounded-full border-2 border-red-500/40 animate-ping"
                  style={{
                    animationDuration: '2s',
                    animationDelay: `${studio.id * 0.3}s`,
                  }}
                />
                <div 
                  className="absolute inset-0 -m-12 rounded-full border border-red-500/20 animate-ping"
                  style={{
                    animationDuration: '2.5s',
                    animationDelay: `${studio.id * 0.3 + 0.5}s`,
                  }}
                />
              </>
            )}

            {/* Enhanced pulse for hover/select */}
            {(isSelected || isHovered) && (
              <>
                <div className="absolute inset-0 -m-6 rounded-full border-2 border-red-500/30 animate-pulse" />
                <div className="absolute inset-0 -m-10 rounded-full border border-red-500/20 animate-pulse" style={{ animationDuration: '1.5s' }} />
                <div className="absolute inset-0 -m-14 rounded-full border border-red-500/10" />
                <div className={`absolute inset-0 -m-4 rounded-full border-2 transition-all duration-500 ${
                  isSelected 
                    ? "border-white animate-ping opacity-50" 
                    : "border-red-400 animate-pulse opacity-40"
                }`} />
              </>
            )}
            
            {/* Marker pin with glow */}
            <div className="relative flex flex-col items-center">
              <div className={`
                relative transition-all duration-300
                ${isSelected ? "scale-130" : isHovered ? "scale-115" : "scale-100"}
              `}>
                {/* Glowing halo effect */}
                <div 
                  className="absolute inset-0 rounded-full blur-md animate-pulse"
                  style={{
                    backgroundColor: isSelected ? '#ffffff' : '#ef4444',
                    opacity: isSelected || isHovered ? 0.4 : 0.2,
                    width: '140%',
                    height: '140%',
                    left: '-20%',
                    top: '-20%',
                  }}
                />
                
                {/* Pin shape */}
                <div className="relative">
                  <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg" 
                    className={`transition-all duration-300 ${
                      isSelected || isHovered 
                        ? "drop-shadow-[0_0_12px_rgba(239,68,68,1)] filter brightness-110" 
                        : "drop-shadow-[0_0_6px_rgba(239,68,68,0.7)]"
                    }`}
                    style={{
                      filter: isSelected || isHovered ? 'drop-shadow(0 0 12px rgba(239,68,68,1))' : 'drop-shadow(0 0 6px rgba(239,68,68,0.7))',
                    }}
                  >
                    <path d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 40 16 40C16 40 32 24.837 32 16C32 7.163 24.837 0 16 0Z" 
                      fill={isSelected ? "#ffffff" : isHovered ? "#fca5a5" : "#ef4444"}
                      className="transition-colors duration-300"
                    />
                    <circle cx="16" cy="15" r="6" 
                      fill={isSelected ? "#000000" : "#ffffff"}
                      className="transition-colors duration-300"
                    />
                    {/* Inner glow circle */}
                    <circle cx="16" cy="15" r="6" 
                      fill={isSelected ? "#ef4444" : "#fca5a5"}
                      className="animate-pulse"
                      style={{
                        opacity: 0.3,
                        animationDuration: '1.5s',
                      }}
                    />
                  </svg>
                </div>
              </div>

              {/* PREMIUM Hover Card - Replaces white rectangles */}
              {(isSelected || isHovered) && (
                <div 
                  className={`
                    mt-2 rounded-xl overflow-hidden backdrop-blur-xl transition-all duration-300 
                    animate-in fade-in slide-in-from-bottom-3 shadow-2xl border
                    ${isSelected ? 'w-[280px]' : 'w-[240px]'}
                    ${isSelected 
                      ? theme === "dark"
                        ? "bg-gradient-to-br from-zinc-900/95 via-zinc-900/90 to-black/95 border-white/20" 
                        : "bg-gradient-to-br from-white/95 via-gray-50/90 to-white/95 border-gray-300/60"
                      : theme === "dark"
                        ? "bg-black/90 border-zinc-800/60"
                        : "bg-white/90 border-gray-300/60"
                    }
                  `}
                  style={{
                    boxShadow: isSelected 
                      ? theme === "dark"
                        ? '0 20px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)'
                        : '0 20px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)'
                      : theme === "dark"
                        ? '0 10px 25px rgba(0,0,0,0.6)'
                        : '0 10px 25px rgba(0,0,0,0.15)',
                  }}
                >
                  <div className="p-4 space-y-3">
                    {/* Studio name with icon */}
                    <div className="flex items-start gap-2">
                      <div className={`p-1.5 rounded-lg ${
                        isSelected
                          ? theme === "dark" ? "bg-red-500/20" : "bg-red-500/10"
                          : theme === "dark" ? "bg-red-500/10" : "bg-red-500/5"
                      }`}>
                        <Mic2 className={`w-4 h-4 ${
                          isSelected ? "text-red-500" : "text-red-600"
                        }`} strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-semibold tracking-wide truncate ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}>
                          {studio.name}
                        </h4>
                        <div className={`flex items-center gap-1 mt-0.5 text-xs ${
                          theme === "dark" ? "text-zinc-400" : "text-gray-600"
                        }`}>
                          <MapPin className="w-3 h-3" strokeWidth={2} />
                          <span className="truncate">{studio.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Rating and Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" strokeWidth={2} />
                        <span className={`text-sm font-semibold ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}>
                          {studio.rating}
                        </span>
                      </div>
                      <span className={`text-sm font-bold ${
                        isSelected
                          ? "text-red-500"
                          : theme === "dark" ? "text-zinc-300" : "text-gray-700"
                      }`}>
                        ${studio.hourlyRate}/hr
                      </span>
                    </div>

                    {/* Distance if available */}
                    {distance !== null && (
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${
                        theme === "dark" 
                          ? "bg-blue-500/10 border border-blue-500/20" 
                          : "bg-blue-50 border border-blue-200/50"
                      }`}>
                        <Navigation className={`w-3 h-3 ${
                          theme === "dark" ? "text-blue-400" : "text-blue-600"
                        }`} strokeWidth={2} />
                        <span className={`text-xs font-medium ${
                          theme === "dark" ? "text-blue-400" : "text-blue-600"
                        }`}>
                          {Math.round(distance)} miles away
                        </span>
                      </div>
                    )}

                    {/* Quick action button for selected */}
                {permissions.canBookStudios && (
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
)}
                  </div>
                </div>
              )}
            </div>
          </button>
        );
      })}

      {/* User Location Marker - Enhanced */}
      {userLocation && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30"
          style={{
            left: getPosition(userLocation.lat, userLocation.lon).x,
            top: getPosition(userLocation.lat, userLocation.lon).y
          }}
        >
          {/* Multiple pulse rings with different speeds */}
          <div className="absolute inset-0 -m-6 rounded-full bg-blue-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
          <div className="absolute inset-0 -m-9 rounded-full bg-blue-500/15 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-0 -m-12 rounded-full bg-blue-500/10 animate-ping" style={{ animationDuration: '2.5s' }} />
          <div className="absolute inset-0 -m-16 rounded-full bg-blue-500/5 animate-ping" style={{ animationDuration: '3s' }} />
          
          {/* User marker with enhanced glow */}
          <div className="relative">
            <div className="absolute inset-0 w-7 h-7 -m-1 rounded-full bg-blue-400/50 blur-lg animate-pulse" />
            <div className="relative w-5 h-5 rounded-full bg-blue-500 ring-4 ring-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,1)]">
              <div className="absolute inset-0 rounded-full bg-blue-400 blur-sm animate-pulse" />
              <div className="absolute inset-1 rounded-full bg-white" />
              <div className="absolute inset-0 rounded-full bg-blue-300/30 animate-ping" style={{ animationDuration: '1s' }} />
            </div>
          </div>
          
          {/* Label */}
          <div className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wider whitespace-nowrap backdrop-blur-md shadow-xl ${
            theme === "dark"
              ? "text-blue-300 bg-black/95 border border-blue-500/60"
              : "text-blue-600 bg-white/95 border border-blue-500/40"
          }`}>
            Your Location
          </div>
        </div>
      )}

      {/* Selected Studio Card - Your existing implementation */}
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
          <div className="relative">
            <div className="w-3 h-3 bg-red-500 rounded-sm shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
            <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-sm animate-ping opacity-50" />
          </div>
          <span>Studios</span>
        </div>
        {userLocation && (
          <div className={`flex items-center gap-2.5 text-xs font-medium tracking-wide ${
            theme === "dark" ? "text-zinc-300" : "text-gray-700"
          }`}>
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
            </div>
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
      You're browsing studios. Are you an artist and you have a recording studio? create clubs to enable listings.
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