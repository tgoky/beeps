"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Music2, Play, Pause, Heart, ShoppingCart, MoreVertical, TrendingUp, DollarSign, Plus, Filter, Users, Upload as UploadIcon } from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";

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
  {
    id: 4,
    title: "Sunday Morning",
    producer: {
      name: "Jazz Keys",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
      verified: true,
    },
    bpm: 85,
    price: 59.99,
    genre: ["Jazz", "Lo-fi"],
    mood: ["Chill", "Smooth"],
    plays: 87000,
    likes: 3200,
    liked: false,
    image: "https://images.unsplash.com/photo-1501612780327-45045538702b",
    audio: "https://example.com/beat4.mp3",
    type: 'lease',
    description: "Chill lo-fi jazz beat with warm Rhodes chords and dusty drum breaks.",
    previewAvailable: 'subscribers'
  },
  {
    id: 5,
    title: "Future Bass Anthem",
    producer: {
      name: "Electric Soul",
      avatar: "https://randomuser.me/api/portraits/women/25.jpg",
      verified: true,
    },
    bpm: 128,
    price: 89.99,
    genre: ["Electronic", "Future Bass"],
    mood: ["Energetic", "Uplifting"],
    plays: 95000,
    likes: 4100,
    liked: false,
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
    audio: "https://example.com/beat5.mp3",
    type: 'exclusive',
    description: "Energetic future bass instrumental with massive drops and emotional chord progressions.",
    previewAvailable: 'none',
    deal: {
      discount: 15,
      endDate: "2023-11-30"
    }
  },
  {
    id: 6,
    title: "Underground Vibes",
    producer: {
      name: "Dark Mode",
      avatar: "https://randomuser.me/api/portraits/men/18.jpg",
      verified: false,
    },
    bpm: 135,
    price: 39.99,
    genre: ["Hip Hop", "Underground"],
    mood: ["Dark", "Mysterious"],
    plays: 76000,
    likes: 1850,
    liked: true,
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
    audio: "https://example.com/beat6.mp3",
    type: 'lease',
    description: "Underground hip hop beat with gritty samples and boom-bap drums.",
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

  return (
    <div className="flex h-screen">
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className={`text-2xl font-semibold mb-1 ${
                theme === "dark" ? "text-gray-100" : "text-gray-900"
              }`}>
                Beat Marketplace
              </h1>
              <p className={`text-[13px] ${
                theme === "dark" ? "text-gray-500" : "text-gray-600"
              }`}>
                Discover and license premium beats from top producers
              </p>
            </div>
            <button
              className={`
                flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200
                ${theme === "dark"
                  ? "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20"
                  : "bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200/50"
                }
                active:scale-95
              `}
            >
              <Plus className="w-3.5 h-3.5" />
              Upload Beat
            </button>
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
                placeholder="Search beats, producers..."
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
              className={`
                px-3 py-2 text-[13px] rounded-lg border transition-all duration-200 cursor-pointer
                ${theme === "dark"
                  ? "bg-gray-900/40 border-gray-800/60 text-gray-200"
                  : "bg-gray-50/50 border-gray-200/60 text-gray-900"
                }
                focus:outline-none focus:ring-2 ${theme === "dark" ? "focus:ring-purple-500/20" : "focus:ring-purple-200"}
              `}
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
            <div className="flex gap-1">
              {["trending", "new", "deals"].map((tab) => {
                const icons = {
                  trending: <TrendingUp className="w-3.5 h-3.5" />,
                  new: <UploadIcon className="w-3.5 h-3.5" />,
                  deals: <DollarSign className="w-3.5 h-3.5" />
                };
                
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`
                      flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200 capitalize
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
                    {icons[tab as keyof typeof icons]}
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Count */}
          <div className={`text-[13px] mb-4 ${
            theme === "dark" ? "text-gray-500" : "text-gray-600"
          }`}>
            {filteredBeats.length} {filteredBeats.length === 1 ? "beat" : "beats"} found
          </div>

          {/* Beats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBeats.map((beat) => (
              <div
                key={beat.id}
                className={`
                  group rounded-lg border overflow-hidden transition-all duration-200 cursor-pointer
                  ${theme === "dark"
                    ? "bg-gray-900/40 border-gray-800/60 hover:border-gray-700/80 hover:bg-gray-900/60"
                    : "bg-white/50 border-gray-200/60 hover:border-gray-300/80 hover:bg-white/80"
                  }
                  hover:shadow-lg active:scale-[0.98]
                `}
                onClick={() => router.push(`/beats/${beat.id}`)}
              >
                {/* Cover Image with Play Overlay */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    alt={beat.title}
                    src={beat.image}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all duration-300">
                    <button
                      onClick={(e) => togglePlay(beat.id, e)}
                      className={`
                        p-3 rounded-full transition-all duration-300 backdrop-blur-sm
                        ${theme === "dark"
                          ? "bg-white/10 hover:bg-white/20 text-white"
                          : "bg-black/20 hover:bg-black/30 text-white"
                        }
                        opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100
                      `}
                    >
                      {currentlyPlaying === beat.id ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Type Badge */}
                  <div className={`
                    absolute top-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur-sm flex items-center gap-1.5
                    ${beat.type === 'exclusive'
                      ? theme === "dark"
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        : "bg-yellow-50/90 text-yellow-700 border border-yellow-200/50"
                      : theme === "dark"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-blue-50/90 text-blue-700 border border-blue-200/50"
                    }
                  `}>
                    {beat.type === 'exclusive' ? 'EXCLUSIVE' : 'LEASE'}
                  </div>

                  {/* BPM Badge */}
                  <div className={`
                    absolute top-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur-sm
                    ${theme === "dark"
                      ? "bg-gray-900/80 text-gray-200 border border-gray-700/50"
                      : "bg-white/80 text-gray-900 border border-gray-200/50"
                    }
                  `}>
                    {beat.bpm} BPM
                  </div>

                  {/* Deal Badge */}
                  {beat.deal && (
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur-sm bg-red-500/90 text-white border border-red-400/50">
                      {beat.deal.discount}% OFF
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3.5">
                  {/* Title & Price */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className={`text-[14px] font-semibold line-clamp-1 flex-1 ${
                      theme === "dark" ? "text-gray-200" : "text-gray-900"
                    }`}>
                      {beat.title}
                    </h3>
                    <span className={`text-[14px] font-bold flex-shrink-0 ${
                      theme === "dark" ? "text-green-400" : "text-green-600"
                    }`}>
                      ${beat.price}
                    </span>
                  </div>

                  {/* Producer */}
                  <div className="flex items-center gap-2 mb-3">
                    <img
                      src={beat.producer.avatar}
                      alt={beat.producer.name}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className={`text-[12px] truncate flex-1 ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}>
                      {beat.producer.name}
                    </span>
                    {beat.producer.verified && (
                      <svg className="w-3 h-3 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>

                  {/* Stats */}
                  <div className={`flex items-center gap-3 mb-3 pb-3 border-b ${
                    theme === "dark" ? "border-gray-800/60" : "border-gray-200/60"
                  }`}>
                    <div className="flex items-center gap-1">
                      <Play className={`w-3 h-3 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
                      <span className={`text-[11px] font-medium ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}>
                        {formatNumber(beat.plays)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => toggleLike(beat.id, e)}
                      className="flex items-center gap-1"
                    >
                      <Heart className={`w-3 h-3 ${beat.liked ? "fill-red-500 text-red-500" : theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
                      <span className={`text-[11px] font-medium ${
                        beat.liked ? "text-red-500" : theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}>
                        {formatNumber(beat.likes)}
                      </span>
                    </button>
                  </div>

                  {/* Genres & Moods */}
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {beat.genre.slice(0, 2).map((genre, index) => (
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
                      {beat.mood.slice(0, 1).map((mood, index) => (
                        <span
                          key={`mood-${index}`}
                          className={`
                            px-2 py-0.5 text-[10px] font-medium rounded-md
                            ${theme === "dark"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-blue-50 text-blue-600 border border-blue-200/50"
                            }
                          `}
                        >
                          {mood}
                        </span>
                      ))}
                      {(beat.genre.length + beat.mood.length > 3) && (
                        <span
                          className={`
                            px-2 py-0.5 text-[10px] font-medium rounded-md
                            ${theme === "dark"
                              ? "bg-gray-800/60 text-gray-400"
                              : "bg-gray-100 text-gray-600"
                            }
                          `}
                        >
                          +{beat.genre.length + beat.mood.length - 3}
                        </span>
                      )}
                    </div>
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
                      }}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Add to Cart
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
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredBeats.length === 0 && (
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
                No beats found
              </p>
              <p className={`text-[12px] ${
                theme === "dark" ? "text-gray-600" : "text-gray-500"
              }`}>
                Try adjusting your filters or search query
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
            Marketplace Activity
          </h2>
          
          {/* Activity Feed */}
          <div className="space-y-3 mb-6">
            {activityData.map((activity) => (
              <div
                key={activity.id}
                className={`
                  p-3 rounded-lg border transition-all duration-200 cursor-pointer
                  ${theme === "dark"
                    ? "bg-gray-900/40 border-gray-800/60 hover:bg-gray-900/60"
                    : "bg-white/50 border-gray-200/60 hover:bg-white/80"
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
                        {activity.action === 'purchased' ? 'purchased' : activity.action === 'liked' ? 'liked' : 'uploaded'}
                      </span>
                      {' '}
                      <span className="font-medium">{activity.beat}</span>
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
                      ${activity.action === 'purchased'
                        ? theme === "dark"
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : "bg-green-50 text-green-600 border border-green-200/50"
                        : activity.action === 'liked'
                          ? theme === "dark"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-red-50 text-red-600 border border-red-200/50"
                          : theme === "dark"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-blue-50 text-blue-600 border border-blue-200/50"
                      }
                    `}
                  >
                    {activity.action === 'purchased' ? 'Sale' : activity.action === 'liked' ? 'Like' : 'New'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className={`h-px my-6 ${
            theme === "dark" ? "bg-gray-800/60" : "bg-gray-200/60"
          }`} />

          {/* Top Producers */}
          <div>
            <h3 className={`text-[15px] font-semibold mb-4 ${
              theme === "dark" ? "text-gray-200" : "text-gray-900"
            }`}>
              Top Producers
            </h3>
            <div className="space-y-3">
              {beats.slice(0, 5).map((beat) => (
                <div
                  key={beat.id}
                  className={`
                    flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-200 cursor-pointer
                    ${theme === "dark"
                      ? "bg-gray-900/40 border-gray-800/60 hover:bg-gray-900/60"
                      : "bg-white/50 border-gray-200/60 hover:bg-white/80"
                    }
                  `}
                >
                  <img
                    src={beat.producer.avatar}
                    alt={beat.producer.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`text-[13px] font-medium truncate ${
                      theme === "dark" ? "text-gray-200" : "text-gray-900"
                    }`}>
                      {beat.producer.name}
                    </div>
                    <div className={`text-[11px] ${
                      theme === "dark" ? "text-gray-600" : "text-gray-500"
                    }`}>
                      5 beats available
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
                    Follow
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
              Marketplace Stats
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-[12px] ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}>
                  Total Beats
                </span>
                <span className={`text-[12px] font-semibold ${
                  theme === "dark" ? "text-gray-200" : "text-gray-900"
                }`}>
                  {beats.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-[12px] ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}>
                  Active Producers
                </span>
                <span className={`text-[12px] font-semibold ${
                  theme === "dark" ? "text-gray-200" : "text-gray-900"
                }`}>
                  {new Set(beats.map(b => b.producer.name)).size}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-[12px] ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}>
                  Deals Available
                </span>
                <span className={`text-[12px] font-semibold ${
                  theme === "dark" ? "text-gray-200" : "text-gray-900"
                }`}>
                  {beats.filter(b => b.deal).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}