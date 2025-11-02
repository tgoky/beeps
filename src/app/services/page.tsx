"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Heart, Play, Pause, Music2, Users, FileText, Mic, Award, Crown, MessageCircle, Plus, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";

type MusicService = {
  id: number;
  type: 'snippet' | 'collab' | 'lyrics' | 'writer' | 'audition' | 'label';
  auditionType?: 'artist' | 'producer' | 'lyricist'; 
  title: string;
  user: {
    name: string;
    avatar: string;
    verified: boolean;
    followers: number;
  };
  description: string;
  tags: string[];
  genre: string[];
  likes: number;
  liked: boolean;
  plays?: number;
  duration?: string;
  audioUrl?: string;
  lyrics?: string;
  price?: number | string;
  deadline?: string;
  status?: 'open' | 'completed' | 'in-progress';
  collaborators?: number;
  comments?: number;
  date: string;
};

// Mock Data
const musicServices: MusicService[] = [
  {
    id: 1,
    type: 'snippet',
    title: "Summer Vibes Hook",
    user: {
      name: "Melody Maker",
      avatar: "https://randomuser.me/api/portraits/women/32.jpg",
      verified: true,
      followers: 12400
    },
    description: "Catchy summer pop hook looking for verses to complete the song. Open to collab!",
    tags: ["Pop", "Upbeat", "Summer"],
    genre: ["Pop", "Dance"],
    likes: 124,
    liked: false,
    plays: 856,
    duration: "0:45",
    audioUrl: "#",
    date: "2 hours ago"
  },
  {
    id: 2,
    type: 'collab',
    title: "Need Rapper for Trap Beat",
    user: {
      name: "Beat Factory",
      avatar: "https://randomuser.me/api/portraits/men/45.jpg",
      verified: false,
      followers: 3200
    },
    description: "Hard-hitting trap beat needs aggressive rapper. 50/50 split on any revenue.",
    tags: ["Trap", "Rap", "Dark"],
    genre: ["Hip Hop"],
    likes: 56,
    liked: true,
    plays: 210,
    price: "Revenue Share",
    status: 'open',
    collaborators: 3,
    comments: 12,
    date: "1 day ago"
  },
  {
    id: 3,
    type: 'lyrics',
    title: "Lyric Review Needed",
    user: {
      name: "Songbird",
      avatar: "https://randomuser.me/api/portraits/women/55.jpg",
      verified: true,
      followers: 8900
    },
    description: "Looking for feedback on these R&B lyrics before I record. Willing to pay for professional critique.",
    tags: ["R&B", "Love", "Ballad"],
    genre: ["R&B"],
    likes: 34,
    liked: false,
    lyrics: "You're the rhythm to my blues...",
    price: "$20-$50",
    date: "3 days ago"
  },
  {
    id: 4,
    type: 'writer',
    title: "Need Songwriter for Pop-Punk Band",
    user: {
      name: "Punk Out",
      avatar: "https://randomuser.me/api/portraits/men/22.jpg",
      verified: false,
      followers: 1200
    },
    description: "Looking for experienced pop-punk songwriter to help with our debut EP. Credit + payment.",
    tags: ["Pop-Punk", "Angsty", "Energetic"],
    genre: ["Rock"],
    likes: 78,
    liked: false,
    price: "$200-$500 per song",
    deadline: "June 30",
    status: 'open',
    date: "5 days ago"
  },
  {
    id: 5,
    type: 'audition',
    auditionType: 'producer',
    title: "Vocalist Auditions for Label",
    user: {
      name: "Urban Sounds Records",
      avatar: "https://randomuser.me/api/portraits/women/65.jpg",
      verified: true,
      followers: 45600
    },
    description: "Seeking talented R&B/Soul vocalists aged 18-25 for development deal. Submit your best performance.",
    tags: ["R&B", "Soul", "Vocalist"],
    genre: ["R&B", "Soul"],
    likes: 210,
    liked: false,
    status: 'open',
    deadline: "Ongoing",
    date: "1 week ago"
  },
  {
    id: 6,
    type: 'label',
    title: "Indie Label Seeking Producers",
    user: {
      name: "Beat Collective",
      avatar: "https://randomuser.me/api/portraits/men/33.jpg",
      verified: true,
      followers: 18700
    },
    description: "Looking for fresh producers to join our roster. Submit your best 3 tracks for consideration.",
    tags: ["Producers", "Contract", "Opportunity"],
    genre: ["All Genres"],
    likes: 145,
    liked: true,
    status: 'open',
    date: "2 weeks ago"
  }
];

