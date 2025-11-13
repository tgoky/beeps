"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Clock, Heart, DollarSign, TrendingUp, Users, CheckCircle, Star, Music2, Zap, Plus } from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";
import { usePermissions } from "@/hooks/usePermissions";

type BookingSession = {
  id: number;
  title: string;
  type: 'deal' | 'collab' | 'bid';
  studio?: {
    name: string;
    avatar: string;
    rating: number;
  };
  producer?: {
    name: string;
    avatar: string;
    rating: number;
  };
  price: number | string;
  originalPrice?: number;
  discount?: number;
  duration: string;
  location: string;
  equipment: string[];
  genre: string[];
  date: string;
  slots: number;
  liked: boolean;
  image: string;
};

type Activity = {
  id: number;
  user: {
    name: string;
    avatar: string;
  };
  action: 'booked' | 'requested' | 'accepted' | 'rejected';
  session: string;
  price?: string;
  time: string;
};

// Mock Data
const sessionData: BookingSession[] = [
  {
    id: 1,
    title: "Weekend Studio Blowout",
    type: 'deal',
    studio: {
      name: "Harmony Studios",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      rating: 4.8,
    },
    price: 50,
    originalPrice: 100,
    discount: 50,
    duration: "2 hours",
    location: "Los Angeles, CA",
    equipment: ["Neve Console", "Pro Tools HD"],
    genre: ["Hip Hop", "R&B"],
    date: "Today - 3 slots left",
    slots: 3,
    liked: false,
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
  },
  {
    id: 2,
    title: "Collab with Producer Alex",
    type: 'collab',
    producer: {
      name: "Alex BeatSmith",
      avatar: "https://randomuser.me/api/portraits/men/22.jpg",
      rating: 4.9,
    },
    price: "Negotiable",
    duration: "Flexible",
    location: "Online or NYC",
    equipment: ["FL Studio", "Live Mixing"],
    genre: ["Trap", "Pop"],
    date: "Ongoing",
    slots: 5,
    liked: true,
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
  },
  {
    id: 3,
    title: "Name Your Price Session",
    type: 'bid',
    studio: {
      name: "Vocal Booth Pro",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      rating: 4.7,
    },
    price: "Bid Now",
    duration: "1-4 hours",
    location: "Miami, FL",
    equipment: ["Isolation Booth", "U87 Mic"],
    genre: ["Rap", "Vocals"],
    date: "Next Week",
    slots: 10,
    liked: false,
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
  },
];

const activityData: Activity[] = [
  {
    id: 1,
    user: {
      name: "Trapper King",
      avatar: "https://randomuser.me/api/portraits/men/22.jpg"
    },
    action: 'booked',
    session: "Weekend Studio Blowout",
    price: "$50",
    time: "5 min ago"
  },
  {
    id: 2,
    user: {
      name: "Luna Sky",
      avatar: "https://randomuser.me/api/portraits/women/33.jpg"
    },
    action: 'requested',
    session: "Collab with Producer Alex",
    price: "$80",
    time: "25 min ago"
  },
  {
    id: 3,
    user: {
      name: "Urban Flow",
      avatar: "https://randomuser.me/api/portraits/men/45.jpg"
    },
    action: 'accepted',
    session: "Name Your Price Session",
    price: "$65",
    time: "1 hour ago"
  },
];

