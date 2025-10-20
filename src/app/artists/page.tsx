"use client";

import { useState } from "react";
import { useTheme } from "../../providers/ThemeProvider";
import { Edit, Mail, MapPin, Link as LinkIcon, Users, Music2, FileText, Heart, MessageCircle, Clock, CheckCircle, Plus, Star, Crown, Settings, Upload, TrendingUp, Award } from "lucide-react";

// Mock user data
const userProfile = {
  id: 1,
  name: "Alex Melody",
  username: "@alexmelody",
  avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  coverImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  bio: "Professional producer & songwriter. Creating hits since 2015. Let's make something amazing together!",
  location: "Los Angeles, CA",
  website: "alexmelody.com",
  verified: true,
  proMember: true,
  stats: {
    followers: 12400,
    following: 843,
    snippets: 56,
    collabs: 32,
    completedProjects: 78,
    avgRating: 4.7
  },
  skills: ["Producer", "Songwriter", "Mixing Engineer", "Vocalist"],
  genres: ["Pop", "R&B", "Hip Hop"],
  equipment: ["Ableton Live", "Neumann U87", "Apollo Twin", "Komplete Kontrol"],
  rates: {
    production: "$500-$1000",
    songwriting: "$300-$700",
    mixing: "$200-$400"
  },
  availability: "Available for new projects"
};

const userActivity = [
  { id: 1, type: "upload", title: "Uploaded new snippet 'Summer Vibes'", date: "2 hours ago" },
  { id: 2, type: "collab", title: "Started collab with @vocalqueen on 'Midnight Dreams'", date: "1 day ago" },
  { id: 3, type: "like", title: "Liked snippet 'Lofi Chill Loop' by @chillbeats", date: "2 days ago" }
];

const userSnippets = [
  { id: 1, title: "Summer Vibes Hook", plays: 1245, likes: 342, duration: "1:02", genre: "Pop", date: "2 days ago" },
  { id: 2, title: "R&B Vocal Loop", plays: 876, likes: 231, duration: "0:45", genre: "R&B", date: "1 week ago" },
  { id: 3, title: "Trap 808 Pattern", plays: 765, likes: 198, duration: "0:52", genre: "Hip Hop", date: "2 weeks ago" }
];

const userCollabs = [
  { id: 1, title: "Midnight Dreams (with @vocalqueen)", status: "in-progress", progress: 65, date: "1 week ago" },
  { id: 2, title: "City Lights (with @urbanrecords)", status: "completed", progress: 100, date: "3 weeks ago" }
];