const trendingSnippets = [
  { id: 1, title: "Lofi Chill Loop", user: "Chill Beats", plays: 1245, duration: "1:02" },
  { id: 2, title: "Dance Drop Idea", user: "EDM Creator", plays: 982, duration: "0:45" },
  { id: 3, title: "R&B Vocal Run", user: "Soul Singer", plays: 876, duration: "0:38" }
];

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export default function MusicServices() {
  const router = useRouter();
  const { theme } = useTheme();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [activeTab, setActiveTab] = useState("snippets");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedService, setSelectedService] = useState("all");
  const [isPlaying, setIsPlaying] = useState<number | null>(null);
  const [services, setServices] = useState<MusicService[]>(musicServices);

  const toggleLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setServices(services.map(service => 
      service.id === id ? { 
        ...service, 
        liked: !service.liked,
        likes: service.liked ? service.likes - 1 : service.likes + 1
      } : service
    ));
  };

  const togglePlay = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying === id) {
      setIsPlaying(null);
      audioRef.current?.pause();
    } else {
      setIsPlaying(id);
      audioRef.current?.play();
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === "all" || service.genre.includes(selectedGenre);
    const matchesService = selectedService === "all" || service.type === selectedService;
    const matchesTab = activeTab === "snippets" ? service.type === "snippet" :
                       activeTab === "collabs" ? service.type === "collab" :
                       activeTab === "lyrics" ? service.type === "lyrics" :
                       activeTab === "writers" ? service.type === "writer" :
                       activeTab === "auditions" ? service.type === "audition" :
                       activeTab === "labels" ? service.type === "label" : true;
    return matchesSearch && matchesGenre && matchesService && matchesTab;
  });

  const getTypeConfig = (type: string) => {
    const configs = {
      snippet: { color: theme === "dark" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-blue-50 text-blue-600 border-blue-200/50", label: "SNIPPET", icon: <Music2 className="w-3 h-3" /> },
      collab: { color: theme === "dark" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-purple-50 text-purple-600 border-purple-200/50", label: "COLLAB", icon: <Users className="w-3 h-3" /> },
      lyrics: { color: theme === "dark" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-green-50 text-green-600 border-green-200/50", label: "LYRICS", icon: <FileText className="w-3 h-3" /> },
      writer: { color: theme === "dark" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "bg-orange-50 text-orange-600 border-orange-200/50", label: "WRITER", icon: <FileText className="w-3 h-3" /> },
      audition: { color: theme === "dark" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-red-50 text-red-600 border-red-200/50", label: "AUDITION", icon: <Mic className="w-3 h-3" /> },
      label: { color: theme === "dark" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : "bg-yellow-50 text-yellow-600 border-yellow-200/50", label: "LABEL", icon: <Crown className="w-3 h-3" /> }
    };
    return configs[type as keyof typeof configs] || configs.snippet;
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
                    Music Services
                  </h1>
                </div>
                <p className={`text-sm font-light tracking-wide ${
                  theme === "dark" ? "text-zinc-500" : "text-gray-600"
                }`}>
                  Collaborate, create, and connect with music professionals
                </p>
              </div>
              <button
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                  theme === "dark"
                    ? "bg-white border-white text-black hover:bg-zinc-100"
                    : "bg-black border-black text-white hover:bg-gray-800"
                }`}
              >
                <Plus className="w-4 h-4" strokeWidth={2} />
                Upload Snippet
              </button>
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
                  placeholder="Search services, users..."
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
                <option value="Pop">Pop</option>
                <option value="Hip Hop">Hip Hop</option>
                <option value="R&B">R&B</option>
                <option value="Rock">Rock</option>
                <option value="Electronic">Electronic</option>
              </select>

              {/* Tab Filters */}
              <div className={`flex items-center gap-1 p-1 rounded-lg border ${
                theme === "dark" ? "border-zinc-800 bg-zinc-900" : "border-gray-300 bg-gray-100"
              }`}>
                {[
                  { key: "snippets", label: "Snippets", icon: Music2 },
                  { key: "collabs", label: "Collabs", icon: Users },
                  { key: "lyrics", label: "Lyrics", icon: FileText },
                  { key: "writers", label: "Writers", icon: FileText },
                  { key: "auditions", label: "Auditions", icon: Mic },
                  { key: "labels", label: "Labels", icon: Crown }
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
              {filteredServices.length} {filteredServices.length === 1 ? "service" : "services"} found
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredServices.map((service) => {
                const typeConfig = getTypeConfig(service.type);
                
                return (
                  <div
                    key={service.id}
                    className={`group rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                      theme === "dark"
                        ? "border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900"
                        : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
                    }`}
                    onClick={() => router.push(`/services/${service.id}`)}
                  >
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={service.user.avatar}
                            alt={service.user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <div className="flex items-center gap-1">
                              <span className={`text-sm font-light tracking-wide ${
                                theme === "dark" ? "text-white" : "text-gray-900"
                              }`}>
                                {service.user.name}
                              </span>
                              {service.user.verified && (
                                <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                              )}
                            </div>
                            <div className={`text-xs font-light tracking-wide ${
                              theme === "dark" ? "text-zinc-500" : "text-gray-600"
                            }`}>
                              {formatNumber(service.user.followers)} followers
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-light tracking-wide border flex items-center gap-1 ${typeConfig.color}`}>
                            {typeConfig.icon}
                            {typeConfig.label}
                          </span>
                          <span className={`text-xs font-light tracking-wide ${
                            theme === "dark" ? "text-zinc-500" : "text-gray-600"
                          }`}>
                            {service.date}
                          </span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className={`text-base font-light tracking-wide mb-2 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {service.title}
                      </h3>
                      <p className={`text-sm font-light tracking-wide mb-3 line-clamp-2 ${
                        theme === "dark" ? "text-zinc-400" : "text-gray-600"
                      }`}>
                        {service.description}
                      </p>

                      {/* Audio Player for Snippets */}
                      {service.type === 'snippet' && (
                        <div className={`
                          p-3 rounded-lg mb-3 border
                          ${theme === "dark"
                            ? "bg-zinc-900 border-zinc-800"
                            : "bg-gray-50 border-gray-300"
                          }
                        `}>
                          <div className="flex items-center justify-between mb-2">
                            <button
                              onClick={(e) => togglePlay(service.id, e)}
                              className={`
                                p-2 rounded-full transition-colors
                                ${theme === "dark"
                                  ? "bg-purple-500/20 hover:bg-purple-500/30 text-purple-400"
                                  : "bg-purple-100 hover:bg-purple-200 text-purple-600"
                                }
                              `}
                            >
                              {isPlaying === service.id ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                            <span className={`text-xs font-light tracking-wide ${
                              theme === "dark" ? "text-zinc-500" : "text-gray-600"
                            }`}>
                              {service.duration}
                            </span>
                            <span className={`text-xs font-light tracking-wide ${
                              theme === "dark" ? "text-zinc-500" : "text-gray-600"
                            }`}>
                              {formatNumber(service.plays!)} plays
                            </span>
                          </div>
                          <div className={`h-1 rounded-full overflow-hidden ${
                            theme === "dark" ? "bg-zinc-700" : "bg-gray-200"
                          }`}>
                            <div
                              className={`h-full ${
                                theme === "dark" ? "bg-purple-500" : "bg-purple-600"
                              }`}
                              style={{ width: isPlaying === service.id ? "70%" : "0%" }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Lyrics Preview */}
                      {service.type === 'lyrics' && service.lyrics && (
                        <div className={`
                          p-3 rounded-lg mb-3 border italic
                          ${theme === "dark"
                            ? "bg-zinc-900 border-zinc-800 text-zinc-400"
                            : "bg-gray-50 border-gray-300 text-gray-600"
                          }
                        `}>
                          <p className="text-xs font-light tracking-wide line-clamp-2">{service.lyrics}</p>
                        </div>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {service.tags.slice(0, 3).map((tag, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 text-xs font-light tracking-wide rounded ${
                              theme === "dark"
                                ? "bg-zinc-800 text-zinc-400"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                        {service.genre.map((genre, i) => (
                          <span
                            key={`g-${i}`}
                            className={`px-2 py-0.5 text-xs font-light tracking-wide rounded border ${
                              theme === "dark"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                : "bg-blue-50 text-blue-600 border-blue-200/50"
                            }`}
                          >
                            {genre}
                          </span>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className={`flex items-center justify-between pt-3 border-t ${
                        theme === "dark" ? "border-zinc-800" : "border-gray-300"
                      }`}>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => toggleLike(service.id, e)}
                            className="flex items-center gap-1"
                          >
                            <Heart className={`w-3.5 h-3.5 ${service.liked ? "fill-red-500 text-red-500" : theme === "dark" ? "text-zinc-500" : "text-gray-500"}`} />
                            <span className={`text-xs font-light tracking-wide ${
                              service.liked ? "text-red-500" : theme === "dark" ? "text-zinc-400" : "text-gray-600"
                            }`}>
                              {service.likes}
                            </span>
                          </button>
                          {service.comments !== undefined && (
                            <div className="flex items-center gap-1">
                              <MessageCircle className={`w-3.5 h-3.5 ${theme === "dark" ? "text-zinc-500" : "text-gray-500"}`} />
                              <span className={`text-xs font-light tracking-wide ${
                                theme === "dark" ? "text-zinc-400" : "text-gray-600"
                              }`}>
                                {service.comments}
                              </span>
                            </div>
                          )}
                          {service.collaborators !== undefined && (
                            <div className="flex items-center gap-1">
                              <Users className={`w-3.5 h-3.5 ${theme === "dark" ? "text-zinc-500" : "text-gray-500"}`} />
                              <span className={`text-xs font-light tracking-wide ${
                                theme === "dark" ? "text-zinc-400" : "text-gray-600"
                              }`}>
                                {service.collaborators}
                              </span>
                            </div>
                          )}
                        </div>

                        <button
                          className={`
                            flex items-center gap-1.5 px-3 py-1.5 text-xs font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95
                            ${theme === "dark"
                              ? "bg-white border-white text-black hover:bg-zinc-100"
                              : "bg-black border-black text-white hover:bg-gray-800"
                            }
                          `}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (service.type === 'snippet') {
                              // Handle snippet action
                            } else if (service.type === 'collab') {
                              router.push(`/collabs/create/${service.id}`);
                            } else if (service.type === 'lyrics') {
                              router.push(`/services/create/${service.id}`);
                            } else if (service.type === 'writer') {
                              router.push(`/services/edit/${service.id}`);
                            } else if (service.type === 'audition') {
                              router.push(`/services/auditions/${service.auditionType}/${service.id}`);
                            }
                          }}
                        >
                          {service.type === 'snippet' ? 'Request Feature' :
                           service.type === 'collab' ? 'Join Collab' :
                           service.type === 'lyrics' ? 'Review Lyrics' :
                           service.type === 'writer' ? 'Hire Writer' :
                           service.type === 'audition' ? 'Submit Audition' : 'Contact Label'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredServices.length === 0 && (
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
                  No services found
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
            {/* Trending Snippets */}
            <div className={`rounded-xl border p-4 ${
              theme === "dark" 
                ? "border-zinc-800 bg-zinc-950" 
                : "border-gray-300 bg-white"
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className={`w-4 h-4 ${
                  theme === "dark" ? "text-purple-400" : "text-purple-600"
                }`} />
                <h2 className={`text-lg font-light tracking-wide ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  Trending Snippets
                </h2>
              </div>
              <div className="space-y-3">
                {trendingSnippets.map((snippet) => (
                  <div
                    key={snippet.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                      theme === "dark"
                        ? "border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800"
                        : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
                    }`}
                  >
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      ${theme === "dark" ? "bg-purple-500/20" : "bg-purple-100"}
                    `}>
                      <Play className={`w-4 h-4 ${
                        theme === "dark" ? "text-purple-400" : "text-purple-600"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-light tracking-wide truncate ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {snippet.title}
                      </div>
                      <div className={`text-xs font-light tracking-wide ${
                        theme === "dark" ? "text-zinc-500" : "text-gray-600"
                      }`}>
                        {snippet.user}
                      </div>
                    </div>
                    <div className={`text-xs font-light tracking-wide flex-shrink-0 ${
                      theme === "dark" ? "text-zinc-500" : "text-gray-600"
                    }`}>
                      {snippet.duration}
                    </div>
                  </div>
                ))}
              </div>
              <button
                className={`
                  w-full mt-3 px-3 py-2 text-xs font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95
                  ${theme === "dark"
                    ? "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
                    : "border-gray-300 text-gray-600 hover:text-black hover:border-gray-400"
                  }
                `}
              >
                View All
              </button>
            </div>

            {/* Divider */}
            <div className={`h-px ${
              theme === "dark" ? "bg-zinc-800" : "bg-gray-300"
            }`} />

            {/* Half Songs */}
            <div className={`rounded-xl border p-4 ${
              theme === "dark" 
                ? "border-zinc-800 bg-zinc-950" 
                : "border-gray-300 bg-white"
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <Music2 className={`w-4 h-4 ${
                  theme === "dark" ? "text-purple-400" : "text-purple-600"
                }`} />
                <h2 className={`text-lg font-light tracking-wide ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  Finish These Songs
                </h2>
              </div>
              <div className="space-y-3">
                {[
                  { title: "Midnight Dreams", needs: "Needs Verse", genre: "Pop", progress: 45 },
                  { title: "City Lights", needs: "Needs Hook", genre: "R&B", progress: 60 },
                  { title: "Revolution", needs: "Needs Bridge", genre: "Rock", progress: 75 }
                ].map((song, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border ${
                      theme === "dark"
                        ? "border-zinc-800 bg-zinc-900"
                        : "border-gray-300 bg-gray-50"
                    }`}
                  >
                    <div className={`text-sm font-light tracking-wide mb-1 ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      {song.title} ({song.needs})
                    </div>
                    <div className={`text-xs font-light tracking-wide mb-2 ${
                      theme === "dark" ? "text-zinc-500" : "text-gray-600"
                    }`}>
                      {song.genre} • {song.progress}% complete
                    </div>
                    <div className={`h-1.5 rounded-full overflow-hidden ${
                      theme === "dark" ? "bg-zinc-800" : "bg-gray-200"
                    }`}>
                      <div
                        className={`h-full ${
                          theme === "dark" ? "bg-purple-500" : "bg-purple-600"
                        }`}
                        style={{ width: `${song.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                className={`
                  w-full mt-3 px-3 py-2 text-xs font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95
                  ${theme === "dark"
                    ? "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
                    : "border-gray-300 text-gray-600 hover:text-black hover:border-gray-400"
                  }
                `}
              >
                Browse More
              </button>
            </div>

            {/* Divider */}
            <div className={`h-px ${
              theme === "dark" ? "bg-zinc-800" : "bg-gray-300"
            }`} />

            {/* Recent Activity */}
            <div className={`rounded-xl border p-4 ${
              theme === "dark" 
                ? "border-zinc-800 bg-zinc-950" 
                : "border-gray-300 bg-white"
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <Clock className={`w-4 h-4 ${
                  theme === "dark" ? "text-purple-400" : "text-purple-600"
                }`} />
                <h2 className={`text-lg font-light tracking-wide ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  Recent Activity
                </h2>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Beat Master", avatar: "https://randomuser.me/api/portraits/men/41.jpg", action: "liked your snippet", item: "summer vibes", time: "15 min ago" },
                  { name: "Lyric Queen", avatar: "https://randomuser.me/api/portraits/women/63.jpg", action: "requested to collab on", item: "your track", time: "1 hour ago" },
                  { name: "Urban Records", avatar: "https://randomuser.me/api/portraits/men/32.jpg", action: "viewed", item: "your profile", time: "3 hours ago" }
                ].map((activity, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all duration-200 ${
                      theme === "dark"
                        ? "border-zinc-800 bg-zinc-900"
                        : "border-gray-300 bg-gray-50"
                    }`}
                  >
                    <img
                      src={activity.avatar}
                      alt={activity.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-light tracking-wide ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        <span className="font-light">{activity.name}</span>
                        {' '}
                        <span className={theme === "dark" ? "text-zinc-500" : "text-gray-600"}>
                          {activity.action}
                        </span>
                        {' '}
                        <span className="font-light">{activity.item}</span>
                      </div>
                      <div className={`text-xs font-light tracking-wide mt-0.5 ${
                        theme === "dark" ? "text-zinc-600" : "text-gray-500"
                      }`}>
                        {activity.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className={`
                  w-full mt-3 px-3 py-2 text-xs font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95
                  ${theme === "dark"
                    ? "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
                    : "border-gray-300 text-gray-600 hover:text-black hover:border-gray-400"
                  }
                `}
              >
                See All Activity
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}