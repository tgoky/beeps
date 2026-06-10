"use client";

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  memo,
} from "react";
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
import { formatAmount } from "@/lib/currency";

// ─── Types ────────────────────────────────────────────────────────────────────

type Studio = {
  id: string;
  name: string;
  location: string;
  streetAddress: string | null;
  hourlyRate: number;
  currency?: string;
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

type SortOrder = "price_asc" | "rating_desc" | "nearest" | null;

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_STUDIOS: Studio[] = [];

const FILTER_OPTIONS = [
  { label: "Budget", min: 0, max: 25, text: "Under $25/hr" },
  { label: "Standard", min: 25, max: 50, text: "$25 - $50/hr" },
  { label: "Premium", min: 50, max: 100, text: "$50 - $100/hr" },
  { label: "Pro", min: 100, max: 9999, text: "$100+/hr" },
];

// ─── Pure utils ───────────────────────────────────────────────────────────────

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
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
};

const getPosition = (lat: number, lon: number, studioId: string) => {
  const hash = hashString(studioId);
  const jitterX = (hash % 10) - 5;
  const jitterY = ((hash >> 2) % 10) - 5;
  const x = 20 + (Math.abs(lon * 100) % 60) + jitterX;
  const y = 20 + (Math.abs(lat * 100) % 60) + jitterY;
  return { x, y };
};

// ─── MapMarker ────────────────────────────────────────────────────────────────