const userReviews = [
  {
    id: 1,
    user: { name: "Vocal Queen", avatar: "https://randomuser.me/api/portraits/women/22.jpg" },
    rating: 5,
    comment: "Alex is an amazing producer to work with! Delivered exactly what I needed and was very professional.",
    date: "2 weeks ago"
  }
];

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export default function ProfilePage() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("activity");
  const [editMode, setEditMode] = useState(false);

  const getActivityIcon = (type: string) => {
    const icons = {
      upload: <Upload className="w-4 h-4" />,
      collab: <Users className="w-4 h-4" />,
      like: <Heart className="w-4 h-4" />,
      follow: <Users className="w-4 h-4" />,
      complete: <CheckCircle className="w-4 h-4" />
    };
    return icons[type as keyof typeof icons] || <Music2 className="w-4 h-4" />;
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-black" : "bg-gray-50"}`}>
      {/* Cover Photo */}
      <div 
        className="h-64 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${userProfile.coverImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
        {editMode && (
          <button
            className={`
              absolute top-4 right-4 flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200
              ${theme === "dark"
                ? "bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20"
                : "bg-black/20 hover:bg-black/30 text-white backdrop-blur-sm border border-white/20"
              }
              active:scale-95
            `}
          >
            <Upload className="w-3.5 h-3.5" />
            Change Cover
          </button>
        )}
      </div>

      {/* Profile Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col md:flex-row gap-6 -mt-16 relative z-10">
          {/* Avatar Section */}
          <div className="flex-shrink-0">
            <div className="relative">
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-32 h-32 rounded-full border-4 shadow-lg object-cover"
                style={{ borderColor: theme === "dark" ? "#000" : "#fff" }}
              />
              {userProfile.verified && (
                <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center border-2"
                  style={{ borderColor: theme === "dark" ? "#000" : "#fff" }}
                >
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
              {editMode && (
                <button
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-purple-500 text-white shadow-lg hover:bg-purple-600 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className={`text-3xl font-bold ${
                    theme === "dark" ? "text-gray-100" : "text-gray-900"
                  }`}>
                    {userProfile.name}
                  </h1>
                  {userProfile.proMember && (
                    <Crown className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
                <div className={`text-[15px] mb-2 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}>
                  {userProfile.username}
                </div>
              </div>

              <div className="flex gap-2">
                {!editMode ? (
                  <>
                    <button
                      onClick={() => setEditMode(true)}
                      className={`
                        flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200
                        ${theme === "dark"
                          ? "bg-gray-800/60 hover:bg-gray-800 text-gray-300 border border-gray-700/60"
                          : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
                        }
                        active:scale-95
                      `}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit Profile
                    </button>
                    <button
                      className={`
                        flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200
                        ${theme === "dark"
                          ? "bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30"
                          : "bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200"
                        }
                        active:scale-95
                      `}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Contact
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditMode(false)}
                      className={`
                        px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200
                        ${theme === "dark"
                          ? "bg-gray-800/60 hover:bg-gray-800 text-gray-300 border border-gray-700/60"
                          : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
                        }
                        active:scale-95
                      `}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      className={`
                        px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200
                        ${theme === "dark"
                          ? "bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30"
                          : "bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200"
                        }
                        active:scale-95
                      `}
                    >
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Bio */}
            <p className={`mb-4 text-[14px] ${
              theme === "dark" ? "text-gray-400" : "text-gray-700"
            }`}>
              {userProfile.bio}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              {[
                { label: "Followers", value: userProfile.stats.followers },
                { label: "Following", value: userProfile.stats.following },
                { label: "Snippets", value: userProfile.stats.snippets },
                { label: "Collabs", value: userProfile.stats.collabs },
                { label: "Projects", value: userProfile.stats.completedProjects }
              ].map((stat, i) => (
                <div
                  key={i}
                  className={`
                    p-3 rounded-lg border text-center
                    ${theme === "dark"
                      ? "bg-gray-900/40 border-gray-800/60"
                      : "bg-white border-gray-200"
                    }
                  `}
                >
                  <div className={`text-xl font-bold ${
                    theme === "dark" ? "text-gray-200" : "text-gray-900"
                  }`}>
                    {formatNumber(stat.value)}
                  </div>
                  <div className={`text-[11px] ${
                    theme === "dark" ? "text-gray-600" : "text-gray-500"
                  }`}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Details */}
            <div className="flex flex-wrap gap-4 text-[13px]">
              {userProfile.location && (
                <div className={`flex items-center gap-1.5 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}>
                  <MapPin className="w-3.5 h-3.5" />
                  {userProfile.location}
                </div>
              )}
              {userProfile.website && (
                <div className={`flex items-center gap-1.5 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}>
                  <LinkIcon className="w-3.5 h-3.5" />
                  <a
                    href={`https://${userProfile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={theme === "dark" ? "text-purple-400 hover:text-purple-300" : "text-purple-600 hover:text-purple-700"}
                  >
                    {userProfile.website}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.floor(userProfile.stats.avgRating)
                        ? "fill-yellow-500 text-yellow-500"
                        : theme === "dark"
                          ? "text-gray-700"
                          : "text-gray-300"
                    }`}
                  />
                ))}
                <span className={`ml-1 text-[12px] ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}>
                  {userProfile.stats.avgRating}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className={`h-px my-6 ${
          theme === "dark" ? "bg-gray-800/60" : "bg-gray-200"
        }`} />

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6 pb-8">
          {/* Left Sidebar */}
          <div className="w-full lg:w-1/3 space-y-4">
            {/* Skills */}
            <div className={`
              p-4 rounded-lg border
              ${theme === "dark"
                ? "bg-gray-900/40 border-gray-800/60"
                : "bg-white border-gray-200"
              }
            `}>
              <div className="flex justify-between items-center mb-3">
                <h2 className={`font-semibold text-[15px] ${
                  theme === "dark" ? "text-gray-200" : "text-gray-900"
                }`}>
                  Skills & Services
                </h2>
                {editMode && (
                  <button className={`text-[12px] ${
                    theme === "dark" ? "text-purple-400" : "text-purple-600"
                  }`}>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {userProfile.skills.map((skill, i) => (
                  <span
                    key={i}
                    className={`
                      px-2.5 py-1 text-[11px] font-medium rounded-md
                      ${theme === "dark"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-blue-50 text-blue-600 border border-blue-200/50"
                      }
                    `}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Genres */}
            <div className={`
              p-4 rounded-lg border
              ${theme === "dark"
                ? "bg-gray-900/40 border-gray-800/60"
                : "bg-white border-gray-200"
              }
            `}>
              <div className="flex justify-between items-center mb-3">
                <h2 className={`font-semibold text-[15px] ${
                  theme === "dark" ? "text-gray-200" : "text-gray-900"
                }`}>
                  Genres
                </h2>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {userProfile.genres.map((genre, i) => (
                  <span
                    key={i}
                    className={`
                      px-2.5 py-1 text-[11px] font-medium rounded-md
                      ${theme === "dark"
                        ? "bg-gray-800/60 text-gray-400"
                        : "bg-gray-100 text-gray-600"
                      }
                    `}
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div className={`
              p-4 rounded-lg border
              ${theme === "dark"
                ? "bg-gray-900/40 border-gray-800/60"
                : "bg-white border-gray-200"
              }
            `}>
              <div className="flex justify-between items-center mb-3">
                <h2 className={`font-semibold text-[15px] ${
                  theme === "dark" ? "text-gray-200" : "text-gray-900"
                }`}>
                  Equipment
                </h2>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {userProfile.equipment.map((item, i) => (
                  <span
                    key={i}
                    className={`
                      px-2.5 py-1 text-[11px] font-medium rounded-md
                      ${theme === "dark"
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        : "bg-purple-50 text-purple-600 border border-purple-200/50"
                      }
                    `}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Rates */}
            <div className={`
              p-4 rounded-lg border
              ${theme === "dark"
                ? "bg-gray-900/40 border-gray-800/60"
                : "bg-white border-gray-200"
              }
            `}>
              <div className="flex justify-between items-center mb-3">
                <h2 className={`font-semibold text-[15px] ${
                  theme === "dark" ? "text-gray-200" : "text-gray-900"
                }`}>
                  Rates
                </h2>
                <button className={`text-[12px] ${
                  theme === "dark" ? "text-purple-400" : "text-purple-600"
                }`}>
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2">
                {Object.entries(userProfile.rates).map(([service, rate]) => (
                  <div key={service} className="flex justify-between items-center">
                    <span className={`text-[13px] capitalize ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}>
                      {service}:
                    </span>
                    <span className={`text-[13px] font-semibold ${
                      theme === "dark" ? "text-gray-200" : "text-gray-900"
                    }`}>
                      {rate}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className={`
              p-4 rounded-lg border
              ${theme === "dark"
                ? "bg-gray-900/40 border-gray-800/60"
                : "bg-white border-gray-200"
              }
            `}>
              <h2 className={`font-semibold text-[15px] mb-3 ${
                theme === "dark" ? "text-gray-200" : "text-gray-900"
              }`}>
                Availability
              </h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className={`text-[13px] ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}>
                  {userProfile.availability}
                </span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full lg:w-2/3">
            {/* Tabs */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1">
                {[
                  { key: "activity", label: "Activity", icon: <Clock className="w-3.5 h-3.5" /> },
                  { key: "snippets", label: "Snippets", icon: <Music2 className="w-3.5 h-3.5" /> },
                  { key: "collabs", label: "Collabs", icon: <Users className="w-3.5 h-3.5" /> },
                  { key: "reviews", label: "Reviews", icon: <Star className="w-3.5 h-3.5" /> }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`
                      flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200
                      ${activeTab === tab.key
                        ? theme === "dark"
                          ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          : "bg-purple-50 text-purple-600 border border-purple-200"
                        : theme === "dark"
                          ? "bg-gray-900/40 hover:bg-gray-800/60 text-gray-400 hover:text-gray-300 border border-gray-800/60"
                          : "bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 border border-gray-200"
                      }
                      active:scale-95
                    `}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
              {!editMode && activeTab === "snippets" && (
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
                  Upload Snippet
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="space-y-3">
              {activeTab === "activity" && userActivity.map((activity) => (
                <div
                  key={activity.id}
                  className={`
                    flex items-start gap-3 p-4 rounded-lg border
                    ${theme === "dark"
                      ? "bg-gray-900/40 border-gray-800/60"
                      : "bg-white border-gray-200"
                    }
                  `}
                >
                  <div className={`
                    p-2.5 rounded-lg
                    ${theme === "dark" ? "bg-purple-500/20" : "bg-purple-100"}
                  `}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <div className={`text-[14px] ${
                      theme === "dark" ? "text-gray-300" : "text-gray-900"
                    }`}>
                      {activity.title}
                    </div>
                    <div className={`text-[12px] mt-1 ${
                      theme === "dark" ? "text-gray-600" : "text-gray-500"
                    }`}>
                      {activity.date}
                    </div>
                  </div>
                </div>
              ))}

              {activeTab === "snippets" && userSnippets.map((snippet) => (
                <div
                  key={snippet.id}
                  className={`
                    flex items-center justify-between p-4 rounded-lg border
                    ${theme === "dark"
                      ? "bg-gray-900/40 border-gray-800/60"
                      : "bg-white border-gray-200"
                    }
                  `}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`
                      w-12 h-12 rounded-lg flex items-center justify-center
                      ${theme === "dark" ? "bg-purple-500/20" : "bg-purple-100"}
                    `}>
                      <Music2 className={`w-5 h-5 ${theme === "dark" ? "text-purple-400" : "text-purple-600"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[14px] font-medium truncate ${
                        theme === "dark" ? "text-gray-200" : "text-gray-900"
                      }`}>
                        {snippet.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`
                          px-2 py-0.5 text-[10px] font-medium rounded-md
                          ${theme === "dark"
                            ? "bg-gray-800/60 text-gray-400"
                            : "bg-gray-100 text-gray-600"
                          }
                        `}>
                          {snippet.genre}
                        </span>
                        <span className={`text-[12px] ${
                          theme === "dark" ? "text-gray-600" : "text-gray-500"
                        }`}>
                          {snippet.duration}
                        </span>
                        <span className={`text-[12px] ${
                          theme === "dark" ? "text-gray-600" : "text-gray-500"
                        }`}>
                          • {snippet.date}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[12px]">
                    <span className={theme === "dark" ? "text-gray-500" : "text-gray-600"}>
                      {formatNumber(snippet.plays)} plays
                    </span>
                    <span className={theme === "dark" ? "text-gray-500" : "text-gray-600"}>
                      {snippet.likes} likes
                    </span>
                  </div>
                </div>
              ))}

              {activeTab === "collabs" && userCollabs.map((collab) => (
                <div
                  key={collab.id}
                  className={`
                    p-4 rounded-lg border
                    ${theme === "dark"
                      ? "bg-gray-900/40 border-gray-800/60"
                      : "bg-white border-gray-200"
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className={`text-[14px] font-medium ${
                        theme === "dark" ? "text-gray-200" : "text-gray-900"
                      }`}>
                        {collab.title}
                      </div>
                      <div className={`text-[12px] mt-1 ${
                        theme === "dark" ? "text-gray-600" : "text-gray-500"
                      }`}>
                        {collab.date}
                      </div>
                    </div>
                    <span className={`
                      px-2.5 py-1 text-[10px] font-semibold rounded-full capitalize
                      ${collab.status === 'completed'
                        ? theme === "dark"
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : "bg-green-50 text-green-600 border border-green-200/50"
                        : theme === "dark"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-blue-50 text-blue-600 border border-blue-200/50"
                      }
                    `}>
                      {collab.status.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 h-2 rounded-full overflow-hidden ${
                      theme === "dark" ? "bg-gray-800" : "bg-gray-200"
                    }`}>
                      <div
                        className={`h-full ${
                          collab.status === 'completed'
                            ? "bg-green-500"
                            : theme === "dark"
                              ? "bg-purple-500"
                              : "bg-purple-600"
                        }`}
                        style={{ width: `${collab.progress}%` }}
                      />
                    </div>
                    <span className={`text-[12px] font-medium ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}>
                      {collab.progress}%
                    </span>
                  </div>
                </div>
              ))}

              {activeTab === "reviews" && userReviews.map((review) => (
                <div
                  key={review.id}
                  className={`
                    p-4 rounded-lg border
                    ${theme === "dark"
                      ? "bg-gray-900/40 border-gray-800/60"
                      : "bg-white border-gray-200"
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={review.user.avatar}
                      alt={review.user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[14px] font-medium ${
                          theme === "dark" ? "text-gray-200" : "text-gray-900"
                        }`}>
                          {review.user.name}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.rating
                                  ? "fill-yellow-500 text-yellow-500"
                                  : theme === "dark"
                                    ? "text-gray-700"
                                    : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className={`text-[13px] mb-2 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}>
                        {review.comment}
                      </p>
                      <div className={`text-[12px] ${
                        theme === "dark" ? "text-gray-600" : "text-gray-500"
                      }`}>
                        {review.date}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}