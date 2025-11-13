"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Music2, Play, Pause, Heart, ShoppingCart, TrendingUp, DollarSign,
  Plus, Upload as UploadIcon, Users, Edit3, BarChart3, MessageCircle, Briefcase
} from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";
import { usePermissions } from "@/hooks/usePermissions";
import { getRoleDisplayName } from '@/lib/permissions';

type Beat = {
  id: number;
  title: string;
  producer: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  bpm: number;
  price: number;
  genre: string[];
  mood: string[];
  plays: number;
  likes: number;
  liked: boolean;
  image: string;
  audio: string;
  type: 'lease' | 'exclusive';
  description?: string;
  previewAvailable: 'free' | 'subscribers' | 'none';
  deal?: {
    discount: number;
    endDate: string;
  };
};

type Activity = {
  id: number;
  user: {
    name: string;
    avatar: string;
  };
  action: 'purchased' | 'liked' | 'uploaded';
  beat: string;
  time: string;
};

// Mock data
const beatData: Beat[] = [
  {
    id: 1,
    title: "Midnight Dreams",
    producer: {
      name: "Alex BeatSmith",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      verified: true,
    },
    bpm: 140,
    price: 49.99,
    genre: ["Hip Hop", "Trap"],
    mood: ["Dark", "Aggressive"],
    plays: 124500,
    likes: 2450,
    liked: false,
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
    audio: "https://example.com/beat1.mp3",
    type: 'lease',
    description: "Dark trap beat with heavy 808s and eerie melodies perfect for late night sessions.",
    previewAvailable: 'free',
    deal: {
      discount: 20,
      endDate: "2023-12-31"
    }
  },
  {
    id: 2,
    title: "Neon Lights",
    producer: {
      name: "Sarah Synth",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      verified: true,
    },
    bpm: 95,
    price: 79.99,
    genre: ["Pop", "Electronic"],
    mood: ["Energetic", "Bright"],
    plays: 87600,
    likes: 1890,
    liked: true,
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
    audio: "https://example.com/beat2.mp3",
    type: 'exclusive',
    description: "Upbeat electronic pop instrumental with shimmering synths and punchy drums.",
    previewAvailable: 'subscribers'
  },
  {
    id: 3,
    title: "Atlanta Nights",
    producer: {
      name: "Marcus Beats",
      avatar: "https://randomuser.me/api/portraits/men/75.jpg",
      verified: false,
    },
    bpm: 150,
    price: 29.99,
    genre: ["Trap", "Drill"],
    mood: ["Hard", "Street"],
    plays: 320000,
    likes: 5400,
    liked: false,
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
    audio: "https://example.com/beat3.mp3",
    type: 'lease',
    description: "Hard-hitting drill beat with sliding 808s and aggressive hi-hat patterns.",
    previewAvailable: 'free'
  },
];

