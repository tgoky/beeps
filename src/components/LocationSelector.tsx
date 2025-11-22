"use client";

import { useState, useEffect } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

interface LocationSelectorProps {
  onLocationChange: (location: LocationData) => void;
  initialLocation?: LocationData;
  showGeolocation?: boolean;
}

export interface LocationData {
  country: string;
  countryCode: string;
  state: string;
  stateCode: string;
  city: string;
  latitude?: number;
  longitude?: number;
  fullAddress?: string;
}

// West African countries with focus
const WEST_AFRICAN_COUNTRIES = [
  { name: "Nigeria", code: "NG" },
  { name: "Ghana", code: "GH" },
  { name: "Senegal", code: "SN" },
  { name: "Côte d'Ivoire", code: "CI" },
  { name: "Mali", code: "ML" },
  { name: "Burkina Faso", code: "BF" },
  { name: "Guinea", code: "GN" },
  { name: "Benin", code: "BJ" },
  { name: "Togo", code: "TG" },
  { name: "Sierra Leone", code: "SL" },
  { name: "Liberia", code: "LR" },
  { name: "Mauritania", code: "MR" },
  { name: "Niger", code: "NE" },
  { name: "Gambia", code: "GM" },
  { name: "Guinea-Bissau", code: "GW" },
  { name: "Cape Verde", code: "CV" },
];

// Other African countries
const OTHER_AFRICAN_COUNTRIES = [
  { name: "South Africa", code: "ZA" },
  { name: "Kenya", code: "KE" },
  { name: "Egypt", code: "EG" },
  { name: "Morocco", code: "MA" },
  { name: "Ethiopia", code: "ET" },
  { name: "Tanzania", code: "TZ" },
  { name: "Uganda", code: "UG" },
  { name: "Algeria", code: "DZ" },
  { name: "Sudan", code: "SD" },
  { name: "Angola", code: "AO" },
  { name: "Mozambique", code: "MZ" },
  { name: "Madagascar", code: "MG" },
  { name: "Cameroon", code: "CM" },
  { name: "Zimbabwe", code: "ZW" },
  { name: "Tunisia", code: "TN" },
  { name: "Rwanda", code: "RW" },
];

// Global countries (popular music hubs)
const GLOBAL_COUNTRIES = [
  { name: "United States", code: "US" },
  { name: "United Kingdom", code: "GB" },
  { name: "Canada", code: "CA" },
  { name: "France", code: "FR" },
  { name: "Germany", code: "DE" },
  { name: "Jamaica", code: "JM" },
  { name: "Brazil", code: "BR" },
  { name: "Australia", code: "AU" },
];

