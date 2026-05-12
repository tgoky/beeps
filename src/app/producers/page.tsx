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
        className="flex items-center gap-2 px-3 py-2 text-sm font-light rounded-lg transition-colors border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
      >
        <ArrowUpDown className="w-3.5 h-3.5" />
        <span>Sort: <span className="font-medium text-white">{current}</span></span>
        <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 p-1 rounded-xl border border-zinc-800 bg-[#09090b] shadow-xl z-50">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onSelect(opt); setIsOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                current === opt 
                  ? "bg-zinc-800 text-white" 
                  : "text-zinc-400 hover:bg-zinc-800/50"
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
      className={`flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wide border rounded-lg transition-all duration-200 ${
        activeValue 
          ? "bg-blue-600 border-blue-600 text-white shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)]" 
          : "bg-[#18181b] border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
      }`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
      {activeValue && <span className="ml-1 bg-white/20 px-1.5 rounded text-[9px]">{activeValue}</span>}
      <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && (
      <div className="absolute top-full left-0 mt-2 w-48 p-1 rounded-xl border border-zinc-800 bg-[#09090b] shadow-2xl z-50">
        {options.map((opt: string) => (
          <button
            key={opt}
            onClick={() => onSelect(opt === activeValue ? null : opt)}
            className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg flex items-center justify-between ${
              opt === activeValue 
                ? "bg-zinc-800 text-white" 
                : "text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            {opt}
            {opt === activeValue && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
          </button>
        ))}
      </div>
    )}
  </div>
);

// 3. Pro Card
const ProCard = ({ producer, router, showDistance }: { producer: Producer; router: any; showDistance: boolean }) => (
  <div
    onClick={() => router.push(`/producers/${producer.id}`)}
    className="group relative flex flex-col p-3 rounded-2xl border border-zinc-800 hover:border-zinc-600 bg-[#121214] hover:bg-[#18181b] transition-all duration-300 cursor-pointer"
  >
    {/* Header */}
    <div className="flex items-center gap-3 mb-3">
      <div className="relative w-10 h-10">
        <img
          src={producer.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${producer.id}`}
          alt={producer.name}
          className="w-full h-full rounded-full object-cover ring-2 ring-transparent group-hover:ring-zinc-500 transition-all"
        />
        {producer.isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#121214] rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <h3 className="font-bold text-sm text-zinc-100 truncate">{producer.name}</h3>
          {producer.verified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
        </div>
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-zinc-500 truncate flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" /> {producer.location || "Global"}
          </p>
          {showDistance && (
            <span className="text-[9px] font-bold text-blue-500 bg-blue-500/10 px-1 rounded flex items-center gap-0.5">
              <Navigation className="w-2 h-2" /> {producer.distance}km
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 bg-yellow-500/10 px-1.5 py-0.5 rounded text-yellow-500">
        <Star className="w-3 h-3 fill-current" />
        <span className="text-xs font-bold">{producer.rating}</span>
      </div>
    </div>

    {/* Preview */}
    <div className="relative aspect-[2/1] bg-zinc-800 rounded-lg overflow-hidden mb-3 group/image">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity bg-black/40 backdrop-blur-[1px]">
        <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
          <Play className="w-4 h-4 text-black fill-black translate-x-0.5" />
        </button>
      </div>
      <div className="absolute bottom-2 left-2 flex gap-1">
        {producer.genres?.slice(0, 2).map((g: string) => (
          <span key={g} className="text-[9px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10">
            {g}
          </span>
        ))}
      </div>
    </div>

    {/* Data */}
    <div className="grid grid-cols-2 gap-px bg-zinc-800/20 rounded-lg overflow-hidden border border-zinc-800">
      <div className="p-2 flex flex-col items-center justify-center bg-[#151518]">
        <span className="text-[9px] uppercase text-zinc-500 font-bold mb-0.5">Starts At</span>
        <span className="text-xs font-bold text-white">${producer.startingPrice}</span>
      </div>
      <div className="p-2 flex flex-col items-center justify-center bg-[#151518]">
        <span className="text-[9px] uppercase text-zinc-500 font-bold mb-0.5">Response</span>
        <span className="text-xs font-bold text-white">{producer.responseTime}</span>
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
      <header className="sticky top-0 z-50 border-b bg-[#09090b]/80 border-zinc-800 backdrop-blur-xl">
        <div className="w-full px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">ProducerHub</span>
          </div>

          <div className="flex-1 max-w-xl relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text"
              placeholder="Search producers, sounds, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none border transition-all bg-zinc-900/50 border-zinc-800 focus:border-zinc-600 focus:bg-zinc-900 text-white"
            />
          </div>

          {/* Location Intelligence Unit */}
          <div className="flex items-center gap-3">
            <button 
              onClick={handleLocationToggle}
              className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-300 ${
                userLocation 
                  ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30" 
                  : "border-zinc-800 hover:bg-zinc-800 text-zinc-400"
              }`}
            >
              {isLocating ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Crosshair className={`w-4 h-4 ${userLocation ? 'animate-pulse' : ''}`} />
              )}
              <span className="text-xs font-bold hidden sm:block">
                {userLocation ? "Near Me" : "Locate"}
              </span>
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full border bg-zinc-900 border-zinc-800">
              <Globe className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs font-medium text-zinc-300">
                {userLocation || "Global"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* --- LEVEL 2: CONTROL DECK --- */}
      <div className="sticky top-16 z-40 border-b bg-[#09090b]/95 border-zinc-800">
        <div className="w-full px-6 py-3 flex flex-col gap-4">
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 pr-4 mr-2 border-r border-zinc-800/50">
                <Filter className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-bold uppercase text-zinc-500">Filters</span>
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
            <div className="flex items-center gap-3">
              <SortDropdown 
                current={sortBy} 
                onSelect={setSortBy} 
                locationActive={!!userLocation}
              />
              <div className="h-6 w-px bg-zinc-800" />
              <div className="flex p-1 rounded-lg border border-zinc-800 bg-zinc-900">
                <button 
                  onClick={() => setViewMode("grid")} 
                  className={`p-1.5 rounded ${
                    viewMode === 'grid' 
                      ? "bg-zinc-700 text-white" 
                      : "text-zinc-500"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode("list")} 
                  className={`p-1.5 rounded ${
                    viewMode === 'list' 
                      ? "bg-zinc-700 text-white" 
                      : "text-zinc-500"
                  }`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Chips */}
          {(filters.genre || filters.rating || filters.availability || userLocation) && (
            <div className="flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Active:</span>
              {userLocation && (
                <button 
                  onClick={handleLocationToggle}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border uppercase bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20"
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
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border uppercase transition-colors bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-red-500/50 hover:text-red-400"
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
      <main className="flex-1 p-6">
        <div className="flex items-baseline justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">
              {userLocation ? "Producers Nearby" : "Verified Producers"}
            </h2>
            {userLocation && (
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                LAGOS
              </span>
            )}
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            {filteredProducers.length} RECORDS
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-t-transparent border-white" />
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
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
          <div className="w-full rounded-xl border overflow-hidden border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase font-bold bg-zinc-900/50 text-zinc-500">
                <tr>
                  <th className="px-6 py-3">Producer</th>
                  {userLocation && <th className="px-6 py-3">Distance</th>}
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Rating</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredProducers.map(p => (
                  <tr 
                    key={p.id} 
                    onClick={() => router.push(`/producers/${p.id}`)}
                    className="group cursor-pointer transition-colors hover:bg-zinc-800/50"
                  >
                    <td className="px-6 py-3 font-bold">{p.name}</td>
                    {userLocation && (
                      <td className="px-6 py-3 font-mono text-blue-500 font-bold">{p.distance} km</td>
                    )}
                    <td className="px-6 py-3">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        p.isOnline 
                          ? "bg-green-500/10 text-green-500 border-green-500/20" 
                          : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${p.isOnline ? 'bg-green-500' : 'bg-zinc-500'}`} />
                        {p.isOnline ? 'Online' : 'Offline'}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-bold">★ {p.rating}</span>
                    </td>
                    <td className="px-6 py-3 font-mono text-zinc-500">${p.startingPrice}</td>
                    <td className="px-6 py-3 text-right">
                      <MoreHorizontal className="w-4 h-4 ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filteredProducers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 border border-zinc-800 border-dashed rounded-xl">
            <Search className="w-8 h-8 text-zinc-700 mb-3" strokeWidth={1.5} />
            <h4 className="text-sm font-bold text-zinc-400 mb-1">No Producers Found</h4>
            <p className="text-xs text-zinc-500">
              {searchQuery ? `Try adjusting "${searchQuery}"` : "Adjust your filters to see more results"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}