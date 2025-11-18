"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "../../../providers/ThemeProvider";
import { usePermissions } from "../../../hooks/usePermissions";
import { useCommunityPosts, useCreateCommunityPost, useCommunityStats } from "@/hooks/api/useCommunityPosts";
import {
  ArrowLeft,
  Plus,
  Users,
  MessageSquare,
  Heart,
  Share2,
  Send,
  Image as ImageIcon,
  Video as VideoIcon,
  Smile,
  MoreHorizontal,
  TrendingUp,
  Zap,
  Music2,
  Mic2,
  Building2,
  Package,
  FileText,
  Headphones,
  Crown,
  Flame,
  Sparkles,
  Clock,
  Bookmark,
  PlayCircle,
  Pause,
  Download,
  ShoppingCart,
  Handshake,
  Award,
  CheckCircle,
  Briefcase,
  Volume2,
  Upload,
  X,
  DollarSign,
  Coins,
  Gift,
  Filter,
  Shuffle,
  Radio,
  Calendar,
  Eye,
  ThumbsUp,
  Star,
  Target,
  Rocket
} from "lucide-react";

// Role display configuration
const roleConfig: Record<string, {
  name: string;
  icon: JSX.Element;
  color: string;
  bg: string;
  accent: string;
  postTypes: { icon: JSX.Element; label: string; type: string }[];
}> = {
  ARTIST: {
    name: "Artists",
    icon: <Mic2 className="w-4 h-4" strokeWidth={2} />,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    accent: "border-purple-500/20",
    postTypes: [
      { icon: <Mic2 className="w-4 h-4" />, label: "Vocal Demo", type: "vocal_demo" },
      { icon: <FileText className="w-4 h-4" />, label: "Lyric Snippet", type: "lyric" },
      { icon: <VideoIcon className="w-4 h-4" />, label: "Music Video", type: "video" },
      { icon: <Briefcase className="w-4 h-4" />, label: "Looking for Beats", type: "brief" },
    ]
  },
  PRODUCER: {
    name: "Producers",
    icon: <Music2 className="w-4 h-4" strokeWidth={2} />,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    accent: "border-blue-500/20",
    postTypes: [
      { icon: <Volume2 className="w-4 h-4" />, label: "Beat Snippet", type: "beat" },
      { icon: <Upload className="w-4 h-4" />, label: "Stem Pack", type: "stems" },
      { icon: <Handshake className="w-4 h-4" />, label: "Open Collab", type: "collab" },
      { icon: <TrendingUp className="w-4 h-4" />, label: "Session Analytics", type: "analytics" },
    ]
  },
  STUDIO_OWNER: {
    name: "Studio Owners",
    icon: <Building2 className="w-4 h-4" strokeWidth={2} />,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    accent: "border-emerald-500/20",
    postTypes: [
      { icon: <Zap className="w-4 h-4" />, label: "Flash Deal", type: "deal" },
      { icon: <Clock className="w-4 h-4" />, label: "Open Slot", type: "availability" },
      { icon: <ImageIcon className="w-4 h-4" />, label: "Before/After", type: "showcase" },
      { icon: <Award className="w-4 h-4" />, label: "Client Win", type: "testimonial" },
    ]
  },
  GEAR_SALES: {
    name: "Gear Specialists",
    icon: <Package className="w-4 h-4" strokeWidth={2} />,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    accent: "border-orange-500/20",
    postTypes: [
      { icon: <VideoIcon className="w-4 h-4" />, label: "Gear Demo", type: "demo" },
      { icon: <ShoppingCart className="w-4 h-4" />, label: "Flash Sale", type: "sale" },
      { icon: <FileText className="w-4 h-4" />, label: "Maintenance Tip", type: "tip" },
    ]
  },
  LYRICIST: {
    name: "Lyricists",
    icon: <FileText className="w-4 h-4" strokeWidth={2} />,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    accent: "border-pink-500/20",
    postTypes: [
      { icon: <FileText className="w-4 h-4" />, label: "Lyric Excerpt", type: "lyric" },
      { icon: <Sparkles className="w-4 h-4" />, label: "Theme Idea", type: "theme" },
      { icon: <Music2 className="w-4 h-4" />, label: "Melody + Words", type: "melody" },
    ]
  },
  OTHER: {
    name: "Enthusiasts",
    icon: <Headphones className="w-4 h-4" strokeWidth={2} />,
    color: "text-gray-500",
    bg: "bg-gray-500/10",
    accent: "border-gray-500/20",
    postTypes: [
      { icon: <MessageSquare className="w-4 h-4" />, label: "Discussion", type: "text" },
      { icon: <ImageIcon className="w-4 h-4" />, label: "Share Media", type: "media" },
    ]
  }
};

// Helper functions
const formatTimestamp = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);

  if (diffInMins < 1) return 'now';
  if (diffInMins < 60) return `${diffInMins}m`;
  if (diffInHours < 24) return `${diffInHours}h`;
  if (diffInDays < 7) return `${diffInDays}d`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

