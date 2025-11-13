"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Music2, 
  Star, 
  MapPin, 
  Edit3, 
  Upload, 
  Briefcase, 
  MessageCircle, 
  CheckCircle2, 
  Play, 
  Users, 
  TrendingUp,
  Calendar,
  Award,
  Headphones,
  Settings,
  Plus,
  Send,
  ExternalLink,
  Clock,
  DollarSign
} from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { usePermissions } from "@/hooks/usePermissions";

type Producer = {
  id: number;
  name: string;
  handle: string;
  avatar: string;
  location: string;
  rating: number;
  genres: string[];
  skills: string[];
  hourlyRate?: string;
  availability?: string;
  bio?: string;
  recentWorks: {
    title: string;
    artist: string;
    plays: number;
    image: string;
  }[];
  social: {
    followers: number;
    following: number;
    posts: number;
  };
  online: boolean;
  lastActive: string;
  featuredGear?: string[];
  stats?: {
    completedProjects: number;
    responseTime: string;
    satisfactionRate: number;
  };
};

interface ProducerProfileViewProps {
  producer: Producer;
  isOwnProfile?: boolean;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export default function ProducerProfileView({ producer, isOwnProfile = false }: ProducerProfileViewProps) {
  const router = useRouter();
  const { theme } = useTheme();
 const { permissions } = usePermissions();

  const [activeTab, setActiveTab] = useState<"works" | "about" | "reviews">("works");
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Determine what actions the current user can take
  const canEdit = isOwnProfile && permissions.canEditProducerProfile;
  const canAcceptJobs = isOwnProfile && permissions.canAcceptJobs;
  const canUploadWorks = isOwnProfile && permissions.canUploadWorks;
  const canRequestService = !isOwnProfile && permissions.canRequestProducerService;
  const canMessage = permissions.canMessageProducers;

  // Producer Action Buttons (for producer viewing their own profile)
  const ProducerActions = () => (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => router.push(`/producers/edit/${producer.id}`)}
        className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
          theme === "dark"
            ? "bg-white border-white text-black hover:bg-zinc-100"
            : "bg-black border-black text-white hover:bg-gray-800"
        }`}
      >
        <Edit3 className="w-4 h-4" strokeWidth={2} />
        Edit Profile
      </button>

      <button
        onClick={() => router.push(`/producers/${producer.id}/upload-work`)}
        className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
          theme === "dark"
            ? "border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600"
            : "border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400"
        }`}
      >
        <Upload className="w-4 h-4" strokeWidth={2} />
        Upload Work
      </button>

      <button
        onClick={() => router.push(`/producers/${producer.id}/jobs`)}
        className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
          theme === "dark"
            ? "border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600"
            : "border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400"
        }`}
      >
        <Briefcase className="w-4 h-4" strokeWidth={2} />
        Manage Jobs
      </button>

      <button
        onClick={() => router.push(`/producers/${producer.id}/settings`)}
        className={`flex items-center gap-2 p-3 rounded-lg border transition-all duration-200 active:scale-95 ${
          theme === "dark"
            ? "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
            : "border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400"
        }`}
      >
        <Settings className="w-4 h-4" strokeWidth={2} />
      </button>
    </div>
  );

  // Client Action Buttons (for non-producers viewing producer profile)
  const ClientActions = () => (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => setShowRequestModal(true)}
        className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
          theme === "dark"
            ? "bg-white border-white text-black hover:bg-zinc-100"
            : "bg-black border-black text-white hover:bg-gray-800"
        }`}
      >
        <Briefcase className="w-4 h-4" strokeWidth={2} />
        Request Service
      </button>

      <button
        onClick={() => router.push(`/messages/${producer.id}`)}
        className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
          theme === "dark"
            ? "border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600"
            : "border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400"
        }`}
      >
        <MessageCircle className="w-4 h-4" strokeWidth={2} />
        Message
      </button>

      <button
        className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
          theme === "dark"
            ? "border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600"
            : "border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400"
        }`}
      >
        <Users className="w-4 h-4" strokeWidth={2} />
        Follow
      </button>
    </div>
  );

  // Request Service Modal
  const RequestServiceModal = () => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className={`w-full max-w-2xl rounded-xl border overflow-hidden ${
        theme === "dark"
          ? "bg-black border-zinc-800"
          : "bg-white border-gray-300"
      }`}>
        <div className={`p-6 border-b ${
          theme === "dark" ? "border-zinc-800" : "border-gray-200"
        }`}>
          <h2 className={`text-xl font-light tracking-tight ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            Request Service from {producer.name}
          </h2>
          <p className={`text-sm font-light mt-1 tracking-wide ${
            theme === "dark" ? "text-zinc-500" : "text-gray-600"
          }`}>
            Tell {producer.name} about your project
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <label className={`block text-xs font-medium tracking-wider uppercase ${
              theme === "dark" ? "text-zinc-400" : "text-gray-600"
            }`}>
              Project Title
            </label>
            <input
              type="text"
              placeholder="e.g., Need beats for my album"
              className={`w-full px-4 py-3 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide focus:outline-none ${
                theme === "dark"
                  ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus:border-white"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900"
              }`}
            />
          </div>

          <div className="space-y-3">
            <label className={`block text-xs font-medium tracking-wider uppercase ${
              theme === "dark" ? "text-zinc-400" : "text-gray-600"
            }`}>
              Project Description
            </label>
            <textarea
              rows={5}
              placeholder="Describe your project, timeline, and requirements..."
              className={`w-full px-4 py-3 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide resize-none focus:outline-none ${
                theme === "dark"
                  ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus:border-white"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900"
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className={`block text-xs font-medium tracking-wider uppercase ${
                theme === "dark" ? "text-zinc-400" : "text-gray-600"
              }`}>
                Budget
              </label>
              <input
                type="text"
                placeholder="$500 - $1000"
                className={`w-full px-4 py-3 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide focus:outline-none ${
                  theme === "dark"
                    ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus:border-white"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900"
                }`}
              />
            </div>

            <div className="space-y-3">
              <label className={`block text-xs font-medium tracking-wider uppercase ${
                theme === "dark" ? "text-zinc-400" : "text-gray-600"
              }`}>
                Deadline
              </label>
              <input
                type="date"
                className={`w-full px-4 py-3 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide focus:outline-none ${
                  theme === "dark"
                    ? "bg-zinc-950 border-zinc-800 text-white focus:border-white"
                    : "bg-white border-gray-300 text-gray-900 focus:border-gray-900"
                }`}
              />
            </div>
          </div>
        </div>

        <div className={`p-6 border-t flex gap-3 ${
          theme === "dark" ? "border-zinc-800" : "border-gray-200"
        }`}>
          <button
            onClick={() => setShowRequestModal(false)}
            className={`flex-1 px-5 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
              theme === "dark"
                ? "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
                : "border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400"
            }`}
          >
            Cancel
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
              theme === "dark"
                ? "bg-white border-white text-black hover:bg-zinc-100"
                : "bg-black border-black text-white hover:bg-gray-800"
            }`}
          >
            <Send className="w-4 h-4" strokeWidth={2} />
            Send Request
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen p-6 transition-colors duration-200 ${
      theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-gray-900"
    }`}>
      <div className="max-w-[1400px] mx-auto">
        {/* Header Section */}
        <div className={`rounded-xl border overflow-hidden mb-6 ${
          theme === "dark"
            ? "bg-zinc-950 border-zinc-800"
            : "bg-white border-gray-300"
        }`}>
          {/* Cover Image */}
          <div className={`h-48 bg-gradient-to-br ${
            theme === "dark"
              ? "from-zinc-900 to-black"
              : "from-gray-200 to-gray-100"
          }`} />

          <div className="p-8">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Avatar & Basic Info */}
              <div className="flex items-start gap-6">
                <div className="relative flex-shrink-0">
                  <img
                    src={producer.avatar}
                    alt={producer.name}
                    className={`w-32 h-32 rounded-xl object-cover border-4 -mt-20 ${
                      theme === "dark" ? "border-black" : "border-white"
                    }`}
                  />
                  {producer.online && (
                    <div className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 ${
                      theme === "dark" ? "border-black" : "border-white"
                    } bg-green-500`} />
                  )}
                </div>

                <div className="flex-1 min-w-0 pt-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h1 className={`text-2xl font-light tracking-tight mb-1 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {producer.name}
                      </h1>
                      <p className={`text-sm font-light tracking-wide mb-2 ${
                        theme === "dark" ? "text-zinc-500" : "text-gray-600"
                      }`}>
                        {producer.handle}
                      </p>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          <span className={`text-sm font-light ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}>
                            {producer.rating}
                          </span>
                          <span className={`text-xs font-light ${
                            theme === "dark" ? "text-zinc-500" : "text-gray-600"
                          }`}>
                            (156 reviews)
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <MapPin className={`w-4 h-4 ${
                            theme === "dark" ? "text-zinc-500" : "text-gray-600"
                          }`} />
                          <span className={`text-sm font-light ${
                            theme === "dark" ? "text-zinc-400" : "text-gray-600"
                          }`}>
                            {producer.location}
                          </span>
                        </div>

                        {producer.hourlyRate && (
                          <div className="flex items-center gap-1.5">
                            <DollarSign className={`w-4 h-4 ${
                              theme === "dark" ? "text-zinc-500" : "text-gray-600"
                            }`} />
                            <span className={`text-sm font-light ${
                              theme === "dark" ? "text-zinc-400" : "text-gray-600"
                            }`}>
                              {producer.hourlyRate}/hr
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                      producer.online
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        producer.online ? "bg-green-400" : "bg-yellow-400"
                      }`} />
                      <span className="text-xs font-medium tracking-wide">
                        {producer.online ? "Available" : producer.availability || "Busy"}
                      </span>
                    </div>
                  </div>

                  {/* Bio */}
                  {producer.bio && (
                    <p className={`text-sm font-light tracking-wide mb-4 ${
                      theme === "dark" ? "text-zinc-400" : "text-gray-600"
                    }`}>
                      {producer.bio}
                    </p>
                  )}

                  {/* Social Stats */}
                  <div className="flex items-center gap-6 mb-6">
                    <div>
                      <div className={`text-lg font-light tracking-tight ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {formatNumber(producer.social.followers)}
                      </div>
                      <div className={`text-xs font-light tracking-wider ${
                        theme === "dark" ? "text-zinc-500" : "text-gray-600"
                      }`}>
                        Followers
                      </div>
                    </div>
                    <div>
                      <div className={`text-lg font-light tracking-tight ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {formatNumber(producer.social.posts)}
                      </div>
                      <div className={`text-xs font-light tracking-wider ${
                        theme === "dark" ? "text-zinc-500" : "text-gray-600"
                      }`}>
                        Works
                      </div>
                    </div>
                    {producer.stats && (
                      <div>
                        <div className={`text-lg font-light tracking-tight ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}>
                          {producer.stats.completedProjects}
                        </div>
                        <div className={`text-xs font-light tracking-wider ${
                          theme === "dark" ? "text-zinc-500" : "text-gray-600"
                        }`}>
                          Projects
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons based on role */}
                  {canEdit || canAcceptJobs || canUploadWorks ? (
                    <ProducerActions />
                  ) : canRequestService ? (
                    <ClientActions />
                  ) : null}
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            {producer.stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-800">
                <div className={`p-4 rounded-lg border ${
                  theme === "dark"
                    ? "bg-zinc-900 border-zinc-800"
                    : "bg-gray-50 border-gray-200"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      theme === "dark" ? "bg-zinc-800" : "bg-white"
                    }`}>
                      <Clock className={`w-5 h-5 ${
                        theme === "dark" ? "text-blue-400" : "text-blue-600"
                      }`} />
                    </div>
                    <div>
                      <div className={`text-sm font-light tracking-wide ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {producer.stats.responseTime}
                      </div>
                      <div className={`text-xs font-light tracking-wider ${
                        theme === "dark" ? "text-zinc-500" : "text-gray-600"
                      }`}>
                        Response Time
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${
                  theme === "dark"
                    ? "bg-zinc-900 border-zinc-800"
                    : "bg-gray-50 border-gray-200"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      theme === "dark" ? "bg-zinc-800" : "bg-white"
                    }`}>
                      <Award className={`w-5 h-5 ${
                        theme === "dark" ? "text-green-400" : "text-green-600"
                      }`} />
                    </div>
                    <div>
                      <div className={`text-sm font-light tracking-wide ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {producer.stats.satisfactionRate}%
                      </div>
                      <div className={`text-xs font-light tracking-wider ${
                        theme === "dark" ? "text-zinc-500" : "text-gray-600"
                      }`}>
                        Satisfaction Rate
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${
                  theme === "dark"
                    ? "bg-zinc-900 border-zinc-800"
                    : "bg-gray-50 border-gray-200"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      theme === "dark" ? "bg-zinc-800" : "bg-white"
                    }`}>
                      <TrendingUp className={`w-5 h-5 ${
                        theme === "dark" ? "text-purple-400" : "text-purple-600"
                      }`} />
                    </div>
                    <div>
                      <div className={`text-sm font-light tracking-wide ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        Top 5%
                      </div>
                      <div className={`text-xs font-light tracking-wider ${
                        theme === "dark" ? "text-zinc-500" : "text-gray-600"
                      }`}>
                        Platform Ranking
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className={`flex items-center gap-1 p-1 rounded-lg border w-fit ${
              theme === "dark"
                ? "bg-zinc-950 border-zinc-800"
                : "bg-white border-gray-300"
            }`}>
              {[
                { key: "works", label: "Recent Works", icon: Play },
                { key: "about", label: "About", icon: Users },
                { key: "reviews", label: "Reviews", icon: Star },
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-light rounded transition-all duration-200 tracking-wide ${
                      activeTab === tab.key
                        ? theme === "dark"
                          ? "bg-white text-black"
                          : "bg-gray-900 text-white"
                        : theme === "dark"
                          ? "text-zinc-400 hover:text-white"
                          : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" strokeWidth={2} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            {activeTab === "works" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {producer.recentWorks.map((work, index) => (
                  <div
                    key={index}
                    className={`group rounded-lg border overflow-hidden transition-all duration-200 cursor-pointer hover:border-zinc-700 ${
                      theme === "dark"
                        ? "bg-zinc-950 border-zinc-800"
                        : "bg-white border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <div className="relative h-48">
                      <img
                        src={work.image}
                        alt={work.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button className="p-4 rounded-full bg-white text-black">
                          <Play className="w-6 h-6 fill-black" strokeWidth={0} />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className={`text-sm font-light tracking-wide mb-1 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {work.title}
                      </h3>
                      <p className={`text-xs font-light tracking-wide mb-2 ${
                        theme === "dark" ? "text-zinc-500" : "text-gray-600"
                      }`}>
                        {work.artist}
                      </p>
                      <div className={`text-xs font-light tracking-wide ${
                        theme === "dark" ? "text-zinc-600" : "text-gray-500"
                      }`}>
                        {formatNumber(work.plays)} plays
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Skills */}
            <div className={`p-6 rounded-xl border ${
              theme === "dark"
                ? "bg-zinc-950 border-zinc-800"
                : "bg-white border-gray-300"
            }`}>
              <h3 className={`text-sm font-medium tracking-wide mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Skills & Expertise
              </h3>
              <div className="flex flex-wrap gap-2">
                {producer.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1.5 text-xs font-light tracking-wide rounded-lg border ${
                      theme === "dark"
                        ? "bg-zinc-900 text-zinc-300 border-zinc-800"
                        : "bg-gray-100 text-gray-700 border-gray-300"
                    }`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Genres */}
            <div className={`p-6 rounded-xl border ${
              theme === "dark"
                ? "bg-zinc-950 border-zinc-800"
                : "bg-white border-gray-300"
            }`}>
              <h3 className={`text-sm font-medium tracking-wide mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Genres
              </h3>
              <div className="flex flex-wrap gap-2">
                {producer.genres.map((genre, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1.5 text-xs font-light tracking-wide rounded-lg border ${
                      theme === "dark"
                        ? "bg-zinc-900 text-zinc-300 border-zinc-800"
                        : "bg-gray-100 text-gray-700 border-gray-300"
                    }`}
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            {/* Featured Gear */}
            {producer.featuredGear && producer.featuredGear.length > 0 && (
              <div className={`p-6 rounded-xl border ${
                theme === "dark"
                  ? "bg-zinc-950 border-zinc-800"
                  : "bg-white border-gray-300"
              }`}>
                <h3 className={`text-sm font-medium tracking-wide mb-4 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  Featured Gear
                </h3>
                <div className="space-y-2">
                  {producer.featuredGear.map((gear, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 text-xs font-light tracking-wide ${
                        theme === "dark" ? "text-zinc-400" : "text-gray-600"
                      }`}
                    >
                      <Headphones className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>{gear}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request Service Modal */}
      {showRequestModal && <RequestServiceModal />}
    </div>
  );
}