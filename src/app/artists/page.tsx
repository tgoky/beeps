"use client";

import { useState } from "react";
import { useTheme } from "../../providers/ThemeProvider";
import { Edit, Mail, MapPin, Link as LinkIcon, Users, Music2, FileText, Heart, MessageCircle, Clock, CheckCircle, Plus, Star, Crown, Settings, Upload, TrendingUp, Award, Play, Pause, Share2, Download, Eye } from "lucide-react";

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
  email: "alex@melody.com",
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
  { id: 3, type: "like", title: "Liked snippet 'Lofi Chill Loop' by @chillbeats", date: "2 days ago" },
  { id: 4, type: "follow", title: "Started following @beatmaker", date: "3 days ago" },
  { id: 5, type: "complete", title: "Completed project 'City Lights'", date: "1 week ago" }
];

const userSnippets = [
  { 
    id: 1, 
    title: "Summer Vibes Hook", 
    plays: 1245, 
    likes: 342, 
    duration: "1:02", 
    genre: "Pop", 
    date: "2 days ago",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80",
    bpm: 120,
    key: "C Major"
  },
  { 
    id: 2, 
    title: "R&B Vocal Loop", 
    plays: 876, 
    likes: 231, 
    duration: "0:45", 
    genre: "R&B", 
    date: "1 week ago",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
    bpm: 95,
    key: "G Minor"
  },
  { 
    id: 3, 
    title: "Trap 808 Pattern", 
    plays: 765, 
    likes: 198, 
    duration: "0:52", 
    genre: "Hip Hop", 
    date: "2 weeks ago",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80",
    bpm: 140,
    key: "F Minor"
  }
];

const userCollabs = [
  { 
    id: 1, 
    title: "Midnight Dreams", 
    collaborator: "@vocalqueen", 
    status: "in-progress", 
    progress: 65, 
    date: "1 week ago",
    image: "https://images.unsplash.com/photo-1571974599782-87624638275f?w=400&q=80"
  },
  { 
    id: 2, 
    title: "City Lights", 
    collaborator: "@urbanrecords", 
    status: "completed", 
    progress: 100, 
    date: "3 weeks ago",
    image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&q=80"
  }
];