interface Post {
  id: string;
  author: {
    id: string;
    username: string;
    avatar: string | null;
    badges?: string[];
    portfolio?: {
      genre?: string;
      vocalRange?: string;
      beatsCatalog?: number;
    };
  };
  content: string;
  postType?: string;
  audioUrl?: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  metadata?: {
    bpm?: number;
    key?: string;
    genre?: string;
    price?: number;
  };
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  tipsReceived?: number;
  createdAt: string;
}

interface Club {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  membersCount: number;
  owner: {
    id: string;
    username: string;
    avatar: string | null;
  };
}

interface CommunityStats {
  totalMembers: number;
  totalClubs: number;
  postsThisWeek: number;
  trendingClubs: Club[];
}

// Mock trending topics
const trendingTopics = [
  { tag: "NewRelease", posts: 2841 },
  { tag: "StudioSession", posts: 1923 },
  { tag: "BeatChallenge", posts: 1456 },
  { tag: "MixingTips", posts: 892 }
];

// Skill badges
const badges: Record<string, { icon: JSX.Element; color: string; label: string }> = {
  verified: { icon: <CheckCircle className="w-3 h-3" />, color: "text-blue-500", label: "Verified" },
  grammy: { icon: <Award className="w-3 h-3" />, color: "text-yellow-500", label: "GRAMMY Nominated" },
  platinum: { icon: <Crown className="w-3 h-3" />, color: "text-purple-500", label: "Platinum Producer" },
  certified: { icon: <Award className="w-3 h-3" />, color: "text-emerald-500", label: "Studio Certified" },
};

// Live Events - Beat Battles, Vocal Roulette, Speed Dating
const liveEvents = [
  {
    id: 1,
    type: "beat_battle",
    title: "Lo-Fi Beat Battle",
    description: "Vote for the best 60-second beat",
    timeLeft: "2h 15m",
    participants: 24,
    viewers: 892,
    prize: "$500",
    status: "live"
  },
  {
    id: 2,
    type: "vocal_roulette",
    title: "Vocal Roulette: Trap Edition",
    description: "Random beats, instant vocals",
    timeLeft: "Live Now",
    participants: 12,
    viewers: 456,
    status: "live"
  },
  {
    id: 3,
    type: "speed_dating",
    title: "Producer x Artist Mixer",
    description: "60-sec speed collabs",
    timeLeft: "Tomorrow 8PM",
    participants: 50,
    genre: "Hip Hop",
    status: "upcoming"
  }
];

// Smart Discovery - For You suggestions
const forYouSuggestions = [
  {
    id: 1,
    reason: "Matches your genre (Trap)",
    creator: {
      username: "TrapMakerPro",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      badges: ["verified", "platinum"]
    },
    content: "New trap beat in F# minor, 140 BPM",
    metadata: { bpm: 140, key: "F#m", genre: "Trap" },
    audioUrl: "/beats/sample1.mp3",
    matchScore: 95
  },
  {
    id: 2,
    reason: "Vocal range match (Tenor)",
    creator: {
      username: "VocalistKing",
      avatar: "https://randomuser.me/api/portraits/men/45.jpg",
      badges: ["verified"]
    },
    content: "Looking for melodic trap beats",
    metadata: { vocalRange: "Tenor", genre: "Trap" },
    matchScore: 88
  }
];

