"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Star,
  CheckCircle2,
  Filter,
  Play,
  LayoutGrid,
  List as ListIcon,
  ChevronDown,
  MapPin,
  Clock,
  X,
  ArrowUpDown,
  Music,
  Crosshair,
  Globe,
  ChevronRight
} from "lucide-react";
import { useProducers, type Producer as APIProducer } from "@/hooks/useProducers";

// --- Math: Haversine Formula for Real Distance ---
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1)); // Returns distance in km with 1 decimal
}


const formatCompact = (num: number) => 
  Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);


// --- Types ---
type Producer = APIProducer & {
  handle: string;
  totalPosts: number;
  rating: number;
  responseTime: string;
  startingPrice: number;
  isOnline: boolean;
  distance: number | null; // Real calculated distance in km
  lat?: number; // Fetched from your updated User schema
  lng?: number; // Fetched from your updated User schema
};

type ViewMode = "grid" | "list";
type SortOption = "Recommended" | "Price: Low to High" | "Price: High to Low" | "Rating" | "Distance";

// --- Components ---

// 1. Functional Sort Dropdown
const SortDropdown = ({ 
  current, 
  onSelect, 
  locationActive 
}: { 
  current: SortOption; 
  onSelect: (s: SortOption) => void; 
  locationActive: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const options: SortOption[] = [
    "Recommended", 
    "Price: Low to High", 
    "Price: High to Low", 
    "Rating",
    ...(locationActive ? ["Distance" as SortOption] : [])
  ];

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors border border-white/10 bg-zinc-900/30 text-zinc-300 hover:bg-zinc-800 hover:border-white/20"
      >
        <ArrowUpDown className="w-4 h-4 text-zinc-500" />
        <span>Sort: <span className="text-white ml-1">{current}</span></span>
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 p-1.5 rounded-xl border border-white/10 bg-[#0a0a0a] shadow-2xl z-50">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onSelect(opt); setIsOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                current === opt 
                  ? "bg-white/10 text-white" 
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// 2. The Filter Dropdown
const FilterDropdown = ({ 
  label, 
  activeValue, 
  options, 
  onSelect,
  isOpen,
  toggle,
  icon: Icon
}: any) => (
  <div className="relative z-50">
    <button
      onClick={toggle}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border rounded-xl transition-all duration-200 ${
        activeValue 
          ? "bg-white border-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
          : "bg-zinc-900/30 border-white/10 text-zinc-400 hover:border-white/30 hover:text-zinc-200 hover:bg-zinc-900/50"
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label}
      {activeValue && <span className="ml-1 bg-black/10 px-2 py-0.5 rounded-md text-xs">{activeValue}</span>}
      <ChevronDown className={`w-4 h-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && (
      <div className="absolute top-full left-0 mt-2 w-48 p-1.5 rounded-xl border border-white/10 bg-[#0a0a0a] shadow-2xl z-50">
        {options.map((opt: string) => (
          <button
            key={opt}
            onClick={() => onSelect(opt === activeValue ? null : opt)}
            className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg flex items-center justify-between transition-colors ${
              opt === activeValue 
                ? "bg-white/10 text-white" 
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            }`}
          >
            {opt}
            {opt === activeValue && <CheckCircle2 className="w-4 h-4 text-white" />}
          </button>
        ))}
      </div>
    )}
  </div>
);