export function LocationSelector({
  onLocationChange,
  initialLocation,
  showGeolocation = true
}: LocationSelectorProps) {
  const { theme } = useTheme();

  const [selectedCountry, setSelectedCountry] = useState(initialLocation?.countryCode || "");
  const [selectedState, setSelectedState] = useState(initialLocation?.stateCode || "");
  const [selectedCity, setSelectedCity] = useState(initialLocation?.city || "");

  const [states, setStates] = useState<Array<{ name: string; code: string }>>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [isLoadingGeo, setIsLoadingGeo] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Combine all countries with West Africa first
  const allCountries = [
    { label: "West Africa", options: WEST_AFRICAN_COUNTRIES },
    { label: "Other African Countries", options: OTHER_AFRICAN_COUNTRIES },
    { label: "Global", options: GLOBAL_COUNTRIES },
  ];

  // Fetch states when country changes
  useEffect(() => {
    if (selectedCountry) {
      fetchStates(selectedCountry);
    } else {
      setStates([]);
      setCities([]);
      setSelectedState("");
      setSelectedCity("");
    }
  }, [selectedCountry]);

  // Fetch cities when state changes
  useEffect(() => {
    if (selectedState && selectedCountry) {
      fetchCities(selectedCountry, selectedState);
    } else {
      setCities([]);
      setSelectedCity("");
    }
  }, [selectedState]);

  // Update parent when location changes
  useEffect(() => {
    if (selectedCountry && selectedCity) {
      const countryObj = [...WEST_AFRICAN_COUNTRIES, ...OTHER_AFRICAN_COUNTRIES, ...GLOBAL_COUNTRIES]
        .find(c => c.code === selectedCountry);

      const stateObj = states.find(s => s.code === selectedState);

      onLocationChange({
        country: countryObj?.name || "",
        countryCode: selectedCountry,
        state: stateObj?.name || "",
        stateCode: selectedState,
        city: selectedCity,
        fullAddress: `${selectedCity}${stateObj?.name ? ', ' + stateObj.name : ''}, ${countryObj?.name}`,
      });
    }
  }, [selectedCountry, selectedState, selectedCity]);

  const fetchStates = async (countryCode: string) => {
    try {
      const response = await fetch(`/api/locations/states?country=${countryCode}`);
      const data = await response.json();
      setStates(data.states || []);
    } catch (error) {
      console.error("Error fetching states:", error);
      setStates([]);
    }
  };

  const fetchCities = async (countryCode: string, stateCode: string) => {
    try {
      const response = await fetch(`/api/locations/cities?country=${countryCode}&state=${stateCode}`);
      const data = await response.json();
      setCities(data.cities || []);
    } catch (error) {
      console.error("Error fetching cities:", error);
      setCities([]);
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser");
      return;
    }

    setIsLoadingGeo(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Reverse geocode to get location details
          const response = await fetch(
            `/api/locations/reverse-geocode?lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();

          if (data.success) {
            setSelectedCountry(data.countryCode);
            setSelectedState(data.stateCode);
            setSelectedCity(data.city);

            onLocationChange({
              ...data,
              latitude,
              longitude,
            });
          } else {
            setGeoError("Could not determine location details");
          }
        } catch (error) {
          setGeoError("Failed to reverse geocode location");
        } finally {
          setIsLoadingGeo(false);
        }
      },
      (error) => {
        setIsLoadingGeo(false);
        setGeoError(error.message || "Unable to retrieve location");
      }
    );
  };

  return (
    <div className="space-y-6">
      {showGeolocation && (
        <div>
          <button
            type="button"
            onClick={handleGeolocation}
            disabled={isLoadingGeo}
            className={`
              w-full flex items-center justify-center gap-2.5 px-6 py-4 text-sm font-light
              rounded-lg border transition-all duration-200 tracking-wide
              ${isLoadingGeo ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}
              ${theme === "dark"
                ? "bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-black hover:border-zinc-700 hover:text-white"
                : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900"
              }
            `}
          >
            {isLoadingGeo ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                <span>Detecting Location...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" strokeWidth={2} />
                <span>Use My Current Location</span>
              </>
            )}
          </button>
          {geoError && (
            <p className={`text-xs font-light mt-2 tracking-wide ${
              theme === "dark" ? "text-red-400" : "text-red-600"
            }`}>
              {geoError}
            </p>
          )}
        </div>
      )}

      <div className="relative">
        <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${
          theme === "dark" ? "text-zinc-500" : "text-gray-500"
        }`}>
          <MapPin className="w-4 h-4" strokeWidth={2} />
        </div>

        <div className={`text-xs font-light tracking-wider uppercase mb-2 pl-9 ${
          theme === "dark" ? "text-zinc-400" : "text-gray-600"
        }`}>
          Or select manually
        </div>
      </div>

      {/* Country Selector */}
      <div className="space-y-3">
        <label className={`block text-xs font-medium tracking-wider uppercase ${
          theme === "dark" ? "text-zinc-400" : "text-gray-600"
        }`}>
          Country *
        </label>
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          required
          className={`
            w-full px-4 py-3.5 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide focus:outline-none
            ${theme === "dark"
              ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus:border-white focus:bg-black"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900"
            }
          `}
        >
          <option value="">Select a country</option>
          {allCountries.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* State Selector */}
      {selectedCountry && states.length > 0 && (
        <div className="space-y-3">
          <label className={`block text-xs font-medium tracking-wider uppercase ${
            theme === "dark" ? "text-zinc-400" : "text-gray-600"
          }`}>
            State/Region *
          </label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            required
            className={`
              w-full px-4 py-3.5 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide focus:outline-none
              ${theme === "dark"
                ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus:border-white focus:bg-black"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900"
              }
            `}
          >
            <option value="">Select a state/region</option>
            {states.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* City Selector */}
      {selectedState && cities.length > 0 && (
        <div className="space-y-3">
          <label className={`block text-xs font-medium tracking-wider uppercase ${
            theme === "dark" ? "text-zinc-400" : "text-gray-600"
          }`}>
            City *
          </label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            required
            className={`
              w-full px-4 py-3.5 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide focus:outline-none
              ${theme === "dark"
                ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus:border-white focus:bg-black"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900"
              }
            `}
          >
            <option value="">Select a city</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Manual City Input (fallback if no cities in dropdown) */}
      {selectedState && cities.length === 0 && (
        <div className="space-y-3">
          <label className={`block text-xs font-medium tracking-wider uppercase ${
            theme === "dark" ? "text-zinc-400" : "text-gray-600"
          }`}>
            City *
          </label>
          <input
            type="text"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            placeholder="Enter city name"
            required
            className={`
              w-full px-4 py-3.5 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide focus:outline-none
              ${theme === "dark"
                ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus:border-white focus:bg-black"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900"
              }
            `}
          />
        </div>
      )}
    </div>
  );
}