const userReviews = [
  {
    id: 1,
    user: { name: "Vocal Queen", avatar: "https://randomuser.me/api/portraits/women/22.jpg", verified: true },
    rating: 5,
    comment: "Alex is an amazing producer to work with! Delivered exactly what I needed and was very professional throughout the entire process. Would definitely work with again!",
    date: "2 weeks ago",
    project: "Summer Vibes"
  },
  {
    id: 2,
    user: { name: "Beat Master", avatar: "https://randomuser.me/api/portraits/men/45.jpg", verified: true },
    rating: 4,
    comment: "Great collaboration experience. Alex's production skills are top-notch and he's very easy to work with. Looking forward to our next project!",
    date: "1 month ago",
    project: "Midnight Dreams"
  }
];

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export default function ProfilePage() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("snippets");
  const [editMode, setEditMode] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);

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

  const togglePlay = (id: number) => {
    setCurrentlyPlaying(currentlyPlaying === id ? null : id);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-gray-900"
    }`}>
      {/* Cover Photo */}
      <div 
        className="h-64 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${userProfile.coverImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
        {editMode && (
          <button
            className={`absolute top-4 right-4 flex items-center gap-2 px-4 py-2 text-sm font-light rounded-lg transition-all duration-200 tracking-wide active:scale-95 ${
              theme === "dark"
                ? "bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20"
                : "bg-black/20 hover:bg-black/30 text-white backdrop-blur-sm border border-white/20"
            }`}
          >
            <Upload className="w-4 h-4" />
            Change Cover
          </button>
        )}
      </div>

      {/* Profile Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col md:flex-row gap-6 -mt-20 relative z-10">
          {/* Avatar Section */}
          <div className="flex-shrink-0">
            <div className="relative">
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-40 h-40 rounded-full border-4 shadow-xl object-cover"
                style={{ borderColor: theme === "dark" ? "#000" : "#fff" }}
              />
              {userProfile.verified && (
                <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center border-2"
                  style={{ borderColor: theme === "dark" ? "#000" : "#fff" }}
                >
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}
              {userProfile.proMember && (
                <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center border-2"
                  style={{ borderColor: theme === "dark" ? "#000" : "#fff" }}
                >
                  <Crown className="w-4 h-4 text-white" />
                </div>
              )}
              {editMode && (
                <button
                  className="absolute bottom-0 right-0 p-3 rounded-full bg-purple-500 text-white shadow-lg hover:bg-purple-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-light tracking-tight">
                    {userProfile.name}
                  </h1>
                  <div className="flex items-center gap-1">
                    {userProfile.verified && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                    {userProfile.proMember && (
                      <Crown className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                </div>
                <div className={`text-lg font-light tracking-wide mb-3 ${
                  theme === "dark" ? "text-zinc-400" : "text-gray-600"
                }`}>
                  {userProfile.username}
                </div>
                
                {/* Bio */}
                <p className={`text-base font-light tracking-wide mb-4 max-w-2xl ${
                  theme === "dark" ? "text-zinc-300" : "text-gray-700"
                }`}>
                  {userProfile.bio}
                </p>

                {/* Contact Info */}
                <div className="flex flex-wrap gap-4 text-sm font-light tracking-wide mb-4">
                  {userProfile.location && (
                    <div className={`flex items-center gap-2 ${
                      theme === "dark" ? "text-zinc-400" : "text-gray-600"
                    }`}>
                      <MapPin className="w-4 h-4" />
                      {userProfile.location}
                    </div>
                  )}
                  {userProfile.website && (
                    <div className={`flex items-center gap-2 ${
                      theme === "dark" ? "text-zinc-400" : "text-gray-600"
                    }`}>
                      <LinkIcon className="w-4 h-4" />
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
                  {userProfile.email && (
                    <div className={`flex items-center gap-2 ${
                      theme === "dark" ? "text-zinc-400" : "text-gray-600"
                    }`}>
                      <Mail className="w-4 h-4" />
                      <span>{userProfile.email}</span>
                    </div>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(userProfile.stats.avgRating)
                            ? "fill-yellow-500 text-yellow-500"
                            : theme === "dark"
                              ? "text-zinc-700"
                              : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-sm font-light tracking-wide ${
                    theme === "dark" ? "text-zinc-500" : "text-gray-600"
                  }`}>
                    {userProfile.stats.avgRating} • {userProfile.stats.completedProjects} projects
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4 md:mt-0">
                {!editMode ? (
                  <>
                    <button
                      onClick={() => setEditMode(true)}
                      className={`flex items-center gap-2 px-6 py-3 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                        theme === "dark"
                          ? "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
                          : "border-gray-300 text-gray-600 hover:text-black hover:border-gray-400"
                      }`}
                    >
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </button>
                    <button
                      className={`flex items-center gap-2 px-6 py-3 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                        theme === "dark"
                          ? "bg-white border-white text-black hover:bg-zinc-100"
                          : "bg-black border-black text-white hover:bg-gray-800"
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                      Contact
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditMode(false)}
                      className={`px-6 py-3 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                        theme === "dark"
                          ? "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
                          : "border-gray-300 text-gray-600 hover:text-black hover:border-gray-400"
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      className={`px-6 py-3 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                        theme === "dark"
                          ? "bg-white border-white text-black hover:bg-zinc-100"
                          : "bg-black border-black text-white hover:bg-gray-800"
                      }`}
                    >
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {[
                { label: "Followers", value: userProfile.stats.followers, icon: <Users className="w-4 h-4" /> },
                { label: "Following", value: userProfile.stats.following, icon: <Users className="w-4 h-4" /> },
                { label: "Snippets", value: userProfile.stats.snippets, icon: <Music2 className="w-4 h-4" /> },
                { label: "Collabs", value: userProfile.stats.collabs, icon: <FileText className="w-4 h-4" /> },
                { label: "Projects", value: userProfile.stats.completedProjects, icon: <Award className="w-4 h-4" /> }
              ].map((stat, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    theme === "dark"
                      ? "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60"
                      : "border-gray-300 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg ${
                      theme === "dark" ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-600"
                    }`}>
                      {stat.icon}
                    </div>
                    <div className={`text-2xl font-light tracking-tight ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      {formatNumber(stat.value)}
                    </div>
                  </div>
                  <div className={`text-xs font-light tracking-wide ${
                    theme === "dark" ? "text-zinc-500" : "text-gray-600"
                  }`}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className={`h-px my-8 ${
          theme === "dark" ? "bg-zinc-800" : "bg-gray-300"
        }`} />

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8 pb-8">
          {/* Left Sidebar */}
          <div className="w-full lg:w-1/3 space-y-6">
            {/* Skills */}
            <div className={`rounded-xl border p-6 ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-900/40"
                : "border-gray-300 bg-white"
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-lg font-light tracking-wide ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  Skills & Services
                </h2>
                {editMode && (
                  <button className={`p-1.5 rounded-lg transition-colors ${
                    theme === "dark" 
                      ? "text-purple-400 hover:bg-purple-500/20" 
                      : "text-purple-600 hover:bg-purple-100"
                  }`}>
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {userProfile.skills.map((skill, i) => (
                  <span
                    key={i}
                    className={`px-3 py-2 text-sm font-light tracking-wide rounded-lg border ${
                      theme === "dark"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-blue-50 text-blue-600 border-blue-200/50"
                    }`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Genres */}
            <div className={`rounded-xl border p-6 ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-900/40"
                : "border-gray-300 bg-white"
            }`}>
              <h2 className={`text-lg font-light tracking-wide mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Genres
              </h2>
              <div className="flex flex-wrap gap-2">
                {userProfile.genres.map((genre, i) => (
                  <span
                    key={i}
                    className={`px-3 py-2 text-sm font-light tracking-wide rounded-lg ${
                      theme === "dark"
                        ? "bg-zinc-800 text-zinc-300"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div className={`rounded-xl border p-6 ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-900/40"
                : "border-gray-300 bg-white"
            }`}>
              <h2 className={`text-lg font-light tracking-wide mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Equipment
              </h2>
              <div className="flex flex-wrap gap-2">
                {userProfile.equipment.map((item, i) => (
                  <span
                    key={i}
                    className={`px-3 py-2 text-sm font-light tracking-wide rounded-lg border ${
                      theme === "dark"
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        : "bg-purple-50 text-purple-600 border-purple-200/50"
                    }`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Rates */}
            <div className={`rounded-xl border p-6 ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-900/40"
                : "border-gray-300 bg-white"
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-lg font-light tracking-wide ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  Service Rates
                </h2>
                {editMode && (
                  <button className={`p-1.5 rounded-lg transition-colors ${
                    theme === "dark" 
                      ? "text-purple-400 hover:bg-purple-500/20" 
                      : "text-purple-600 hover:bg-purple-100"
                  }`}>
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {Object.entries(userProfile.rates).map(([service, rate]) => (
                  <div key={service} className="flex justify-between items-center">
                    <span className={`text-sm font-light tracking-wide capitalize ${
                      theme === "dark" ? "text-zinc-400" : "text-gray-600"
                    }`}>
                      {service}
                    </span>
                    <span className={`text-sm font-light tracking-wide ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      {rate}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className={`rounded-xl border p-6 ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-900/40"
                : "border-gray-300 bg-white"
            }`}>
              <h2 className={`text-lg font-light tracking-wide mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Availability
              </h2>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className={`text-sm font-light tracking-wide ${
                  theme === "dark" ? "text-zinc-300" : "text-gray-700"
                }`}>
                  {userProfile.availability}
                </span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full lg:w-2/3">
            {/* Tabs */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-1 p-1 rounded-lg border bg-zinc-900/40 border-zinc-800">
                {[
                  { key: "snippets", label: "Snippets", icon: Music2 },
                  { key: "collabs", label: "Collabs", icon: Users },
                  { key: "activity", label: "Activity", icon: Clock },
                  { key: "reviews", label: "Reviews", icon: Star }
                ].map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`
                        flex items-center gap-2 px-6 py-3 text-sm font-light rounded-lg transition-all duration-200 tracking-wide
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
              {!editMode && activeTab === "snippets" && (
                <button
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                    theme === "dark"
                      ? "bg-white border-white text-black hover:bg-zinc-100"
                      : "bg-black border-black text-white hover:bg-gray-800"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Upload Snippet
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="space-y-4">
              {activeTab === "snippets" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userSnippets.map((snippet) => (
                    <div
                      key={snippet.id}
                      className={`group rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                        theme === "dark"
                          ? "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60"
                          : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={snippet.image}
                          alt={snippet.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        
                        {/* Play Button */}
                        <button
                          onClick={() => togglePlay(snippet.id)}
                          className="absolute top-4 right-4 p-3 rounded-full backdrop-blur-sm bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
                        >
                          {currentlyPlaying === snippet.id ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5 ml-0.5" />
                          )}
                        </button>

                        {/* Track Info */}
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-lg font-light text-white tracking-wide mb-1">
                            {snippet.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs font-light text-zinc-300">
                            <span>{snippet.bpm} BPM</span>
                            <span>•</span>
                            <span>{snippet.key}</span>
                            <span>•</span>
                            <span>{snippet.duration}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`px-3 py-1 text-xs font-light tracking-wide rounded-full ${
                            theme === "dark"
                              ? "bg-zinc-800 text-zinc-300"
                              : "bg-gray-100 text-gray-700"
                          }`}>
                            {snippet.genre}
                          </span>
                          <span className={`text-xs font-light tracking-wide ${
                            theme === "dark" ? "text-zinc-500" : "text-gray-500"
                          }`}>
                            {snippet.date}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs font-light tracking-wide">
                            <div className="flex items-center gap-1">
                              <Play className="w-3 h-3" />
                              <span>{formatNumber(snippet.plays)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              <span>{snippet.likes}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className={`p-2 rounded-lg transition-colors ${
                              theme === "dark"
                                ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                : "text-gray-500 hover:text-black hover:bg-gray-200"
                            }`}>
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button className={`p-2 rounded-lg transition-colors ${
                              theme === "dark"
                                ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                : "text-gray-500 hover:text-black hover:bg-gray-200"
                            }`}>
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "collabs" && (
                <div className="space-y-4">
                  {userCollabs.map((collab) => (
                    <div
                      key={collab.id}
                      className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                        theme === "dark"
                          ? "border-zinc-800 bg-zinc-900/40"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-48 h-48 flex-shrink-0">
                          <img
                            src={collab.image}
                            alt={collab.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className={`text-xl font-light tracking-wide mb-1 ${
                                theme === "dark" ? "text-white" : "text-gray-900"
                              }`}>
                                {collab.title}
                              </h3>
                              <p className={`text-sm font-light tracking-wide ${
                                theme === "dark" ? "text-zinc-400" : "text-gray-600"
                              }`}>
                                with {collab.collaborator}
                              </p>
                            </div>
                            <span className={`px-3 py-1 text-xs font-light tracking-wide rounded-full ${
                              collab.status === 'completed'
                                ? theme === "dark"
                                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                  : "bg-green-50 text-green-600 border border-green-200/50"
                                : theme === "dark"
                                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                  : "bg-blue-50 text-blue-600 border border-blue-200/50"
                            }`}>
                              {collab.status.replace('-', ' ')}
                            </span>
                          </div>

                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm font-light tracking-wide mb-2">
                              <span className={theme === "dark" ? "text-zinc-400" : "text-gray-600"}>
                                Progress
                              </span>
                              <span className={theme === "dark" ? "text-zinc-400" : "text-gray-600"}>
                                {collab.progress}%
                              </span>
                            </div>
                            <div className={`w-full h-2 rounded-full overflow-hidden ${
                              theme === "dark" ? "bg-zinc-800" : "bg-gray-200"
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
                          </div>

                          <div className={`text-xs font-light tracking-wide ${
                            theme === "dark" ? "text-zinc-500" : "text-gray-500"
                          }`}>
                            Started {collab.date}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "activity" && (
                <div className="space-y-3">
                  {userActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 ${
                        theme === "dark"
                          ? "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60"
                          : "border-gray-300 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className={`p-3 rounded-lg ${
                        theme === "dark" ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-600"
                      }`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <div className={`text-base font-light tracking-wide mb-1 ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}>
                          {activity.title}
                        </div>
                        <div className={`text-sm font-light tracking-wide ${
                          theme === "dark" ? "text-zinc-500" : "text-gray-500"
                        }`}>
                          {activity.date}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="space-y-4">
                  {userReviews.map((review) => (
                    <div
                      key={review.id}
                      className={`rounded-xl border p-6 ${
                        theme === "dark"
                          ? "border-zinc-800 bg-zinc-900/40"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <img
                          src={review.user.avatar}
                          alt={review.user.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-lg font-light tracking-wide ${
                              theme === "dark" ? "text-white" : "text-gray-900"
                            }`}>
                              {review.user.name}
                            </span>
                            {review.user.verified && (
                              <CheckCircle className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? "fill-yellow-500 text-yellow-500"
                                      : theme === "dark"
                                        ? "text-zinc-700"
                                        : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className={`text-sm font-light tracking-wide ${
                              theme === "dark" ? "text-zinc-500" : "text-gray-500"
                            }`}>
                              • {review.project}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className={`text-base font-light tracking-wide mb-4 ${
                        theme === "dark" ? "text-zinc-300" : "text-gray-700"
                      }`}>
                        {review.comment}
                      </p>
                      <div className={`text-sm font-light tracking-wide ${
                        theme === "dark" ? "text-zinc-500" : "text-gray-500"
                      }`}>
                        {review.date}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}