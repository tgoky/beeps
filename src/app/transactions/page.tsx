"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Video, MapPin, Users, Music2, ShoppingCart, Clock, Star, Play, Zap, Package, Radio, Tv } from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";

type LiveStream = {
  id: number;
  user: {
    name: string;
    avatar: string;
    verified: boolean;
    followers: number;
  };
  title: string;
  thumbnail: string;
  viewers: number;
  tags: string[];
  genre: string;
  duration: string;
  isLive: boolean;
  scheduled?: string;
};

const liveStreams: LiveStream[] = [
  {
    id: 1,
    user: {
      name: "ProducerPro",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      verified: true,
      followers: 12400
    },
    title: "Making a Hit Beat from Scratch",
    thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400",
    viewers: 1245,
    tags: ["Producing", "Tutorial"],
    genre: "Hip Hop",
    duration: "2:45:12",
    isLive: true
  },
  {
    id: 2,
    user: {
      name: "VocalQueen",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      verified: true,
      followers: 18700
    },
    title: "Vocal Recording Session",
    thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
    viewers: 876,
    tags: ["Recording", "R&B"],
    genre: "R&B",
    duration: "1:23:45",
    isLive: true
  },
  {
    id: 3,
    user: {
      name: "BeatMaster",
      avatar: "https://randomuser.me/api/portraits/men/55.jpg",
      verified: false,
      followers: 3200
    },
    title: "Weekly Beat Challenge",
    thumbnail: "https://images.unsplash.com/photo-1496293455970-f8581aae0e3b?w=400",
    viewers: 432,
    tags: ["Challenge", "Trap"],
    genre: "Trap",
    duration: "3:12:08",
    isLive: true
  },
  {
    id: 4,
    user: {
      name: "SongwriterPro",
      avatar: "https://randomuser.me/api/portraits/women/65.jpg",
      verified: true,
      followers: 8900
    },
    title: "Songwriting Workshop",
    thumbnail: "https://images.unsplash.com/photo-1453738773917-9c3eff1db985?w=400",
    viewers: 0,
    tags: ["Workshop", "Pop"],
    genre: "Pop",
    duration: "",
    isLive: false,
    scheduled: "Tomorrow, 3:00 PM"
  }
];

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export default function LiveMusicPage() {
  const router = useRouter();
  const { theme } = useTheme();
  
  const [activeTab, setActiveTab] = useState("streams");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredStreams = liveStreams.filter(stream => {
    const matchesSearch = stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stream.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || stream.genre === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-screen">
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className={`text-2xl font-semibold mb-1 ${
                  theme === "dark" ? "text-gray-100" : "text-gray-900"
                }`}>
                  Live Music Hub
                </h1>
                <p className={`text-[13px] ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}>
                  Stream, connect, and create in real-time
                </p>
              </div>
              <button
                className={`
                  flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200
                  ${theme === "dark"
                    ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                    : "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                  }
                  active:scale-95
                `}
              >
                <Radio className="w-3.5 h-3.5" />
                Go Live
              </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {[
                { icon: <MapPin className="w-5 h-5" />, label: "Find Studio", color: "blue" },
                { icon: <Users className="w-5 h-5" />, label: "Find Musicians", color: "purple" },
                { icon: <Music2 className="w-5 h-5" />, label: "Book Session", color: "green" },
                { icon: <ShoppingCart className="w-5 h-5" />, label: "Buy Gear", color: "orange" }
              ].map((action, i) => (
                <button
                  key={i}
                  className={`
                    p-4 rounded-lg border transition-all duration-200
                    ${theme === "dark"
                      ? "bg-gray-900/40 border-gray-800/60 hover:bg-gray-900/60"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                    }
                    active:scale-95
                  `}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`
                      ${action.color === "blue" ? theme === "dark" ? "text-blue-400" : "text-blue-600" :
                        action.color === "purple" ? theme === "dark" ? "text-purple-400" : "text-purple-600" :
                        action.color === "green" ? theme === "dark" ? "text-green-400" : "text-green-600" :
                        theme === "dark" ? "text-orange-400" : "text-orange-600"
                      }
                    `}>
                      {action.icon}
                    </div>
                    <span className={`text-[13px] font-medium ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      {action.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
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
                placeholder="Search streams..."
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

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`
                px-3 py-2 text-[13px] rounded-lg border transition-all duration-200 cursor-pointer
                ${theme === "dark"
                  ? "bg-gray-900/40 border-gray-800/60 text-gray-200"
                  : "bg-gray-50/50 border-gray-200/60 text-gray-900"
                }
                focus:outline-none focus:ring-2 ${theme === "dark" ? "focus:ring-purple-500/20" : "focus:ring-purple-200"}
              `}
            >
              <option value="all">All Categories</option>
              <option value="Hip Hop">Hip Hop</option>
              <option value="R&B">R&B</option>
              <option value="Pop">Pop</option>
              <option value="Trap">Trap</option>
              <option value="Electronic">Electronic</option>
            </select>

            {/* Tab Filters */}
            <div className="flex gap-1">
              {[
                { key: "streams", label: "Live Streams", icon: <Video className="w-3.5 h-3.5" /> },
                { key: "studios", label: "Studios", icon: <MapPin className="w-3.5 h-3.5" /> },
                { key: "services", label: "Services", icon: <Zap className="w-3.5 h-3.5" /> },
                { key: "gear", label: "Gear", icon: <Package className="w-3.5 h-3.5" /> }
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
            {filteredStreams.length} {filteredStreams.length === 1 ? "stream" : "streams"} found
          </div>

          {/* Streams Grid */}
          {activeTab === "streams" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStreams.map((stream) => (
                <div
                  key={stream.id}
                  className={`
                    group rounded-lg border overflow-hidden transition-all duration-200 cursor-pointer
                    ${theme === "dark"
                      ? "bg-gray-900/40 border-gray-800/60 hover:border-gray-700/80 hover:bg-gray-900/60"
                      : "bg-white/50 border-gray-200/60 hover:border-gray-300/80 hover:bg-white/80"
                    }
                    hover:shadow-lg active:scale-[0.98]
                  `}
                  onClick={() => router.push(`/live/${stream.id}`)}
                >
                  {/* Thumbnail */}
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={stream.thumbnail}
                      alt={stream.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    {/* Live Badge */}
                    {stream.isLive && (
                      <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur-sm bg-red-500/90 text-white border border-red-400/50 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        LIVE
                      </div>
                    )}

                    {/* Viewers Count */}
                    {stream.isLive && (
                      <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur-sm bg-black/70 text-white">
                        {formatNumber(stream.viewers)} viewers
                      </div>
                    )}

                    {/* Scheduled Overlay */}
                    {!stream.isLive && stream.scheduled && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                        <Clock className="w-6 h-6 mb-2" />
                        <div className="text-[11px] font-medium text-center px-2">
                          {stream.scheduled}
                        </div>
                      </div>
                    )}

                    {/* Duration */}
                    {stream.isLive && stream.duration && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold backdrop-blur-sm bg-black/70 text-white">
                        {stream.duration}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    {/* User Info */}
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={stream.user.avatar}
                        alt={stream.user.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className={`text-[12px] font-medium truncate ${
                            theme === "dark" ? "text-gray-300" : "text-gray-900"
                          }`}>
                            {stream.user.name}
                          </span>
                          {stream.user.verified && (
                            <svg className="w-3 h-3 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className={`text-[14px] font-semibold mb-2 line-clamp-2 ${
                      theme === "dark" ? "text-gray-200" : "text-gray-900"
                    }`}>
                      {stream.title}
                    </h3>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      <span
                        className={`
                          px-2 py-0.5 text-[10px] font-medium rounded-md
                          ${theme === "dark"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-blue-50 text-blue-600 border border-blue-200/50"
                          }
                        `}
                      >
                        {stream.genre}
                      </span>
                      {stream.tags.slice(0, 2).map((tag, i) => (
                        <span
                          key={i}
                          className={`
                            px-2 py-0.5 text-[10px] font-medium rounded-md
                            ${theme === "dark"
                              ? "bg-gray-800/60 text-gray-400"
                              : "bg-gray-100 text-gray-600"
                            }
                          `}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Other tabs content placeholders */}
          {activeTab !== "streams" && (
            <div className={`
              text-center py-12 rounded-lg border backdrop-blur-sm
              ${theme === "dark"
                ? "bg-gray-950/40 border-gray-800/50"
                : "bg-white/40 border-gray-200/60"
              }
            `}>
              <Tv className={`w-12 h-12 mx-auto mb-3 ${
                theme === "dark" ? "text-gray-700" : "text-gray-300"
              }`} />
              <p className={`text-[14px] font-medium mb-1 ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                Coming Soon
              </p>
              <p className={`text-[12px] ${
                theme === "dark" ? "text-gray-600" : "text-gray-500"
              }`}>
                This section is under development
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className={`
        w-80 border-l hidden xl:block p-6 overflow-y-auto
        ${theme === "dark"
          ? "bg-black border-gray-800/50"
          : "bg-white/40 border-gray-200/60"
        }
      `}>
        <div className="sticky top-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className={`w-4 h-4 ${theme === "dark" ? "text-red-400" : "text-red-600"}`} />
            <h2 className={`text-[15px] font-semibold ${
              theme === "dark" ? "text-gray-200" : "text-gray-900"
            }`}>
              Live Now
            </h2>
          </div>

          {/* Not Streaming State */}
          <div className={`
            p-4 rounded-lg border text-center mb-6
            ${theme === "dark"
              ? "bg-gray-900/40 border-gray-800/60"
              : "bg-gray-50 border-gray-200"
            }
          `}>
            <Video className={`w-8 h-8 mx-auto mb-2 ${
              theme === "dark" ? "text-gray-600" : "text-gray-400"
            }`} />
            <p className={`text-[13px] mb-3 ${
              theme === "dark" ? "text-gray-500" : "text-gray-600"
            }`}>
              You are not streaming yet
            </p>
            <button
              className={`
                w-full flex items-center justify-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200
                ${theme === "dark"
                  ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                  : "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                }
                active:scale-95
              `}
            >
              <Radio className="w-3.5 h-3.5" />
              Go Live Now
            </button>
          </div>

          {/* Divider */}
          <div className={`h-px my-6 ${
            theme === "dark" ? "bg-gray-800/60" : "bg-gray-200/60"
          }`} />

          {/* Top Live Streams */}
          <h3 className={`text-[15px] font-semibold mb-4 ${
            theme === "dark" ? "text-gray-200" : "text-gray-900"
          }`}>
            Top Live Streams
          </h3>
          <div className="space-y-3">
            {liveStreams
              .filter(stream => stream.isLive)
              .sort((a, b) => b.viewers - a.viewers)
              .slice(0, 3)
              .map((stream) => (
                <div
                  key={stream.id}
                  className={`
                    flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-200 cursor-pointer
                    ${theme === "dark"
                      ? "bg-gray-900/40 border-gray-800/60 hover:bg-gray-900/60"
                      : "bg-white/50 border-gray-200/60 hover:bg-white/80"
                    }
                  `}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={stream.thumbnail}
                      alt={stream.title}
                      className="w-16 h-16 rounded object-cover"
                    />
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-semibold bg-red-500 text-white">
                      LIVE
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[13px] font-medium line-clamp-1 ${
                      theme === "dark" ? "text-gray-200" : "text-gray-900"
                    }`}>
                      {stream.title}
                    </div>
                    <div className={`text-[11px] ${
                      theme === "dark" ? "text-gray-600" : "text-gray-500"
                    }`}>
                      {stream.user.name}
                    </div>
                    <div className={`flex items-center gap-1 text-[11px] ${
                      theme === "dark" ? "text-gray-600" : "text-gray-500"
                    }`}>
                      <Users className="w-3 h-3" />
                      {formatNumber(stream.viewers)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}