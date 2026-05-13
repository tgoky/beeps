"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Star,
  CheckCircle2,
  Filter,
  Play,
  MoreHorizontal,
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
  Navigation
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useProducers, type Producer as APIProducer } from "@/hooks/useProducers";

// --- Types ---
type Producer = APIProducer & {
  handle: string;
  totalPosts: number;
  rating: number;
  responseTime: string;
  startingPrice: number;
  isOnline: boolean;
  distance: number; // in km
};

type ViewMode = "grid" | "list";
type SortOption = "Recommended" | "Price: Low to High" | "Price: High to Low" | "Rating" | "Distance";

const formatCompact = (num: number) => 
  Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);

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
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors border border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800"
      >
        <ArrowUpDown className="w-4 h-4 text-zinc-500" />
        <span>Sort: <span className="text-white ml-1">{current}</span></span>
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 p-1.5 rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl z-50">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onSelect(opt); setIsOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                current === opt 
                  ? "bg-zinc-800 text-white" 
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
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
  <div className="relative">
    <button
      onClick={toggle}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border rounded-xl transition-all duration-200 ${
        activeValue 
          ? "bg-white border-white text-black" 
          : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 hover:bg-zinc-900"
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label}
      {activeValue && <span className="ml-1 bg-black/10 px-2 py-0.5 rounded-md text-xs">{activeValue}</span>}
      <ChevronDown className={`w-4 h-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && (
      <div className="absolute top-full left-0 mt-2 w-48 p-1.5 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl z-50">
        {options.map((opt: string) => (
          <button
            key={opt}
            onClick={() => onSelect(opt === activeValue ? null : opt)}
            className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg flex items-center justify-between transition-colors ${
              opt === activeValue 
                ? "bg-zinc-800 text-white" 
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
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

// 3. Pro Card (Perfectly Scaled Circular Proportions)
const ProCard = ({ producer, router, showDistance }: { producer: Producer; router: any; showDistance: boolean }) => (
  <div
    onClick={() => router.push(`/producers/${producer.id}`)}
    className="group relative w-full aspect-square rounded-full border border-zinc-700 hover:border-zinc-500 bg-zinc-900/40 hover:bg-zinc-800/80 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col items-center justify-center p-2 text-center shadow-lg"
  >
    {/* Subtle blurred background for depth */}
    <div className="absolute inset-0 z-0 opacity-30 group-hover:opacity-40 transition-opacity duration-300">
       <img 
         src={producer.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${producer.id}`} 
         className="w-full h-full object-cover blur-xl scale-110" 
         alt="" 
       />
       <div className="absolute inset-0 bg-black/60" />
    </div>

    {/* Play Button & Overlay (Hover) */}
    <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/60 backdrop-blur-[2px] rounded-full">
      <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
        <Play className="w-4 h-4 text-black fill-black translate-x-0.5" />
      </button>
      
      {/* Genres curved/positioned at bottom of circle */}
      <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-1.5 px-3 flex-wrap">
        {producer.genres?.slice(0, 2).map((g: string) => (
          <span key={g} className="text-[9px] font-medium bg-zinc-900/90 text-zinc-200 px-2 py-0.5 rounded-full border border-zinc-700 shadow-sm truncate max-w-[70px]">
            {g}
          </span>
        ))}
      </div>
    </div>

    {/* Content - Meticulously scaled to fit properly inside the circle */}
    <div className="relative z-10 flex flex-col items-center w-full mt-1">
      {/* Avatar */}
    {/* Avatar */}
