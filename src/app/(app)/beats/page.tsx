"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Music2, Play, Pause, Heart, ShoppingCart, TrendingUp, DollarSign,
  Plus, Upload as UploadIcon, Users, Edit3, BarChart3, MessageCircle, Briefcase, Loader2
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { getRoleDisplayName } from '@/lib/permissions';
import { useBeats, type Beat as APIBeat } from "@/hooks/useBeats";

import { formatAmount } from "@/lib/currency";

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

function hasBeatsData(data: unknown): data is { data?: { beats?: APIBeat[] }; beats?: APIBeat[] } {
  return typeof data === 'object' && data !== null;
}

const transformBeat = (apiBeat: APIBeat): Beat => {
  return {
    id: parseInt(apiBeat.id.slice(0, 8), 16),
    title: apiBeat.title,
    producer: {
      name: apiBeat.producer?.username || apiBeat.producer?.email?.split('@')[0] || 'Unknown',
      avatar: apiBeat.producer?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${apiBeat.producer.id}`,
      verified: apiBeat.producer?.verified || false,
    },
    bpm: apiBeat.bpm,
    price: Number(apiBeat.price),
    genre: apiBeat.genres || [],
    mood: apiBeat.moods || [],
    plays: apiBeat.plays || Math.floor(Math.random() * 500000) + 10000,
    likes: apiBeat.likes || 0,
    liked: false, 
    image: apiBeat.imageUrl || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
    audio: apiBeat.audioUrl,
    type: apiBeat.type === 'EXCLUSIVE' ? 'exclusive' : 'lease',
    description: apiBeat.description || "",
    previewAvailable: 'free' as const,
  };
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export default function BeatMarketplace() {
  const router = useRouter();
  const { permissions, isProducer, isArtist, isLyricist } = usePermissions();

  const [activeTab, setActiveTab] = useState("trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedMood, setSelectedMood] = useState("all");
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data, isLoading, error } = useBeats({
    search: debouncedSearch || undefined,
    genre: selectedGenre !== "all" ? selectedGenre : undefined,
    mood: selectedMood !== "all" ? selectedMood : undefined,
  });

  let apiBeats: APIBeat[] = [];
  
  if (hasBeatsData(data)) {
    if (Array.isArray(data)) {
      apiBeats = data as APIBeat[];
    } else if (data.data?.beats) {
      apiBeats = data.data.beats;
    } else if (data.beats) {
      apiBeats = data.beats;
    }
  }
  
  const beats = apiBeats.map(transformBeat);

  const toggleLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Like beat:", id);
  };

  const togglePlay = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentlyPlaying(currentlyPlaying === id ? null : id);
  };

  const filteredBeats = beats;

  const BeatCardActions = ({ beat }: { beat: Beat }) => {
    const isOwnBeat = false; // Replace with: currentUser?.id === beat.producerId

    if (isOwnBeat && permissions.canUploadBeats) {
      return (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/beats/${beat.id}/edit`);
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 bg-white border-white text-black hover:bg-zinc-200"
          >
            <Edit3 className="w-4 h-4" strokeWidth={2} />
            Edit
          </button>

          {permissions.canViewBeatAnalytics && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/beats/${beat.id}/analytics`);
              }}
              className="p-2.5 rounded-lg border transition-all duration-200 active:scale-95 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-zinc-800"
            >
              <BarChart3 className="w-4 h-4" strokeWidth={2} />
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="flex gap-2">
        {permissions.canPurchaseBeats && (
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 bg-white border-white text-black hover:bg-zinc-200"
          >
            <ShoppingCart className="w-4 h-4" strokeWidth={2} />
            Add to Cart
          </button>
        )}

        {permissions.canSendLicensingOffers && (
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="p-2.5 rounded-lg border transition-all duration-200 active:scale-95 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-zinc-800"
            title="Make Offer"
          >
            <DollarSign className="w-4 h-4" strokeWidth={2} />
          </button>
        )}

        {permissions.canMessageProducers && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/messages/${beat.producer.name}`);
            }}
            className="p-2.5 rounded-lg border transition-all duration-200 active:scale-95 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-zinc-800"
            title="Message Producer"
          >
            <MessageCircle className="w-4 h-4" strokeWidth={2} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-[#030303] text-white">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          <div className="xl:col-span-3">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white">
                    <Music2 className="w-4 h-4 text-black" strokeWidth={2.5} />
                  </div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Beat Marketplace
                  </h1>
                </div>
                <p className="text-sm font-medium tracking-wide text-zinc-400">
                  Discover and license premium beats from top producers
                </p>
              </div>

              {permissions.canUploadBeats && (
                <button
                  onClick={() => router.push('/beats/upload')}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 bg-white border-white text-black hover:bg-zinc-200"
                >
                  <Plus className="w-4 h-4" strokeWidth={2} />
                  Upload Beat
                </button>
              )}
            </div>

            {isProducer && permissions.canUploadBeats && (
              <div className="mb-6 p-4 rounded-lg border bg-blue-950/20 border-blue-900/30">
                <div className="flex items-start gap-3">
                  <Music2 className="w-5 h-5 flex-shrink-0 text-blue-400" strokeWidth={2} />
                  <div>
                    <p className="text-sm font-medium tracking-wide text-blue-300">
                      Producer Dashboard
                    </p>
                    <p className="text-xs font-medium tracking-wide mt-1 text-blue-400/70">
                      You can upload beats, view analytics, and manage pricing. Your beats will appear with edit options.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(isArtist || isLyricist) && permissions.canPurchaseBeats && (
              <div className="mb-6 p-4 rounded-lg border bg-purple-950/20 border-purple-900/30">
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 flex-shrink-0 text-purple-400" strokeWidth={2} />
                  <div>
                    <p className="text-sm font-medium tracking-wide text-purple-300">
                      {getRoleDisplayName(permissions.role as any)} Access
                    </p>
                    <p className="text-xs font-medium tracking-wide mt-1 text-purple-400/70">
                      Purchase beats, send licensing offers, comment on tracks, and request collaborations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 mb-8 p-4 rounded-xl border border-zinc-800 bg-[#0A0A0A]">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Search beats, producers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide focus:outline-none bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-600 focus:bg-zinc-800"
                />
              </div>

              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-4 py-3 text-sm font-medium rounded-lg border transition-all duration-200 cursor-pointer tracking-wide focus:outline-none bg-zinc-900 border-zinc-800 text-white focus:border-zinc-600 focus:bg-zinc-800"
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

              <select
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value)}
                className="px-4 py-3 text-sm font-medium rounded-lg border transition-all duration-200 cursor-pointer tracking-wide focus:outline-none bg-zinc-900 border-zinc-800 text-white focus:border-zinc-600 focus:bg-zinc-800"
              >
                <option value="all">All Moods</option>
                <option value="Dark">Dark</option>
                <option value="Aggressive">Aggressive</option>
                <option value="Energetic">Energetic</option>
                <option value="Bright">Bright</option>
                <option value="Chill">Chill</option>
                <option value="Smooth">Smooth</option>
              </select>

              <div className="flex items-center gap-1 p-1 rounded-lg border border-zinc-800 bg-zinc-900 overflow-x-auto scrollbar-hide">
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
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded transition-all duration-200 tracking-wide whitespace-nowrap
                        ${activeTab === tab.key
                          ? "bg-white text-black"
                          : "text-zinc-400 hover:text-white"
                        }`}
                    >
                      <IconComponent className="w-4 h-4" strokeWidth={2} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
              </div>
            )}

            {error && (
              <div className="p-4 rounded-lg border bg-red-500/10 border-red-500/20 text-red-400">
                <p className="text-sm">Failed to load beats. Please try again.</p>
              </div>
            )}

            {!isLoading && !error && (
              <div className="text-sm font-medium tracking-wide mb-6 text-zinc-500">
                {filteredBeats.length} {filteredBeats.length === 1 ? "beat" : "beats"} found
              </div>
            )}

            {!isLoading && !error && (
              <div className="space-y-4">
              {filteredBeats.map((beat) => (
                <div
                  key={beat.id}
                  className="group rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer active:scale-[0.98] border-zinc-800 bg-[#0A0A0A] hover:border-zinc-700 hover:bg-zinc-900"
                  onClick={() => router.push(`/beats/${beat.id}`)}
                >
                  <div className="flex">
                    <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden">
                      <img
                        alt={beat.title}
                        src={beat.image}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all duration-300">
                        <button
                          onClick={(e) => togglePlay(beat.id, e)}
                          className="p-2 rounded-full transition-all duration-300 backdrop-blur-sm bg-white/20 hover:bg-white/40 text-white opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                        >
                          {currentlyPlaying === beat.id ? (
                            <Pause className="w-6 h-6" />
                          ) : (
                            <Play className="w-6 h-6 ml-0.5" />
                          )}
                        </button>
                      </div>

                      <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium tracking-wide backdrop-blur-sm border
                        ${beat.type === 'exclusive'
                          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        }`}
                      >
                        {beat.type === 'exclusive' ? 'Exclusive' : 'Lease'}
                      </div>
                    </div>

                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between h-full">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-4 mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-medium tracking-wide mb-1 truncate text-white">
                                {beat.title}
                              </h3>
                              <div className="flex items-center gap-2 mb-2">
                                <img
                                  src={beat.producer.avatar}
                                  alt={beat.producer.name}
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                                <span className="text-xs font-medium tracking-wide truncate text-zinc-400">
                                  {beat.producer.name}
                                </span>
                                {beat.producer.verified && (
                                  <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center">
                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-xs font-medium flex-shrink-0 text-zinc-500">
                              <div className="flex items-center gap-1">
                                <Play className="w-3 h-3" />
                                <span>{formatNumber(beat.plays)}</span>
                              </div>
                              <button
                                onClick={(e) => toggleLike(beat.id, e)}
                                className="flex items-center gap-1 hover:text-white transition-colors"
                              >
                                <Heart className={`w-3 h-3 ${beat.liked ? "fill-red-500 text-red-500" : ""}`} />
                                <span className={beat.liked ? "text-red-500" : ""}>
                                  {formatNumber(beat.likes)}
                                </span>
                              </button>
                              <div className="text-zinc-600">•</div>
                              <span>{beat.bpm} BPM</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            {beat.genre.slice(0, 2).map((genre, index) => (
                              <span
                                key={index}
                                className="px-2.5 py-1 text-xs font-medium rounded-full tracking-wide bg-zinc-800 text-zinc-300 border border-zinc-700"
                              >
                                {genre}
                              </span>
                            ))}
                            {beat.mood.slice(0, 1).map((mood, index) => (
                              <span
                                key={`mood-${index}`}
                                className="px-2.5 py-1 text-xs font-medium rounded-full tracking-wide border bg-zinc-900 text-zinc-400 border-zinc-800"
                              >
                                {mood}
                              </span>
                            ))}
                          </div>

                          <p className="text-xs font-medium tracking-wide line-clamp-1 text-zinc-500">
                            {beat.description || "No description provided."}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-3 pl-4 border-l border-zinc-800">
                          <div className="text-right">
                            {/* We assume the producer's currency is returned, otherwise fallback to "USD" */}
<div className="text-lg font-medium tracking-tight text-white">
  {formatAmount(beat.price, (beat as any).producer?.currency || "USD")}
</div>
{beat.deal && (
  <div className="text-xs font-medium text-red-400 tracking-wide line-through">
    {formatAmount((beat.price / (1 - beat.deal.discount / 100)), (beat as any).producer?.currency || "USD")}
  </div>
)}
                          </div>

                          <BeatCardActions beat={beat} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredBeats.length === 0 && (
                <div className="text-center py-16 rounded-xl border border-zinc-800 bg-[#0A0A0A]">
                  <Music2 className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
                  <p className="text-sm font-medium tracking-wide mb-1 text-zinc-300">
                    No beats found
                  </p>
                  <p className="text-xs font-medium tracking-wide text-zinc-500">
                    Try adjusting your filters or search query
                  </p>
                </div>
              )}
            </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* Marketplace Stats */}
            <div className="rounded-xl border p-5 border-zinc-800 bg-[#0A0A0A]">
              <h3 className="text-sm font-semibold tracking-wide mb-4 text-white">
                Marketplace Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium tracking-wide text-zinc-400">Total Beats</span>
                  <span className="text-sm font-semibold tracking-wide text-white">{beats.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium tracking-wide text-zinc-400">Active Producers</span>
                  <span className="text-sm font-semibold tracking-wide text-white">
                    {new Set(beats.map(b => b.producer.name)).size}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium tracking-wide text-zinc-400">Deals Available</span>
                  <span className="text-sm font-semibold tracking-wide text-white">
                    {beats.filter(b => b.deal).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium tracking-wide text-zinc-400">Total Plays</span>
                  <span className="text-sm font-semibold tracking-wide text-white">
                    {formatNumber(beats.reduce((sum, b) => sum + b.plays, 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Producers */}
            <div className="rounded-xl border p-5 border-zinc-800 bg-[#0A0A0A]">
              <h3 className="text-sm font-semibold tracking-wide mb-4 text-white">
                Top Producers
              </h3>
              <div className="space-y-3">
                {beats.slice(0, 4).map((beat) => (
                  <div
                    key={beat.id}
                    className="flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-800"
                  >
                    <img
                      src={beat.producer.avatar}
                      alt={beat.producer.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium tracking-wide truncate mb-0.5 text-white">
                        {beat.producer.name}
                      </div>
                      <div className="text-xs font-medium tracking-wide text-zinc-500">
                        {Math.floor(Math.random() * 20) + 5} beats
                      </div>
                    </div>
                    <button
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 bg-white border-white text-black hover:bg-zinc-200"
                    >
                      Follow
                    </button>
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