const activityData: Activity[] = [
  {
    id: 1,
    user: {
      name: "Trapper King",
      avatar: "https://randomuser.me/api/portraits/men/22.jpg"
    },
    action: 'purchased',
    beat: "Midnight Dreams",
    time: "5 min ago"
  },
  {
    id: 2,
    user: {
      name: "Luna Sky",
      avatar: "https://randomuser.me/api/portraits/women/33.jpg"
    },
    action: 'liked',
    beat: "Neon Lights",
    time: "25 min ago"
  },
  {
    id: 3,
    user: {
      name: "Alex BeatSmith",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    action: 'uploaded',
    beat: "City Dreams",
    time: "1 hour ago"
  },
];

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export default function BeatMarketplace() {
  const router = useRouter();
  const { theme } = useTheme();
  const { permissions, isProducer, isArtist, isLyricist } = usePermissions();

  const [activeTab, setActiveTab] = useState("trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedMood, setSelectedMood] = useState("all");
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [beats, setBeats] = useState<Beat[]>(beatData);

  const toggleLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setBeats(beats.map(beat => 
      beat.id === id ? { ...beat, liked: !beat.liked, likes: beat.liked ? beat.likes - 1 : beat.likes + 1 } : beat
    ));
  };

  const togglePlay = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentlyPlaying(currentlyPlaying === id ? null : id);
  };

  const filteredBeats = beats.filter(beat => {
    const matchesSearch = beat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         beat.producer.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === "all" || beat.genre.includes(selectedGenre);
    const matchesMood = selectedMood === "all" || beat.mood.includes(selectedMood);
    return matchesSearch && matchesGenre && matchesMood;
  });

  // Beat Card Actions Component - Role-based buttons
  const BeatCardActions = ({ beat }: { beat: Beat }) => {
    // Check if this is the current user's beat (TODO: Replace with actual user ID check)
    const isOwnBeat = false; // Replace with: currentUser?.id === beat.producerId

    // Producer viewing their own beat
    if (isOwnBeat && permissions.canUploadBeats) {
      return (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/beats/${beat.id}/edit`);
            }}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
              theme === "dark"
                ? "bg-white border-white text-black hover:bg-zinc-100"
                : "bg-black border-black text-white hover:bg-gray-800"
            }`}
          >
            <Edit3 className="w-3 h-3" strokeWidth={2} />
            Edit
          </button>

          {permissions.canViewBeatAnalytics && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/beats/${beat.id}/analytics`);
              }}
              className={`p-2 rounded-lg border transition-all duration-200 active:scale-95 ${
                theme === "dark"
                  ? "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
                  : "border-gray-300 text-gray-500 hover:text-gray-900 hover:border-gray-400"
              }`}
            >
              <BarChart3 className="w-3 h-3" strokeWidth={2} />
            </button>
          )}
        </div>
      );
    }

    // Other users viewing beats
    return (
      <div className="flex gap-2">
        {permissions.canPurchaseBeats && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Add to cart logic
            }}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
              theme === "dark"
                ? "bg-white border-white text-black hover:bg-zinc-100"
                : "bg-black border-black text-white hover:bg-gray-800"
            }`}
          >
            <ShoppingCart className="w-3 h-3" strokeWidth={2} />
            Add to Cart
          </button>
        )}

        {permissions.canSendLicensingOffers && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Send offer logic
            }}
            className={`p-2 rounded-lg border transition-all duration-200 active:scale-95 ${
              theme === "dark"
                ? "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
                : "border-gray-300 text-gray-500 hover:text-gray-900 hover:border-gray-400"
            }`}
            title="Make Offer"
          >
            <DollarSign className="w-3 h-3" strokeWidth={2} />
          </button>
        )}

        {permissions.canMessageProducers && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/messages/${beat.producer.name}`);
            }}
            className={`p-2 rounded-lg border transition-all duration-200 active:scale-95 ${
              theme === "dark"
                ? "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
                : "border-gray-300 text-gray-500 hover:text-gray-900 hover:border-gray-400"
            }`}
            title="Message Producer"
          >
            <MessageCircle className="w-3 h-3" strokeWidth={2} />
          </button>
        )}
      </div>
    );
  };

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
                    Beat Marketplace
                  </h1>
                </div>
                <p className={`text-sm font-light tracking-wide ${
                  theme === "dark" ? "text-zinc-500" : "text-gray-600"
                }`}>
                  Discover and license premium beats from top producers
                </p>
              </div>

              {/* Upload Beat Button - Producers Only */}
              {permissions.canUploadBeats && (
                <button
                  onClick={() => router.push('/beats/upload')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                    theme === "dark"
                      ? "bg-white border-white text-black hover:bg-zinc-100"
                      : "bg-black border-black text-white hover:bg-gray-800"
                  }`}
                >
                  <Plus className="w-4 h-4" strokeWidth={2} />
                  Upload Beat
                </button>
              )}
            </div>

            {/* Permission Info Banner */}
            {isProducer && permissions.canUploadBeats && (
              <div className={`mb-6 p-4 rounded-lg border ${
                theme === "dark"
                  ? "bg-blue-950/20 border-blue-900/30"
                  : "bg-blue-50 border-blue-200/50"
              }`}>
                <div className="flex items-start gap-3">
                  <Music2 className={`w-5 h-5 flex-shrink-0 ${
                    theme === "dark" ? "text-blue-400" : "text-blue-600"
                  }`} strokeWidth={2} />
                  <div>
                    <p className={`text-sm font-medium tracking-wide ${
                      theme === "dark" ? "text-blue-300" : "text-blue-900"
                    }`}>
                      Producer Dashboard
                    </p>
                    <p className={`text-xs font-light tracking-wide mt-1 ${
                      theme === "dark" ? "text-blue-400/70" : "text-blue-700/70"
                    }`}>
                      You can upload beats, view analytics, and manage pricing. Your beats will appear with edit options.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(isArtist || isLyricist) && permissions.canPurchaseBeats && (
              <div className={`mb-6 p-4 rounded-lg border ${
                theme === "dark"
                  ? "bg-purple-950/20 border-purple-900/30"
                  : "bg-purple-50 border-purple-200/50"
              }`}>
                <div className="flex items-start gap-3">
                  <Briefcase className={`w-5 h-5 flex-shrink-0 ${
                    theme === "dark" ? "text-purple-400" : "text-purple-600"
                  }`} strokeWidth={2} />
                  <div>
                    <p className={`text-sm font-medium tracking-wide ${
                      theme === "dark" ? "text-purple-300" : "text-purple-900"
                    }`}>
                      {getRoleDisplayName(permissions.role as any)} Access
                    </p>
                    <p className={`text-xs font-light tracking-wide mt-1 ${
                      theme === "dark" ? "text-purple-400/70" : "text-purple-700/70"
                    }`}>
                      Purchase beats, send licensing offers, comment on tracks, and request collaborations.
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
                  placeholder="Search beats, producers..."
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
                <option value="Pop">Pop</option>
                <option value="Electronic">Electronic</option>
                <option value="R&B">R&B</option>
                <option value="Drill">Drill</option>
                <option value="Jazz">Jazz</option>
                <option value="Lo-fi">Lo-fi</option>
              </select>

              {/* Mood Filter */}
              <select
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value)}
                className={`px-4 py-3 text-sm font-light rounded-lg border transition-all duration-200 cursor-pointer tracking-wide focus:outline-none ${
                  theme === "dark"
                    ? "bg-zinc-900 border-zinc-800 text-white focus:border-white focus:bg-black"
                    : "bg-gray-50 border-gray-300 text-gray-900 focus:border-gray-900 focus:bg-white"
                }`}
              >
                <option value="all">All Moods</option>
                <option value="Dark">Dark</option>
                <option value="Aggressive">Aggressive</option>
                <option value="Energetic">Energetic</option>
                <option value="Bright">Bright</option>
                <option value="Chill">Chill</option>
                <option value="Smooth">Smooth</option>
              </select>

              {/* Tab Filters */}
              <div className={`flex items-center gap-1 p-1 rounded-lg border ${
                theme === "dark" ? "border-zinc-800 bg-zinc-900" : "border-gray-300 bg-gray-100"
              }`}>
                {[
                  { key: "trending", label: "Trending", icon: TrendingUp },
                  { key: "new", label: "New", icon: UploadIcon },
                  { key: "deals", label: "Deals", icon: DollarSign }
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
              {filteredBeats.length} {filteredBeats.length === 1 ? "beat" : "beats"} found
            </div>

            {/* Compact Wide Cards */}
            <div className="space-y-4">
              {filteredBeats.map((beat) => (
                <div
                  key={beat.id}
                  className={`group rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                    theme === "dark"
                      ? "border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900"
                      : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
                  }`}
                  onClick={() => router.push(`/beats/${beat.id}`)}
                >
                  <div className="flex">
                    {/* Cover Image */}
                    <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden">
                      <img
                        alt={beat.title}
                        src={beat.image}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all duration-300">
                        <button
                          onClick={(e) => togglePlay(beat.id, e)}
                          className="p-2 rounded-full transition-all duration-300 backdrop-blur-sm
                            bg-white/10 hover:bg-white/20 text-white
                            opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                        >
                          {currentlyPlaying === beat.id ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                          )}
                        </button>
                      </div>

                      {/* Type Badge */}
                      <div className={`
                        absolute top-2 left-2 px-2 py-1 rounded text-xs font-light tracking-wide backdrop-blur-sm
                        ${beat.type === 'exclusive'
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        }
                      `}>
                        {beat.type === 'exclusive' ? 'EXC' : 'LSE'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between h-full">
                        {/* Left Section - Beat Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-4 mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className={`text-base font-light tracking-wide mb-1 truncate ${
                                theme === "dark" ? "text-white" : "text-gray-900"
                              }`}>
                                {beat.title}
                              </h3>
                              <div className="flex items-center gap-2 mb-2">
                                <img
                                  src={beat.producer.avatar}
                                  alt={beat.producer.name}
                                  className="w-4 h-4 rounded-full object-cover"
                                />
                                <span className={`text-xs font-light tracking-wide truncate ${
                                  theme === "dark" ? "text-zinc-500" : "text-gray-600"
                                }`}>
                                  {beat.producer.name}
                                </span>
                                {beat.producer.verified && (
                                  <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Stats */}
                            <div className={`flex items-center gap-3 text-xs font-light flex-shrink-0 ${
                              theme === "dark" ? "text-zinc-500" : "text-gray-600"
                            }`}>
                              <div className="flex items-center gap-1">
                                <Play className="w-3 h-3" />
                                <span>{formatNumber(beat.plays)}</span>
                              </div>
                              <button
                                onClick={(e) => toggleLike(beat.id, e)}
                                className="flex items-center gap-1"
                              >
                                <Heart className={`w-3 h-3 ${beat.liked ? "fill-red-500 text-red-500" : theme === "dark" ? "text-zinc-500" : "text-gray-500"}`} />
                                <span className={beat.liked ? "text-red-500" : ""}>
                                  {formatNumber(beat.likes)}
                                </span>
                              </button>
                              <div className={theme === "dark" ? "text-zinc-600" : "text-gray-400"}>•</div>
                              <span>{beat.bpm} BPM</span>
                            </div>
                          </div>

                          {/* Genres & Moods */}
                          <div className="flex items-center gap-2 mb-2">
                            {beat.genre.slice(0, 2).map((genre, index) => (
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
                            {beat.mood.slice(0, 1).map((mood, index) => (
                              <span
                                key={`mood-${index}`}
                                className={`px-2 py-1 text-xs font-light rounded-full tracking-wide border ${
                                  theme === "dark"
                                    ? "bg-zinc-800 text-zinc-300 border-zinc-700"
                                    : "bg-gray-100 text-gray-700 border-gray-300"
                                }`}
                              >
                                {mood}
                              </span>
                            ))}
                          </div>

                          {/* Description */}
                          <p className={`text-xs font-light tracking-wide line-clamp-1 ${
                            theme === "dark" ? "text-zinc-500" : "text-gray-600"
                          }`}>
                            {beat.description}
                          </p>
                        </div>

                        {/* Right Section - Price & Action */}
                        <div className={`flex flex-col items-end gap-3 pl-4 border-l ${
                          theme === "dark" ? "border-zinc-800" : "border-gray-300"
                        }`}>
                          <div className="text-right">
                            <div className={`text-lg font-light tracking-tight ${
                              theme === "dark" ? "text-white" : "text-gray-900"
                            }`}>
                              ${beat.price}
                            </div>
                            {beat.deal && (
                              <div className="text-xs font-light text-red-400 tracking-wide line-through">
                                ${(beat.price / (1 - beat.deal.discount / 100)).toFixed(2)}
                              </div>
                            )}
                          </div>

                          {/* Role-based Action Buttons */}
                          <BeatCardActions beat={beat} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredBeats.length === 0 && (
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
                  No beats found
                </p>
                <p className={`text-xs font-light tracking-wide ${
                  theme === "dark" ? "text-zinc-600" : "text-gray-500"
                }`}>
                  Try adjusting your filters or search query
                </p>
              </div>
            )}
          </div>

          {/* Sidebar - 1 column */}
          <div className="xl:col-span-1 space-y-6">
            {/* Marketplace Activity */}
            <div className={`rounded-xl border p-4 ${
              theme === "dark" 
                ? "border-zinc-800 bg-zinc-950" 
                : "border-gray-300 bg-white"
            }`}>
              <h2 className={`text-lg font-light tracking-wide mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Marketplace Activity
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
                            {activity.action === 'purchased' ? 'purchased' : activity.action === 'liked' ? 'liked' : 'uploaded'}
                          </span>
                          {' '}
                          <span className="font-medium">{activity.beat}</span>
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
                          ${activity.action === 'purchased'
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : activity.action === 'liked'
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }
                        `}
                      >
                        {activity.action === 'purchased' ? 'Sale' : activity.action === 'liked' ? 'Like' : 'New'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Producers */}
            <div className={`rounded-xl border p-4 ${
              theme === "dark" 
                ? "border-zinc-800 bg-zinc-950" 
                : "border-gray-300 bg-white"
            }`}>
              <h3 className={`text-lg font-light tracking-wide mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Top Producers
              </h3>
              <div className="space-y-3">
                {beats.slice(0, 4).map((beat) => (
                  <div
                    key={beat.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                      theme === "dark"
                        ? "border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800"
                        : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
                    }`}
                  >
                    <img
                      src={beat.producer.avatar}
                      alt={beat.producer.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-light tracking-wide truncate mb-1 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {beat.producer.name}
                      </div>
                      <div className={`text-xs font-light tracking-wide ${
                        theme === "dark" ? "text-zinc-500" : "text-gray-600"
                      }`}>
                        {Math.floor(Math.random() * 20) + 5} beats
                      </div>
                    </div>
                    <button
                      className={`px-3 py-1 text-xs font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                        theme === "dark"
                          ? "bg-white border-white text-black hover:bg-zinc-100"
                          : "bg-black border-black text-white hover:bg-gray-800"
                      }`}
                    >
                      Follow
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
                Marketplace Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-light tracking-wide ${
                    theme === "dark" ? "text-zinc-500" : "text-gray-600"
                  }`}>
                    Total Beats
                  </span>
                  <span className={`text-sm font-light tracking-wide ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {beats.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-light tracking-wide ${
                    theme === "dark" ? "text-zinc-500" : "text-gray-600"
                  }`}>
                    Active Producers
                  </span>
                  <span className={`text-sm font-light tracking-wide ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {new Set(beats.map(b => b.producer.name)).size}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-light tracking-wide ${
                    theme === "dark" ? "text-zinc-500" : "text-gray-600"
                  }`}>
                    Deals Available
                  </span>
                  <span className={`text-sm font-light tracking-wide ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {beats.filter(b => b.deal).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-light tracking-wide ${
                    theme === "dark" ? "text-zinc-500" : "text-gray-600"
                  }`}>
                    Total Plays
                  </span>
                  <span className={`text-sm font-light tracking-wide ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {formatNumber(beats.reduce((sum, b) => sum + b.plays, 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}