const MapMarker = memo(
  ({
    studio,
    isSelected,
    onSelect,
    hoverBusRef,
  }: {
    studio: Studio;
    isSelected: boolean;
    onSelect: (s: Studio | null) => void;
    hoverBusRef: React.MutableRefObject<string | null>;
  }) => {
    const [localState, setLocalState] = useState<"idle" | "hovered" | "dimmed">("idle");

    useEffect(() => {
      const handler = () => {
        const hov = hoverBusRef.current;
        if (hov === studio.id) setLocalState("hovered");
        else if (hov !== null) setLocalState("dimmed");
        else setLocalState("idle");
      };
      window.addEventListener("beeps:hoverchange", handler);
      return () => window.removeEventListener("beeps:hoverchange", handler);
    }, [studio.id, hoverBusRef]);

    const pos =
      studio.latitude && studio.longitude
        ? getPosition(studio.latitude, studio.longitude, studio.id)
        : { x: 50, y: 50 };

    const isHovered = localState === "hovered";
    const isDimmed = localState === "dimmed" && !isSelected;

    return (
      <div
        className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-[opacity,filter,transform] duration-200 will-change-transform pointer-events-auto ${
          isDimmed ? "opacity-30 blur-[2px] scale-95" : "opacity-100 scale-100"
        }`}
        style={{
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          zIndex: isSelected || isHovered ? 50 : 10,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(studio);
        }}
        onPointerEnter={() => {
          hoverBusRef.current = studio.id;
          window.dispatchEvent(new Event("beeps:hoverchange"));
        }}
        onPointerLeave={() => {
          hoverBusRef.current = null;
          window.dispatchEvent(new Event("beeps:hoverchange"));
        }}
      >
        <div
          className={`relative flex flex-col items-center justify-center transition-transform duration-150 ${
            isSelected || isHovered ? "scale-110" : "scale-100"
          }`}
        >
          {(isSelected || isHovered) && (
            <div className="absolute bottom-[140%] mb-1 px-3 py-1.5 text-xs font-medium whitespace-nowrap bg-zinc-900 text-white rounded-lg shadow-xl border border-zinc-800 pointer-events-none">
              {studio.name}
              <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 rotate-45 border-r border-b bg-zinc-900 border-zinc-800" />
            </div>
          )}

          <div
            className={`min-w-[40px] h-8 px-2.5 flex items-center justify-center rounded-full border relative z-10 shadow-lg transition-colors whitespace-nowrap ${
              isSelected
                ? "bg-white border-white text-black"
                : "bg-zinc-900 border-zinc-700 text-white"
            }`}
          >
            {isSelected ? (
              <Mic2 size={14} strokeWidth={2} />
            ) : (
              <div className="flex items-baseline gap-0.5">
                <span className="text-xs font-bold leading-none">
                  {formatAmount(studio.hourlyRate, studio.currency || "USD")}
                </span>
                <span className="text-[9px] font-medium opacity-60 leading-none tracking-wide">
                  /hr
                </span>
              </div>
            )}
          </div>

          <div className="px-2 py-0.5 rounded-md mt-1 bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 text-zinc-300 shadow-md">
            <span className="text-[10px] font-medium leading-none whitespace-nowrap block truncate max-w-[80px]">
              {studio.location.split(",")[0]}
            </span>
          </div>
        </div>
      </div>
    );
  }
);
MapMarker.displayName = "MapMarker";

// ─── Static Map Background ─────────────────────────────────────────────────────
// FIX: Wrapped in its own isolated layer with contain:strict so it never
// participates in the sheet's compositing layer — massive GPU saving.

const MapBackground = memo(() => (
  // contain:strict tells the browser "nothing inside affects layout outside"
  // This prevents the SVG lines from triggering repaints during sheet drags.
  <div style={{ contain: "strict", position: "absolute", inset: 0, zIndex: 0 }}>
    <div
      className="absolute inset-[-200%] w-[500%] h-[500%] opacity-[0.02] pointer-events-none mix-blend-screen"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' fill='%23ffffff'/%3E%3C/svg%3E")`,
      }}
    />
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-80"
      viewBox="0 0 100 100"
      overflow="visible"
    >
      <rect x="-500" y="-500" width="1100" height="1100" fill="#111215" />
      <path d="M -500 -500 L -20 -500 Q -50 50 -10 500 L -500 500 Z" fill="#0d0e11" />
      <path d="M 120 -500 L 600 -500 L 600 600 L 140 600 Q 100 100 120 -500 Z" fill="#0d0e11" />
      <path d="M 140 -200 L 600 -200 L 600 600 Q 130 100 140 -200 Z" fill="#17181c" />
      <path d="M -500 -500 L 600 -500 L 600 -30 Q 100 -80 -500 -30 Z" fill="#14151a" />
      <path d="M 15 0 L 100 0 L 100 100 L 30 100 C 30 100 25 80 40 70 C 55 60 50 40 30 35 C 10 30 5 15 15 0 Z" fill="#121317" />
      <path d="M 60 0 L 100 0 L 100 40 Q 80 50 60 30 Q 50 15 60 0 Z" fill="#18191e" />
      <path d="M 60 55 L 75 55 L 75 65 L 60 65 Z" fill="#1c1d22" />
      <path d="M 70 80 L 100 80 L 100 100 L 70 100 Z" fill="#15161a" />
    </svg>
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      viewBox="0 0 100 100"
      overflow="visible"
    >
      <g stroke="#1f1f24" strokeWidth="0.4" opacity="0.6">
        {[-400, -300, -200, -100, -80, -60, -40, -20, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 300, 400, 500].map((y) => (
          <line key={`h-${y}`} x1="-500" y1={y} x2="600" y2={y} />
        ))}
        {[-400, -300, -200, -100, -80, -60, -40, -20, 0, 15, 25, 35, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 120, 140, 160, 180, 200, 300, 400, 500].map((x) => (
          <line key={`v-${x}`} x1={x} y1="-500" x2={x} y2="600" />
        ))}
      </g>
      <path d="M -500 45 L 600 45 M 40 -500 L 40 600" stroke="#2e2e36" strokeWidth="1.2" strokeDasharray="5,5" opacity="0.6" />
      <g fill="none">
        <path d="M -500 -280 L -50 0 Q 30 50 80 60 L 250 65 L 600 80" stroke="#0a0a0c" strokeWidth="4" strokeLinecap="round" />
        <path d="M -500 -280 L -50 0 Q 30 50 80 60 L 250 65 L 600 80" stroke="#3f3f46" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M 60 600 L 60 40 Q 60 20 150 -50 L 500 -322" stroke="#0a0a0c" strokeWidth="4" strokeLinecap="round" />
        <path d="M 60 600 L 60 40 Q 60 20 150 -50 L 500 -322" stroke="#3f3f46" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
    <div className="absolute inset-0 pointer-events-none opacity-60 z-10">
      {[
        { l: 42, t: 47, w: 4, h: 4 }, { l: 47, t: 47, w: 4, h: 6 },
        { l: 42, t: 53, w: 9, h: 4 }, { l: 55, t: 48, w: 8, h: 8 },
        { l: 65, t: 25, w: 5, h: 5 }, { l: 82, t: 75, w: 6, h: 10 },
        { l: 35, t: 20, w: 4, h: 4 }, { l: 90, t: 15, w: 5, h: 5 },
      ].map((b, i) => (
        <div
          key={i}
          className="absolute bg-[#18181b] border border-[#27272a] rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
          style={{ left: `${b.l}%`, top: `${b.t}%`, width: `${b.w}%`, height: `${b.h}%` }}
        />
      ))}
    </div>
  </div>
));
MapBackground.displayName = "MapBackground";