// 3. Pro Card 
// 3. Pro Card 
const ProCard = ({ producer, router, showDistance }: { producer: Producer; router: any; showDistance: boolean }) => (
  <div
    onClick={() => router.push(`/producers/${producer.id}`)}
    className="group relative w-full aspect-square rounded-full border border-white/5 hover:border-white/20 bg-zinc-900/20 hover:bg-zinc-800/40 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col items-center justify-center p-2 text-center shadow-lg hover:shadow-2xl"
  >
    {/* Subtle blurred background for depth */}
    <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
       <img 
         src={producer.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${producer.id}`} 
         className="w-full h-full object-cover blur-2xl scale-125" 
         alt="" 
       />
       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
    </div>

    {/* NEW: Floating Rating Tag (Top Left) */}
    <div className="absolute z-30 top-[14%] left-[10%] flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
      <div className="bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded-full shadow-lg flex items-center gap-1 -rotate-[15deg] group-hover:rotate-0 transition-transform duration-300">
        <Star className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" />
        <span className="text-[9px] font-bold text-white pr-0.5">{producer.rating}</span>
      </div>
    </div>

    {/* Creative Floating Price Tag (Top Right) */}
 {/* Creative Floating Price Tag (Top Right) */}
<div className="absolute z-30 top-[14%] right-[10%] flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
  <div className="bg-white/10 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.4)] rotate-[15deg] group-hover:rotate-0 transition-transform duration-300">
    <span className="text-[10px] sm:text-xs font-bold text-white tracking-tight drop-shadow-sm">
      ${formatCompact(producer.startingPrice)}
    </span>
  </div>
</div>

    {/* Play Button & Overlay (Hover) */}
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/40 backdrop-blur-sm rounded-full">
      <button className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-110 transition-transform duration-300">
        <Play className="w-5 h-5 text-black fill-black translate-x-0.5" />
      </button>
      
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 px-4 flex-wrap">
        {producer.genres?.slice(0, 2).map((g: string) => (
          <span key={g} className="text-[10px] font-medium bg-white/10 text-white px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-sm truncate max-w-[80px]">
            {g}
          </span>
        ))}
      </div>
    </div>

    {/* Content - Avatar, Name, and Location */}
    <div className="relative z-10 flex flex-col items-center w-[85%] transition-transform duration-500 mt-2">
      {/* Avatar */}
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 mb-2 sm:mb-3 group-hover:scale-105 transition-transform duration-500">
        <img
          src={producer.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${producer.id}`}
          alt={producer.name}
          className="w-full h-full rounded-full object-cover shadow-2xl"
        />
        {producer.isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-green-500 border-2 border-[#0A0A0A] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse" />
        )}
      </div>

      <div className="flex items-center justify-center gap-1 mb-0.5 sm:mb-1 w-full">
        <h3 className="font-medium text-xs sm:text-sm text-white truncate tracking-tight">
          {producer.name}
        </h3>
        {producer.verified && <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400 shrink-0" />}
      </div>

      {/* NEW: Location now has the full width of the bottom area */}
      <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] text-zinc-400 w-full px-2">
        <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 text-zinc-500" /> 
        <span className="truncate">
          {producer.location?.split(',')[0] || "Global"}
        </span>
      </div>
    </div>
  </div>
);

