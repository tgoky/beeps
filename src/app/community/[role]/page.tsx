"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "../../../providers/ThemeProvider";
import { usePermissions } from "../../../hooks/usePermissions";
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
  Eye,
  Bookmark
} from "lucide-react";

// Role display configuration
const roleConfig: Record<string, { name: string; icon: JSX.Element; color: string; bg: string; accent: string }> = {
  ARTIST: {
    name: "Artists",
    icon: <Mic2 className="w-4 h-4" strokeWidth={2} />,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    accent: "border-purple-500/20"
  },
  PRODUCER: {
    name: "Producers",
    icon: <Music2 className="w-4 h-4" strokeWidth={2} />,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    accent: "border-blue-500/20"
  },
  STUDIO_OWNER: {
    name: "Studio Owners",
    icon: <Building2 className="w-4 h-4" strokeWidth={2} />,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    accent: "border-emerald-500/20"
  },
  GEAR_SALES: {
    name: "Gear Specialists",
    icon: <Package className="w-4 h-4" strokeWidth={2} />,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    accent: "border-orange-500/20"
  },
  LYRICIST: {
    name: "Lyricists",
    icon: <FileText className="w-4 h-4" strokeWidth={2} />,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    accent: "border-pink-500/20"
  },
  OTHER: {
    name: "Enthusiasts",
    icon: <Headphones className="w-4 h-4" strokeWidth={2} />,
    color: "text-gray-500",
    bg: "bg-gray-500/10",
    accent: "border-gray-500/20"
  }
};

// Helper function to format timestamps
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
  };
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
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

// Mock trending topics for engagement
const trendingTopics = [
  { tag: "NewRelease", posts: 2841 },
  { tag: "StudioSession", posts: 1923 },
  { tag: "BeatChallenge", posts: 1456 },
  { tag: "MixingTips", posts: 892 }
];

export default function CommunityPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { permissions } = usePermissions();

  const role = (params.role as string)?.toUpperCase() || 'OTHER';
  const config = roleConfig[role] || roleConfig.OTHER;

  const [postContent, setPostContent] = useState("");
  const [activeTab, setActiveTab] = useState<"feed" | "trending" | "clubs">("feed");

  // Data states
  const [posts, setPosts] = useState<Post[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(null);

  // Loading states
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoadingPosts(true);
        const response = await fetch(`/api/communities/${role.toLowerCase()}/posts`);

        if (!response.ok) {
          console.error('Failed to fetch posts');
          return;
        }

        const data = await response.json();
        setPosts(data.data || []);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    fetchPosts();
  }, [role]);

  // Fetch community stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true);
        const response = await fetch(`/api/communities/${role.toLowerCase()}/stats`);

        if (!response.ok) {
          console.error('Failed to fetch stats');
          return;
        }

        const data = await response.json();
        setStats(data.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [role]);

  const handleGoBack = () => {
    router.push("/");
  };

  const handleCreateClub = () => {
    console.log("Create club in", role, "community");
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) return;

    try {
      setIsCreatingPost(true);

      const response = await fetch(`/api/communities/${role.toLowerCase()}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: postContent,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error?.message || 'Failed to create post');
        return;
      }

      const result = await response.json();
      setPosts([result.data, ...posts]);
      setPostContent("");
    } catch (error) {
      console.error('Error creating post:', error);
      alert('An error occurred while creating the post');
    } finally {
      setIsCreatingPost(false);
    }
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
            {/* Left: Back + Title */}
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

            {/* Right: Create Club */}
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

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Main Feed - 7 columns */}
          <div className="lg:col-span-7 space-y-3">
            {activeTab === "feed" && (
              <>
                {/* Compact Create Post */}
                <div className={`rounded-xl border p-3 ${
                  theme === "dark"
                    ? "border-zinc-800 bg-zinc-950"
                    : "border-gray-200 bg-white"
                }`}>
                  <div className="flex gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg} ${config.color}`}>
                      {config.icon}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        placeholder="What's happening?"
                        className={`w-full px-0 py-1 text-sm font-light bg-transparent border-none resize-none focus:outline-none tracking-wide placeholder:font-light ${
                          theme === "dark"
                            ? "text-white placeholder-zinc-600"
                            : "text-gray-900 placeholder-gray-400"
                        }`}
                        rows={2}
                      />
                      <div className="flex items-center justify-between mt-2 pt-2 border-t ${
                        theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'
                      }">
                        <div className="flex gap-1">
                          {[ImageIcon, VideoIcon, Smile].map((Icon, i) => (
                            <button
                              key={i}
                              className={`p-1.5 rounded transition-colors ${
                                theme === "dark"
                                  ? "hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                                  : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                              }`}
                            >
                              <Icon className="w-4 h-4" strokeWidth={2} />
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={handleCreatePost}
                          disabled={!postContent.trim() || isCreatingPost}
                          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-light rounded-full transition-all tracking-wide active:scale-95 ${
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
                      </div>
                    </div>
                  </div>
                </div>

                {/* Posts Feed - Twitter-like compact */}
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
                        {/* Avatar */}
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

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`text-sm font-light tracking-wide truncate ${
                                theme === "dark" ? "text-white" : "text-gray-900"
                              }`}>
                                {post.author.username}
                              </span>
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

                          {/* Post Content */}
                          <p className={`text-sm font-light leading-relaxed mb-2 tracking-wide ${
                            theme === "dark" ? "text-zinc-200" : "text-gray-800"
                          }`}>
                            {post.content}
                          </p>

                          {/* Media */}
                          {post.imageUrl && (
                            <div className="mb-2 rounded-lg overflow-hidden border ${
                              theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'
                            }">
                              <img
                                src={post.imageUrl}
                                alt="Post content"
                                className="w-full h-48 object-cover"
                              />
                            </div>
                          )}

                          {/* Actions - Compact */}
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

            {/* Quick Actions */}
            <div className={`rounded-xl border p-4 ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-950"
                : "border-gray-200 bg-white"
            }`}>
              <h3 className="text-sm font-light tracking-wide mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                  theme === "dark"
                    ? "border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white"
                    : "border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                }`}>
                  <UserPlus className="w-3.5 h-3.5" strokeWidth={2} />
                  Invite Members
                </button>
                <button className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                  theme === "dark"
                    ? "border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white"
                    : "border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                }`}>
                  <Crown className="w-3.5 h-3.5" strokeWidth={2} />
                  Leaderboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
