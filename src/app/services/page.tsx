"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Heart, Play, Pause, Music2, Users, FileText, Mic, Crown, MessageCircle, Plus, TrendingUp, Clock, CheckCircle, Lock, Globe, UserPlus, EyeOff, AlertCircle, Info, Pencil, Send } from "lucide-react";
import { usePermissions } from "../../hooks/usePermissions";

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
  lyricsVisibility?: 'public' | 'club' | 'followers';
  price?: number | string;
  deadline?: string;
  status?: 'open' | 'completed' | 'in-progress';
  collaborators?: number;
  comments?: number;
  date: string;
  allowsAnonymous?: boolean;
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
    lyricsVisibility: 'public',
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
    auditionType: 'artist',
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
    date: "1 week ago",
    allowsAnonymous: true
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
  },
  {
    id: 7,
    type: 'lyrics',
    title: "Private Lyrics for Club Members",
    user: {
      name: "Secret Wordsmith",
      avatar: "https://randomuser.me/api/portraits/men/18.jpg",
      verified: false,
      followers: 2100
    },
    description: "Exclusive lyrics shared only with my club. Join to see the full content!",
    tags: ["Hip Hop", "Private", "Exclusive"],
    genre: ["Hip Hop"],
    likes: 42,
    liked: false,
    lyrics: "Hidden behind the curtain...",
    lyricsVisibility: 'club',
    date: "4 days ago"
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

const getReputationTier = (followers: number): 'newbie' | 'rising' | 'verified' | 'pro' | 'industry' => {
  if (followers >= 500000) return 'industry';
  if (followers >= 50000) return 'pro';
  if (followers >= 5000) return 'verified';
  if (followers >= 100) return 'rising';
  return 'newbie';
};

const getReputationBadge = (tier: string) => {
  const configs = {
    newbie: { label: 'Newbie', color: 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50' },
    rising: { label: 'Rising', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    verified: { label: 'Verified', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    pro: { label: 'Pro', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    industry: { label: 'Industry', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' }
  };
  return configs[tier as keyof typeof configs] || configs.newbie;
};

export default function MusicServices() {
  const router = useRouter();
  const { permissions, isArtist, isProducer, isLyricist } = usePermissions();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [activeTab, setActiveTab] = useState("snippets");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedService, setSelectedService] = useState("all");
  const [isPlaying, setIsPlaying] = useState<number | null>(null);
  const [services, setServices] = useState<MusicService[]>(musicServices);
  const [showPermissionBanner, setShowPermissionBanner] = useState(true);

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

  const canViewAudition = (audition: MusicService) => {
    if (!audition.auditionType || !permissions.canViewAuditionsByType) {
      return permissions.canSubmitToAuditions;
    }
    if (audition.auditionType === 'artist' && isArtist) return true;
    if (audition.auditionType === 'producer' && isProducer) return true;
    if (audition.auditionType === 'lyricist' && isLyricist) return true;
    return permissions.canHostAuditions;
  };

  const canViewLyrics = (lyrics: MusicService) => {
    if (!lyrics.lyricsVisibility || lyrics.lyricsVisibility === 'public') {
      return permissions.canViewLyrics;
    }
    return permissions.canViewPrivateLyrics;
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

    if (service.type === 'audition' && !canViewAudition(service)) return false;
    if (service.type === 'lyrics' && !canViewLyrics(service)) return false;

    return matchesSearch && matchesGenre && matchesService && matchesTab;
  });

  const getTypeConfig = (type: string) => {
    const configs = {
      snippet: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", label: "Snippet", icon: <Music2 className="w-3 h-3" /> },
      collab: { color: "bg-purple-500/10 text-purple-400 border-purple-500/20", label: "Collab", icon: <Users className="w-3 h-3" /> },
      lyrics: { color: "bg-green-500/10 text-green-400 border-green-500/20", label: "Lyrics", icon: <FileText className="w-3 h-3" /> },
      writer: { color: "bg-orange-500/10 text-orange-400 border-orange-500/20", label: "Writer", icon: <FileText className="w-3 h-3" /> },
      audition: { color: "bg-red-500/10 text-red-400 border-red-500/20", label: "Audition", icon: <Mic className="w-3 h-3" /> },
      label: { color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", label: "Label", icon: <Crown className="w-3 h-3" /> }
    };
    return configs[type as keyof typeof configs] || configs.snippet;
  };

  const getPrivacyIcon = (visibility?: string) => {
    if (visibility === 'club') return <Lock className="w-3 h-3" />;
    if (visibility === 'followers') return <UserPlus className="w-3 h-3" />;
    return <Globe className="w-3 h-3" />;
  };

  const getPrivacyLabel = (visibility?: string) => {
    if (visibility === 'club') return 'Club Only';
    if (visibility === 'followers') return 'Followers Only';
    return 'Public';
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-[#030303] text-white">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Permission Banner */}
        {showPermissionBanner && (
          <div className="mb-6 p-4 rounded-xl border border-blue-900/30 bg-blue-950/20">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Info className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-400" />
                <div>
                  <h3 className="text-sm font-medium mb-2 text-blue-300">
                    Your Music Services Permissions ({permissions.role})
                  </h3>
                  <div className="text-xs space-y-1 text-blue-400/70">
                    <div className="flex flex-wrap gap-2">
                      {permissions.canUploadSnippets && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-blue-400" /> Upload Snippets
                        </span>
                      )}
                      {permissions.canPostLyrics && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-blue-400" /> Post Lyrics
                        </span>
                      )}
                      {permissions.canCreateWriterGigs && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-blue-400" /> Create Writer Gigs
                        </span>
                      )}
                      {permissions.canHostAuditions && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-blue-400" /> Host Auditions
                        </span>
                      )}
                      {permissions.canSubmitToAuditions && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-blue-400" /> Submit to Auditions
                        </span>
                      )}
                      {permissions.canSubmitAnonymousAudition && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-blue-400" /> Anonymous Submissions
                        </span>
                      )}
                      {permissions.canCreateCollabRequest && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-blue-400" /> Create Collabs
                        </span>
                      )}
                      {permissions.canGiveProfessionalReview && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-blue-400" /> Professional Reviews
                        </span>
                      )}
                    </div>
                    <p className="mt-2">
                      Reputation Tier: <span className="font-medium text-blue-300">{permissions.reputationTier.charAt(0).toUpperCase() + permissions.reputationTier.slice(1)}</span>
                      {permissions.isVerifiedCreator && " • Verified Creator"}
                      {permissions.isProfessionalReviewer && " • Professional Reviewer"}
                      {permissions.isLabelPartner && " • Label Partner"}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowPermissionBanner(false)}
                className="text-xs px-2 py-1 rounded text-blue-400 hover:bg-black/20"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">

          {/* Main Content - 3 columns */}
          <div className="xl:col-span-3">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white">
                    <Music2 className="w-4 h-4 text-black" strokeWidth={2.5} />
                  </div>
                  <h1 className="text-2xl font-light tracking-tight text-white">
                    Music Services
                  </h1>
                </div>
                <p className="text-sm font-light tracking-wide text-zinc-400">
                  Collaborate, create, and connect with music professionals
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {permissions.canUploadSnippets && (
                  <button className="flex items-center gap-2 px-4 py-2 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 bg-white border-white text-black hover:bg-zinc-200">
                    <Plus className="w-4 h-4" strokeWidth={2} />
                    Upload Snippet
                  </button>
                )}
                {permissions.canPostLyrics && (
                  <button className="flex items-center gap-2 px-4 py-2 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800">
                    <Pencil className="w-4 h-4" strokeWidth={2} />
                    Post Lyrics
                  </button>
                )}
                {permissions.canHostAuditions && (
                  <button className="flex items-center gap-2 px-4 py-2 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800">
                    <Mic className="w-4 h-4" strokeWidth={2} />
                    Host Audition
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-8 p-4 rounded-xl border border-zinc-800 bg-[#0A0A0A]">
              {/* Search */}
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Search services, users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide focus:outline-none bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-600 focus:bg-zinc-800"
                />
              </div>

              {/* Genre Filter */}
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-4 py-3 text-sm font-light rounded-lg border transition-all duration-200 cursor-pointer tracking-wide focus:outline-none bg-zinc-900 border-zinc-800 text-white focus:border-zinc-600 focus:bg-zinc-800"
              >
                <option value="all">All Genres</option>
                <option value="Pop">Pop</option>
                <option value="Hip Hop">Hip Hop</option>
                <option value="R&B">R&B</option>
                <option value="Rock">Rock</option>
                <option value="Electronic">Electronic</option>
              </select>

              {/* Tab Filters */}
              <div className="flex items-center gap-1 p-1 rounded-lg border border-zinc-800 bg-zinc-900 overflow-x-auto no-scrollbar">
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
                        flex items-center gap-2 px-4 py-2 text-sm font-light rounded transition-all duration-200 tracking-wide whitespace-nowrap
                        ${activeTab === tab.key
                          ? "bg-white text-black"
                          : "text-zinc-400 hover:text-white"
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
            <div className="text-sm font-light tracking-wide mb-6 text-zinc-500">
              {filteredServices.length} {filteredServices.length === 1 ? "service" : "services"} found
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredServices.map((service) => {
                const typeConfig = getTypeConfig(service.type);
                const repTier = getReputationTier(service.user.followers);
                const repBadge = getReputationBadge(repTier);

                const canInteract =
                  (service.type === 'snippet' && permissions.canUploadSnippets) ||
                  (service.type === 'collab' && permissions.canJoinPaidCollabs) ||
                  (service.type === 'lyrics' && permissions.canGiveFeedback) ||
                  (service.type === 'writer' && permissions.canCreateWriterGigs) ||
                  (service.type === 'audition' && permissions.canSubmitToAuditions) ||
                  (service.type === 'label' && permissions.canPostLabelOpportunity);

                return (
                  <div
                    key={service.id}
                    className="group rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer active:scale-[0.98] border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900"
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
                              <span className="text-sm font-light tracking-wide text-white">
                                {service.user.name}
                              </span>
                              {service.user.verified && (
                                <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-xs font-light tracking-wide text-zinc-400">
                                {formatNumber(service.user.followers)} followers
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-light tracking-wide border ${repBadge.color}`}>
                                {repBadge.label}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-light tracking-wide border flex items-center gap-1 ${typeConfig.color}`}>
                            {typeConfig.icon}
                            {typeConfig.label}
                          </span>
                          <span className="text-xs font-light tracking-wide text-zinc-500">
                            {service.date}
                          </span>
                        </div>
                      </div>

                      {/* Privacy Badge for Lyrics */}
                      {service.type === 'lyrics' && service.lyricsVisibility && (
                        <div className="mb-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-light tracking-wide border ${
                            service.lyricsVisibility === 'club'
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : service.lyricsVisibility === 'followers'
                              ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                              : "bg-green-500/10 text-green-400 border-green-500/20"
                          }`}>
                            {getPrivacyIcon(service.lyricsVisibility)}
                            {getPrivacyLabel(service.lyricsVisibility)}
                          </span>
                        </div>
                      )}

                      {/* Anonymous Badge for Auditions */}
                      {service.type === 'audition' && service.allowsAnonymous && permissions.canSubmitAnonymousAudition && (
                        <div className="mb-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-light tracking-wide border bg-purple-500/10 text-purple-400 border-purple-500/20">
                            <EyeOff className="w-3 h-3" />
                            Anonymous Submissions Allowed
                          </span>
                        </div>
                      )}

                      {/* Title & Description */}
                      <h3 className="text-base font-medium tracking-wide mb-2 text-white line-clamp-1">
                        {service.title}
                      </h3>
                      <p className="text-sm font-light tracking-wide mb-3 line-clamp-2 text-zinc-400">
                        {service.description}
                      </p>

                      {/* Audio Player for Snippets */}
                      {service.type === 'snippet' && (
                        <div className="p-3 rounded-lg mb-3 border bg-zinc-900 border-zinc-800">
                          <div className="flex items-center justify-between mb-2">
                            <button
                              onClick={(e) => togglePlay(service.id, e)}
                              className="p-2 rounded-full transition-colors bg-purple-500/20 hover:bg-purple-500/30 text-purple-400"
                            >
                              {isPlaying === service.id ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                            <span className="text-xs font-light tracking-wide text-zinc-400">
                              {service.duration}
                            </span>
                            <span className="text-xs font-light tracking-wide text-zinc-400">
                              {formatNumber(service.plays!)} plays
                            </span>
                          </div>
                          <div className="h-1 rounded-full overflow-hidden bg-zinc-800">
                            <div
                              className="h-full bg-purple-500"
                              style={{ width: isPlaying === service.id ? "70%" : "0%" }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Lyrics Preview */}
                      {service.type === 'lyrics' && service.lyrics && canViewLyrics(service) && (
                        <div className="p-3 rounded-lg mb-3 border italic bg-zinc-900 border-zinc-800 text-zinc-400">
                          <p className="text-xs font-light tracking-wide line-clamp-2">{service.lyrics}</p>
                        </div>
                      )}

                      {/* Blocked Lyrics Preview */}
                      {service.type === 'lyrics' && !canViewLyrics(service) && (
                        <div className="p-3 rounded-lg mb-3 border flex items-center gap-2 bg-zinc-900 border-zinc-800 text-zinc-500">
                          <Lock className="w-4 h-4" />
                          <p className="text-xs font-light tracking-wide">
                            {service.lyricsVisibility === 'club'
                              ? 'Join their club to view these lyrics'
                              : 'Follow this user to view private lyrics'}
                          </p>
                        </div>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {service.tags.slice(0, 3).map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 text-xs font-light tracking-wide rounded bg-zinc-900 text-zinc-400 border border-zinc-800"
                          >
                            {tag}
                          </span>
                        ))}
                        {service.genre.map((genre, i) => (
                          <span
                            key={`g-${i}`}
                            className="px-2 py-1 text-xs font-light tracking-wide rounded border bg-blue-500/10 text-blue-400 border-blue-500/20"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={(e) => toggleLike(service.id, e)}
                            className="flex items-center gap-1.5 group/btn"
                          >
                            <Heart className={`w-3.5 h-3.5 ${service.liked ? "fill-red-500 text-red-500" : "text-zinc-500 group-hover/btn:text-white transition-colors"}`} />
                            <span className={`text-xs font-light tracking-wide ${
                              service.liked ? "text-red-500" : "text-zinc-400"
                            }`}>
                              {service.likes}
                            </span>
                          </button>
                          {service.comments !== undefined && (
                            <div className="flex items-center gap-1.5">
                              <MessageCircle className="w-3.5 h-3.5 text-zinc-500" />
                              <span className="text-xs font-light tracking-wide text-zinc-400">
                                {service.comments}
                              </span>
                            </div>
                          )}
                          {service.collaborators !== undefined && (
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-zinc-500" />
                              <span className="text-xs font-light tracking-wide text-zinc-400">
                                {service.collaborators}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Permission-based Action Button */}
                        {canInteract ? (
                          <button
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 bg-white border-white text-black hover:bg-zinc-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (service.type === 'snippet') {
                                // Handled contextually
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
                            <Send className="w-3 h-3" />
                            {service.type === 'snippet' ? 'Collab' :
                             service.type === 'collab' ? 'Join Collab' :
                             service.type === 'lyrics' ? 'Give Feedback' :
                             service.type === 'writer' ? 'Apply' :
                             service.type === 'audition' ? 'Submit' : 'Contact'}
                          </button>
                        ) : (
                          <div className="text-xs font-light tracking-wide flex items-center gap-1 text-zinc-500">
                            <AlertCircle className="w-3.5 h-3.5" />
                            No Access
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredServices.length === 0 && (
              <div className="text-center py-16 rounded-xl border border-zinc-800 bg-zinc-950">
                <Music2 className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
                <p className="text-sm font-medium tracking-wide mb-1 text-zinc-300">
                  No services found
                </p>
                <p className="text-xs font-light tracking-wide text-zinc-500">
                  Try adjusting your filters or search query
                </p>
              </div>
            )}
          </div>

          {/* Sidebar - 1 column */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* Trending Snippets */}
            <div className="rounded-xl border p-5 border-zinc-800 bg-[#0A0A0A]">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <h2 className="text-lg font-light tracking-wide text-white">
                  Trending Snippets
                </h2>
              </div>
              <div className="space-y-3">
                {trendingSnippets.map((snippet) => (
                  <div
                    key={snippet.id}
                    className="flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/20">
                      <Play className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium tracking-wide truncate text-zinc-200">
                        {snippet.title}
                      </div>
                      <div className="text-xs font-light tracking-wide text-zinc-500">
                        {snippet.user}
                      </div>
                    </div>
                    <div className="text-xs font-light tracking-wide flex-shrink-0 text-zinc-500">
                      {snippet.duration}
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 px-3 py-2 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600">
                View All
              </button>
            </div>

            {/* Finish Songs */}
            <div className="rounded-xl border p-5 border-zinc-800 bg-[#0A0A0A]">
              <div className="flex items-center gap-2 mb-4">
                <Music2 className="w-4 h-4 text-purple-400" />
                <h2 className="text-lg font-light tracking-wide text-white">
                  Finish These Songs
                </h2>
              </div>
              <div className="space-y-3">
                {[
                  { title: "Midnight Dreams", needs: "Needs Verse", genre: "Pop", progress: 45 },
                  { title: "City Lights", needs: "Needs Hook", genre: "R&B", progress: 60 },
                  { title: "Revolution", needs: "Needs Bridge", genre: "Rock", progress: 75 }
                ].map((song, i) => (
                  <div key={i} className="p-3 rounded-lg border border-zinc-800 bg-zinc-900">
                    <div className="text-sm font-medium tracking-wide mb-1 text-zinc-200">
                      {song.title} <span className="text-zinc-500 font-light">({song.needs})</span>
                    </div>
                    <div className="text-xs font-light tracking-wide mb-3 text-zinc-500">
                      {song.genre} • {song.progress}% complete
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-zinc-800">
                      <div
                        className="h-full bg-purple-500"
                        style={{ width: `${song.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 px-3 py-2 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600">
                Browse More
              </button>
            </div>

            {/* Recent Activity */}
            <div className="rounded-xl border p-5 border-zinc-800 bg-[#0A0A0A]">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-purple-400" />
                <h2 className="text-lg font-light tracking-wide text-white">
                  Recent Activity
                </h2>
              </div>
              <div className="space-y-4">
                {[
                  { name: "Beat Master", avatar: "https://randomuser.me/api/portraits/men/41.jpg", action: "liked your snippet", item: "summer vibes", time: "15 min ago" },
                  { name: "Lyric Queen", avatar: "https://randomuser.me/api/portraits/women/63.jpg", action: "requested to collab on", item: "your track", time: "1 hour ago" },
                  { name: "Urban Records", avatar: "https://randomuser.me/api/portraits/men/32.jpg", action: "viewed", item: "your profile", time: "3 hours ago" }
                ].map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 border-zinc-800 bg-zinc-900">
                    <img
                      src={activity.avatar}
                      alt={activity.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-light tracking-wide text-zinc-300">
                        <span className="font-medium text-white">{activity.name}</span>
                        {' '}
                        <span className="text-zinc-500">
                          {activity.action}
                        </span>
                        {' '}
                        <span className="font-medium">{activity.item}</span>
                      </div>
                      <div className="text-xs font-light tracking-wide mt-1 text-zinc-500">
                        {activity.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 px-3 py-2 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600">
                See All Activity
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}