export default function CommunityPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { permissions } = usePermissions();

  const role = (params.role as string)?.toUpperCase() || 'OTHER';
  const config = roleConfig[role] || roleConfig.OTHER;

  const [postContent, setPostContent] = useState("");
  const [activeTab, setActiveTab] = useState<"feed" | "for-you" | "live" | "briefs" | "trending" | "clubs">("feed");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [tipAmount, setTipAmount] = useState("5");
  const [selectedTipPost, setSelectedTipPost] = useState<string | null>(null);

  // Smart Discovery Filters
  const [genreFilter, setGenreFilter] = useState("all");
  const [bpmFilter, setBpmFilter] = useState("all");

  // Club state (not using TanStack Query yet)
  const [clubs, setClubs] = useState<Club[]>([]);

  // TanStack Query hooks - with automatic caching, deduplication, and background refetching
  const { data: posts = [], isLoading: isLoadingPosts } = useCommunityPosts(role.toLowerCase());
  const { data: stats = null, isLoading: isLoadingStats } = useCommunityStats(role.toLowerCase());
  const createPostMutation = useCreateCommunityPost();

  const handleGoBack = () => {
    router.push("/");
  };

  const handleCreateClub = () => {
    console.log("Create club in", role, "community");
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) return;

    // Use TanStack Query mutation with optimistic updates
    createPostMutation.mutate(
      {
        content: postContent,
        role: role.toLowerCase(),
      },
      {
        onSuccess: () => {
          setPostContent("");
          setShowCreateModal(false);
          setSelectedPostType(null);
        },
        onError: (error: any) => {
          console.error('Error creating post:', error);
          alert(error.message || 'Failed to create post');
        },
      }
    );
  };

  const toggleAudio = (postId: string) => {
    setPlayingAudio(playingAudio === postId ? null : postId);
  };

  const handleSendTip = () => {
    // In production, integrate with payment processor
    console.log(`Sending $${tipAmount} tip to post ${selectedTipPost}`);
    setShowTipModal(false);
    setTipAmount("5");
    setSelectedTipPost(null);
  };

  return (
    <div className={`min-h-screen ${
      theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-gray-900"
    }`}>
      {/* Premium Header */}
      <div className={`sticky top-0 z-30 backdrop-blur-xl border-b ${
        theme === "dark"
          ? "bg-black/80 border-zinc-800"
          : "bg-white/80 border-gray-200"
      }`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoBack}
                className={`p-2 rounded-lg border transition-all duration-200 active:scale-95 ${
                  theme === "dark"
                    ? "border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white"
                    : "border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                }`}
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={2} />
              </button>

              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${config.bg}`}>
                  <div className={config.color}>
                    {config.icon}
                  </div>
                </div>
                <div>
                  <h1 className="text-base font-light tracking-tight">
                    {config.name}
                  </h1>
                  <p className={`text-xs font-light tracking-wide ${
                    theme === "dark" ? "text-zinc-500" : "text-gray-600"
                  }`}>
                    {stats ? formatNumber(stats.totalMembers) : '...'} members
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateClub}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                theme === "dark"
                  ? "bg-white border-white text-black hover:bg-zinc-100"
                  : "bg-black border-black text-white hover:bg-gray-800"
              }`}
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              Create Club
            </button>
          </div>

          {/* Tabs */}
          <div className={`flex gap-1 mt-3 p-1 rounded-lg border w-fit ${
            theme === "dark"
              ? "bg-zinc-950 border-zinc-800"
              : "bg-white border-gray-200"
          }`}>
            {[
              { key: "feed", label: "Feed", icon: Zap },
              { key: "for-you", label: "For You", icon: Target },
              { key: "live", label: "Live Events", icon: Radio },
              { key: "briefs", label: "Open Briefs", icon: Briefcase },
              { key: "trending", label: "Trending", icon: TrendingUp },
              { key: "clubs", label: "Clubs", icon: Users }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-light rounded transition-all duration-200 tracking-wide ${
                    activeTab === tab.key
                      ? theme === "dark"
                        ? "bg-white text-black"
                        : "bg-black text-white"
                      : theme === "dark"
                        ? "text-zinc-400 hover:text-white"
                        : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tip Modal */}
      {showTipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-xl border p-6 ${
            theme === "dark"
              ? "bg-zinc-900 border-zinc-800"
              : "bg-white border-gray-200"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gift className={`w-5 h-5 ${theme === "dark" ? "text-yellow-400" : "text-yellow-500"}`} strokeWidth={2} />
                <h3 className="text-base font-light tracking-tight">Send Tip</h3>
              </div>
              <button
                onClick={() => setShowTipModal(false)}
                className={`p-1 rounded transition-colors ${
                  theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-gray-100"
                }`}
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-light tracking-wide mb-2 ${
                  theme === "dark" ? "text-zinc-400" : "text-gray-600"
                }`}>
                  Amount
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {["5", "10", "25", "50"].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setTipAmount(amount)}
                      className={`px-3 py-2 rounded-lg text-sm font-light tracking-wide transition-all ${
                        tipAmount === amount
                          ? theme === "dark"
                            ? "bg-white text-black"
                            : "bg-black text-white"
                          : theme === "dark"
                            ? "border border-zinc-800 hover:border-zinc-700"
                            : "border border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  placeholder="Custom amount"
                  className={`w-full px-3 py-2 text-sm font-light bg-transparent border rounded-lg focus:outline-none tracking-wide ${
                    theme === "dark"
                      ? "border-zinc-800 text-white placeholder-zinc-600 focus:border-white"
                      : "border-gray-200 text-gray-900 placeholder-gray-400 focus:border-black"
                  }`}
                />
              </div>

              <div className={`p-3 rounded-lg border ${
                theme === "dark" ? "border-zinc-800 bg-zinc-900/50" : "border-gray-200 bg-gray-50"
              }`}>
                <p className={`text-xs font-light tracking-wide ${
                  theme === "dark" ? "text-zinc-400" : "text-gray-600"
                }`}>
                  Tips help support creators directly. 100% goes to the creator.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSendTip}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-light rounded-lg transition-all tracking-wide active:scale-95 ${
                    theme === "dark"
                      ? "bg-white text-black hover:bg-zinc-100"
                      : "bg-black text-white hover:bg-gray-800"
                  }`}
                >
                  <Gift className="w-4 h-4" strokeWidth={2} />
                  Send ${tipAmount}
                </button>
                <button
                  onClick={() => setShowTipModal(false)}
                  className={`px-4 py-2 text-sm font-light rounded-lg border transition-all tracking-wide active:scale-95 ${
                    theme === "dark"
                      ? "border-zinc-800 hover:bg-zinc-800"
                      : "border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-xl border p-6 ${
            theme === "dark"
              ? "bg-zinc-900 border-zinc-800"
              : "bg-white border-gray-200"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-light tracking-tight">Create Post</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`p-1 rounded transition-colors ${
                  theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-gray-100"
                }`}
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-light tracking-wide mb-2 ${
                  theme === "dark" ? "text-zinc-400" : "text-gray-600"
                }`}>
                  Post Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {config.postTypes.map((type) => (
                    <button
                      key={type.type}
                      onClick={() => setSelectedPostType(type.type)}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${
                        selectedPostType === type.type
                          ? theme === "dark"
                            ? "border-white bg-white/5"
                            : "border-black bg-black/5"
                          : theme === "dark"
                            ? "border-zinc-800 hover:border-zinc-700"
                            : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={selectedPostType === type.type ? config.color :
                        theme === "dark" ? "text-zinc-500" : "text-gray-500"
                      }>
                        {type.icon}
                      </div>
                      <span className="text-xs font-light tracking-wide">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder={`Share ${selectedPostType ? 'your ' + config.postTypes.find(t => t.type === selectedPostType)?.label.toLowerCase() : 'something'}...`}
                  className={`w-full px-3 py-2 text-sm font-light bg-transparent border rounded-lg resize-none focus:outline-none tracking-wide ${
                    theme === "dark"
                      ? "border-zinc-800 text-white placeholder-zinc-600 focus:border-white"
                      : "border-gray-200 text-gray-900 placeholder-gray-400 focus:border-black"
                  }`}
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreatePost}
                  disabled={!postContent.trim() || isCreatingPost}
                  className={`flex-1 px-4 py-2 text-sm font-light rounded-lg transition-all tracking-wide active:scale-95 ${
                    postContent.trim() && !isCreatingPost
                      ? theme === "dark"
                        ? "bg-white text-black hover:bg-zinc-100"
                        : "bg-black text-white hover:bg-gray-800"
                      : theme === "dark"
                        ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {isCreatingPost ? "Posting..." : "Post"}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className={`px-4 py-2 text-sm font-light rounded-lg border transition-all tracking-wide active:scale-95 ${
                    theme === "dark"
                      ? "border-zinc-800 hover:bg-zinc-800"
                      : "border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Main Feed - 7 columns */}
          <div className="lg:col-span-7 space-y-3">
            {/* FOR YOU TAB - Smart Discovery */}
            {activeTab === "for-you" && (
              <>
                {/* Filters */}
                <div className={`rounded-xl border p-4 ${
                  theme === "dark"
                    ? "border-zinc-800 bg-zinc-950"
                    : "border-gray-200 bg-white"
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4" strokeWidth={2} />
                    <h3 className="text-sm font-light tracking-wide">Discovery Filters</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-light tracking-wide mb-1 ${
                        theme === "dark" ? "text-zinc-500" : "text-gray-600"
                      }`}>Genre</label>
                      <select
                        value={genreFilter}
                        onChange={(e) => setGenreFilter(e.target.value)}
                        className={`w-full px-2 py-1.5 text-xs font-light rounded border transition-colors ${
                          theme === "dark"
                            ? "bg-zinc-900 border-zinc-800 text-white"
                            : "bg-white border-gray-200 text-gray-900"
                        }`}
                      >
                        <option value="all">All Genres</option>
                        <option value="trap">Trap</option>
                        <option value="lofi">Lo-Fi</option>
                        <option value="rnb">R&B</option>
                        <option value="drill">Drill</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs font-light tracking-wide mb-1 ${
                        theme === "dark" ? "text-zinc-500" : "text-gray-600"
                      }`}>BPM</label>
                      <select
                        value={bpmFilter}
                        onChange={(e) => setBpmFilter(e.target.value)}
                        className={`w-full px-2 py-1.5 text-xs font-light rounded border transition-colors ${
                          theme === "dark"
                            ? "bg-zinc-900 border-zinc-800 text-white"
                            : "bg-white border-gray-200 text-gray-900"
                        }`}
                      >
                        <option value="all">All BPM</option>
                        <option value="slow">60-90 BPM</option>
                        <option value="mid">90-130 BPM</option>
                        <option value="fast">130-180 BPM</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Smart Suggestions */}
                {forYouSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={`rounded-xl border p-4 transition-all hover:scale-[1.01] ${
                      theme === "dark"
                        ? "border-zinc-800 bg-zinc-950"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-light ${
                        theme === "dark" ? "bg-purple-500/10 text-purple-400" : "bg-purple-100 text-purple-600"
                      }`}>
                        <Rocket className="w-3 h-3" strokeWidth={2} />
                        {suggestion.matchScore}% Match
                      </div>
                      <span className={`text-xs font-light tracking-wide ${
                        theme === "dark" ? "text-zinc-500" : "text-gray-600"
                      }`}>
                        {suggestion.reason}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full flex-shrink-0 ${config.bg} ${config.color} flex items-center justify-center`}>
                        {suggestion.creator.avatar ? (
                          <img
                            src={suggestion.creator.avatar}
                            alt={suggestion.creator.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          config.icon
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-sm font-light tracking-wide ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}>
                            {suggestion.creator.username}
                          </span>
                          {suggestion.creator.badges?.map((badge) => (
                            <div key={badge} className={badges[badge]?.color}>
                              {badges[badge]?.icon}
                            </div>
                          ))}
                        </div>
                        <p className={`text-sm font-light tracking-wide mb-2 ${
                          theme === "dark" ? "text-zinc-300" : "text-gray-700"
                        }`}>
                          {suggestion.content}
                        </p>
                        {suggestion.metadata && (
                          <div className="flex items-center gap-3 text-xs font-light">
                            {suggestion.metadata.bpm && (
                              <span className={theme === "dark" ? "text-zinc-500" : "text-gray-500"}>
                                {suggestion.metadata.bpm} BPM
                              </span>
                            )}
                            {suggestion.metadata.key && (
                              <span className={theme === "dark" ? "text-zinc-500" : "text-gray-500"}>
                                Key: {suggestion.metadata.key}
                              </span>
                            )}
                            {suggestion.metadata.genre && (
                              <span className={`px-2 py-0.5 rounded ${
                                theme === "dark" ? "bg-zinc-800 text-zinc-400" : "bg-gray-100 text-gray-600"
                              }`}>
                                {suggestion.metadata.genre}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <button className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-light transition-all active:scale-95 ${
                            theme === "dark"
                              ? "bg-white text-black hover:bg-zinc-100"
                              : "bg-black text-white hover:bg-gray-800"
                          }`}>
                            <Handshake className="w-3 h-3" strokeWidth={2} />
                            Connect
                          </button>
                          <button className={`p-1.5 rounded-full transition-colors ${
                            theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-gray-100"
                          }`}>
                            <Eye className="w-4 h-4" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* LIVE EVENTS TAB - Beat Battles, Vocal Roulette, Speed Dating */}
            {activeTab === "live" && (
              <div className="space-y-3">
                {liveEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`rounded-xl border p-6 transition-all hover:scale-[1.01] cursor-pointer ${
                      theme === "dark"
                        ? "border-zinc-800 bg-zinc-950"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${
                          event.status === "live"
                            ? "bg-red-500/10"
                            : "bg-purple-500/10"
                        }`}>
                          {event.type === "beat_battle" && (
                            <Volume2 className={`w-5 h-5 ${
                              event.status === "live" ? "text-red-500" : "text-purple-500"
                            }`} strokeWidth={2} />
                          )}
                          {event.type === "vocal_roulette" && (
                            <Shuffle className={`w-5 h-5 ${
                              event.status === "live" ? "text-red-500" : "text-purple-500"
                            }`} strokeWidth={2} />
                          )}
                          {event.type === "speed_dating" && (
                            <Users className={`w-5 h-5 ${
                              event.status === "live" ? "text-red-500" : "text-purple-500"
                            }`} strokeWidth={2} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`text-base font-light tracking-tight ${
                              theme === "dark" ? "text-white" : "text-gray-900"
                            }`}>
                              {event.title}
                            </h3>
                            {event.status === "live" && (
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                <span className="text-xs font-light text-red-500">LIVE</span>
                              </div>
                            )}
                          </div>
                          <p className={`text-sm font-light tracking-wide ${
                            theme === "dark" ? "text-zinc-400" : "text-gray-600"
                          }`}>
                            {event.description}
                          </p>
                        </div>
                      </div>
                      {event.prize && (
                        <div className={`px-3 py-1.5 rounded-lg border ${
                          theme === "dark"
                            ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-500"
                            : "border-yellow-600/20 bg-yellow-100 text-yellow-700"
                        }`}>
                          <span className="text-sm font-light tracking-wide">{event.prize}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-6 text-sm font-light">
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${
                          theme === "dark" ? "text-zinc-500" : "text-gray-500"
                        }`} strokeWidth={2} />
                        <span className={theme === "dark" ? "text-zinc-400" : "text-gray-600"}>
                          {event.timeLeft}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className={`w-4 h-4 ${
                          theme === "dark" ? "text-zinc-500" : "text-gray-500"
                        }`} strokeWidth={2} />
                        <span className={theme === "dark" ? "text-zinc-400" : "text-gray-600"}>
                          {event.participants} participants
                        </span>
                      </div>
                      {event.viewers && (
                        <div className="flex items-center gap-2">
                          <Eye className={`w-4 h-4 ${
                            theme === "dark" ? "text-zinc-500" : "text-gray-500"
                          }`} strokeWidth={2} />
                          <span className={theme === "dark" ? "text-zinc-400" : "text-gray-600"}>
                            {formatNumber(event.viewers)} watching
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t ${
                      theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'
                    }">
                      <button className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-light rounded-lg transition-all tracking-wide active:scale-95 ${
                        event.status === "live"
                          ? theme === "dark"
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "bg-red-600 text-white hover:bg-red-700"
                          : theme === "dark"
                            ? "bg-white text-black hover:bg-zinc-100"
                            : "bg-black text-white hover:bg-gray-800"
                      }`}>
                        <Radio className="w-4 h-4" strokeWidth={2} />
                        {event.status === "live" ? "Join Live" : "Set Reminder"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "feed" && (
              <>
                {/* Quick Create */}
                <div className={`rounded-xl border p-3 ${
                  theme === "dark"
                    ? "border-zinc-800 bg-zinc-950"
                    : "border-gray-200 bg-white"
                }`}>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className={`w-full flex items-center gap-3 text-left ${
                      theme === "dark" ? "text-zinc-400" : "text-gray-500"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bg} ${config.color}`}>
                      {config.icon}
                    </div>
                    <span className="text-sm font-light tracking-wide">What's happening?</span>
                  </button>
                  <div className={`flex items-center gap-2 mt-3 pt-3 border-t ${
                    theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'
                  }`}>
                    {config.postTypes.slice(0, 4).map((type, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedPostType(type.type);
                          setShowCreateModal(true);
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-light tracking-wide transition-colors ${
                          theme === "dark"
                            ? "hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                            : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {type.icon}
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Posts Feed - With Tip Jars */}
                {isLoadingPosts ? (
                  <div className={`rounded-xl border p-6 text-center ${
                    theme === "dark"
                      ? "border-zinc-800 bg-zinc-950 text-zinc-400"
                      : "border-gray-200 bg-white text-gray-600"
                  }`}>
                    <p className="text-sm font-light tracking-wide">Loading posts...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className={`rounded-xl border p-8 text-center ${
                    theme === "dark"
                      ? "border-zinc-800 bg-zinc-950"
                      : "border-gray-200 bg-white"
                  }`}>
                    <Sparkles className={`w-8 h-8 mx-auto mb-2 ${
                      theme === "dark" ? "text-zinc-700" : "text-gray-300"
                    }`} strokeWidth={1.5} />
                    <p className={`text-sm font-light tracking-wide ${
                      theme === "dark" ? "text-zinc-400" : "text-gray-600"
                    }`}>
                      No posts yet. Be the first to share!
                    </p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <div
                      key={post.id}
                      className={`border-b last:border-b-0 p-3 transition-colors ${
                        theme === "dark"
                          ? "border-zinc-800 hover:bg-zinc-950/50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex gap-2">
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 ${config.bg} ${config.color} flex items-center justify-center`}>
                          {post.author.avatar ? (
                            <img
                              src={post.author.avatar}
                              alt={post.author.username}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            config.icon
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`text-sm font-light tracking-wide truncate ${
                                theme === "dark" ? "text-white" : "text-gray-900"
                              }`}>
                                {post.author.username}
                              </span>
                              {post.author.badges?.map((badge) => (
                                <div key={badge} className={badges[badge]?.color} title={badges[badge]?.label}>
                                  {badges[badge]?.icon}
                                </div>
                              ))}
                              <span className={`text-xs font-light tracking-wide ${
                                theme === "dark" ? "text-zinc-600" : "text-gray-500"
                              }`}>
                                · {formatTimestamp(post.createdAt)}
                              </span>
                            </div>
                            <button className={`p-1 rounded transition-colors ${
                              theme === "dark"
                                ? "hover:bg-zinc-800 text-zinc-500"
                                : "hover:bg-gray-100 text-gray-500"
                            }`}>
                              <MoreHorizontal className="w-4 h-4" strokeWidth={2} />
                            </button>
                          </div>

                          {post.postType && (
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-light tracking-wide mb-2 ${
                              theme === "dark" ? "bg-zinc-800 text-zinc-400" : "bg-gray-100 text-gray-600"
                            }`}>
                              {config.postTypes.find(t => t.type === post.postType)?.icon}
                              {config.postTypes.find(t => t.type === post.postType)?.label}
                            </div>
                          )}

                          <p className={`text-sm font-light leading-relaxed mb-2 tracking-wide ${
                            theme === "dark" ? "text-zinc-200" : "text-gray-800"
                          }`}>
                            {post.content}
                          </p>

                          {post.audioUrl && (
                            <div className={`mb-2 p-3 rounded-lg border ${
                              theme === "dark" ? "border-zinc-800 bg-zinc-900" : "border-gray-200 bg-gray-50"
                            }`}>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => toggleAudio(post.id)}
                                  className={`p-2 rounded-full transition-colors ${
                                    theme === "dark" ? "bg-white text-black hover:bg-zinc-100" : "bg-black text-white hover:bg-gray-800"
                                  }`}
                                >
                                  {playingAudio === post.id ?
                                    <Pause className="w-4 h-4" strokeWidth={2} /> :
                                    <PlayCircle className="w-4 h-4" strokeWidth={2} />
                                  }
                                </button>
                                <div className="flex-1">
                                  <div className={`h-1 rounded-full ${theme === "dark" ? "bg-zinc-800" : "bg-gray-200"}`}>
                                    <div className="h-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 w-1/3"></div>
                                  </div>
                                  {post.metadata && (
                                    <div className={`flex items-center gap-3 mt-1 text-xs font-light ${
                                      theme === "dark" ? "text-zinc-500" : "text-gray-500"
                                    }`}>
                                      {post.metadata.bpm && <span>{post.metadata.bpm} BPM</span>}
                                      {post.metadata.key && <span>Key: {post.metadata.key}</span>}
                                      {post.metadata.genre && <span>{post.metadata.genre}</span>}
                                    </div>
                                  )}
                                </div>
                                <button className={`p-2 rounded transition-colors ${
                                  theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-gray-100"
                                }`}>
                                  <Download className="w-4 h-4" strokeWidth={2} />
                                </button>
                              </div>
                            </div>
                          )}

                          {post.imageUrl && (
                            <div className={`mb-2 rounded-lg overflow-hidden border ${
                              theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'
                            }`}>
                              <img
                                src={post.imageUrl}
                                alt="Post content"
                                className="w-full h-48 object-cover"
                              />
                            </div>
                          )}

                          {(post.postType === 'beat' || post.postType === 'collab') && (
                            <div className="flex items-center gap-2 mb-2">
                              <button className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-light transition-all active:scale-95 ${
                                theme === "dark"
                                  ? "bg-white text-black hover:bg-zinc-100"
                                  : "bg-black text-white hover:bg-gray-800"
                              }`}>
                                <Handshake className="w-3 h-3" strokeWidth={2} />
                                Collab
                              </button>
                              {post.metadata?.price && (
                                <button className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-light transition-all active:scale-95 border ${
                                  theme === "dark"
                                    ? "border-zinc-700 hover:bg-zinc-800"
                                    : "border-gray-300 hover:bg-gray-100"
                                }`}>
                                  <ShoppingCart className="w-3 h-3" strokeWidth={2} />
                                  ${post.metadata.price}
                                </button>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-6 mt-2">
                            <button className={`flex items-center gap-1 transition-colors group ${
                              theme === "dark"
                                ? "text-zinc-600 hover:text-red-400"
                                : "text-gray-500 hover:text-red-500"
                            }`}>
                              <Heart className="w-4 h-4 group-hover:fill-current" strokeWidth={2} />
                              <span className="text-xs font-light">{formatNumber(post.likesCount)}</span>
                            </button>
                            <button className={`flex items-center gap-1 transition-colors group ${
                              theme === "dark"
                                ? "text-zinc-600 hover:text-blue-400"
                                : "text-gray-500 hover:text-blue-500"
                            }`}>
                              <MessageSquare className="w-4 h-4" strokeWidth={2} />
                              <span className="text-xs font-light">{formatNumber(post.commentsCount)}</span>
                            </button>
                            <button className={`flex items-center gap-1 transition-colors group ${
                              theme === "dark"
                                ? "text-zinc-600 hover:text-green-400"
                                : "text-gray-500 hover:text-green-500"
                            }`}>
                              <Share2 className="w-4 h-4" strokeWidth={2} />
                              <span className="text-xs font-light">{formatNumber(post.sharesCount)}</span>
                            </button>
                            {/* TIP JAR */}
                            <button
                              onClick={() => {
                                setSelectedTipPost(post.id);
                                setShowTipModal(true);
                              }}
                              className={`flex items-center gap-1 transition-colors group ${
                                theme === "dark"
                                  ? "text-zinc-600 hover:text-yellow-400"
                                  : "text-gray-500 hover:text-yellow-500"
                              }`}
                            >
                              <Coins className="w-4 h-4" strokeWidth={2} />
                              {post.tipsReceived && post.tipsReceived > 0 && (
                                <span className="text-xs font-light">${post.tipsReceived}</span>
                              )}
                            </button>
                            <button className={`ml-auto transition-colors ${
                              theme === "dark"
                                ? "text-zinc-600 hover:text-yellow-400"
                                : "text-gray-500 hover:text-yellow-500"
                            }`}>
                              <Bookmark className="w-4 h-4" strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === "briefs" && (
              <div className="space-y-3">
                <div className={`rounded-xl border p-8 text-center ${
                  theme === "dark"
                    ? "border-zinc-800 bg-zinc-950"
                    : "border-gray-200 bg-white"
                }`}>
                  <Briefcase className={`w-8 h-8 mx-auto mb-2 ${
                    theme === "dark" ? "text-zinc-700" : "text-gray-300"
                  }`} strokeWidth={1.5} />
                  <p className={`text-sm font-light tracking-wide mb-1 ${
                    theme === "dark" ? "text-zinc-400" : "text-gray-600"
                  }`}>
                    No open briefs yet
                  </p>
                  <p className={`text-xs font-light tracking-wide ${
                    theme === "dark" ? "text-zinc-600" : "text-gray-500"
                  }`}>
                    Post what you're looking for and let creators apply
                  </p>
                </div>
              </div>
            )}

            {activeTab === "trending" && (
              <div className="space-y-3">
                {trendingTopics.map((topic, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      theme === "dark"
                        ? "border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Flame className={`w-4 h-4 ${
                            theme === "dark" ? "text-orange-400" : "text-orange-500"
                          }`} strokeWidth={2} />
                          <span className={`text-sm font-light tracking-wide ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}>
                            #{topic.tag}
                          </span>
                        </div>
                        <p className={`text-xs font-light tracking-wide ${
                          theme === "dark" ? "text-zinc-500" : "text-gray-600"
                        }`}>
                          {formatNumber(topic.posts)} posts
                        </p>
                      </div>
                      <TrendingUp className={`w-5 h-5 ${
                        theme === "dark" ? "text-zinc-600" : "text-gray-400"
                      }`} strokeWidth={2} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "clubs" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {isLoadingStats ? (
                  <div className={`col-span-2 rounded-xl border p-6 text-center ${
                    theme === "dark"
                      ? "border-zinc-800 bg-zinc-950"
                      : "border-gray-200 bg-white"
                  }`}>
                    <p className="text-sm font-light tracking-wide">Loading clubs...</p>
                  </div>
                ) : stats && stats.trendingClubs.length > 0 ? (
                  stats.trendingClubs.map((club) => (
                    <div
                      key={club.id}
                      className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
                        theme === "dark"
                          ? "border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg flex-shrink-0">
                          {club.icon || '🎵'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-sm font-light tracking-wide truncate mb-0.5 ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}>
                            {club.name}
                          </h3>
                          <p className={`text-xs font-light tracking-wide truncate mb-2 ${
                            theme === "dark" ? "text-zinc-500" : "text-gray-600"
                          }`}>
                            {club.description || 'Community club'}
                          </p>
                          <div className="flex items-center gap-1">
                            <Users className={`w-3 h-3 ${
                              theme === "dark" ? "text-zinc-600" : "text-gray-500"
                            }`} strokeWidth={2} />
                            <span className={`text-xs font-light ${
                              theme === "dark" ? "text-zinc-500" : "text-gray-600"
                            }`}>
                              {formatNumber(club.membersCount)} members
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`col-span-2 rounded-xl border p-8 text-center ${
                    theme === "dark"
                      ? "border-zinc-800 bg-zinc-950"
                      : "border-gray-200 bg-white"
                  }`}>
                    <Users className={`w-8 h-8 mx-auto mb-2 ${
                      theme === "dark" ? "text-zinc-700" : "text-gray-300"
                    }`} strokeWidth={1.5} />
                    <p className={`text-sm font-light tracking-wide ${
                      theme === "dark" ? "text-zinc-400" : "text-gray-600"
                    }`}>
                      No clubs yet. Create the first one!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar - 5 columns */}
          <div className="lg:col-span-5 space-y-3">
            {/* Live Activity */}
            <div className={`rounded-xl border p-4 ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-950"
                : "border-gray-200 bg-white"
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Zap className={`w-4 h-4 ${config.color}`} strokeWidth={2} />
                <h3 className="text-sm font-light tracking-wide">Live Activity</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className={`text-xs font-light tracking-wide ${
                    theme === "dark" ? "text-zinc-400" : "text-gray-600"
                  }`}>
                    342 members online now
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className={`w-3 h-3 ${
                    theme === "dark" ? "text-zinc-600" : "text-gray-400"
                  }`} strokeWidth={2} />
                  <span className={`text-xs font-light tracking-wide ${
                    theme === "dark" ? "text-zinc-400" : "text-gray-600"
                  }`}>
                    23 posts in the last hour
                  </span>
                </div>
              </div>
            </div>

            {/* Community Stats */}
            <div className={`rounded-xl border p-4 ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-950"
                : "border-gray-200 bg-white"
            }`}>
              <h3 className="text-sm font-light tracking-wide mb-3">Community Stats</h3>
              {isLoadingStats ? (
                <p className={`text-xs font-light tracking-wide ${
                  theme === "dark" ? "text-zinc-500" : "text-gray-500"
                }`}>
                  Loading...
                </p>
              ) : stats ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <div className={`text-lg font-light tracking-tight ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      {formatNumber(stats.totalMembers)}
                    </div>
                    <div className={`text-xs font-light tracking-wider ${
                      theme === "dark" ? "text-zinc-500" : "text-gray-600"
                    }`}>
                      Members
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className={`text-lg font-light tracking-tight ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      {formatNumber(stats.totalClubs)}
                    </div>
                    <div className={`text-xs font-light tracking-wider ${
                      theme === "dark" ? "text-zinc-500" : "text-gray-600"
                    }`}>
                      Clubs
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className={`text-lg font-light tracking-tight ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      {formatNumber(stats.postsThisWeek)}
                    </div>
                    <div className={`text-xs font-light tracking-wider ${
                      theme === "dark" ? "text-zinc-500" : "text-gray-600"
                    }`}>
                      Posts
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Trending Now */}
            <div className={`rounded-xl border p-4 ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-950"
                : "border-gray-200 bg-white"
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-orange-500" strokeWidth={2} />
                <h3 className="text-sm font-light tracking-wide">Trending</h3>
              </div>
              <div className="space-y-2">
                {trendingTopics.slice(0, 3).map((topic, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded-lg cursor-pointer transition-colors ${
                      theme === "dark"
                        ? "hover:bg-zinc-900"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className={`text-xs font-light tracking-wide ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      #{topic.tag}
                    </div>
                    <div className={`text-xs font-light tracking-wide ${
                      theme === "dark" ? "text-zinc-600" : "text-gray-500"
                    }`}>
                      {formatNumber(topic.posts)} posts
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Creators */}
            <div className={`rounded-xl border p-4 ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-950"
                : "border-gray-200 bg-white"
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-4 h-4 text-yellow-500" strokeWidth={2} />
                <h3 className="text-sm font-light tracking-wide">Top Creators</h3>
              </div>
              <div className="space-y-2">
                <p className={`text-xs font-light tracking-wide ${
                  theme === "dark" ? "text-zinc-500" : "text-gray-500"
                }`}>
                  Leaderboard coming soon
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