export default function ProducerHub() {
  const router = useRouter();
  
  // --- State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("Recommended");
  
  // Location State (Now stores actual coordinates)
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    genre: null as string | null,
    rating: null as string | null,
    price: null as string | null,
    availability: null as string | null
  });

  const { data: apiProducers = [], isLoading } = useProducers({
    search: searchQuery || undefined,
    genre: filters.genre || undefined,
  });

  // Transform Data + Real Distance
  const producers: Producer[] = apiProducers.map((p, i) => {
    let dist: number | null = null;
    
    // If we have user coordinates and the producer has lat/lng, calculate real distance
    if (userCoords && p.lat !== undefined && p.lng !== undefined) {
      dist = calculateDistance(userCoords.lat, userCoords.lng, p.lat, p.lng);
    }

    return {
      ...p,
      handle: `@${(p.name || p.email?.split('@')[0] || 'producer').toLowerCase().replace(/\s+/g, '')}`,
      totalPosts: (p.beats?.length || 0) + (p.studios?.length || 0) + (p.services?.length || 0),
      rating: p.rating || 4.5,
      responseTime: i % 2 === 0 ? "1 hr" : "24 hrs",
      startingPrice: p.startingPrice || 100,
      isOnline: i % 3 === 0,
      distance: dist 
    };
  });

  // Filter Logic
  let filteredProducers = producers.filter(p => {
    if (filters.availability === "Online Now" && !p.isOnline) return false;
    if (filters.rating === "4.8+" && p.rating < 4.8) return false;
    if (filters.rating === "4.5+" && p.rating < 4.5) return false;
    if (filters.rating === "4.0+" && p.rating < 4.0) return false;
    
    // Only filter by distance if they successfully requested it and calculation succeeded
    if (userCoords && p.distance !== null && p.distance > 20) return false;
    
    return true;
  });

  // Sorting Logic
  filteredProducers.sort((a, b) => {
    switch(sortBy) {
      case "Price: Low to High": return a.startingPrice - b.startingPrice;
      case "Price: High to Low": return b.startingPrice - a.startingPrice;
      case "Rating": return b.rating - a.rating;
      case "Distance": 
        if (a.distance === null) return 1; // Push those without coordinates to the back
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      default: return 0;
    }
  });

  const filterOptions = {
    genre: ["Hip Hop", "Trap", "R&B", "Pop", "Electronic", "Rock"],
    rating: ["4.0+", "4.5+", "4.8+"],
    availability: ["Online Now"]
  };

  const handleLocationToggle = () => {
    if (userCoords) {
      setUserCoords(null);
      setSortBy("Recommended");
      return;
    }

    setIsLocating(true);

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setSortBy("Distance");
        setIsLocating(false);
      },
      (error) => {
        console.error("Error locating:", error);
        alert("Could not get your location. Please check browser permissions.");
        setIsLocating(false);
      }
    );
  };

  return (
    <div className="h-full overflow-y-auto bg-[#030303] text-white selection:bg-white/20">
      
      {/* --- LEVEL 1: TOP BAR --- */}
      <header className="sticky top-0 z-50 border-b bg-[#030303]/80 border-white/5 backdrop-blur-2xl">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between gap-6">
          
          <div className="flex-1 w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text"
              placeholder="Search producers, sounds, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-2xl pl-11 pr-4 py-3 rounded-2xl text-sm outline-none border transition-all bg-zinc-900/40 border-white/5 focus:border-white/20 focus:bg-zinc-900 text-white placeholder:text-zinc-500 focus:shadow-[0_0_30px_rgba(255,255,255,0.05)]"
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={handleLocationToggle}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-300 ${
                userCoords 
                  ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                  : "bg-zinc-900/30 border-white/5 hover:border-white/20 hover:bg-zinc-800 text-zinc-300"
              }`}
            >
              {isLocating ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Crosshair className={`w-4 h-4 ${userCoords ? 'animate-pulse' : ''}`} />
              )}
              <span className="text-sm font-semibold hidden sm:block">
                {userCoords ? "Near Me" : "Locate"}
              </span>
            </button>

            <button 
              onClick={() => {
                setUserCoords(null);
                setSortBy("Recommended");
              }}
              className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-300 ${
                !userCoords 
                  ? "bg-white/10 border-white/20 text-white shadow-sm" 
                  : "bg-zinc-900/30 border-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 cursor-pointer"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">
                {userCoords ? `${Math.abs(userCoords.lat).toFixed(1)}°${userCoords.lat >= 0 ? 'N' : 'S'}, ${Math.abs(userCoords.lng).toFixed(1)}°${userCoords.lng >= 0 ? 'E' : 'W'}` : "Global"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* --- LEVEL 2: CONTROL DECK --- */}
      <div className="sticky top-20 z-40 border-b bg-[#030303]/90 border-white/5 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto w-full px-6 py-4 flex flex-col gap-4">
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 pr-4 mr-2 border-r border-white/10">
                <Filter className="w-4 h-4 text-zinc-500" />
                <span className="text-sm font-medium text-zinc-400">Filters</span>
              </div>
              
              <FilterDropdown 
                label="Genre" 
                icon={Music}
                activeValue={filters.genre} 
                options={filterOptions.genre} 
                isOpen={openDropdown === 'genre'}
                toggle={() => setOpenDropdown(openDropdown === 'genre' ? null : 'genre')}
                onSelect={(v: string) => { setFilters({...filters, genre: v}); setOpenDropdown(null); }}
              />
              <FilterDropdown 
                label="Rating" 
                icon={Star}
                activeValue={filters.rating} 
                options={filterOptions.rating} 
                isOpen={openDropdown === 'rating'}
                toggle={() => setOpenDropdown(openDropdown === 'rating' ? null : 'rating')}
                onSelect={(v: string) => { setFilters({...filters, rating: v}); setOpenDropdown(null); }}
              />
              <FilterDropdown 
                label="Status" 
                icon={Clock}
                activeValue={filters.availability} 
                options={filterOptions.availability} 
                isOpen={openDropdown === 'availability'}
                toggle={() => setOpenDropdown(openDropdown === 'availability' ? null : 'availability')}
                onSelect={(v: string) => { setFilters({...filters, availability: v}); setOpenDropdown(null); }}
              />
            </div>

            <div className="flex items-center gap-4">
              <SortDropdown 
                current={sortBy} 
                onSelect={setSortBy} 
                locationActive={!!userCoords}
              />
              <div className="h-8 w-px bg-white/10" />
              <div className="flex p-1 rounded-xl border border-white/10 bg-zinc-900/30">
                <button 
                  onClick={() => setViewMode("grid")} 
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid' 
                      ? "bg-white/10 text-white shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode("list")} 
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list' 
                      ? "bg-white/10 text-white shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {(filters.genre || filters.rating || filters.availability || userCoords) && (
            <div className="flex items-center gap-2 animate-in slide-in-from-top-2 duration-300 pt-2">
              <span className="text-xs font-medium text-zinc-500 mr-1">Active:</span>
              {userCoords && (
                <button 
                  onClick={handleLocationToggle}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-white/10 text-white border-white/20 hover:bg-white/20 transition-colors"
                >
                  Near Me <X className="w-3 h-3" />
                </button>
              )}
              {Object.entries(filters).map(([key, value]) => {
                if (!value) return null;
                return (
                  <button 
                    key={key}
                    onClick={() => setFilters(prev => ({ ...prev, [key]: null }))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors bg-zinc-900/80 border-white/10 text-zinc-300 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10"
                  >
                    {value} <X className="w-3 h-3" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- LEVEL 3: GRID / LIST --- */}
      <main className="max-w-[1600px] mx-auto w-full p-6 pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="animate-spin h-8 w-8 border-2 border-t-transparent border-white rounded-full" />
          </div>
        ) : viewMode === 'grid' ? (
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6 sm:gap-8">
            {filteredProducers.map(producer => (
              <ProCard 
                key={producer.id} 
                producer={producer} 
                router={router} 
                showDistance={!!userCoords} 
              />
            ))}
          </div>

        ) : (
          <div className="flex flex-col gap-3">
            {filteredProducers.map(p => (
              <div 
                key={p.id}
                onClick={() => router.push(`/producers/${p.id}`)}
                className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/30 border border-white/5 hover:bg-zinc-800/50 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-4 min-w-[300px]">
                  <div className="relative w-14 h-14 shrink-0">
                    <img
                      src={p.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`}
                      alt={p.name}
                      className="w-full h-full rounded-full object-cover border border-white/10"
                    />
                    {p.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#121212] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-semibold text-white tracking-tight">{p.name}</span>
                      {p.verified && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                      <span>{p.handle}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {p.location?.split(',')[0]}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 items-center gap-8 justify-between md:justify-center">
                  <div className="hidden lg:flex items-center gap-2 w-[200px] flex-wrap">
                    {p.genres?.slice(0, 3).map((g: string) => (
                      <span key={g} className="text-[10px] font-medium px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-zinc-300">
                        {g}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center">
                      <span className="flex items-center gap-1 text-sm font-semibold text-white">
                        <Star className="w-3.5 h-3.5 fill-white" /> {p.rating}
                      </span>
                      <span className="text-[10px] text-zinc-500">Rating</span>
                    </div>
                    {userCoords && p.distance !== null && (
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-semibold text-white">{p.distance} <span className="text-xs text-zinc-500 font-normal">km</span></span>
                        <span className="text-[10px] text-zinc-500">Away</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 min-w-[200px]">
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-white">${p.startingPrice}</span>
                    <span className="text-[10px] text-zinc-500">Starting at</span>
                  </div>
                  
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white group-hover:text-black transition-all duration-300">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredProducers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 border border-white/5 border-dashed rounded-3xl bg-zinc-900/20">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-zinc-400" strokeWidth={2} />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">No Producers Found</h4>
            <p className="text-sm text-zinc-500">
              {searchQuery ? `Try adjusting "${searchQuery}"` : "Adjust your filters to see more results"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}