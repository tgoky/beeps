"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Clock, Heart, DollarSign, TrendingUp, Users, Filter, CheckCircle, XCircle, Star, Music2, Zap } from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";

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
  {
    id: 4,
    title: "Late-Night Discount",
    type: 'deal',
    studio: {
      name: "Beat Factory",
      avatar: "https://randomuser.me/api/portraits/men/75.jpg",
      rating: 4.5,
    },
    price: 30,
    originalPrice: 70,
    discount: 57,
    duration: "1 hour",
    location: "Chicago, IL",
    equipment: ["SSL Console", "Drum Room"],
    genre: ["Rock", "Alternative"],
    date: "Tonight 10PM-2AM",
    slots: 2,
    liked: false,
    image: "https://images.unsplash.com/photo-1501612780327-45045538702b",
  },
  {
    id: 5,
    title: "Producer Collab Special",
    type: 'collab',
    producer: {
      name: "Sarah Synth",
      avatar: "https://randomuser.me/api/portraits/women/25.jpg",
      rating: 4.9,
    },
    price: "Free",
    duration: "2-3 hours",
    location: "Remote",
    equipment: ["Ableton Live", "MIDI Controllers"],
    genre: ["Electronic", "House"],
    date: "This Month",
    slots: 8,
    liked: false,
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
  },
  {
    id: 6,
    title: "Bidding War: Premium Studio",
    type: 'bid',
    studio: {
      name: "Platinum Records",
      avatar: "https://randomuser.me/api/portraits/men/18.jpg",
      rating: 5.0,
    },
    price: "Starting at $75",
    duration: "4 hours",
    location: "Nashville, TN",
    equipment: ["API Console", "Vintage Mics", "Drum Room"],
    genre: ["Country", "Rock", "Pop"],
    date: "Next Month",
    slots: 15,
    liked: true,
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04",
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
  {
    id: 4,
    user: {
      name: "Soulful Sam",
      avatar: "https://randomuser.me/api/portraits/men/55.jpg"
    },
    action: 'rejected',
    session: "Late-Night Discount",
    price: "$25",
    time: "2 hours ago"
  },
];

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export default function SessionBookings() {
  const router = useRouter();
  const { theme } = useTheme();
  
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
    <div className="flex h-screen">
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className={`text-2xl font-semibold mb-1 ${
              theme === "dark" ? "text-gray-100" : "text-gray-900"
            }`}>
              Collabs & Deals
            </h1>
            <p className={`text-[13px] ${
              theme === "dark" ? "text-gray-500" : "text-gray-600"
            }`}>
              Find deals, collabs, or name your price for studio time
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
                placeholder="Search sessions..."
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

            {/* Genre Filter */}
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className={`
                px-3 py-2 text-[13px] rounded-lg border transition-all duration-200 cursor-pointer
                ${theme === "dark"
                  ? "bg-gray-900/40 border-gray-800/60 text-gray-200"
                  : "bg-gray-50/50 border-gray-200/60 text-gray-900"
                }
                focus:outline-none focus:ring-2 ${theme === "dark" ? "focus:ring-purple-500/20" : "focus:ring-purple-200"}
              `}
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
              <option value="Los Angeles">Los Angeles</option>
              <option value="New York">New York</option>
              <option value="Miami">Miami</option>
              <option value="Chicago">Chicago</option>
              <option value="Online">Online/Remote</option>
            </select>

            {/* Tab Filters */}
            <div className="flex gap-1">
              {[
                { key: "deals", label: "Hot Deals", icon: <Zap className="w-3.5 h-3.5" /> },
                { key: "collabs", label: "Collabs", icon: <Users className="w-3.5 h-3.5" /> },
                { key: "bids", label: "Bids", icon: <DollarSign className="w-3.5 h-3.5" /> }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200
                    ${activeTab === tab.key
                      ? theme === "dark"
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        : "bg-purple-50 text-purple-600 border border-purple-200"
                      : theme === "dark"
                        ? "bg-gray-900/40 hover:bg-gray-800/60 text-gray-400 hover:text-gray-300 border border-gray-800/60"
                        : "bg-gray-50/50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 border border-gray-200/60"
                    }
                    active:scale-95
                  `}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          <div className={`text-[13px] mb-4 ${
            theme === "dark" ? "text-gray-500" : "text-gray-600"
          }`}>
            {filteredSessions.length} {filteredSessions.length === 1 ? "session" : "sessions"} found
          </div>

          {/* Sessions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className={`
                  group rounded-lg border overflow-hidden transition-all duration-200 cursor-pointer
                  ${theme === "dark"
                    ? "bg-gray-900/40 border-gray-800/60 hover:border-gray-700/80 hover:bg-gray-900/60"
                    : "bg-white/50 border-gray-200/60 hover:border-gray-300/80 hover:bg-white/80"
                  }
                  hover:shadow-lg active:scale-[0.98]
                `}
                onClick={() => router.push(`/bookings/${session.id}`)}
              >
                {/* Cover Image */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    alt={session.title}
                    src={session.image}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Type Badge */}
                  <div className={`
                    absolute top-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur-sm flex items-center gap-1.5
                    ${session.type === 'deal'
                      ? "bg-red-500/90 text-white border border-red-400/50"
                      : session.type === 'collab'
                        ? theme === "dark"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "bg-blue-50/90 text-blue-700 border border-blue-200/50"
                        : theme === "dark"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-green-50/90 text-green-700 border border-green-200/50"
                    }
                  `}>
                    {session.type === 'deal' ? 'HOT DEAL' : session.type === 'collab' ? 'COLLAB' : 'BID'}
                  </div>

                  {/* Discount Badge */}
                  {session.discount && (
                    <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur-sm bg-red-500/90 text-white border border-red-400/50">
                      {session.discount}% OFF
                    </div>
                  )}

                  {/* Title & Location Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-white font-semibold text-[14px] mb-1 line-clamp-1">
                      {session.title}
                    </h3>
                    <div className="flex items-center gap-1 text-white/80 text-[11px]">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{session.location}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3.5">
                  {/* Studio/Producer Info */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <img
                        src={session.studio?.avatar || session.producer?.avatar}
                        alt={session.studio?.name || session.producer?.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className={`text-[12px] font-medium truncate ${
                          theme === "dark" ? "text-gray-300" : "text-gray-900"
                        }`}>
                          {session.studio?.name || session.producer?.name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      <span className={`text-[11px] font-medium ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}>
                        {session.studio?.rating || session.producer?.rating}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className={`flex items-center justify-between mb-3 pb-3 border-b text-[11px] ${
                    theme === "dark" ? "border-gray-800/60 text-gray-500" : "border-gray-200/60 text-gray-600"
                  }`}>
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
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {session.genre.slice(0, 2).map((genre, index) => (
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
                          {genre}
                        </span>
                      ))}
                      {session.equipment.slice(0, 1).map((equip, index) => (
                        <span
                          key={`equip-${index}`}
                          className={`
                            px-2 py-0.5 text-[10px] font-medium rounded-md
                            ${theme === "dark"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-blue-50 text-blue-600 border border-blue-200/50"
                            }
                          `}
                        >
                          {equip}
                        </span>
                      ))}
                      {(session.genre.length + session.equipment.length > 3) && (
                        <span
                          className={`
                            px-2 py-0.5 text-[10px] font-medium rounded-md
                            ${theme === "dark"
                              ? "bg-gray-800/60 text-gray-400"
                              : "bg-gray-100 text-gray-600"
                            }
                          `}
                        >
                          +{session.genre.length + session.equipment.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-3">
                    {typeof session.price === 'number' ? (
                      <div className="flex items-baseline gap-2">
                        <span className={`text-[18px] font-bold ${
                          theme === "dark" ? "text-green-400" : "text-green-600"
                        }`}>
                          ${session.price}
                        </span>
                        {session.originalPrice && (
                          <span className={`text-[12px] line-through ${
                            theme === "dark" ? "text-gray-600" : "text-gray-400"
                          }`}>
                            ${session.originalPrice}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className={`text-[14px] font-semibold ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}>
                        {session.price}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1.5">
                    <button
                      className={`
                        flex-1 flex items-center justify-center gap-2 px-3 py-2 text-[13px] font-medium rounded-lg transition-all duration-200
                        ${theme === "dark"
                          ? "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20"
                          : "bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200/50"
                        }
                        group-hover:shadow-md active:scale-95
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (session.type === 'bid') {
                          setShowBidModal(true);
                        } else {
                          router.push(session.type === 'collab' ? `/collabs/create/${session.id}` : `/studios/create/${session.id}`);
                        }
                      }}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {session.type === 'bid' ? 'Make Offer' : session.type === 'collab' ? 'Request' : 'Book Now'}
                    </button>
                    
                    <button
                      className={`
                        p-2 rounded-lg transition-all duration-200
                        ${theme === "dark"
                          ? "bg-gray-800/60 hover:bg-gray-800 border border-gray-800/60"
                          : "bg-gray-100/80 hover:bg-gray-200 border border-gray-200/60"
                        }
                        active:scale-95
                      `}
                      onClick={(e) => toggleLike(session.id, e)}
                    >
                      <Heart className={`w-3.5 h-3.5 ${session.liked ? "fill-red-500 text-red-500" : theme === "dark" ? "text-gray-400" : "text-gray-600"}`} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredSessions.length === 0 && (
            <div className={`
              text-center py-12 rounded-lg border backdrop-blur-sm
              ${theme === "dark"
                ? "bg-gray-950/40 border-gray-800/50"
                : "bg-white/40 border-gray-200/60"
              }
            `}>
              <Music2 className={`w-12 h-12 mx-auto mb-3 ${
                theme === "dark" ? "text-gray-700" : "text-gray-300"
              }`} />
              <p className={`text-[14px] font-medium mb-1 ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                No sessions found
              </p>
              <p className={`text-[12px] ${
                theme === "dark" ? "text-gray-600" : "text-gray-500"
              }`}>
                Try adjusting your filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Sidebar */}
      <div className={`
        w-80 border-l hidden xl:block p-6 overflow-y-auto
        ${theme === "dark"
          ? "bg-black border-gray-800/50"
          : "bg-white/40 border-gray-200/60"
        }
      `}>
        <div className="sticky top-6">
          <h2 className={`text-lg font-semibold mb-4 ${
            theme === "dark" ? "text-gray-200" : "text-gray-900"
          }`}>
            Booking Activity
          </h2>
          
          {/* Activity Feed */}
          <div className="space-y-3 mb-6">
            {activityData.map((activity) => (
              <div
                key={activity.id}
                className={`
                  p-3 rounded-lg border transition-all duration-200
                  ${theme === "dark"
                    ? "bg-gray-900/40 border-gray-800/60"
                    : "bg-white/50 border-gray-200/60"
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={activity.user.avatar}
                    alt={activity.user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`text-[12px] ${
                      theme === "dark" ? "text-gray-300" : "text-gray-900"
                    }`}>
                      <span className="font-medium">{activity.user.name}</span>
                      {' '}
                      <span className={theme === "dark" ? "text-gray-500" : "text-gray-600"}>
                        {activity.action === 'booked' ? 'booked' : 
                         activity.action === 'requested' ? 'requested' :
                         activity.action === 'accepted' ? 'accepted' : 'rejected'}
                      </span>
                      {' '}
                      <span className="font-medium">{activity.session}</span>
                      {activity.price && (
                        <>
                          {' for '}
                          <span className="font-semibold">{activity.price}</span>
                        </>
                      )}
                    </div>
                    <div className={`text-[11px] mt-1 ${
                      theme === "dark" ? "text-gray-600" : "text-gray-500"
                    }`}>
                      {activity.time}
                    </div>
                  </div>
                  <span
                    className={`
                      px-2 py-0.5 text-[10px] font-medium rounded-md flex-shrink-0
                      ${activity.action === 'booked'
                        ? theme === "dark"
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : "bg-green-50 text-green-600 border border-green-200/50"
                        : activity.action === 'requested'
                          ? theme === "dark"
                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                            : "bg-yellow-50 text-yellow-600 border border-yellow-200/50"
                          : activity.action === 'accepted'
                            ? theme === "dark"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-blue-50 text-blue-600 border border-blue-200/50"
                            : theme === "dark"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-red-50 text-red-600 border border-red-200/50"
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

          {/* Divider */}
          <div className={`h-px my-6 ${
            theme === "dark" ? "bg-gray-800/60" : "bg-gray-200/60"
          }`} />

          {/* Trending Studios */}
          <div>
            <h3 className={`text-[15px] font-semibold mb-4 ${
              theme === "dark" ? "text-gray-200" : "text-gray-900"
            }`}>
              Trending Studios
            </h3>
            <div className="space-y-3">
              {sessions.filter(s => s.studio).slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className={`
                    flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-200 cursor-pointer
                    ${theme === "dark"
                      ? "bg-gray-900/40 border-gray-800/60 hover:bg-gray-900/60"
                      : "bg-white/50 border-gray-200/60 hover:bg-white/80"
                    }
                  `}
                >
                  <img
                    src={session.studio?.avatar}
                    alt={session.studio?.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`text-[13px] font-medium truncate ${
                      theme === "dark" ? "text-gray-200" : "text-gray-900"
                    }`}>
                      {session.studio?.name}
                    </div>
                    <div className={`text-[11px] ${
                      theme === "dark" ? "text-gray-600" : "text-gray-500"
                    }`}>
                      {session.location}
                    </div>
                  </div>
                  <button
                    className={`
                      px-3 py-1 text-[11px] font-medium rounded-lg transition-all duration-200
                      ${theme === "dark"
                        ? "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20"
                        : "bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200/50"
                      }
                      active:scale-95
                    `}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Card */}
          <div className={`
            mt-6 p-4 rounded-lg border backdrop-blur-sm
            ${theme === "dark"
              ? "bg-gray-900/40 border-gray-800/60"
              : "bg-white/50 border-gray-200/60"
            }
          `}>
            <h3 className={`text-[13px] font-semibold mb-3 ${
              theme === "dark" ? "text-gray-200" : "text-gray-900"
            }`}>
              Todays Stats
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-[12px] ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}>
                  Active Deals
                </span>
                <span className={`text-[12px] font-semibold ${
                  theme === "dark" ? "text-gray-200" : "text-gray-900"
                }`}>
                  {sessions.filter(s => s.type === 'deal').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-[12px] ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}>
                  Open Collabs
                </span>
                <span className={`text-[12px] font-semibold ${
                  theme === "dark" ? "text-gray-200" : "text-gray-900"
                }`}>
                  {sessions.filter(s => s.type === 'collab').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-[12px] ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}>
                  Bid Sessions
                </span>
                <span className={`text-[12px] font-semibold ${
                  theme === "dark" ? "text-gray-200" : "text-gray-900"
                }`}>
                  {sessions.filter(s => s.type === 'bid').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bid Modal */}
      {showBidModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`
            w-full max-w-md rounded-lg border p-6
            ${theme === "dark"
              ? "bg-gray-900 border-gray-800"
              : "bg-white border-gray-200"
            }
          `}>
            <h3 className={`text-lg font-semibold mb-4 ${
              theme === "dark" ? "text-gray-200" : "text-gray-900"
            }`}>
              Make an Offer
            </h3>

            <div className="mb-4">
              <label className={`block text-[13px] font-medium mb-2 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}>
                Your Offer Price: ${bidPrice}
              </label>
              <input
                type="range"
                min="20"
                max="200"
                value={bidPrice}
                onChange={(e) => setBidPrice(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: theme === "dark"
                    ? `linear-gradient(to right, #a855f7 0%, #a855f7 ${((bidPrice - 20) / 180) * 100}%, #374151 ${((bidPrice - 20) / 180) * 100}%, #374151 100%)`
                    : `linear-gradient(to right, #9333ea 0%, #9333ea ${((bidPrice - 20) / 180) * 100}%, #e5e7eb ${((bidPrice - 20) / 180) * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>

            <div className="mb-4">
              <label className={`block text-[13px] font-medium mb-2 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}>
                Add a Message (Optional)
              </label>
              <textarea
                placeholder="E.g., 'I need 2 hours for vocal recording...'"
                rows={3}
                className={`
                  w-full px-3 py-2 text-[13px] rounded-lg border transition-all duration-200 resize-none
                  ${theme === "dark"
                    ? "bg-gray-800/40 border-gray-700/60 text-gray-200 placeholder-gray-600 focus:border-purple-500/50"
                    : "bg-gray-50/50 border-gray-200/60 text-gray-900 placeholder-gray-400 focus:border-purple-300"
                  }
                  focus:outline-none focus:ring-2 ${theme === "dark" ? "focus:ring-purple-500/20" : "focus:ring-purple-200"}
                `}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowBidModal(false)}
                className={`
                  flex-1 px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200
                  ${theme === "dark"
                    ? "bg-gray-800/60 hover:bg-gray-800 text-gray-300 border border-gray-700/60"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
                  }
                  active:scale-95
                `}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowBidModal(false);
                  // Handle bid submission here
                }}
                className={`
                  flex-1 px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200
                  ${theme === "dark"
                    ? "bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30"
                    : "bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200"
                  }
                  active:scale-95
                `}
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