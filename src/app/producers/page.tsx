"use client";

import { useState } from "react";
import { producerData } from "./producersdata";
import { useRouter } from "next/navigation";
import { Search, MapPin, Star, Music2, CheckCircle2, Users, Play, MessageCircle } from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";

type Producer = {
  id: number;
  name: string;
  handle: string;
  avatar: string;
  cover: string;
  location: string;
  rating: number;
  genres: string[];
  skills: string[];
  recentWorks: {
    title: string;
    artist: string;
    plays: number;
    image: string;
  }[];
  social: {
    followers: number;
    following: number;
    posts: number;
  };
  online: boolean;
  lastActive: string;
  featuredGear?: string[];
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export default function ProducerHub() {
  const router = useRouter();
  const { theme } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [activeTab, setActiveTab] = useState("trending");

  const filteredProducers = producerData.filter(producer => {
    const matchesSearch = producer.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         producer.handle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === "all" || producer.genres.includes(selectedGenre);
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-2xl font-semibold mb-1 ${
          theme === "dark" ? "text-gray-100" : "text-gray-900"
        }`}>
          Producer Hub
        </h1>
        <p className={`text-[13px] ${
          theme === "dark" ? "text-gray-500" : "text-gray-600"
        }`}>
          Connect with top music producers worldwide
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
            placeholder="Search producers..."
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
          <option value="Electronic">Electronic</option>
          <option value="Pop">Pop</option>
          <option value="Jazz">Jazz</option>
          <option value="Soul">Soul</option>
        </select>

        {/* Tab Filters */}
        <div className="flex gap-1">
          {["trending", "nearby", "new", "verified"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200 capitalize
                ${activeTab === tab
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
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className={`text-[13px] mb-4 ${
        theme === "dark" ? "text-gray-500" : "text-gray-600"
      }`}>
        {filteredProducers.length} {filteredProducers.length === 1 ? "producer" : "producers"} found
      </div>

      {/* Producers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducers.map((producer) => (
          <div
            key={producer.id}
            className={`
              group rounded-lg border overflow-hidden transition-all duration-200 cursor-pointer
              ${theme === "dark"
                ? "bg-gray-900/40 border-gray-800/60 hover:border-gray-700/80 hover:bg-gray-900/60"
                : "bg-white/50 border-gray-200/60 hover:border-gray-300/80 hover:bg-white/80"
              }
              hover:shadow-lg active:scale-[0.98]
            `}
            onClick={() => router.push(`/producers/create/${producer.id}`)}
          >
            {/* Cover Image with Avatar */}
            <div className="relative h-32 overflow-hidden">
              <img
                alt={producer.name}
                src={producer.cover}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              {/* Status Badge */}
              <div className={`
                absolute top-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur-sm flex items-center gap-1.5
                ${producer.online
                  ? theme === "dark"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-green-50/90 text-green-700 border border-green-200/50"
                  : theme === "dark"
                    ? "bg-gray-900/80 text-gray-400 border border-gray-700/50"
                    : "bg-white/80 text-gray-600 border border-gray-200/50"
                }
              `}>
                <div className={`w-1.5 h-1.5 rounded-full ${producer.online ? 'bg-green-500' : 'bg-gray-400'}`} />
                {producer.online ? "Online" : producer.lastActive}
              </div>

              {/* Avatar Overlay */}
              <div className="absolute -bottom-6 left-3">
                <div className="relative">
                  <img
                    src={producer.avatar}
                    alt={producer.name}
                    className="w-12 h-12 rounded-lg border-2 object-cover shadow-lg"
                    style={{ borderColor: theme === "dark" ? "#111827" : "#ffffff" }}
                  />
                  {producer.online && (
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 bg-green-500 ${
                      theme === "dark" ? "border-gray-900" : "border-white"
                    }`} />
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-3.5 pt-8">
              {/* Name & Rating */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className={`text-[14px] font-semibold truncate ${
                    theme === "dark" ? "text-gray-200" : "text-gray-900"
                  }`}>
                    {producer.name}
                  </h3>
                  <p className={`text-[11px] truncate ${
                    theme === "dark" ? "text-gray-500" : "text-gray-600"
                  }`}>
                    {producer.handle}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  <span className={`text-[12px] font-medium ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}>
                    {producer.rating}
                  </span>
                </div>
              </div>

              {/* Location */}
              <div className={`flex items-center gap-1.5 mb-3 text-[12px] ${
                theme === "dark" ? "text-gray-500" : "text-gray-600"
              }`}>
                <MapPin className="w-3 h-3" />
                <span className="truncate">{producer.location}</span>
              </div>

              {/* Social Stats */}
              <div className={`flex items-center gap-3 mb-3 pb-3 border-b ${
                theme === "dark" ? "border-gray-800/60" : "border-gray-200/60"
              }`}>
                <div className="flex items-center gap-1">
                  <Users className={`w-3 h-3 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
                  <span className={`text-[11px] font-medium ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}>
                    {formatNumber(producer.social.followers)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Music2 className={`w-3 h-3 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
                  <span className={`text-[11px] font-medium ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}>
                    {producer.social.posts} tracks
                  </span>
                </div>
              </div>

              {/* Genres */}
              <div className="mb-3">
                <div className={`flex items-center gap-1 mb-1.5 text-[11px] ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}>
                  <Music2 className="w-3 h-3" />
                  <span>Genres</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {producer.genres.slice(0, 3).map((genre, index) => (
                    <span
                      key={index}
                      className={`
                        px-2 py-0.5 text-[10px] font-medium rounded-md
                        ${theme === "dark"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-blue-50 text-blue-600 border border-blue-200/50"
                        }
                      `}
                    >
                      {genre}
                    </span>
                  ))}
                  {producer.genres.length > 3 && (
                    <span
                      className={`
                        px-2 py-0.5 text-[10px] font-medium rounded-md
                        ${theme === "dark"
                          ? "bg-gray-800/60 text-gray-400"
                          : "bg-gray-100 text-gray-600"
                        }
                      `}
                    >
                      +{producer.genres.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Recent Work Preview */}
              {producer.recentWorks && producer.recentWorks.length > 0 && (
                <div className="mb-3">
                  <div className={`flex items-center gap-1 mb-1.5 text-[11px] ${
                    theme === "dark" ? "text-gray-500" : "text-gray-600"
                  }`}>
                    <Play className="w-3 h-3" />
                    <span>Recent Work</span>
                  </div>
                  <div className={`
                    p-2 rounded-lg flex items-center gap-2 border
                    ${theme === "dark"
                      ? "bg-gray-800/40 border-gray-800/60"
                      : "bg-gray-50/50 border-gray-200/60"
                    }
                  `}>
                    <img
                      src={producer.recentWorks[0].image}
                      alt={producer.recentWorks[0].title}
                      className="w-8 h-8 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`text-[11px] font-medium truncate ${
                        theme === "dark" ? "text-gray-300" : "text-gray-900"
                      }`}>
                        {producer.recentWorks[0].title}
                      </div>
                      <div className={`text-[10px] truncate ${
                        theme === "dark" ? "text-gray-600" : "text-gray-500"
                      }`}>
                        {formatNumber(producer.recentWorks[0].plays)} plays
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                    router.push(`/producers/create/${producer.id}`);
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  View Profile
                </button>
                
                <button
                  className={`
                    p-2 rounded-lg transition-all duration-200
                    ${theme === "dark"
                      ? "bg-gray-800/60 hover:bg-gray-800 text-gray-400 hover:text-gray-300 border border-gray-800/60"
                      : "bg-gray-100/80 hover:bg-gray-200 text-gray-600 hover:text-gray-700 border border-gray-200/60"
                    }
                    active:scale-95
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducers.length === 0 && (
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
            No producers found
          </p>
          <p className={`text-[12px] ${
            theme === "dark" ? "text-gray-600" : "text-gray-500"
          }`}>
            Try adjusting your filters or search query
          </p>
        </div>
      )}
    </div>
  );
}