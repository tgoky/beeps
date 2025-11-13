"use client";

import { useState } from "react";
import { useTheme } from "../../providers/ThemeProvider";
import { usePermissions } from "../../hooks/usePermissions";
import { Edit, Mail, MapPin, Link as LinkIcon, Users, Music2, FileText, Heart, MessageCircle, Clock, CheckCircle, Plus, Star, Crown, Settings, Upload, TrendingUp, Award, Play, Pause, Share2, Download, Eye, Briefcase, DollarSign, Package, Headphones, Mic, Zap, Shield, Trophy, Target, BarChart3, Calendar, Sparkles, Wrench, Radio } from "lucide-react";

// Mock user data (in real app, this would come from API/database)
const mockUserProfile = {
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
  primaryRole: "PRODUCER", // This would come from the actual user data
  secondaryRoles: ["ARTIST", "LYRICIST"], // User has multiple capabilities
  followers: 12400,
  stats: {
    // PRODUCER stats
    beatsLicensed: 145,
    collabCompletionRate: 95,
    avgSessionRating: 4.8,
    totalCollabs: 89,

    // ARTIST stats
    snippetPlays: 45000,
    fanGrowth: 850,
    collabRequestsReceived: 23,
    songsReleased: 34,

    // LYRICIST stats
    lyricsUsedInSongs: 67,
    feedbackScore: 4.7,
    collabROI: "$12.5K",
    publishedWorks: 45,

    // GEAR_SALES stats
    rentalUtilization: 87,
    avgRentalDuration: "4.2 days",
    damageClaims: 0,
    itemsListed: 23,
    transactions: 156,
    sellerRating: 4.9,

    // STUDIO_OWNER stats
    bookingsThisMonth: 42,
    occupancyRate: 78,
    repeatClients: 65,
    avgBookingValue: "$450"
  },
  skills: ["Producer", "Songwriter", "Mixing Engineer", "Vocalist"],
  genres: ["Pop", "R&B", "Hip Hop"],
  equipment: ["Ableton Live", "Neumann U87", "Apollo Twin", "Komplete Kontrol"],
  rates: {
    production: "$500-$1000",
    songwriting: "$300-$700",
    mixing: "$200-$400",
    studioHourly: "$75/hr"
  },
  availability: "Available for new projects",

  // Badge data
  badges: {
    streams: 10000, // For "Verified Artist" badge (10k+)
    totalCollabs: 89, // For "Certified Producer" (50+)
    hasInsurance: true,
    totalRentals: 156, // For "Gear Pro" (20+)
    publishedWorks: 45 // For "Master Lyricist"
  }
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

// Role-specific badge generator
const getRoleBadges = (user: typeof mockUserProfile, role: string) => {
  const badges = [];

  if (role === "ARTIST" && user.badges.streams >= 10000) {
    badges.push({
      icon: <CheckCircle className="w-4 h-4" />,
      label: "Verified Artist",
      color: "blue",
      description: "10k+ streams"
    });
  }

  if (role === "PRODUCER" && user.badges.totalCollabs >= 50) {
    badges.push({
      icon: <Trophy className="w-4 h-4" />,
      label: "Certified Producer",
      color: "purple",
      description: "50+ collaborations"
    });
  }

  if (role === "GEAR_SALES" && user.badges.hasInsurance && user.badges.totalRentals >= 20) {
    badges.push({
      icon: <Shield className="w-4 h-4" />,
      label: "Gear Pro",
      color: "green",
      description: "Insured + 20+ rentals"
    });
  }

  if (role === "LYRICIST" && user.badges.publishedWorks > 0) {
    badges.push({
      icon: <Award className="w-4 h-4" />,
      label: "Master Lyricist",
      color: "yellow",
      description: "Published works"
    });
  }

  if (role === "STUDIO_OWNER") {
    badges.push({
      icon: <Star className="w-4 h-4" />,
      label: "Verified Studio",
      color: "orange",
      description: "Certified location"
    });
  }

  return badges;
};

// Get role-specific stats
const getRoleStats = (user: typeof mockUserProfile, role: string) => {
  switch (role) {
    case "PRODUCER":
      return [
        { label: "Beats Licensed", value: user.stats.beatsLicensed, icon: <Music2 className="w-5 h-5" /> },
        { label: "Completion Rate", value: `${user.stats.collabCompletionRate}%`, icon: <Target className="w-5 h-5" /> },
        { label: "Avg. Rating", value: user.stats.avgSessionRating.toFixed(1), icon: <Star className="w-5 h-5" /> },
        { label: "Total Collabs", value: user.stats.totalCollabs, icon: <Users className="w-5 h-5" /> }
      ];

    case "ARTIST":
      return [
        { label: "Snippet Plays", value: formatNumber(user.stats.snippetPlays), icon: <Play className="w-5 h-5" /> },
        { label: "Fan Growth", value: `+${user.stats.fanGrowth}`, icon: <TrendingUp className="w-5 h-5" /> },
        { label: "Collab Requests", value: user.stats.collabRequestsReceived, icon: <Briefcase className="w-5 h-5" /> },
        { label: "Songs Released", value: user.stats.songsReleased, icon: <Radio className="w-5 h-5" /> }
      ];

    case "LYRICIST":
      return [
        { label: "Lyrics Used", value: user.stats.lyricsUsedInSongs, icon: <FileText className="w-5 h-5" /> },
        { label: "Feedback Score", value: user.stats.feedbackScore.toFixed(1), icon: <MessageCircle className="w-5 h-5" /> },
        { label: "Collab ROI", value: user.stats.collabROI, icon: <DollarSign className="w-5 h-5" /> },
        { label: "Published Works", value: user.stats.publishedWorks, icon: <Award className="w-5 h-5" /> }
      ];

    case "GEAR_SALES":
      return [
        { label: "Rental Util.", value: `${user.stats.rentalUtilization}%`, icon: <BarChart3 className="w-5 h-5" /> },
        { label: "Avg. Duration", value: user.stats.avgRentalDuration, icon: <Clock className="w-5 h-5" /> },
        { label: "Damage Claims", value: user.stats.damageClaims, icon: <Shield className="w-5 h-5" /> },
        { label: "Seller Rating", value: user.stats.sellerRating.toFixed(1), icon: <Star className="w-5 h-5" /> }
      ];

    case "STUDIO_OWNER":
      return [
        { label: "Monthly Bookings", value: user.stats.bookingsThisMonth, icon: <Calendar className="w-5 h-5" /> },
        { label: "Occupancy", value: `${user.stats.occupancyRate}%`, icon: <TrendingUp className="w-5 h-5" /> },
        { label: "Repeat Clients", value: `${user.stats.repeatClients}%`, icon: <Users className="w-5 h-5" /> },
        { label: "Avg. Booking", value: user.stats.avgBookingValue, icon: <DollarSign className="w-5 h-5" /> }
      ];

    default:
      return [
        { label: "Followers", value: formatNumber(user.followers), icon: <Users className="w-5 h-5" /> },
        { label: "Total Projects", value: user.stats.totalCollabs, icon: <Briefcase className="w-5 h-5" /> },
        { label: "Avg. Rating", value: user.stats.avgSessionRating.toFixed(1), icon: <Star className="w-5 h-5" /> }
      ];
  }
};

// Get role-specific CTA
const getRoleCTA = (role: string, viewerRole: string, theme: string) => {
  const isOwnProfile = role === viewerRole; // In real app, check if viewing own profile

  if (isOwnProfile) {
    // Own profile - show creation CTAs
    switch (role) {
      case "PRODUCER":
        return { text: "Create Collab", icon: <Plus className="w-5 h-5" />, href: "/collabs/create" };
      case "ARTIST":
        return { text: "Find Producer", icon: <Headphones className="w-5 h-5" />, href: "/services?tab=collabs" };
      case "GEAR_SALES":
        return { text: "List Equipment", icon: <Package className="w-5 h-5" />, href: "/gear/list" };
      case "LYRICIST":
        return { text: "Post Lyrics", icon: <FileText className="w-5 h-5" />, href: "/services/create/lyrics" };
      case "STUDIO_OWNER":
        return { text: "Manage Bookings", icon: <Calendar className="w-5 h-5" />, href: "/studios/manage" };
      default:
        return { text: "Upload Snippet", icon: <Upload className="w-5 h-5" />, href: "/snippets/upload" };
    }
  }

  // Viewing someone else's profile - show interaction CTAs
  switch (role) {
    case "PRODUCER":
      return { text: "Hire Me", icon: <Briefcase className="w-5 h-5" />, href: "#collab-modal" };
    case "ARTIST":
      return { text: "Offer Beat", icon: <Music2 className="w-5 h-5" />, href: "#offer-modal" };
    case "GEAR_SALES":
      return { text: "Rent Gear", icon: <Package className="w-5 h-5" />, href: "#rental-modal" };
    case "LYRICIST":
      return { text: "Request Review", icon: <MessageCircle className="w-5 h-5" />, href: "#review-modal" };
    case "STUDIO_OWNER":
      return { text: "Book Session", icon: <Calendar className="w-5 h-5" />, href: "#booking-modal" };
    default:
      return { text: "Collaborate", icon: <Users className="w-5 h-5" />, href: "#collab-modal" };
  }
};

// Get role display name
const getRoleDisplayName = (role: string) => {
  const roleNames: Record<string, string> = {
    PRODUCER: "Producer",
    ARTIST: "Artist",
    LYRICIST: "Lyricist",
    GEAR_SALES: "Gear Sales",
    STUDIO_OWNER: "Studio Owner",
    OTHER: "Member"
  };
  return roleNames[role] || role;
};

// Get role icon
const getRoleIcon = (role: string, className: string = "w-5 h-5") => {
  const roleIcons: Record<string, JSX.Element> = {
    PRODUCER: <Headphones className={className} />,
    ARTIST: <Mic className={className} />,
    LYRICIST: <FileText className={className} />,
    GEAR_SALES: <Package className={className} />,
    STUDIO_OWNER: <Radio className={className} />,
    OTHER: <Users className={className} />
  };
  return roleIcons[role] || <Users className={className} />;
};

export default function ProfilePage() {
  const { theme } = useTheme();
  const { permissions, isArtist, isProducer, isLyricist, isStudioOwner, isGearSales } = usePermissions();

  // State for role toggle (for hybrid users)
  const [activeRoleView, setActiveRoleView] = useState(mockUserProfile.primaryRole);
  const [activeTab, setActiveTab] = useState("overview");
  const [editMode, setEditMode] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);

  // In real app, this would be the logged-in user's role
  const viewerRole = permissions.role;

  // Check if user has multiple roles (hybrid user)
  const isHybridUser = mockUserProfile.secondaryRoles && mockUserProfile.secondaryRoles.length > 0;
  const availableRoles = [mockUserProfile.primaryRole, ...(mockUserProfile.secondaryRoles || [])];

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

  const roleStats = getRoleStats(mockUserProfile, activeRoleView);
  const roleBadges = getRoleBadges(mockUserProfile, activeRoleView);
  const roleCTA = getRoleCTA(activeRoleView, viewerRole, theme);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-gray-900"
    }`}>
      {/* Cover Photo */}
      <div
        className="h-64 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${mockUserProfile.coverImage})` }}
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
                src={mockUserProfile.avatar}
                alt={mockUserProfile.name}
                className="w-40 h-40 rounded-full border-4 shadow-xl object-cover"
                style={{ borderColor: theme === "dark" ? "#000" : "#fff" }}
              />
              {mockUserProfile.verified && (
                <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center border-2"
                  style={{ borderColor: theme === "dark" ? "#000" : "#fff" }}
                >
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}
              {mockUserProfile.proMember && (
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
                    {mockUserProfile.name}
                  </h1>
                  <div className="flex items-center gap-1">
                    {mockUserProfile.verified && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                    {mockUserProfile.proMember && (
                      <Crown className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                </div>

                {/* Role badges and toggle */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                    theme === "dark"
                      ? "bg-purple-500/20 border border-purple-500/30"
                      : "bg-purple-50 border border-purple-200"
                  }`}>
                    {getRoleIcon(activeRoleView, "w-4 h-4")}
                    <span className={`text-sm font-light tracking-wide ${
                      theme === "dark" ? "text-purple-300" : "text-purple-700"
                    }`}>
                      {getRoleDisplayName(activeRoleView)}
                    </span>
                  </div>

                  {/* Display role-specific achievement badges */}
                  {roleBadges.map((badge, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-light tracking-wide ${
                        badge.color === "blue" ? (theme === "dark" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-blue-50 text-blue-700 border border-blue-200") :
                        badge.color === "purple" ? (theme === "dark" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-purple-50 text-purple-700 border border-purple-200") :
                        badge.color === "green" ? (theme === "dark" ? "bg-green-500/20 text-green-300 border border-green-500/30" : "bg-green-50 text-green-700 border border-green-200") :
                        badge.color === "yellow" ? (theme === "dark" ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" : "bg-yellow-50 text-yellow-700 border border-yellow-200") :
                        badge.color === "orange" ? (theme === "dark" ? "bg-orange-500/20 text-orange-300 border border-orange-500/30" : "bg-orange-50 text-orange-700 border border-orange-200") :
                        ""
                      }`}
                      title={badge.description}
                    >
                      {badge.icon}
                      <span>{badge.label}</span>
                    </div>
                  ))}
                </div>

                {/* Hybrid User Role Toggle */}
                {isHybridUser && (
                  <div className="mb-4">
                    <div className={`inline-flex items-center gap-2 p-1 rounded-lg ${
                      theme === "dark"
                        ? "bg-zinc-900/60 border border-zinc-800"
                        : "bg-white border border-gray-200"
                    }`}>
                      <span className={`text-xs font-light tracking-wide px-2 ${
                        theme === "dark" ? "text-zinc-400" : "text-gray-600"
                      }`}>
                        View as:
                      </span>
                      {availableRoles.map((role) => (
                        <button
                          key={role}
                          onClick={() => setActiveRoleView(role)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-light tracking-wide transition-all ${
                            activeRoleView === role
                              ? (theme === "dark"
                                  ? "bg-purple-500 text-white"
                                  : "bg-purple-600 text-white")
                              : (theme === "dark"
                                  ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100")
                          }`}
                        >
                          {getRoleIcon(role, "w-3.5 h-3.5")}
                          {getRoleDisplayName(role)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`text-lg font-light tracking-wide mb-3 ${
                  theme === "dark" ? "text-zinc-400" : "text-gray-600"
                }`}>
                  {mockUserProfile.username}
                </div>

                {/* Bio */}
                <p className={`text-base font-light tracking-wide mb-4 max-w-2xl ${
                  theme === "dark" ? "text-zinc-300" : "text-gray-700"
                }`}>
                  {mockUserProfile.bio}
                </p>

                {/* Contact Info */}
                <div className="flex flex-wrap gap-4 text-sm font-light tracking-wide mb-4">
                  {mockUserProfile.location && (
                    <div className={`flex items-center gap-2 ${
                      theme === "dark" ? "text-zinc-400" : "text-gray-600"
                    }`}>
                      <MapPin className="w-4 h-4" />
                      {mockUserProfile.location}
                    </div>
                  )}
                  {mockUserProfile.website && (
                    <a
                      href={`https://${mockUserProfile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 hover:text-purple-500 transition-colors ${
                        theme === "dark" ? "text-zinc-400" : "text-gray-600"
                      }`}
                    >
                      <LinkIcon className="w-4 h-4" />
                      {mockUserProfile.website}
                    </a>
                  )}
                  {mockUserProfile.email && (
                    <a
                      href={`mailto:${mockUserProfile.email}`}
                      className={`flex items-center gap-2 hover:text-purple-500 transition-colors ${
                        theme === "dark" ? "text-zinc-400" : "text-gray-600"
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                      {mockUserProfile.email}
                    </a>
                  )}
                </div>

                {/* Availability Status */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  <span className={`text-sm font-light tracking-wide ${
                    theme === "dark" ? "text-zinc-300" : "text-gray-700"
                  }`}>
                    {mockUserProfile.availability}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4 md:mt-0">
                {editMode ? (
                  <button
                    onClick={() => setEditMode(false)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-light tracking-wide transition-all duration-200 active:scale-95 ${
                      theme === "dark"
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Save Changes
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setEditMode(true)}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-light tracking-wide transition-all duration-200 border active:scale-95 ${
                        theme === "dark"
                          ? "bg-zinc-900/60 hover:bg-zinc-800 text-white border-zinc-700"
                          : "bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      Edit Profile
                    </button>
                    <a
                      href={roleCTA.href}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-light tracking-wide transition-all duration-200 active:scale-95 ${
                        theme === "dark"
                          ? "bg-purple-600 hover:bg-purple-700 text-white"
                          : "bg-purple-600 hover:bg-purple-700 text-white"
                      }`}
                    >
                      {roleCTA.icon}
                      {roleCTA.text}
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Role-Specific Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {roleStats.map((stat, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-4 transition-all duration-200 hover:scale-105 ${
                    theme === "dark"
                      ? "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60"
                      : "border-gray-300 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className={`flex items-center gap-2 mb-2 ${
                    theme === "dark" ? "text-purple-400" : "text-purple-600"
                  }`}>
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-light tracking-tight mb-1">
                    {stat.value}
                  </div>
                  <div className={`text-xs font-light tracking-wide ${
                    theme === "dark" ? "text-zinc-400" : "text-gray-600"
                  }`}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`border-b mb-6 ${
          theme === "dark" ? "border-zinc-800" : "border-gray-300"
        }`}>
          <div className="flex gap-8 overflow-x-auto">
            {["overview", "snippets", "collabs", "activity", "reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-light tracking-wide whitespace-nowrap transition-all duration-200 border-b-2 ${
                  activeTab === tab
                    ? (theme === "dark"
                        ? "border-purple-500 text-purple-400"
                        : "border-purple-600 text-purple-600")
                    : (theme === "dark"
                        ? "border-transparent text-zinc-400 hover:text-white hover:border-zinc-600"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-400")
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8 pb-8">
          {/* Left Sidebar - Role-aware sections */}
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
                {editMode && permissions.role === activeRoleView && (
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
                {mockUserProfile.skills.map((skill, i) => (
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
                {mockUserProfile.genres.map((genre, i) => (
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

            {/* Equipment - Only show for PRODUCER, GEAR_SALES, STUDIO_OWNER */}
            {(activeRoleView === "PRODUCER" || activeRoleView === "GEAR_SALES" || activeRoleView === "STUDIO_OWNER") && (
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
                  {mockUserProfile.equipment.map((item, i) => (
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
            )}

            {/* Rates - Audience-aware (only show to non-peers or verified users) */}
            {(viewerRole !== activeRoleView || editMode) && activeRoleView !== "OTHER" && (
              <div className={`rounded-xl border p-6 ${
                theme === "dark"
                  ? "border-zinc-800 bg-zinc-900/40"
                  : "border-gray-300 bg-white"
              }`}>
                <h2 className={`text-lg font-light tracking-wide mb-4 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  Service Rates
                </h2>
                <div className="space-y-3">
                  {activeRoleView === "PRODUCER" && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-light tracking-wide ${
                          theme === "dark" ? "text-zinc-400" : "text-gray-600"
                        }`}>
                          Production
                        </span>
                        <span className={`text-sm font-light tracking-wide ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}>
                          {mockUserProfile.rates.production}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-light tracking-wide ${
                          theme === "dark" ? "text-zinc-400" : "text-gray-600"
                        }`}>
                          Mixing
                        </span>
                        <span className={`text-sm font-light tracking-wide ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}>
                          {mockUserProfile.rates.mixing}
                        </span>
                      </div>
                    </>
                  )}
                  {activeRoleView === "LYRICIST" && (
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-light tracking-wide ${
                        theme === "dark" ? "text-zinc-400" : "text-gray-600"
                      }`}>
                        Songwriting
                      </span>
                      <span className={`text-sm font-light tracking-wide ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {mockUserProfile.rates.songwriting}
                      </span>
                    </div>
                  )}
                  {activeRoleView === "STUDIO_OWNER" && (
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-light tracking-wide ${
                        theme === "dark" ? "text-zinc-400" : "text-gray-600"
                      }`}>
                        Studio Hourly
                      </span>
                      <span className={`text-sm font-light tracking-wide ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {mockUserProfile.rates.studioHourly}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Recent Activity */}
                <div className={`rounded-xl border p-6 ${
                  theme === "dark"
                    ? "border-zinc-800 bg-zinc-900/40"
                    : "border-gray-300 bg-white"
                }`}>
                  <h2 className={`text-xl font-light tracking-wide mb-6 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    Recent Activity
                  </h2>
                  <div className="space-y-4">
                    {userActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${
                          theme === "dark"
                            ? "bg-zinc-800/40 hover:bg-zinc-800/60"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${
                          theme === "dark" ? "bg-purple-500/20" : "bg-purple-100"
                        }`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-light tracking-wide mb-1 ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}>
                            {activity.title}
                          </p>
                          <p className={`text-xs font-light tracking-wide ${
                            theme === "dark" ? "text-zinc-400" : "text-gray-600"
                          }`}>
                            {activity.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "snippets" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userSnippets.map((snippet) => (
                  <div
                    key={snippet.id}
                    className={`rounded-xl border overflow-hidden transition-all duration-200 hover:scale-105 ${
                      theme === "dark"
                        ? "border-zinc-800 bg-zinc-900/40"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={snippet.image}
                        alt={snippet.title}
                        className="w-full h-48 object-cover"
                      />
                      <button
                        onClick={() => togglePlay(snippet.id)}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 transition-colors"
                      >
                        {currentlyPlaying === snippet.id ? (
                          <Pause className="w-12 h-12 text-white" />
                        ) : (
                          <Play className="w-12 h-12 text-white" />
                        )}
                      </button>
                      <div className="absolute top-4 right-4 flex gap-2">
                        <span className={`px-2 py-1 text-xs font-light tracking-wide rounded ${
                          theme === "dark" ? "bg-black/60 text-white" : "bg-white/90 text-gray-900"
                        }`}>
                          {snippet.duration}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className={`text-lg font-light tracking-wide mb-2 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {snippet.title}
                      </h3>
                      <div className="flex items-center justify-between text-sm font-light tracking-wide mb-3">
                        <span className={theme === "dark" ? "text-zinc-400" : "text-gray-600"}>
                          {snippet.genre}
                        </span>
                        <span className={theme === "dark" ? "text-zinc-400" : "text-gray-600"}>
                          {snippet.bpm} BPM • {snippet.key}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm font-light tracking-wide">
                          <div className={`flex items-center gap-1 ${
                            theme === "dark" ? "text-zinc-400" : "text-gray-600"
                          }`}>
                            <Play className="w-4 h-4" />
                            {formatNumber(snippet.plays)}
                          </div>
                          <div className={`flex items-center gap-1 ${
                            theme === "dark" ? "text-zinc-400" : "text-gray-600"
                          }`}>
                            <Heart className="w-4 h-4" />
                            {formatNumber(snippet.likes)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className={`p-2 rounded-lg transition-colors ${
                            theme === "dark"
                              ? "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                              : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                          }`}>
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button className={`p-2 rounded-lg transition-colors ${
                            theme === "dark"
                              ? "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                              : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
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
                    className={`rounded-xl border p-6 transition-all duration-200 hover:scale-[1.02] ${
                      theme === "dark"
                        ? "border-zinc-800 bg-zinc-900/40"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={collab.image}
                        alt={collab.title}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className={`text-lg font-light tracking-wide mb-1 ${
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
                            collab.status === "completed"
                              ? (theme === "dark" ? "bg-green-500/20 text-green-300" : "bg-green-100 text-green-700")
                              : (theme === "dark" ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700")
                          }`}>
                            {collab.status === "completed" ? "Completed" : "In Progress"}
                          </span>
                        </div>
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-sm font-light tracking-wide mb-1">
                            <span className={theme === "dark" ? "text-zinc-400" : "text-gray-600"}>
                              Progress
                            </span>
                            <span className={theme === "dark" ? "text-white" : "text-gray-900"}>
                              {collab.progress}%
                            </span>
                          </div>
                          <div className={`w-full h-2 rounded-full overflow-hidden ${
                            theme === "dark" ? "bg-zinc-800" : "bg-gray-200"
                          }`}>
                            <div
                              className="h-full bg-purple-500 transition-all duration-300"
                              style={{ width: `${collab.progress}%` }}
                            />
                          </div>
                        </div>
                        <p className={`text-xs font-light tracking-wide ${
                          theme === "dark" ? "text-zinc-400" : "text-gray-600"
                        }`}>
                          Started {collab.date}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-4">
                {userActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${
                      theme === "dark"
                        ? "bg-zinc-900/40 hover:bg-zinc-900/60 border border-zinc-800"
                        : "bg-white hover:bg-gray-50 border border-gray-300"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      theme === "dark" ? "bg-purple-500/20" : "bg-purple-100"
                    }`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-light tracking-wide mb-1 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {activity.title}
                      </p>
                      <p className={`text-xs font-light tracking-wide ${
                        theme === "dark" ? "text-zinc-400" : "text-gray-600"
                      }`}>
                        {activity.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-6">
                {userReviews.map((review) => (
                  <div
                    key={review.id}
                    className={`rounded-xl border p-6 ${
                      theme === "dark"
                        ? "border-zinc-800 bg-zinc-900/40"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={review.user.avatar}
                        alt={review.user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm font-light tracking-wide ${
                              theme === "dark" ? "text-white" : "text-gray-900"
                            }`}>
                              {review.user.name}
                            </h4>
                            {review.user.verified && (
                              <CheckCircle className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? "fill-yellow-500 text-yellow-500"
                                    : (theme === "dark" ? "text-zinc-700" : "text-gray-300")
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className={`text-sm font-light tracking-wide mb-2 ${
                          theme === "dark" ? "text-zinc-300" : "text-gray-700"
                        }`}>
                          {review.comment}
                        </p>
                        <div className="flex items-center gap-3 text-xs font-light tracking-wide">
                          <span className={theme === "dark" ? "text-zinc-400" : "text-gray-600"}>
                            Project: {review.project}
                          </span>
                          <span className={theme === "dark" ? "text-zinc-600" : "text-gray-400"}>
                            •
                          </span>
                          <span className={theme === "dark" ? "text-zinc-400" : "text-gray-600"}>
                            {review.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
