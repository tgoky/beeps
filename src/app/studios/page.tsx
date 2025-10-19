"use client";

import { useState, useEffect } from "react";
import { studioData } from "./studiosjson";
import { useRouter } from "next/navigation";
import { Search, MapPin, Star, Mic2, CheckCircle2 } from "lucide-react";
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

// Haversine formula to calculate distance between two coordinates (in miles)
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 3958.8; // Earth's radius in miles
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
  const [filteredStudios, setFilteredStudios] = useState<Studio[]>([]);
  const [radius, setRadius] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Get user's location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lon: longitude });
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

  // Filter studios based on radius, location, and search
  useEffect(() => {
    let filtered = studioData;

    // Filter by radius
    if (userLocation) {
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

    // Filter by location
    if (locationFilter !== "all") {
      filtered = filtered.filter((studio) =>
        studio.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter((studio) =>
        studio.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredStudios(filtered);
  }, [userLocation, radius, locationFilter, searchQuery]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-2xl font-semibold mb-1 ${
          theme === "dark" ? "text-gray-100" : "text-gray-900"
        }`}>
          Recording Studios
        </h1>
        <p className={`text-[13px] ${
          theme === "dark" ? "text-gray-500" : "text-gray-600"
        }`}>
          Book professional studios near you
        </p>
      </div>

      {/* Filters */}
      <div className={`
        flex flex-wrap gap-2 mb-6 p-4 rounded-lg border backdrop-blur-sm
        ${theme === "dark" 
          ? "bg-gray-950/40 border-gray-800/50" 
          : "bg-white/40 border-gray-200/60"
        }
      `}>
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${
            theme === "dark" ? "text-gray-500" : "text-gray-400"
          }`} />
          <input
            type="text"
            placeholder="Search studios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`
              w-full pl-9 pr-3 py-2 text-[13px] rounded-lg border transition-all duration-200
              ${theme === "dark"
                ? "bg-gray-900/40 border-gray-800/60 text-gray-200 placeholder-gray-600 focus:border-purple-500/50"
                : "bg-gray-50/50 border-gray-200/60 text-gray-900 placeholder-gray-400 focus:border-purple-300"
              }
              focus:outline-none focus:ring-2 ${theme === "dark" ? "focus:ring-purple-500/20" : "focus:ring-purple-200"}
            `}
          />
        </div>

        {/* Location Filter */}
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className={`
            px-3 py-2 text-[13px] rounded-lg border transition-all duration-200 cursor-pointer
            ${theme === "dark"
              ? "bg-gray-900/40 border-gray-800/60 text-gray-200"
              : "bg-gray-50/50 border-gray-200/60 text-gray-900"
            }
            focus:outline-none focus:ring-2 ${theme === "dark" ? "focus:ring-purple-500/20" : "focus:ring-purple-200"}
          `}
        >
          <option value="all">All Locations</option>
          <option value="los angeles">Los Angeles</option>
          <option value="new york">New York</option>
          <option value="nashville">Nashville</option>
        </select>

        {/* Radius Filter */}
        <select
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className={`
            px-3 py-2 text-[13px] rounded-lg border transition-all duration-200 cursor-pointer
            ${theme === "dark"
              ? "bg-gray-900/40 border-gray-800/60 text-gray-200"
              : "bg-gray-50/50 border-gray-200/60 text-gray-900"
            }
            focus:outline-none focus:ring-2 ${theme === "dark" ? "focus:ring-purple-500/20" : "focus:ring-purple-200"}
          `}
        >
          <option value={50}>50 miles</option>
          <option value={100}>100 miles</option>
          <option value={200}>200 miles</option>
          <option value={9999}>All distances</option>
        </select>

        {/* Location Button */}
        <button
          onClick={getUserLocation}
          disabled={isLoadingLocation}
          className={`
            flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg border transition-all duration-200
            ${theme === "dark"
              ? "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/20 disabled:opacity-50"
              : "bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-200/50 disabled:opacity-50"
            }
            active:scale-95 disabled:cursor-not-allowed
          `}
        >
          <MapPin className="w-3.5 h-3.5" />
          {isLoadingLocation ? "Loading..." : "Use My Location"}
        </button>
      </div>

      {/* Results Count */}
      <div className={`text-[13px] mb-4 ${
        theme === "dark" ? "text-gray-500" : "text-gray-600"
      }`}>
        {filteredStudios.length} {filteredStudios.length === 1 ? "studio" : "studios"} found
      </div>

      {/* Studios Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredStudios.map((studio) => (
          <div
            key={studio.id}
            className={`
              group rounded-lg border overflow-hidden transition-all duration-200 cursor-pointer
              ${theme === "dark"
                ? "bg-gray-900/40 border-gray-800/60 hover:border-gray-700/80 hover:bg-gray-900/60"
                : "bg-white/50 border-gray-200/60 hover:border-gray-300/80 hover:bg-white/80"
              }
              hover:shadow-lg active:scale-[0.98]
            `}
            onClick={() => router.push(`/studios/create/${studio.id}`)}
          >
            {/* Image */}
            <div className="relative h-44 overflow-hidden">
              <img
                alt={studio.name}
                src={studio.image}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className={`
                absolute top-2 right-2 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-sm
                ${theme === "dark"
                  ? "bg-gray-900/80 text-gray-200 border border-gray-700/50"
                  : "bg-white/80 text-gray-900 border border-gray-200/50"
                }
              `}>
                {studio.price}
              </div>
            </div>

            {/* Content */}
            <div className="p-3.5">
              {/* Title & Rating */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className={`text-[14px] font-semibold line-clamp-1 ${
                  theme === "dark" ? "text-gray-200" : "text-gray-900"
                }`}>
                  {studio.name}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  <span className={`text-[12px] font-medium ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}>
                    {studio.rating}
                  </span>
                </div>
              </div>

              {/* Location */}
              <div className={`flex items-center gap-1.5 mb-3 text-[12px] ${
                theme === "dark" ? "text-gray-500" : "text-gray-600"
              }`}>
                <MapPin className="w-3 h-3" />
                <span className="line-clamp-1">
                  {studio.location}
                  {userLocation && (
                    <span className="ml-1">
                      ({Math.round(
                        calculateDistance(
                          userLocation.lat,
                          userLocation.lon,
                          studio.lat,
                          studio.lon
                        )
                      )} mi)
                    </span>
                  )}
                </span>
              </div>

              {/* Equipment Tags */}
              <div className="mb-3">
                <div className={`flex items-center gap-1 mb-1.5 text-[11px] ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}>
                  <Mic2 className="w-3 h-3" />
                  <span>Featured Gear</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {studio.equipment.slice(0, 3).map((item, index) => (
                    <span
                      key={index}
                      className={`
                        px-2 py-0.5 text-[10px] font-medium rounded-md
                        ${theme === "dark"
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          : "bg-purple-50 text-purple-600 border border-purple-200/50"
                        }
                      `}
                    >
                      {item}
                    </span>
                  ))}
                  {studio.equipment.length > 3 && (
                    <span
                      className={`
                        px-2 py-0.5 text-[10px] font-medium rounded-md
                        ${theme === "dark"
                          ? "bg-gray-800/60 text-gray-400"
                          : "bg-gray-100 text-gray-600"
                        }
                      `}
                    >
                      +{studio.equipment.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Book Button */}
              <button
                className={`
                  w-full flex items-center justify-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200
                  ${theme === "dark"
                    ? "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20"
                    : "bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200/50"
                  }
                  group-hover:shadow-md active:scale-95
                `}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/studios/create/${studio.id}`);
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Book Studio
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredStudios.length === 0 && (
        <div className={`
          text-center py-12 rounded-lg border backdrop-blur-sm
          ${theme === "dark"
            ? "bg-gray-950/40 border-gray-800/50"
            : "bg-white/40 border-gray-200/60"
          }
        `}>
          <Mic2 className={`w-12 h-12 mx-auto mb-3 ${
            theme === "dark" ? "text-gray-700" : "text-gray-300"
          }`} />
          <p className={`text-[14px] font-medium mb-1 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>
            No studios found
          </p>
          <p className={`text-[12px] ${
            theme === "dark" ? "text-gray-600" : "text-gray-500"
          }`}>
            Try adjusting your filters or search radius
          </p>
        </div>
      )}
    </div>
  );
}