// ─── InteractiveMap ───────────────────────────────────────────────────────────

type InteractiveMapProps = {
  filteredStudios: Studio[];
  selectedStudio: Studio | null;
  setSelectedStudio: (studio: Studio | null) => void;
  hoverBusRef: React.MutableRefObject<string | null>;
  userLocation: { lat: number; lon: number } | null;
  isLoadingLocation: boolean;
  getUserLocation: () => void;
  permissions: { canCreateStudios?: boolean } | null | undefined;
  mapWrapperRef: React.RefObject<HTMLDivElement>;
};

const InteractiveMap = memo(
  ({
    filteredStudios,
    selectedStudio,
    setSelectedStudio,
    hoverBusRef,
    userLocation,
    isLoadingLocation,
    getUserLocation,
    permissions,
    mapWrapperRef,
  }: InteractiveMapProps) => {
    const router = useRouter();
    const [mapZoom, setMapZoom] = useState(1.2);
    const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
    const [isMapDragging, setIsMapDragging] = useState(false);
    const [tiltMode, setTiltMode] = useState(false);
    const mapDragStart = useRef({ x: 0, y: 0 });
    const contentRef = useRef<HTMLDivElement>(null);

    const applyTransform = useCallback(() => {
      if (!contentRef.current) return;
      const { x, y } = mapOffset;
      const tilt = tiltMode ? " perspective(1200px) rotateX(45deg)" : "";
      contentRef.current.style.transform = `scale(${mapZoom}) translate(${x / mapZoom}px, ${y / mapZoom}px)${tilt}`;
    }, [mapZoom, mapOffset, tiltMode]);

    useEffect(() => {
      applyTransform();
    }, [applyTransform]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
      setIsMapDragging(true);
      mapDragStart.current = { x: e.clientX - mapOffset.x, y: e.clientY - mapOffset.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      if (contentRef.current) contentRef.current.style.transition = "none";
    }, [mapOffset]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
      if (!isMapDragging) return;
      e.preventDefault();
      setMapOffset({ x: e.clientX - mapDragStart.current.x, y: e.clientY - mapDragStart.current.y });
    }, [isMapDragging]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
      setIsMapDragging(false);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      if (contentRef.current)
        contentRef.current.style.transition = "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)";
    }, []);

    const handleWheel = useCallback((e: React.WheelEvent) => {
      e.stopPropagation();
      setMapZoom((z) => Math.min(Math.max(z - e.deltaY * 0.001, 0.4), 4));
    }, []);

    const zoom = useCallback((delta: number) => {
      setMapZoom((z) => Math.min(Math.max(z + delta, 0.4), 4));
    }, []);

    const handleSelect = useCallback((studio: Studio | null) => {
      setSelectedStudio(studio);
    }, [setSelectedStudio]);

    return (
      <div
        ref={mapWrapperRef}
        className="absolute inset-0"
        style={{
          paddingBottom: "42vh",
          transition: "padding 500ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <div
          className="relative w-full h-full overflow-hidden select-none bg-[#0a0a0c]"
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ cursor: "grab", touchAction: "none" }}
        >
          <div
            ref={contentRef}
            className="absolute inset-0 w-full h-full"
            style={{
              // FIX: removed will-change here — it was permanently promoting every
              // child to its own GPU layer. Only set during active animation.
              transformStyle: "preserve-3d",
              transformOrigin: "center 70%",
              transform: `scale(1.2)`,
              transition: "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          >
            <MapBackground />

            {/* Fog layer */}
            <div className="absolute inset-0 pointer-events-none z-[15]">
              <div
                className="absolute inset-[-100%] w-[300%] h-[300%] mix-blend-screen opacity-[0.06]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='fog'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.012' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23fog)' fill='%23ffffff'/%3E%3C/svg%3E")`,
                  animation: "fog-roll 60s linear infinite",
                }}
              />
            </div>

            {/* Markers */}
            <div className="absolute inset-0 pointer-events-none z-30">
              {filteredStudios.map((studio) => (
                <MapMarker
                  key={studio.id}
                  studio={studio}
                  isSelected={selectedStudio?.id === studio.id}
                  onSelect={handleSelect}
                  hoverBusRef={hoverBusRef}
                />
              ))}

              {userLocation && (
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ left: "35%", top: "40%" }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-full animate-pulse" />
                    <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vignette */}
          <div className="absolute inset-0 pointer-events-none z-[25] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(5,5,5,0.75)_120%)]" />
          </div>

          {/* Controls */}
          <div className="absolute top-4 right-4 z-30 flex flex-col gap-2 pointer-events-auto">
            <button
              onClick={() => setTiltMode((t) => !t)}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors shadow-lg"
            >
              {tiltMode ? "3D" : "2D"}
            </button>
          </div>

          <div className="absolute bottom-4 right-4 flex flex-col z-30 shadow-lg rounded-lg overflow-hidden border border-zinc-800 pointer-events-auto">
            <button
              onClick={() => zoom(0.5)}
              className="w-10 h-10 flex items-center justify-center bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors border-b border-zinc-800"
            >
              <Plus size={18} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => zoom(-0.5)}
              className="w-10 h-10 flex items-center justify-center bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <Minimize2 size={18} strokeWidth={1.5} />
            </button>
          </div>

          <div className="absolute top-4 left-4 z-30 flex flex-col gap-3 pointer-events-auto">
            <button
              onClick={getUserLocation}
              disabled={isLoadingLocation}
              className={`w-10 h-10 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors shadow-lg ${
                isLoadingLocation ? "opacity-50" : ""
              }`}
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

          {/* Selected studio floating card */}
          {selectedStudio && (
            <div className="absolute top-4 left-16 z-40 w-64 animate-in slide-in-from-left-4 duration-300 pointer-events-auto">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-sm font-medium text-white flex items-center gap-1.5 line-clamp-1">
                      {selectedStudio.name}
                      {selectedStudio.verificationStatus === "VERIFIED" && (
                        <BadgeCheck size={14} className="text-blue-400 shrink-0" />
                      )}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudio(null);
                      }}
                      className="text-zinc-500 hover:text-white transition-colors ml-2"
                    >
                      <X size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5 text-yellow-500">
                      <Star size={12} className="fill-current" />
                      <span className="text-sm font-medium">
                        {selectedStudio.rating
                          ? Number(selectedStudio.rating).toFixed(1)
                          : "New"}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {formatAmount(
                        selectedStudio.hourlyRate,
                        selectedStudio.currency || "USD"
                      )}
                      <span className="text-xs font-normal text-zinc-500">
                        /hr
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/studios/${selectedStudio.id}`);
                    }}
                    className="w-full py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
                  >
                    View Studio
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <style>{`
          @keyframes fog-roll {
            0% { transform: translate(0, 0); }
            100% { transform: translate(-10%, -10%); }
          }
        `}</style>
      </div>
    );
  }
);
InteractiveMap.displayName = "InteractiveMap";