<div className="relative w-14 h-14 sm:w-16 sm:h-16 mb-2">
  <img
    src={producer.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${producer.id}`}
    alt={producer.name}
    className="w-full h-full rounded-full object-cover transition-all shadow-xl"
  />
        {producer.isOnline && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#0A0A0A] rounded-full" />
        )}
      </div>

      <div className="flex items-center justify-center gap-1 mb-0.5 px-3 w-full">
        <h3 className="font-medium text-xs sm:text-sm text-white truncate max-w-[80%]">{producer.name}</h3>
        {producer.verified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
      </div>

      <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] text-zinc-400 mb-2 px-3 w-full">
        <span className="flex items-center gap-0.5 truncate max-w-[50%]">
          <MapPin className="w-2.5 h-2.5" /> {producer.location?.split(',')[0] || "Global"}
        </span>
        <span>•</span>
        <span className="flex items-center gap-0.5 text-yellow-500 font-medium">
          <Star className="w-2.5 h-2.5 fill-current" /> {producer.rating}
        </span>
      </div>

      <div className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-zinc-900/80 border border-zinc-700 text-[9px] sm:text-[10px] font-medium text-zinc-200 backdrop-blur-md shadow-sm">
        From ${producer.startingPrice}
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
  
  // Location State
  const [userLocation, setUserLocation] = useState<string | null>(null);
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

  // Transform Data + Distance
  const producers: Producer[] = apiProducers.map((p, i) => ({
    ...p,
    handle: `@${(p.name || p.email?.split('@')[0] || 'producer').toLowerCase().replace(/\s+/g, '')}`,
    totalPosts: (p.beats?.length || 0) + (p.studios?.length || 0) + (p.services?.length || 0),
    rating: p.rating || 4.5,
    responseTime: i % 2 === 0 ? "1 hr" : "24 hrs",
    startingPrice: p.startingPrice || 100,
    isOnline: i % 3 === 0,
    distance: parseFloat((Math.random() * 50).toFixed(1))
  }));

  // Filter Logic
  let filteredProducers = producers.filter(p => {
    if (filters.availability === "Online Now" && !p.isOnline) return false;
    if (filters.rating === "4.8+" && p.rating < 4.8) return false;
    if (filters.rating === "4.5+" && p.rating < 4.5) return false;
    if (filters.rating === "4.0+" && p.rating < 4.0) return false;
    if (userLocation && p.distance > 20) return false;
    return true;
  });

  // Sorting Logic
  filteredProducers.sort((a, b) => {
    switch(sortBy) {
      case "Price: Low to High": return a.startingPrice - b.startingPrice;
      case "Price: High to Low": return b.startingPrice - a.startingPrice;
      case "Rating": return b.rating - a.rating;
      case "Distance": return a.distance - b.distance;
      default: return 0;
    }
  });

  const filterOptions = {
    genre: ["Hip Hop", "Trap", "R&B", "Pop", "Electronic", "Rock"],
    rating: ["4.0+", "4.5+", "4.8+"],
    availability: ["Online Now"]
  };

  const handleLocationToggle = () => {
    if (userLocation) {
      setUserLocation(null);
      setSortBy("Recommended");
    } else {
      setIsLocating(true);
      setTimeout(() => {
        setUserLocation("Lagos, NG");
        setSortBy("Distance");
        setIsLocating(false);
      }, 800);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#030303] text-white">
      
      {/* --- LEVEL 1: TOP BAR --- */}
      <header className="sticky top-0 z-50 border-b bg-[#030303]/90 border-zinc-800 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white">ProducerHub</span>
          </div>

          <div className="flex-1 max-w-xl relative hidden md:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text"
              placeholder="Search producers, sounds, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none border transition-all bg-zinc-900/50 border-zinc-800 focus:border-zinc-600 focus:bg-zinc-900 text-white placeholder:text-zinc-500"
            />
          </div>

          {/* Location Intelligence Unit */}
          <div className="flex items-center gap-3">
            <button 
              onClick={handleLocationToggle}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-300 ${
                userLocation 
                  ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20" 
                  : "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 text-zinc-300"
              }`}
            >
              {isLocating ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Crosshair className={`w-4 h-4 ${userLocation ? 'animate-pulse' : ''}`} />
              )}
              <span className="text-sm font-medium hidden sm:block">
                {userLocation ? "Near Me" : "Locate"}
              </span>
            </button>

            <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-zinc-900/50 border-zinc-800">
              <Globe className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-medium text-zinc-300">
                {userLocation || "Global"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* --- LEVEL 2: CONTROL DECK --- */}
      <div className="sticky top-20 z-40 border-b bg-[#030303]/95 border-zinc-800 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto w-full px-6 py-4 flex flex-col gap-4">
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 pr-4 mr-2 border-r border-zinc-800">
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

            {/* Right Side: Sort & View */}
            <div className="flex items-center gap-4">
              <SortDropdown 
                current={sortBy} 
                onSelect={setSortBy} 
                locationActive={!!userLocation}
              />
              <div className="h-8 w-px bg-zinc-800" />
              <div className="flex p-1 rounded-xl border border-zinc-800 bg-zinc-900/50">
                <button 
                  onClick={() => setViewMode("grid")} 
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' 
                      ? "bg-zinc-800 text-white shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode("list")} 
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? "bg-zinc-800 text-white shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Chips */}
          {(filters.genre || filters.rating || filters.availability || userLocation) && (
            <div className="flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 pt-2">
              <span className="text-xs font-medium text-zinc-500 mr-1">Active:</span>
              {userLocation && (
                <button 
                  onClick={handleLocationToggle}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                >
                  Near Me <X className="w-3.5 h-3.5" />
                </button>
              )}
              {Object.entries(filters).map(([key, value]) => {
                if (!value) return null;
                return (
                  <button 
                    key={key}
                    onClick={() => setFilters(prev => ({ ...prev, [key]: null }))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors bg-zinc-900/80 border-zinc-700 text-zinc-300 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10"
                  >
                    {value} <X className="w-3.5 h-3.5" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- LEVEL 3: GRID / LIST --- */}
      <main className="max-w-[1600px] mx-auto w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-white">
              {userLocation ? "Producers Nearby" : "Verified Producers"}
            </h2>
            {userLocation && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-md font-medium shadow-sm">
                LAGOS
              </span>
            )}
          </div>
          <span className="text-sm text-zinc-500 font-medium">
            {filteredProducers.length} {filteredProducers.length === 1 ? "producer" : "producers"}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="animate-spin h-8 w-8 border-2 border-t-transparent border-zinc-400 rounded-full" />
          </div>
        ) : viewMode === 'grid' ? (
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-6">
            {filteredProducers.map(producer => (
              <ProCard 
                key={producer.id} 
                producer={producer} 
                router={router} 
                showDistance={!!userLocation} 
              />
            ))}
          </div>

        ) : (
          <div className="w-full rounded-xl border overflow-hidden border-zinc-800 bg-[#0A0A0A]">
            <table className="w-full text-left text-sm">
              <thead className="text-xs font-medium bg-zinc-900/50 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Producer</th>
                  {userLocation && <th className="px-6 py-4 font-medium">Distance</th>}
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Rating</th>
                  <th className="px-6 py-4 font-medium">Price</th>
                  <th className="px-6 py-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredProducers.map(p => (
                  <tr 
                    key={p.id} 
                    onClick={() => router.push(`/producers/${p.id}`)}
                    className="group cursor-pointer transition-colors hover:bg-zinc-900"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={p.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`}
                            alt={p.name}
                            className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                          />
                          {p.isOnline && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0A0A0A] rounded-full" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white flex items-center gap-1.5">
                            {p.name}
                            {p.verified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
                          </span>
                          <span className="text-xs text-zinc-500">{p.location?.split(',')[0]}</span>
                        </div>
                      </div>
                    </td>
                    {userLocation && (
                      <td className="px-6 py-4 text-blue-400 font-medium">{p.distance} km</td>
                    )}
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        p.isOnline 
                          ? "bg-green-500/10 text-green-400 border-green-500/20" 
                          : "bg-zinc-800/50 text-zinc-400 border-zinc-700"
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${p.isOnline ? 'bg-green-500' : 'bg-zinc-500'}`} />
                        {p.isOnline ? 'Online' : 'Offline'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-zinc-300 font-medium">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        {p.rating}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-300">${p.startingPrice}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors ml-auto">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filteredProducers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 border border-zinc-800 border-dashed rounded-2xl bg-[#0A0A0A]">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-zinc-500" strokeWidth={2} />
            </div>
            <h4 className="text-lg font-medium text-white mb-2">No Producers Found</h4>
            <p className="text-sm text-zinc-400">
              {searchQuery ? `Try adjusting "${searchQuery}"` : "Adjust your filters to see more results"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}