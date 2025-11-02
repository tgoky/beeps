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
                    <Video className={`w-4 h-4 ${
                      theme === "dark" ? "text-black" : "text-white"
                    }`} strokeWidth={2.5} />
                  </div>
                  <h1 className="text-2xl font-light tracking-tight">
                    Live Music Hub
                  </h1>
                </div>
                <p className={`text-sm font-light tracking-wide ${
                  theme === "dark" ? "text-zinc-500" : "text-gray-600"
                }`}>
                  Stream, connect, and create in real-time
                </p>
              </div>
              <button
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                  theme === "dark"
                    ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                    : "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/50"
                }`}
              >
                <Radio className="w-4 h-4" />
                Go Live
              </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { icon: MapPin, label: "Find Studio", color: "blue" },
                { icon: Users, label: "Find Musicians", color: "purple" },
                { icon: Music2, label: "Book Session", color: "green" },
                { icon: ShoppingCart, label: "Buy Gear", color: "orange" }
              ].map((action, i) => {
                const IconComponent = action.icon;
                return (
                  <button
                    key={i}
                    className={`p-4 rounded-xl border transition-all duration-200 active:scale-95 ${
                      theme === "dark"
                        ? "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60"
                        : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`
                        ${action.color === "blue" ? theme === "dark" ? "text-blue-400" : "text-blue-600" :
                          action.color === "purple" ? theme === "dark" ? "text-purple-400" : "text-purple-600" :
                          action.color === "green" ? theme === "dark" ? "text-green-400" : "text-green-600" :
                          theme === "dark" ? "text-orange-400" : "text-orange-600"
                        }
                      `}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className={`text-sm font-light tracking-wide ${
                        theme === "dark" ? "text-zinc-300" : "text-gray-700"
                      }`}>
                        {action.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

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
                  placeholder="Search streams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide focus:outline-none ${
                    theme === "dark"
                      ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 focus:border-white focus:bg-black"
                      : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:bg-white"
                  }`}
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`px-4 py-3 text-sm font-light rounded-lg border transition-all duration-200 cursor-pointer tracking-wide focus:outline-none ${
                  theme === "dark"
                    ? "bg-zinc-900 border-zinc-800 text-white focus:border-white focus:bg-black"
                    : "bg-gray-50 border-gray-300 text-gray-900 focus:border-gray-900 focus:bg-white"
                }`}
              >
                <option value="all">All Categories</option>
                <option value="Hip Hop">Hip Hop</option>
                <option value="R&B">R&B</option>
                <option value="Pop">Pop</option>
                <option value="Trap">Trap</option>
                <option value="Electronic">Electronic</option>
              </select>

              {/* Tab Filters */}
              <div className={`flex items-center gap-1 p-1 rounded-lg border ${
                theme === "dark" ? "border-zinc-800 bg-zinc-900" : "border-gray-300 bg-gray-100"
              }`}>
                {[
                  { key: "streams", label: "Live Streams", icon: Video },
                  { key: "studios", label: "Studios", icon: MapPin },
                  { key: "services", label: "Services", icon: Zap },
                  { key: "gear", label: "Gear", icon: Package }
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
              {filteredStreams.length} {filteredStreams.length === 1 ? "stream" : "streams"} found
            </div>

            {/* Streams Grid */}
            {activeTab === "streams" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {filteredStreams.map((stream) => (
                  <div
                    key={stream.id}
                    className={`group rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                      theme === "dark"
                        ? "border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900"
                        : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
                    }`}
                    onClick={() => router.push(`/live/${stream.id}`)}
                  >
                    {/* Thumbnail */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={stream.thumbnail}
                        alt={stream.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      
                      {/* Live Badge */}
                      {stream.isLive && (
                        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-light tracking-wide backdrop-blur-sm bg-red-500/90 text-white border border-red-400/50 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          LIVE
                        </div>
                      )}

                      {/* Viewers Count */}
                      {stream.isLive && (
                        <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-light tracking-wide backdrop-blur-sm bg-black/70 text-white">
                          {formatNumber(stream.viewers)} viewers
                        </div>
                      )}

                      {/* Scheduled Overlay */}
                      {!stream.isLive && stream.scheduled && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                          <Clock className="w-8 h-8 mb-3" />
                          <div className="text-sm font-light tracking-wide text-center px-4">
                            {stream.scheduled}
                          </div>
                        </div>
                      )}

                      {/* Duration */}
                      {stream.isLive && stream.duration && (
                        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded text-xs font-light tracking-wide backdrop-blur-sm bg-black/70 text-white">
                          {stream.duration}
                        </div>
                      )}

                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all duration-300">
                        <button
                          className="p-4 rounded-full transition-all duration-300 backdrop-blur-sm
                            bg-white/10 hover:bg-white/20 text-white
                            opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                        >
                          <Play className="w-6 h-6 ml-0.5" />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      {/* User Info */}
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={stream.user.avatar}
                          alt={stream.user.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-light tracking-wide truncate ${
                              theme === "dark" ? "text-white" : "text-gray-900"
                            }`}>
                              {stream.user.name}
                            </span>
                            {stream.user.verified && (
                              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className={`text-xs font-light tracking-wide ${
                            theme === "dark" ? "text-zinc-500" : "text-gray-600"
                          }`}>
                            {formatNumber(stream.user.followers)} followers
                          </div>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className={`text-base font-light tracking-wide mb-3 line-clamp-2 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {stream.title}
                      </h3>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`px-3 py-1.5 text-xs font-light tracking-wide rounded-lg border ${
                            theme === "dark"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-blue-50 text-blue-600 border-blue-200/50"
                          }`}
                        >
                          {stream.genre}
                        </span>
                        {stream.tags.slice(0, 2).map((tag, i) => (
                          <span
                            key={i}
                            className={`px-3 py-1.5 text-xs font-light tracking-wide rounded-lg ${
                              theme === "dark"
                                ? "bg-zinc-800 text-zinc-300"
                                : "bg-gray-100 text-gray-700"
                            }`}
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
              <div className={`text-center py-16 rounded-xl border ${
                theme === "dark" 
                  ? "border-zinc-800 bg-zinc-950" 
                  : "border-gray-300 bg-white"
              }`}>
                <Tv className={`w-12 h-12 mx-auto mb-3 ${
                  theme === "dark" ? "text-zinc-700" : "text-gray-400"
                }`} />
                <p className={`text-sm font-light tracking-wide mb-1 ${
                  theme === "dark" ? "text-zinc-400" : "text-gray-600"
                }`}>
                  Coming Soon
                </p>
                <p className={`text-xs font-light tracking-wide ${
                  theme === "dark" ? "text-zinc-600" : "text-gray-500"
                }`}>
                  This section is under development
                </p>
              </div>
            )}
          </div>

          {/* Sidebar - 1 column */}
          <div className="xl:col-span-1 space-y-6">
            {/* Go Live Card */}
            <div className={`rounded-xl border p-6 ${
              theme === "dark" 
                ? "border-zinc-800 bg-zinc-950" 
                : "border-gray-300 bg-white"
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <Zap className={`w-5 h-5 ${
                  theme === "dark" ? "text-red-400" : "text-red-600"
                }`} />
                <h2 className={`text-lg font-light tracking-wide ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  Start Streaming
                </h2>
              </div>

              {/* Not Streaming State */}
              <div className={`p-4 rounded-lg border text-center mb-4 ${
                theme === "dark"
                  ? "border-zinc-800 bg-zinc-900/40"
                  : "border-gray-300 bg-gray-50"
              }`}>
                <Video className={`w-8 h-8 mx-auto mb-3 ${
                  theme === "dark" ? "text-zinc-600" : "text-gray-400"
                }`} />
                <p className={`text-sm font-light tracking-wide mb-3 ${
                  theme === "dark" ? "text-zinc-500" : "text-gray-600"
                }`}>
                  You are not streaming yet
                </p>
                <button
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                    theme === "dark"
                      ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                      : "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/50"
                  }`}
                >
                  <Radio className="w-4 h-4" />
                  Go Live Now
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className={`h-px ${
              theme === "dark" ? "bg-zinc-800" : "bg-gray-300"
            }`} />

            {/* Top Live Streams */}
            <div className={`rounded-xl border p-6 ${
              theme === "dark" 
                ? "border-zinc-800 bg-zinc-950" 
                : "border-gray-300 bg-white"
            }`}>
              <h3 className={`text-lg font-light tracking-wide mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Top Live Streams
              </h3>
              <div className="space-y-4">
                {liveStreams
                  .filter(stream => stream.isLive)
                  .sort((a, b) => b.viewers - a.viewers)
                  .slice(0, 3)
                  .map((stream) => (
                    <div
                      key={stream.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                        theme === "dark"
                          ? "border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800"
                          : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
                      }`}
                      onClick={() => router.push(`/live/${stream.id}`)}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={stream.thumbnail}
                          alt={stream.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="absolute bottom-1 left-1 px-2 py-0.5 rounded text-[10px] font-light tracking-wide bg-red-500 text-white">
                          LIVE
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-light tracking-wide line-clamp-1 mb-1 ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}>
                          {stream.title}
                        </div>
                        <div className={`text-xs font-light tracking-wide mb-1 ${
                          theme === "dark" ? "text-zinc-500" : "text-gray-600"
                        }`}>
                          {stream.user.name}
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-light tracking-wide ${
                          theme === "dark" ? "text-zinc-600" : "text-gray-500"
                        }`}>
                          <Users className="w-3 h-3" />
                          {formatNumber(stream.viewers)} viewers
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className={`rounded-xl border p-6 ${
              theme === "dark" 
                ? "border-zinc-800 bg-zinc-950" 
                : "border-gray-300 bg-white"
            }`}>
              <h3 className={`text-lg font-light tracking-wide mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Live Stats
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Active Streams", value: "24", change: "+5" },
                  { label: "Total Viewers", value: "3.2K", change: "+12%" },
                  { label: "Avg. Duration", value: "2.1h", change: "+0.3h" }
                ].map((stat, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className={`text-sm font-light tracking-wide ${
                      theme === "dark" ? "text-zinc-400" : "text-gray-600"
                    }`}>
                      {stat.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-light tracking-wide ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {stat.value}
                      </span>
                      <span className={`text-xs font-light tracking-wide px-2 py-0.5 rounded ${
                        stat.change.startsWith('+') 
                          ? theme === "dark" 
                            ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                            : "bg-green-50 text-green-600 border border-green-200/50"
                          : theme === "dark"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-red-50 text-red-600 border border-red-200/50"
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}