// ─── StudioCard ───────────────────────────────────────────────────────────────

const StudioCard = memo(
  ({
    studio,
    distance,
    onHover,
  }: {
    studio: Studio;
    distance: number | null;
    onHover: (id: string | null) => void;
  }) => {
    const router = useRouter();
    return (
      <div
        className="group flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 hover:bg-zinc-800 transition-all duration-200 cursor-pointer overflow-hidden"
        onClick={() => router.push(`/studios/${studio.id}`)}
        onMouseEnter={() => onHover(studio.id)}
        onMouseLeave={() => onHover(null)}
      >
        <div className="relative w-full h-32 overflow-hidden bg-zinc-950">
          <img
            src={
              studio.imageUrl ||
              "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&q=80"
            }
            alt={studio.name}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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

        <div className="p-2 flex flex-col justify-between flex-grow">
          <div className="flex flex-col gap-0.5">
            <h4 className="text-xs font-medium text-white truncate">
              {studio.name}
            </h4>
            <p className="text-[10px] font-light text-zinc-400 truncate">
              {studio.location.split(",")[0]}
            </p>
          </div>

          <div className="mt-2 pt-1.5 border-t border-zinc-800/50 flex items-end justify-between gap-2">
            <div className="flex items-baseline gap-0.5 text-xs font-semibold text-white shrink-0">
              {formatAmount(studio.hourlyRate, studio.currency || "USD")}
              <span className="text-[9px] font-normal text-zinc-500 tracking-wide">
                /hr
              </span>
            </div>
            {distance !== null && (
              <span className="text-[9px] font-light text-zinc-500 shrink-0 mb-px">
                {distance < 10 ? distance.toFixed(1) : Math.round(distance)} mi
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
);
StudioCard.displayName = "StudioCard";

// ─── StudioList (main page) ───────────────────────────────────────────────────

export default function StudioList() {
  const { permissions } = usePermissions();

  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [selectedFilterIndex, setSelectedFilterIndex] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCountry, setFilterCountry] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Not logged in");
      })
      .then((resData) => {
        const user = resData?.data;
        if (!user) return;

        const loc = (user.location || "").toLowerCase();
        const code = user.countryCode || "";
        const curr = user.currency || "";

        if (code === "GH" || curr === "GHS" || loc.includes("ghana") || loc.includes("accra")) {
          return setFilterCountry("Ghana");
        }
        if (code === "NG" || curr === "NGN" || loc.includes("nigeria") || loc.includes("lagos") || loc.includes("abuja") || loc.includes("umuahia")) {
          return setFilterCountry("Nigeria");
        }
        if (code === "GB" || curr === "GBP" || loc.includes("uk") || loc.includes("united kingdom") || loc.includes("london")) {
          return setFilterCountry("United Kingdom");
        }
        if (code === "US" || loc.includes("usa") || loc.includes("united states") || loc.includes("new york") || loc.includes("los angeles")) {
          return setFilterCountry("United States");
        }
        setFilterCountry("");
      })
      .catch((err) => console.log("Public session fallback:", err.message))
      .finally(() => setIsAuthLoading(false));
  }, []);

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
    maxRate: selectedFilterIndex !== null && FILTER_OPTIONS[selectedFilterIndex].max < 9999 ? FILTER_OPTIONS[selectedFilterIndex].max : undefined,
    latitude: sortOrder === "nearest" && userLocation ? userLocation.lat : undefined,
    longitude: sortOrder === "nearest" && userLocation ? userLocation.lon : undefined,
    radius: sortOrder === "nearest" && userLocation ? 50 : undefined,
    enabled: !isAuthLoading,
  });

  const studios = useMemo(() => studiosData?.studios ?? EMPTY_STUDIOS, [studiosData?.studios]);

  // ── Sheet drag — NATIVE OPTIMISED ───────────────────────────────────────────
  const [sheetState, setSheetState] = useState<"full" | "half" | "min">("half");

  const sheetRef = useRef<HTMLDivElement>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const sheetStateRef = useRef<"full" | "half" | "min">("half");

  // FIX: Cache snap heights in a ref so we NEVER read the DOM during drag.
  // Heights are calculated once on mount and on window resize.
  const snapHeightsRef = useRef({ full: 0, half: 0, min: 0 });

  const recalcSnaps = useCallback(() => {
    const parentHeight =
      sheetRef.current?.parentElement?.clientHeight ?? window.innerHeight;
    snapHeightsRef.current = {
      full: 0,
      half: parentHeight * 0.32,
      min: parentHeight * 0.75,
    };
  }, []);

  useEffect(() => {
    recalcSnaps();
    window.addEventListener("resize", recalcSnaps);
    return () => window.removeEventListener("resize", recalcSnaps);
  }, [recalcSnaps]);

  const handleSheetPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();

      const sheet = sheetRef.current;
      const mapWrap = mapWrapperRef.current;
      if (!sheet) return;

      // Use the pre-cached snap heights — zero DOM reads during drag
      const snaps = snapHeightsRef.current;
      const startY = e.clientY;
      const startOffset = snaps[sheetStateRef.current];

      // FIX: Only promote to GPU layer right before drag starts
      sheet.style.willChange = "transform";
      sheet.style.transition = "none";

      let rafId: number;

      const handleMove = (moveEvent: PointerEvent) => {
        moveEvent.preventDefault();

        const dy = moveEvent.clientY - startY;
        let newY = startOffset + dy;
        newY = Math.max(0, Math.min(newY, snaps.min));

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          if (sheet) sheet.style.transform = `translate3d(0, ${newY}px, 0)`;
        });
      };

      const handleUp = (upEvent: PointerEvent) => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        window.removeEventListener("pointercancel", handleUp);
        if (rafId) cancelAnimationFrame(rafId);

        const dy = upEvent.clientY - startY;
        const finalY = startOffset + dy;

        let targetState = sheetStateRef.current;
        if (dy < -40) {
          targetState = targetState === "min" ? "half" : "full";
        } else if (dy > 40) {
          targetState = targetState === "full" ? "half" : "min";
        } else {
          const distances = [
            { state: "full" as const, dist: Math.abs(finalY - snaps.full) },
            { state: "half" as const, dist: Math.abs(finalY - snaps.half) },
            { state: "min" as const, dist: Math.abs(finalY - snaps.min) },
          ];
          targetState = distances.sort((a, b) => a.dist - b.dist)[0].state;
        }

        sheetStateRef.current = targetState;
        setSheetState(targetState);

        sheet.style.transition =
          "transform 500ms cubic-bezier(0.32, 0.72, 0, 1)";
        sheet.style.transform = `translate3d(0, ${snaps[targetState]}px, 0)`;

        if (mapWrap) {
          mapWrap.style.transition =
            "padding 500ms cubic-bezier(0.32, 0.72, 0, 1)";
          mapWrap.style.paddingBottom =
            targetState === "full"
              ? "75vh"
              : targetState === "half"
              ? "42vh"
              : "15vh";
        }

        // FIX: Release GPU layer once animation completes
        setTimeout(() => {
          if (sheetRef.current) sheetRef.current.style.willChange = "auto";
        }, 520);
      };

      window.addEventListener("pointermove", handleMove, { passive: false });
      window.addEventListener("pointerup", handleUp);
      window.addEventListener("pointercancel", handleUp);
    },
    [] // No dependencies — reads from refs only
  );

  // ── Hover bus ────────────────────────────────────────────────────────────────
  const hoverBusRef = useRef<string | null>(null);
  const handleStudioHover = useCallback((id: string | null) => {
    hoverBusRef.current = id;
    window.dispatchEvent(new Event("beeps:hoverchange"));
  }, []);

  const [selectedStudio, setSelectedStudio] = useState<Studio | null>(null);

  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setIsLoadingLocation(false);
      },
      () => setIsLoadingLocation(false)
    );
  }, []);

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
          loc
            .split(",")
            .map((p) => p.trim())
            .forEach((p) => {
              if (p.toLowerCase().includes(q)) suggestions.add(p);
            });
        }
      });
      setSearchSuggestions(Array.from(suggestions).slice(0, 5));
    },
    [studios]
  );

  const availableCountries = useMemo(() => {
    const countries = new Set<string>(["Nigeria", "Ghana", "United States", "United Kingdom"]);
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
    if (sortOrder === "price_asc")
      data.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
    else if (sortOrder === "rating_desc")
      data.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sortOrder === "nearest" && userLocation) {
      data.sort((a, b) => {
        const dA =
          a.latitude && a.longitude
            ? calculateDistance(userLocation.lat, userLocation.lon, a.latitude, a.longitude)
            : Infinity;
        const dB =
          b.latitude && b.longitude
            ? calculateDistance(userLocation.lat, userLocation.lon, b.latitude, b.longitude)
            : Infinity;
        return dA - dB;
      });
    }
    return data;
  }, [studios, sortOrder, userLocation]);

  // Helper to snap the sheet programmatically (used by toggle button)
  const snapSheetTo = useCallback(
    (targetState: "full" | "half" | "min") => {
      sheetStateRef.current = targetState;
      setSheetState(targetState);
      const snaps = snapHeightsRef.current;
      if (sheetRef.current) {
        sheetRef.current.style.transition =
          "transform 500ms cubic-bezier(0.32, 0.72, 0, 1)";
        sheetRef.current.style.transform = `translate3d(0, ${snaps[targetState]}px, 0)`;
      }
      if (mapWrapperRef.current) {
        mapWrapperRef.current.style.transition =
          "padding 500ms cubic-bezier(0.32, 0.72, 0, 1)";
        mapWrapperRef.current.style.paddingBottom =
          targetState === "full" ? "75vh" : targetState === "half" ? "42vh" : "15vh";
      }
    },
    []
  );

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#030303] selection:bg-white selection:text-black">
      <InteractiveMap
        filteredStudios={filteredStudios}
        selectedStudio={selectedStudio}
        setSelectedStudio={setSelectedStudio}
        hoverBusRef={hoverBusRef}
        userLocation={userLocation}
        isLoadingLocation={isLoadingLocation}
        getUserLocation={getUserLocation}
        permissions={permissions}
        mapWrapperRef={mapWrapperRef}
      />

      {(isLoadingStudios || isAuthLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 pointer-events-none">
          <div className="animate-spin h-8 w-8 border-2 border-t-transparent border-white rounded-full" />
        </div>
      )}

      {/* Bottom sheet */}
      {/* FIX: removed willChange from JSX — it was always-on.
           We only set it imperatively in the drag handler, then unset it after. */}
      <div
        ref={sheetRef}
        className="absolute left-0 right-0 bottom-0 z-40 flex flex-col bg-[#030303] border-t border-zinc-800 rounded-t-3xl shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.5)]"
        style={{
          height: "90vh",
          transform: `translate3d(0, 32vh, 0)`,
          transition: "transform 500ms cubic-bezier(0.32, 0.72, 0, 1)",
          // willChange is intentionally NOT set here — only applied during drag
        }}
      >
        {/* Drag handle */}
        <div
          className="w-full cursor-grab active:cursor-grabbing touch-none flex flex-col items-center pt-3 pb-3 shrink-0"
          onPointerDown={handleSheetPointerDown}
        >
          <button
            onClick={() => {
              const next =
                sheetState === "full"
                  ? "half"
                  : sheetState === "half"
                  ? "full"
                  : "half";
              snapSheetTo(next);
            }}
            className="bg-zinc-800/50 hover:bg-zinc-700 transition-colors rounded-full px-6 py-1 outline-none text-zinc-400 hover:text-white"
          >
            {sheetState === "full" ? (
              <ChevronDown size={18} strokeWidth={2} />
            ) : (
              <ChevronUp size={18} strokeWidth={2} />
            )}
          </button>
        </div>

        <div className="flex flex-col flex-1 px-4 lg:px-8 overflow-hidden pt-1">
          {/* Search */}
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
                onFocus={() => {
                  if (sheetState !== "full") snapSheetTo("full");
                }}
                className="flex-1 px-4 py-3.5 text-sm font-light bg-transparent outline-none ring-0 border-none text-white placeholder-zinc-500 focus:ring-0"
              />
              <button
                onClick={() => setShowFilters((f) => !f)}
                className={`pr-4 pl-3 py-3.5 flex items-center justify-center transition-colors bg-transparent border-none outline-none ${
                  showFilters ? "text-white" : "text-zinc-500 hover:text-white"
                }`}
              >
                <SlidersHorizontal size={18} />
              </button>
            </div>

            {searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 z-50 rounded-xl shadow-xl overflow-hidden">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-zinc-800 transition-colors ${
                      index > 0 ? "border-t border-zinc-800/50" : ""
                    }`}
                    onClick={() => {
                      setSearchQuery(suggestion);
                      setSearchSuggestions([]);
                    }}
                  >
                    <MapPin size={14} className="text-zinc-500" />
                    <span className="text-sm font-medium text-zinc-300">
                      {suggestion}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filters */}
          <div
            className={`transition-all duration-300 overflow-hidden shrink-0 ${
              showFilters
                ? "max-h-80 opacity-100 mb-5 border-b border-zinc-800 pb-5"
                : "max-h-0 opacity-0 mb-0"
            }`}
          >
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <span className="block text-sm font-medium text-zinc-400 mb-2">
                  Country
                </span>
                <select
                  value={filterCountry}
                  onChange={(e) => {
                    setFilterCountry(e.target.value);
                    setFilterCity("");
                  }}
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm font-light text-white outline-none focus:border-zinc-600 cursor-pointer"
                >
                  <option value="">All Countries</option>
                  {availableCountries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {availableCities.length > 0 && (
                <div>
                  <span className="block text-sm font-medium text-zinc-400 mb-2">
                    City
                  </span>
                  <select
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm font-light text-white outline-none focus:border-zinc-600 cursor-pointer"
                  >
                    <option value="">All Cities</option>
                    {availableCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <span className="block text-sm font-medium text-zinc-400 mb-3">
              Price
            </span>
            <div className="flex flex-wrap gap-2 mb-6">
              {FILTER_OPTIONS.map((option, i) => (
                <button
                  key={i}
                  onClick={() =>
                    setSelectedFilterIndex(selectedFilterIndex === i ? null : i)
                  }
                  className={`px-4 py-2 text-xs font-medium rounded-lg transition-all border ${
                    selectedFilterIndex === i
                      ? "bg-white text-black border-white"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex gap-6">
              {(
                [
                  { key: "price_asc", label: "Lowest Price" },
                  { key: "rating_desc", label: "Highest Rated" },
                  { key: "nearest", label: "Nearest to Me" },
                ] as { key: SortOrder; label: string }[]
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    if (key === "nearest" && sortOrder !== "nearest")
                      getUserLocation();
                    setSortOrder(sortOrder === key ? null : key);
                  }}
                  className={`text-sm font-medium transition-colors pb-1 border-b-2 ${
                    sortOrder === key
                      ? "text-white border-white"
                      : "text-zinc-500 border-transparent hover:text-zinc-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 shrink-0">
            <h3 className="text-sm font-medium text-zinc-400">
              {filteredStudios.length}{" "}
              {filteredStudios.length === 1 ? "Result" : "Results"}
            </h3>
          </div>

          {/* Studio grid */}
          <div
            className="flex-1 overflow-y-auto scrollbar-hide pb-6"
            style={{ transform: "translateZ(0)" }}
          >
            {filteredStudios.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredStudios.map((studio) => {
                  const distance =
                    userLocation && studio.latitude && studio.longitude
                      ? calculateDistance(
                          userLocation.lat,
                          userLocation.lon,
                          studio.latitude,
                          studio.longitude
                        )
                      : null;
                  return (
                    <StudioCard
                      key={studio.id}
                      studio={studio}
                      distance={distance}
                      onHover={handleStudioHover}
                    />
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
                  {searchQuery
                    ? `Try adjusting "${searchQuery}"`
                    : "Adjust your filters"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
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