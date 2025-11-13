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
  Image,
  Video,
  Smile,
  MoreHorizontal,
  UserPlus,
  Search,
  TrendingUp,
  Clock,
  Star,
  Music2,
  Mic2,
  Building2,
  Package,
  FileText,
  Headphones
} from "lucide-react";

// Role display configuration
const roleConfig: Record<string, { name: string; icon: JSX.Element; color: string; bg: string }> = {
  ARTIST: {
    name: "Artists Community",
    icon: <Mic2 className="w-5 h-5" />,
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  },
  PRODUCER: {
    name: "Producers Community",
    icon: <Music2 className="w-5 h-5" />,
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  STUDIO_OWNER: {
    name: "Studio Owners Community",
    icon: <Building2 className="w-5 h-5" />,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10"
  },
  GEAR_SALES: {
    name: "Gear Specialists Community",
    icon: <Package className="w-5 h-5" />,
    color: "text-orange-500",
    bg: "bg-orange-500/10"
  },
  LYRICIST: {
    name: "Lyricists Community",
    icon: <FileText className="w-5 h-5" />,
    color: "text-pink-500",
    bg: "bg-pink-500/10"
  },
  OTHER: {
    name: "Music Enthusiasts Community",
    icon: <Headphones className="w-5 h-5" />,
    color: "text-gray-500",
    bg: "bg-gray-500/10"
  }
};

// Mock data
const mockPosts = [
  {
    id: 1,
    author: {
      name: "Sarah Producer",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      role: "PRODUCER",
      verified: true
    },
    content: "Just finished mixing a sick track! 🔥 Looking for vocalists to collab on this beat. Anyone interested?",
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&q=80",
    likes: 234,
    comments: 45,
    shares: 12,
    timestamp: "2 hours ago"
  },
  {
    id: 2,
    author: {
      name: "Mike Studios",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      role: "STUDIO_OWNER",
      verified: true
    },
    content: "Studio space available this weekend! Special rates for community members. DM for booking.",
    likes: 156,
    comments: 28,
    shares: 8,
    timestamp: "5 hours ago"
  },
  {
    id: 3,
    author: {
      name: "Alex Beats",
      avatar: "https://randomuser.me/api/portraits/men/67.jpg",
      role: "PRODUCER",
      verified: false
    },
    content: "New beat pack dropping tomorrow 🎵 Preview link in bio. What genre should I make next?",
    video: true,
    likes: 892,
    comments: 134,
    shares: 56,
    timestamp: "1 day ago"
  }
];

const mockClubs = [
  {
    id: 1,
    name: "Lo-Fi Producers",
    icon: "🎧",
    members: 1245,
    description: "Creating chill vibes together",
    trending: true
  },
  {
    id: 2,
    name: "Trap Makers",
    icon: "🔥",
    members: 3456,
    description: "Hard beats only",
    trending: true
  },
  {
    id: 3,
    name: "Sample Diggers",
    icon: "💿",
    members: 892,
    description: "Finding the perfect samples",
    trending: false
  },
  {
    id: 4,
    name: "Mixing Masters",
    icon: "🎚️",
    members: 2103,
    description: "Level up your mixing game",
    trending: false
  }
];

// Helper function to format timestamps
const formatTimestamp = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);

  if (diffInMins < 1) return 'Just now';
  if (diffInMins < 60) return `${diffInMins} ${diffInMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffInDays < 7) return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;

  return date.toLocaleDateString();
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

export default function CommunityPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { permissions } = usePermissions();

  const role = (params.role as string)?.toUpperCase() || 'OTHER';
  const config = roleConfig[role] || roleConfig.OTHER;

  const [postContent, setPostContent] = useState("");
  const [activeTab, setActiveTab] = useState<"feed" | "clubs" | "members">("feed");

  // Data states
  const [posts, setPosts] = useState<Post[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(null);

  // Loading states
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
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

  // Fetch community stats (includes trending clubs)
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
    // In real app, open create club modal specific to this community
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

      // Add new post to the beginning of the feed
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
      {/* Header */}
      <div className={`sticky top-0 z-30 border-b backdrop-blur-sm ${
        theme === "dark"
          ? "bg-black/80 border-zinc-800"
          : "bg-white/80 border-gray-200"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Back button + Community name */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoBack}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  theme === "dark"
                    ? "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                    : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Go Back</span>
              </button>

              <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${config.bg}`}>
                <div className={config.color}>
                  {config.icon}
                </div>
                <h1 className="text-lg font-semibold tracking-tight">
                  {config.name}
                </h1>
              </div>
            </div>

            {/* Right: Create Club button */}
            <button
              onClick={handleCreateClub}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                theme === "dark"
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Create Club</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-8 border-t">
            {["feed", "clubs", "members"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? (theme === "dark"
                        ? "border-purple-500 text-purple-400"
                        : "border-purple-600 text-purple-600")
                    : (theme === "dark"
                        ? "border-transparent text-zinc-400 hover:text-white"
                        : "border-transparent text-gray-600 hover:text-gray-900")
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === "feed" && (
              <>
                {/* Create Post */}
                <div className={`rounded-xl border p-6 ${
                  theme === "dark"
                    ? "border-zinc-800 bg-zinc-900/40"
                    : "border-gray-300 bg-white"
                }`}>
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bg} ${config.color} flex-shrink-0`}>
                      {config.icon}
                    </div>
                    <div className="flex-1 space-y-4">
                      <textarea
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        placeholder="Share something with the community..."
                        className={`w-full px-4 py-3 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          theme === "dark"
                            ? "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        }`}
                        rows={3}
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <button className={`p-2 rounded-lg transition-colors ${
                            theme === "dark"
                              ? "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                              : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                          }`}>
                            <Image className="w-5 h-5" />
                          </button>
                          <button className={`p-2 rounded-lg transition-colors ${
                            theme === "dark"
                              ? "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                              : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                          }`}>
                            <Video className="w-5 h-5" />
                          </button>
                          <button className={`p-2 rounded-lg transition-colors ${
                            theme === "dark"
                              ? "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                              : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                          }`}>
                            <Smile className="w-5 h-5" />
                          </button>
                        </div>
                        <button
                          onClick={handleCreatePost}
                          disabled={!postContent.trim() || isCreatingPost}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                            postContent.trim() && !isCreatingPost
                              ? "bg-purple-600 hover:bg-purple-700 text-white"
                              : theme === "dark"
                                ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          <Send className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {isCreatingPost ? "Posting..." : "Post"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Posts Feed */}
                {isLoadingPosts ? (
                  <div className={`rounded-xl border p-6 text-center ${
                    theme === "dark"
                      ? "border-zinc-800 bg-zinc-900/40 text-zinc-400"
                      : "border-gray-300 bg-white text-gray-600"
                  }`}>
                    <p>Loading posts...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className={`rounded-xl border p-6 text-center ${
                    theme === "dark"
                      ? "border-zinc-800 bg-zinc-900/40 text-zinc-400"
                      : "border-gray-300 bg-white text-gray-600"
                  }`}>
                    <p>No posts yet. Be the first to share something!</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <div
                      key={post.id}
                      className={`rounded-xl border p-6 ${
                        theme === "dark"
                          ? "border-zinc-800 bg-zinc-900/40"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {/* Post Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bg} ${config.color}`}>
                            {post.author.avatar ? (
                              <img
                                src={post.author.avatar}
                                alt={post.author.username}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              config.icon
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{post.author.username}</h4>
                            </div>
                            <p className={`text-sm ${
                              theme === "dark" ? "text-zinc-400" : "text-gray-600"
                            }`}>
                              {formatTimestamp(post.createdAt)}
                            </p>
                          </div>
                        </div>
                        <button className={`p-2 rounded-lg transition-colors ${
                          theme === "dark"
                            ? "hover:bg-zinc-800 text-zinc-400"
                            : "hover:bg-gray-100 text-gray-600"
                        }`}>
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Post Content */}
                      <p className="mb-4 leading-relaxed">{post.content}</p>

                      {/* Post Media */}
                      {post.imageUrl && (
                        <div className="mb-4 rounded-lg overflow-hidden">
                          <img
                            src={post.imageUrl}
                            alt="Post content"
                            className="w-full h-64 object-cover"
                          />
                        </div>
                      )}
                      {post.videoUrl && (
                        <div className={`mb-4 rounded-lg overflow-hidden flex items-center justify-center h-64 ${
                          theme === "dark" ? "bg-zinc-800" : "bg-gray-200"
                        }`}>
                          <Video className="w-12 h-12 text-zinc-500" />
                        </div>
                      )}

                      {/* Post Actions */}
                      <div className={`flex items-center gap-6 pt-4 border-t ${
                        theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'
                      }`}>
                        <button className={`flex items-center gap-2 transition-colors ${
                          theme === "dark"
                            ? "text-zinc-400 hover:text-red-400"
                            : "text-gray-600 hover:text-red-600"
                        }`}>
                          <Heart className="w-5 h-5" />
                          <span className="text-sm font-medium">{post.likesCount}</span>
                        </button>
                        <button className={`flex items-center gap-2 transition-colors ${
                          theme === "dark"
                            ? "text-zinc-400 hover:text-blue-400"
                            : "text-gray-600 hover:text-blue-600"
                        }`}>
                          <MessageSquare className="w-5 h-5" />
                          <span className="text-sm font-medium">{post.commentsCount}</span>
                        </button>
                        <button className={`flex items-center gap-2 transition-colors ${
                          theme === "dark"
                            ? "text-zinc-400 hover:text-green-400"
                            : "text-gray-600 hover:text-green-600"
                        }`}>
                          <Share2 className="w-5 h-5" />
                          <span className="text-sm font-medium">{post.sharesCount}</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === "clubs" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {mockClubs.map((club) => (
                  <div
                    key={club.id}
                    className={`rounded-xl border p-6 hover:scale-105 transition-all cursor-pointer ${
                      theme === "dark"
                        ? "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60"
                        : "border-gray-300 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-2xl">
                        {club.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{club.name}</h3>
                          {club.trending && (
                            <TrendingUp className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                        <p className={`text-sm mb-2 ${
                          theme === "dark" ? "text-zinc-400" : "text-gray-600"
                        }`}>
                          {club.description}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4" />
                          <span>{club.members.toLocaleString()} members</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "members" && (
              <div className="space-y-4">
                <div className={`rounded-xl border p-4 ${
                  theme === "dark"
                    ? "border-zinc-800 bg-zinc-900/40"
                    : "border-gray-300 bg-white"
                }`}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search members..."
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        theme === "dark"
                          ? "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
                          : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>
                </div>

                <p className={`text-center py-8 ${
                  theme === "dark" ? "text-zinc-500" : "text-gray-500"
                }`}>
                  Member list coming soon...
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Community Stats */}
            <div className={`rounded-xl border p-6 ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-900/40"
                : "border-gray-300 bg-white"
            }`}>
              <h3 className="font-semibold mb-4">Community Stats</h3>
              {isLoadingStats ? (
                <div className={`text-center py-4 ${
                  theme === "dark" ? "text-zinc-400" : "text-gray-600"
                }`}>
                  <p className="text-sm">Loading stats...</p>
                </div>
              ) : stats ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm ${
                        theme === "dark" ? "text-zinc-400" : "text-gray-600"
                      }`}>
                        Total Members
                      </span>
                      <span className="font-semibold">{stats.totalMembers.toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm ${
                        theme === "dark" ? "text-zinc-400" : "text-gray-600"
                      }`}>
                        Active Clubs
                      </span>
                      <span className="font-semibold">{stats.totalClubs.toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm ${
                        theme === "dark" ? "text-zinc-400" : "text-gray-600"
                      }`}>
                        Posts This Week
                      </span>
                      <span className="font-semibold">{stats.postsThisWeek.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`text-center py-4 ${
                  theme === "dark" ? "text-zinc-400" : "text-gray-600"
                }`}>
                  <p className="text-sm">Unable to load stats</p>
                </div>
              )}
            </div>

            {/* Trending Clubs */}
            <div className={`rounded-xl border p-6 ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-900/40"
                : "border-gray-300 bg-white"
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold">Trending Clubs</h3>
              </div>
              {isLoadingStats ? (
                <div className={`text-center py-4 ${
                  theme === "dark" ? "text-zinc-400" : "text-gray-600"
                }`}>
                  <p className="text-sm">Loading clubs...</p>
                </div>
              ) : stats && stats.trendingClubs.length > 0 ? (
                <div className="space-y-3">
                  {stats.trendingClubs.map((club) => (
                    <div
                      key={club.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        theme === "dark"
                          ? "hover:bg-zinc-800"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-lg">
                        {club.icon || '🎵'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{club.name}</h4>
                        <p className={`text-xs ${
                          theme === "dark" ? "text-zinc-400" : "text-gray-600"
                        }`}>
                          {club.membersCount.toLocaleString()} members
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-4 ${
                  theme === "dark" ? "text-zinc-400" : "text-gray-600"
                }`}>
                  <p className="text-sm">No trending clubs yet</p>
                </div>
              )}
            </div>

            {/* Invite Members */}
            <div className={`rounded-xl border p-6 ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-900/40"
                : "border-gray-300 bg-white"
            }`}>
              <h3 className="font-semibold mb-4">Invite Members</h3>
              <p className={`text-sm mb-4 ${
                theme === "dark" ? "text-zinc-400" : "text-gray-600"
              }`}>
                Know someone who would love this community?
              </p>
              <button className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${
                theme === "dark"
                  ? "bg-zinc-800 hover:bg-zinc-700 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-900"
              }`}>
                <UserPlus className="w-4 h-4" />
                <span className="text-sm font-medium">Send Invites</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