export default function SessionBookings() {
  const router = useRouter();
  const { theme } = useTheme();
  const { permissions, isProducer, isArtist, isLyricist, isStudioOwner } = usePermissions();

  const [activeTab, setActiveTab] = useState("deals");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [sessions, setSessions] = useState<BookingSession[]>(sessionData);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidPrice, setBidPrice] = useState(50);

  const toggleLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(sessions.map(session => 
      session.id === id ? { ...session, liked: !session.liked } : session
    ));
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (session.studio?.name || session.producer?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === "all" || session.genre.includes(selectedGenre);
    const matchesLocation = selectedLocation === "all" || session.location.includes(selectedLocation);
    const matchesTab = activeTab === "deals" ? session.type === "deal" :
                       activeTab === "collabs" ? session.type === "collab" :
                       activeTab === "bids" ? session.type === "bid" : true;
    return matchesSearch && matchesGenre && matchesLocation && matchesTab;
  });

  return (
    <div className={`min-h-screen p-6 transition-colors duration-200 ${
      theme === "dark" 
        ? "bg-black text-white" 
        : "bg-gray-50 text-gray-900"
    }`}>
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Main Content - 3 columns */}
          <div className="xl:col-span-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    theme === "dark" ? "bg-white" : "bg-gray-900"
                  }`}>
                    <Music2 className={`w-4 h-4 ${
                      theme === "dark" ? "text-black" : "text-white"
                    }`} strokeWidth={2.5} />
                  </div>
                  <h1 className="text-2xl font-light tracking-tight">
                    Collabs & Deals
                  </h1>
                </div>
                <p className={`text-sm font-light tracking-wide ${
                  theme === "dark" ? "text-zinc-500" : "text-gray-600"
                }`}>
                  Find deals, collabs, or name your price for studio time
                </p>
              </div>

              {/* Create Session Buttons */}
              <div className="flex gap-2">
                {permissions.canCreateDeals && (
                  <button
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                      theme === "dark"
                        ? "bg-white border-white text-black hover:bg-zinc-100"
                        : "bg-black border-black text-white hover:bg-gray-800"
                    }`}
                    onClick={() => router.push('/collabs/create/deal')}
                  >
                    <Plus className="w-4 h-4" strokeWidth={2} />
                    Create Deal
                  </button>
                )}
                {permissions.canCreateCollabs && (
                  <button
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                      theme === "dark"
                        ? "bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800"
                        : "bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200"
                    }`}
                    onClick={() => router.push('/collabs/create/collab')}
                  >
                    <Plus className="w-4 h-4" strokeWidth={2} />
                    Create Collab
                  </button>
                )}
                {permissions.canCreateBids && (
                  <button
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                      theme === "dark"
                        ? "bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800"
                        : "bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200"
                    }`}
                    onClick={() => router.push('/collabs/create/bid')}
                  >
                    <Plus className="w-4 h-4" strokeWidth={2} />
                    Create Bid
                  </button>
                )}
              </div>
            </div>

            {/* Permission Info Banners */}
            {isProducer && (
              <div className={`mb-6 p-4 rounded-lg border ${
                theme === "dark"
                  ? "bg-blue-950/20 border-blue-900/30"
                  : "bg-blue-50 border-blue-200/50"
              }`}>
                <div className="flex items-start gap-3">
                  <Music2 className={`w-5 h-5 ${
                    theme === "dark" ? "text-blue-400" : "text-blue-600"
                  }`} />
                  <div>
                    <p className={`text-sm font-medium ${
                      theme === "dark" ? "text-blue-300" : "text-blue-900"
                    }`}>
                      Producer Dashboard
                    </p>
                    <p className={`text-xs mt-1 ${
                      theme === "dark" ? "text-blue-400/70" : "text-blue-700/70"
                    }`}>
                      You can create deals, collabs, and bids. View analytics on your sessions and manage collaborations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isStudioOwner && (
              <div className={`mb-6 p-4 rounded-lg border ${
                theme === "dark"
                  ? "bg-purple-950/20 border-purple-900/30"
                  : "bg-purple-50 border-purple-200/50"
              }`}>
                <div className="flex items-start gap-3">
                  <Zap className={`w-5 h-5 ${
                    theme === "dark" ? "text-purple-400" : "text-purple-600"
                  }`} />
                  <div>
                    <p className={`text-sm font-medium ${
                      theme === "dark" ? "text-purple-300" : "text-purple-900"
                    }`}>
                      Studio Owner Dashboard
                    </p>
                    <p className={`text-xs mt-1 ${
                      theme === "dark" ? "text-purple-400/70" : "text-purple-700/70"
                    }`}>
                      Create flash deals and bid sessions. Access premium features and session analytics.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(isArtist || isLyricist) && !isProducer && (
              <div className={`mb-6 p-4 rounded-lg border ${
                theme === "dark"
                  ? "bg-green-950/20 border-green-900/30"
                  : "bg-green-50 border-green-200/50"
              }`}>
                <div className="flex items-start gap-3">
                  <Users className={`w-5 h-5 ${
                    theme === "dark" ? "text-green-400" : "text-green-600"
                  }`} />
                  <div>
                    <p className={`text-sm font-medium ${
                      theme === "dark" ? "text-green-300" : "text-green-900"
                    }`}>
                      {isArtist ? "Artist" : "Lyricist"} Dashboard
                    </p>
                    <p className={`text-xs mt-1 ${
                      theme === "dark" ? "text-green-400/70" : "text-green-700/70"
                    }`}>
                      Create collabs, book sessions, negotiate terms, and place bids on studio time.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className={`flex flex-wrap gap-3 mb-8 p-4 rounded-xl border ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-950"
                : "border-gray-300 bg-white"
            }`}>
              {/* Search */}
              <div className="relative flex-1 min-w-[250px]">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  theme === "dark" ? "text-zinc-600" : "text-gray-500"
                }`} strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide focus:outline-none ${
                    theme === "dark"
                      ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 focus:border-white focus:bg-black"
                      : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:bg-white"
                  }`}
                />
              </div>

              {/* Genre Filter */}
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className={`px-4 py-3 text-sm font-light rounded-lg border transition-all duration-200 cursor-pointer tracking-wide focus:outline-none ${
                  theme === "dark"
                    ? "bg-zinc-900 border-zinc-800 text-white focus:border-white focus:bg-black"
                    : "bg-gray-50 border-gray-300 text-gray-900 focus:border-gray-900 focus:bg-white"
                }`}
              >
                <option value="all">All Genres</option>
                <option value="Hip Hop">Hip Hop</option>
                <option value="Trap">Trap</option>
                <option value="R&B">R&B</option>
                <option value="Pop">Pop</option>
                <option value="Rock">Rock</option>
                <option value="Electronic">Electronic</option>
              </select>

              {/* Location Filter */}
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className={`px-4 py-3 text-sm font-light rounded-lg border transition-all duration-200 cursor-pointer tracking-wide focus:outline-none ${
                  theme === "dark"
                    ? "bg-zinc-900 border-zinc-800 text-white focus:border-white focus:bg-black"
                    : "bg-gray-50 border-gray-300 text-gray-900 focus:border-gray-900 focus:bg-white"
                }`}
              >
                <option value="all">All Locations</option>
                <option value="Los Angeles">Los Angeles</option>
                <option value="New York">New York</option>
                <option value="Miami">Miami</option>
                <option value="Chicago">Chicago</option>
                <option value="Online">Online/Remote</option>
              </select>

              {/* Tab Filters */}
              <div className={`flex items-center gap-1 p-1 rounded-lg border ${
                theme === "dark" ? "border-zinc-800 bg-zinc-900" : "border-gray-300 bg-gray-100"
              }`}>
                {[
                  { key: "deals", label: "Hot Deals", icon: Zap },
                  { key: "collabs", label: "Collabs", icon: Users },
                  { key: "bids", label: "Bids", icon: DollarSign }
                ].map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`
                        flex items-center gap-2 px-4 py-2 text-sm font-light rounded transition-all duration-200 tracking-wide
                        ${activeTab === tab.key
                          ? theme === "dark"
                            ? "bg-white text-black"
                            : "bg-black text-white"
                          : theme === "dark"
                            ? "text-zinc-400 hover:text-white"
                            : "text-gray-600 hover:text-black"
                        }
                      `}
                    >
                      <IconComponent className="w-4 h-4" strokeWidth={2} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results Count */}
            <div className={`text-sm font-light tracking-wide mb-6 ${
              theme === "dark" ? "text-zinc-500" : "text-gray-600"
            }`}>
              {filteredSessions.length} {filteredSessions.length === 1 ? "session" : "sessions"} found
            </div>

            {/* Compact Wide Cards */}
            <div className="space-y-4">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className={`group rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                    theme === "dark"
                      ? "border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900"
                      : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
                  }`}
                  onClick={() => router.push(`/bookings/${session.id}`)}
                >
                  <div className="flex">
                    {/* Cover Image */}
                    <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden">
                      <img
                        alt={session.title}
                        src={session.image}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
                      
                      {/* Type Badge */}
                      <div className={`
                        absolute top-2 left-2 px-2 py-1 rounded text-xs font-light tracking-wide backdrop-blur-sm
                        ${session.type === 'deal'
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : session.type === 'collab'
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : "bg-green-500/20 text-green-400 border border-green-500/30"
                        }
                      `}>
                        {session.type === 'deal' ? 'DEAL' : session.type === 'collab' ? 'COLLAB' : 'BID'}
                      </div>

                      {/* Discount Badge */}
                      {session.discount && (
                        <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-light tracking-wide backdrop-blur-sm 
                          bg-red-500/20 text-red-400 border border-red-500/30">
                          {session.discount}% OFF
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between h-full">
                        {/* Left Section - Session Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-4 mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className={`text-base font-light tracking-wide mb-1 truncate ${
                                theme === "dark" ? "text-white" : "text-gray-900"
                              }`}>
                                {session.title}
                              </h3>
                              <div className="flex items-center gap-2 mb-2">
                                <img
                                  src={session.studio?.avatar || session.producer?.avatar}
                                  alt={session.studio?.name || session.producer?.name}
                                  className="w-4 h-4 rounded-full object-cover"
                                />
                                <span className={`text-xs font-light tracking-wide truncate ${
                                  theme === "dark" ? "text-zinc-500" : "text-gray-600"
                                }`}>
                                  {session.studio?.name || session.producer?.name}
                                </span>
                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                  <span className={`text-xs font-light ${
                                    theme === "dark" ? "text-zinc-400" : "text-gray-500"
                                  }`}>
                                    {session.studio?.rating || session.producer?.rating}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Details */}
                          <div className={`flex items-center gap-4 mb-2 text-xs font-light ${
                            theme === "dark" ? "text-zinc-500" : "text-gray-600"
                          }`}>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{session.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{session.duration}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{session.slots} left</span>
                            </div>
                          </div>

                          {/* Genres & Equipment */}
                          <div className="flex items-center gap-2 mb-2">
                            {session.genre.slice(0, 2).map((genre, index) => (
                              <span
                                key={index}
                                className={`px-2 py-1 text-xs font-light rounded-full tracking-wide ${
                                  theme === "dark"
                                    ? "bg-white text-black"
                                    : "bg-black text-white"
                                }`}
                              >
                                {genre}
                              </span>
                            ))}
                            {session.equipment.slice(0, 1).map((equip, index) => (
                              <span
                                key={`equip-${index}`}
                                className={`px-2 py-1 text-xs font-light rounded-full tracking-wide border ${
                                  theme === "dark"
                                    ? "bg-zinc-800 text-zinc-300 border-zinc-700"
                                    : "bg-gray-100 text-gray-700 border-gray-300"
                                }`}
                              >
                                {equip}
                              </span>
                            ))}
                          </div>

                          {/* Date */}
                          <p className={`text-xs font-light tracking-wide ${
                            theme === "dark" ? "text-zinc-500" : "text-gray-600"
                          }`}>
                            {session.date}
                          </p>
                        </div>

                        {/* Right Section - Price & Action */}
                        <div className={`flex flex-col items-end gap-3 pl-4 border-l ${
                          theme === "dark" ? "border-zinc-800" : "border-gray-300"
                        }`}>
                          <div className="text-right">
                            {typeof session.price === 'number' ? (
                              <div className="flex flex-col items-end">
                                <div className={`text-lg font-light tracking-tight ${
                                  theme === "dark" ? "text-white" : "text-gray-900"
                                }`}>
                                  ${session.price}
                                </div>
                                {session.originalPrice && (
                                  <div className="text-xs font-light text-red-400 tracking-wide line-through">
                                    ${session.originalPrice}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className={`text-sm font-light tracking-wide ${
                                theme === "dark" ? "text-white" : "text-gray-900"
                              }`}>
                                {session.price}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {/* Book Session Button - Based on session type and permissions */}
                            {session.type === 'deal' && permissions.canBookSessions && (
                              <button
                                className={`flex items-center gap-2 px-4 py-2 text-xs font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 w-32 justify-center ${
                                  theme === "dark"
                                    ? "bg-white border-white text-black hover:bg-zinc-100"
                                    : "bg-black border-black text-white hover:bg-gray-800"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/studios/create/${session.id}`);
                                }}
                              >
                                <CheckCircle className="w-3 h-3" strokeWidth={2} />
                                Book Now
                              </button>
                            )}

                            {/* Request Collab Button - Based on permissions */}
                            {session.type === 'collab' && permissions.canNegotiateCollabTerms && (
                              <button
                                className={`flex items-center gap-2 px-4 py-2 text-xs font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 w-32 justify-center ${
                                  theme === "dark"
                                    ? "bg-white border-white text-black hover:bg-zinc-100"
                                    : "bg-black border-black text-white hover:bg-gray-800"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/collabs/create/${session.id}`);
                                }}
                              >
                                <CheckCircle className="w-3 h-3" strokeWidth={2} />
                                Request
                              </button>
                            )}

                            {/* Place Bid Button - Based on permissions */}
                            {session.type === 'bid' && permissions.canPlaceBids && (
                              <button
                                className={`flex items-center gap-2 px-4 py-2 text-xs font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 w-32 justify-center ${
                                  theme === "dark"
                                    ? "bg-white border-white text-black hover:bg-zinc-100"
                                    : "bg-black border-black text-white hover:bg-gray-800"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowBidModal(true);
                                }}
                              >
                                <CheckCircle className="w-3 h-3" strokeWidth={2} />
                                Make Offer
                              </button>
                            )}

                            {/* No Permission State */}
                            {((session.type === 'deal' && !permissions.canBookSessions) ||
                              (session.type === 'collab' && !permissions.canNegotiateCollabTerms) ||
                              (session.type === 'bid' && !permissions.canPlaceBids)) && (
                              <div className={`flex items-center gap-2 px-4 py-2 text-xs font-light rounded-lg border w-32 justify-center ${
                                theme === "dark"
                                  ? "border-zinc-800 text-zinc-600 bg-zinc-900/50"
                                  : "border-gray-300 text-gray-400 bg-gray-100/50"
                              }`}>
                                <CheckCircle className="w-3 h-3" strokeWidth={2} />
                                {session.type === 'bid' ? 'Make Offer' : session.type === 'collab' ? 'Request' : 'Book Now'}
                              </div>
                            )}

                            <button
                              className={`p-2 rounded-lg border transition-all duration-200 active:scale-95 ${
                                theme === "dark"
                                  ? "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
                                  : "border-gray-300 text-gray-500 hover:text-black hover:border-gray-400"
                              }`}
                              onClick={(e) => toggleLike(session.id, e)}
                            >
                              <Heart className={`w-3 h-3 ${session.liked ? "fill-red-500 text-red-500" : ""}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredSessions.length === 0 && (
              <div className={`text-center py-16 rounded-xl border ${
                theme === "dark" 
                  ? "border-zinc-800 bg-zinc-950" 
                  : "border-gray-300 bg-white"
              }`}>
                <Music2 className={`w-12 h-12 mx-auto mb-3 ${
                  theme === "dark" ? "text-zinc-700" : "text-gray-400"
                }`} />
                <p className={`text-sm font-light tracking-wide mb-1 ${
                  theme === "dark" ? "text-zinc-400" : "text-gray-600"
                }`}>
                  No sessions found
                </p>
                <p className={`text-xs font-light tracking-wide ${
                  theme === "dark" ? "text-zinc-600" : "text-gray-500"
                }`}>
                  Try adjusting your filters
                </p>
              </div>
            )}
          </div>

          {/* Sidebar - 1 column */}
          <div className="xl:col-span-1 space-y-6">
            {/* Booking Activity */}
            <div className={`rounded-xl border p-4 ${
              theme === "dark" 
                ? "border-zinc-800 bg-zinc-950" 
                : "border-gray-300 bg-white"
            }`}>
              <h2 className={`text-lg font-light tracking-wide mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Booking Activity
              </h2>
              
              <div className="space-y-3">
                {activityData.map((activity) => (
                  <div
                    key={activity.id}
                    className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                      theme === "dark"
                        ? "border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800"
                        : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={activity.user.avatar}
                        alt={activity.user.name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-light tracking-wide mb-1 ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}>
                          <span className="font-medium">{activity.user.name}</span>
                          {' '}
                          <span className={theme === "dark" ? "text-zinc-500" : "text-gray-600"}>
                            {activity.action === 'booked' ? 'booked' : 
                             activity.action === 'requested' ? 'requested' :
                             activity.action === 'accepted' ? 'accepted' : 'rejected'}
                          </span>
                          {' '}
                          <span className="font-medium">{activity.session}</span>
                          {activity.price && (
                            <>
                              {' for '}
                              <span className="font-medium">{activity.price}</span>
                            </>
                          )}
                        </div>
                        <div className={`text-xs font-light tracking-wide ${
                          theme === "dark" ? "text-zinc-600" : "text-gray-500"
                        }`}>
                          {activity.time}
                        </div>
                      </div>
                      <span
                        className={`
                          px-2 py-1 text-xs font-light rounded-full tracking-wide flex-shrink-0
                          ${activity.action === 'booked'
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : activity.action === 'requested'
                              ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                              : activity.action === 'accepted'
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }
                        `}
                      >
                        {activity.action === 'booked' ? 'Booked' :
                         activity.action === 'requested' ? 'Pending' :
                         activity.action === 'accepted' ? 'Accepted' : 'Rejected'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Studios */}
            <div className={`rounded-xl border p-4 ${
              theme === "dark" 
                ? "border-zinc-800 bg-zinc-950" 
                : "border-gray-300 bg-white"
            }`}>
              <h3 className={`text-lg font-light tracking-wide mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Trending Studios
              </h3>
              <div className="space-y-3">
                {sessions.filter(s => s.studio).slice(0, 4).map((session) => (
                  <div
                    key={session.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                      theme === "dark"
                        ? "border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800"
                        : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
                    }`}
                  >
                    <img
                      src={session.studio?.avatar}
                      alt={session.studio?.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-light tracking-wide truncate mb-1 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {session.studio?.name}
                      </div>
                      <div className={`text-xs font-light tracking-wide ${
                        theme === "dark" ? "text-zinc-500" : "text-gray-600"
                      }`}>
                        {session.location}
                      </div>
                    </div>
                    <button
                      className={`px-3 py-1 text-xs font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                        theme === "dark"
                          ? "bg-white border-white text-black hover:bg-zinc-100"
                          : "bg-black border-black text-white hover:bg-gray-800"
                      }`}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Card */}
            <div className={`rounded-xl border p-4 ${
              theme === "dark" 
                ? "border-zinc-800 bg-zinc-950" 
                : "border-gray-300 bg-white"
            }`}>
              <h3 className={`text-lg font-light tracking-wide mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Today's Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-light tracking-wide ${
                    theme === "dark" ? "text-zinc-500" : "text-gray-600"
                  }`}>
                    Active Deals
                  </span>
                  <span className={`text-sm font-light tracking-wide ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {sessions.filter(s => s.type === 'deal').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-light tracking-wide ${
                    theme === "dark" ? "text-zinc-500" : "text-gray-600"
                  }`}>
                    Open Collabs
                  </span>
                  <span className={`text-sm font-light tracking-wide ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {sessions.filter(s => s.type === 'collab').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-light tracking-wide ${
                    theme === "dark" ? "text-zinc-500" : "text-gray-600"
                  }`}>
                    Bid Sessions
                  </span>
                  <span className={`text-sm font-light tracking-wide ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {sessions.filter(s => s.type === 'bid').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bid Modal */}
      {showBidModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-xl border p-6 ${
            theme === "dark" 
              ? "border-zinc-800 bg-zinc-950" 
              : "border-gray-300 bg-white"
          }`}>
            <h3 className={`text-lg font-light tracking-wide mb-4 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              Make an Offer
            </h3>

            <div className="mb-4">
              <label className={`block text-sm font-light tracking-wide mb-2 ${
                theme === "dark" ? "text-zinc-400" : "text-gray-600"
              }`}>
                Your Offer Price: ${bidPrice}
              </label>
              <input
                type="range"
                min="20"
                max="200"
                value={bidPrice}
                onChange={(e) => setBidPrice(Number(e.target.value))}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                  theme === "dark" ? "bg-zinc-800" : "bg-gray-300"
                }`}
                style={{
                  background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${((bidPrice - 20) / 180) * 100}%, ${
                    theme === "dark" ? "#374151" : "#d1d5db"
                  } ${((bidPrice - 20) / 180) * 100}%, ${
                    theme === "dark" ? "#374151" : "#d1d5db"
                  } 100%)`
                }}
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-light tracking-wide mb-2 ${
                theme === "dark" ? "text-zinc-400" : "text-gray-600"
              }`}>
                Add a Message (Optional)
              </label>
              <textarea
                placeholder="E.g., 'I need 2 hours for vocal recording...'"
                rows={3}
                className={`w-full px-3 py-2 text-sm font-light rounded-lg border tracking-wide resize-none focus:outline-none ${
                  theme === "dark"
                    ? "border-zinc-800 bg-zinc-900 text-white placeholder-zinc-600 focus:border-white focus:bg-black"
                    : "border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:bg-white"
                }`}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowBidModal(false)}
                className={`flex-1 px-4 py-2.5 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                  theme === "dark"
                    ? "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
                    : "border-gray-300 text-gray-600 hover:text-black hover:border-gray-400"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowBidModal(false);
                  // Handle bid submission here
                }}
                className={`flex-1 px-4 py-2.5 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                  theme === "dark"
                    ? "bg-white border-white text-black hover:bg-zinc-100"
                    : "bg-black border-black text-white hover:bg-gray-800"
                }`}
              >
                Submit Bid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}