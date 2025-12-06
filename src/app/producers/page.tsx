"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  Star,
  Music2,
  CheckCircle2,
  Users,
  Play,
  MessageCircle,
  TrendingUp,
  Map,
  UserCheck,
  Clock,
  Briefcase,
  Settings,
  Edit3,
  Loader2
} from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { usePermissions } from "@/hooks/usePermissions";
import { getRoleDisplayName } from '@/lib/permissions';
import type { UserRole } from '@prisma/client';
import { useProducers, type Producer as APIProducer } from "@/hooks/useProducers";

// Use the API producer type directly - no need to transform with fake data
type Producer = APIProducer & {
  handle: string;
  recentWorks: {
    title: string;
    image: string;
  }[];
  totalPosts: number;
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export default function ProducerHub() {
  const router = useRouter();
  const { theme } = useTheme();
  const { permissions, isProducer } = usePermissions();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedSkill, setSelectedSkill] = useState("all");
  const [activeTab, setActiveTab] = useState("trending");

  // Fetch producers from API
  const { data: apiProducers = [], isLoading, error } = useProducers({
    search: searchQuery || undefined,
  });

  // Add computed fields to producers
  const producers: Producer[] = apiProducers.map(p => ({
    ...p,
    handle: `@${(p.name || p.email.split('@')[0]).toLowerCase().replace(/\s+/g, '')}`,
    recentWorks: p.beats.slice(0, 3).map(beat => ({
      title: beat.title,
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f"
    })),
    totalPosts: p.beats.length + p.studios.length + p.services.length
  }));

  const filteredProducers = producers.filter(producer => {
    const matchesGenre = selectedGenre === "all" || producer.genres.includes(selectedGenre);
    const matchesSkill = selectedSkill === "all" || producer.specialties.includes(selectedSkill);
    return matchesGenre && matchesSkill;
  });

  const tabConfig = [
    { key: "trending", label: "Trending", icon: TrendingUp },
    { key: "nearby", label: "Nearby", icon: Map },
    { key: "new", label: "New", icon: Clock },
    { key: "verified", label: "Verified", icon: UserCheck },
  ];

  // Get unique skills from all producers
  const allSkills = Array.from(new Set(producers.flatMap(producer => producer.specialties)));

  // Producer Card Action Buttons - changes based on user role
  const ProducerCardActions = ({ producer }: { producer: Producer }) => {
    // Check if this is the current user's profile (in a real app, check against auth user ID)
    const isOwnProfile = false; // Replace with actual check: currentUserId === producer.userId

    if (isOwnProfile && permissions.canEditProducerProfile) {
      // Producer viewing their own card
      return (
        <div className="flex gap-2">
          <button
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
              theme === "dark"
                ? "bg-white border-white text-black hover:bg-zinc-100"
                : "bg-black border-black text-white hover:bg-gray-800"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/producers/edit/${producer.id}`);
            }}
          >
            <Edit3 className="w-4 h-4" strokeWidth={2} />
            Edit Profile
          </button>
          
          <button
            className={`p-2.5 rounded-lg border transition-all duration-200 active:scale-95 ${
              theme === "dark"
                ? "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
                : "border-gray-300 text-gray-500 hover:text-gray-900 hover:border-gray-400"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/producers/${producer.id}/settings`);
            }}
          >
            <Settings className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      );
    } else if (permissions.canRequestProducerService) {
      // Other users (artists, lyricists, etc.) viewing producer
      return (
        <div className="flex gap-2">
          <button
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
              theme === "dark"
                ? "bg-white border-white text-black hover:bg-zinc-100"
                : "bg-black border-black text-white hover:bg-gray-800"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/producers/${producer.id}`);
            }}
          >
            <Briefcase className="w-4 h-4" strokeWidth={2} />
            Request Service
          </button>
          
          <button
            className={`p-2.5 rounded-lg border transition-all duration-200 active:scale-95 ${
              theme === "dark"
                ? "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
                : "border-gray-300 text-gray-500 hover:text-gray-900 hover:border-gray-400"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/messages/${producer.id}`);
            }}
          >
            <MessageCircle className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      );
    } else {
      // Default view - just view profile button
      return (
        <button
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
            theme === "dark"
              ? "bg-white border-white text-black hover:bg-zinc-100"
              : "bg-black border-black text-white hover:bg-gray-800"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/producers/${producer.id}`);
          }}
        >
          <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
          View Profile
        </button>
      );
    }
  };

  return (
    <div className={`min-h-screen p-6 transition-colors duration-200 ${
      theme === "dark" 
        ? "bg-black text-white" 
        : "bg-gray-50 text-gray-900"
    }`}>
      <div className="max-w-[1400px] mx-auto">
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
                Producer Hub
              </h1>
            </div>
            <p className={`text-sm font-light tracking-wide ${
              theme === "dark" ? "text-zinc-500" : "text-gray-600"
            }`}>
              {isProducer 
                ? "Manage your producer profile and connect with clients"
                : "Connect with top music producers worldwide"}
            </p>
          </div>

          {/* Conditional Header Action */}
          {isProducer && (
            <button
              onClick={() => router.push('/producers/my-profile')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                theme === "dark"
                  ? "bg-white border-white text-black hover:bg-zinc-100"
                  : "bg-black border-black text-white hover:bg-gray-800"
              }`}
            >
              <Edit3 className="w-4 h-4" strokeWidth={2} />
              Edit My Profile
            </button>
          )}
        </div>

        {/* Permission Info Banner (for non-producers) */}
        {!isProducer && permissions.canRequestProducerService && (
          <div className={`mb-6 p-4 rounded-lg border ${
            theme === "dark"
              ? "bg-blue-950/20 border-blue-900/30"
              : "bg-blue-50 border-blue-200/50"
          }`}>
            <div className="flex items-start gap-3">
              <Briefcase className={`w-5 h-5 flex-shrink-0 ${
                theme === "dark" ? "text-blue-400" : "text-blue-600"
              }`} strokeWidth={2} />
              <div>
                <p className={`text-sm font-medium tracking-wide ${
                  theme === "dark" ? "text-blue-300" : "text-blue-900"
                }`}>
                  Browse and Request Producer Services
                </p>
                <p className={`text-xs font-light tracking-wide mt-1 ${
                  theme === "dark" ? "text-blue-400/70" : "text-blue-700/70"
                }`}>
                  As {getRoleDisplayName(permissions.role as UserRole)}, you can view producer profiles, request services, and message directly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Filters */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search */}
            <div className="space-y-3">
              <label className={`block text-xs font-medium tracking-wider uppercase ${
                theme === "dark" ? "text-zinc-400" : "text-gray-600"
              }`}>
                Search Producers
              </label>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  theme === "dark" ? "text-zinc-600" : "text-gray-500"
                }`} strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Search by name or handle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide focus:outline-none ${
                    theme === "dark" 
                      ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus:border-white focus:bg-black" 
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:bg-white"
                  }`}
                />
              </div>
            </div>

            {/* Genre Filter */}
            <div className="space-y-3">
              <label className={`block text-xs font-medium tracking-wider uppercase ${
                theme === "dark" ? "text-zinc-400" : "text-gray-600"
              }`}>
                Genre
              </label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className={`w-full px-3 py-3 text-sm font-light rounded-lg border transition-all duration-200 cursor-pointer tracking-wide focus:outline-none ${
                  theme === "dark"
                    ? "bg-zinc-950 border-zinc-800 text-white focus:border-white focus:bg-black"
                    : "bg-white border-gray-300 text-gray-900 focus:border-gray-900 focus:bg-white"
                }`}
              >
                <option value="all">All Genres</option>
                <option value="Hip Hop">Hip Hop</option>
                <option value="Trap">Trap</option>
                <option value="R&B">R&B</option>
                <option value="Electronic">Electronic</option>
                <option value="Pop">Pop</option>
                <option value="Jazz">Jazz</option>
                <option value="Soul">Soul</option>
              </select>
            </div>

            {/* Skills Filter */}
            <div className="space-y-3">
              <label className={`block text-xs font-medium tracking-wider uppercase ${
                theme === "dark" ? "text-zinc-400" : "text-gray-600"
              }`}>
                Skills
              </label>
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className={`w-full px-3 py-3 text-sm font-light rounded-lg border transition-all duration-200 cursor-pointer tracking-wide focus:outline-none ${
                  theme === "dark"
                    ? "bg-zinc-950 border-zinc-800 text-white focus:border-white focus:bg-black"
                    : "bg-white border-gray-300 text-gray-900 focus:border-gray-900 focus:bg-white"
                }`}
              >
                <option value="all">All Skills</option>
                {allSkills.map((skill) => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
            </div>

            {/* Stats */}
            <div className={`p-4 rounded-lg border ${
              theme === "dark" 
                ? "bg-zinc-950 border-zinc-800" 
                : "bg-white border-gray-300"
            }`}>
              <div className="space-y-3">
                <h3 className={`text-sm font-light tracking-wide ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>Community</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className={`text-lg font-light tracking-tight ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      {formatNumber(producers.reduce((sum, p) => sum + p.followersCount, 0))}
                    </div>
                    <div className={`text-xs font-light tracking-wider ${
                      theme === "dark" ? "text-zinc-500" : "text-gray-600"
                    }`}>Total Followers</div>
                  </div>
                  <div className="space-y-1">
                    <div className={`text-lg font-light tracking-tight ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      {producers.length}
                    </div>
                    <div className={`text-xs font-light tracking-wider ${
                      theme === "dark" ? "text-zinc-500" : "text-gray-600"
                    }`}>Producers</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Role Info */}
            <div className={`p-4 rounded-lg border ${
              theme === "dark" 
                ? "bg-zinc-950 border-zinc-800" 
                : "bg-white border-gray-300"
            }`}>
              <div className="space-y-2">
                <h3 className={`text-sm font-light tracking-wide ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>Your Role</h3>
                <p className={`text-xs font-light tracking-wide ${
                  theme === "dark" ? "text-zinc-500" : "text-gray-600"
                }`}>
                 {getRoleDisplayName(permissions.role as UserRole)}
                </p>
                {isProducer && (
                  <p className={`text-xs font-light tracking-wide ${
                    theme === "dark" ? "text-green-400" : "text-green-600"
                  }`}>
                    ✓ Can accept jobs and manage profile
                  </p>
                )}
                {permissions.canRequestProducerService && (
                  <p className={`text-xs font-light tracking-wide ${
                    theme === "dark" ? "text-blue-400" : "text-blue-600"
                  }`}>
                    ✓ Can request producer services
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className={`flex items-center gap-1 mb-6 p-1 rounded-lg border w-fit ${
              theme === "dark" 
                ? "bg-zinc-950 border-zinc-800" 
                : "bg-white border-gray-300"
            }`}>
              {tabConfig.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
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

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className={`w-8 h-8 animate-spin ${
                  theme === "dark" ? "text-zinc-600" : "text-gray-400"
                }`} />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className={`p-4 rounded-lg border ${
                theme === "dark"
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-red-50 border-red-200 text-red-600"
              }`}>
                <p className="text-sm">Failed to load producers. Please try again.</p>
              </div>
            )}

            {/* Results Count */}
            {!isLoading && !error && (
              <div className={`text-sm font-light tracking-wide mb-6 ${
                theme === "dark" ? "text-zinc-500" : "text-gray-600"
              }`}>
                {filteredProducers.length} {filteredProducers.length === 1 ? "producer" : "producers"} found
              </div>
            )}

            {/* Producers Grid */}
            {!isLoading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducers.map((producer) => (
                <div
                  key={producer.id}
                  className={`group rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer hover:border-zinc-700 active:scale-[0.98] ${
                    theme === "dark"
                      ? "bg-zinc-950 border-zinc-800 hover:bg-zinc-900"
                      : "bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                  }`}
                  onClick={() => router.push(`/producers/${producer.id}`)}
                >
                  {/* Header with Avatar and Info */}
                  <div className={`p-4 border-b ${
                    theme === "dark" ? "border-zinc-800" : "border-gray-200"
                  }`}>
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={producer.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${producer.id}`}
                          alt={producer.name || producer.email}
                          className={`w-12 h-12 rounded-lg object-cover border ${
                            theme === "dark" ? "border-zinc-700" : "border-gray-300"
                          }`}
                        />
                        {producer.verified && (
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${
                            theme === "dark" ? "border-zinc-950" : "border-white"
                          } bg-blue-500 flex items-center justify-center`}>
                            <CheckCircle2 className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      {/* Producer Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-sm font-light tracking-wide truncate ${
                              theme === "dark" ? "text-white" : "text-gray-900"
                            }`}>
                              {producer.name || producer.email.split('@')[0]}
                            </h3>
                            <p className={`text-xs font-light tracking-wide truncate ${
                              theme === "dark" ? "text-zinc-500" : "text-gray-600"
                            }`}>
                              {producer.handle}
                            </p>
                          </div>
                          {producer.verified && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <CheckCircle2 className="w-3 h-3 text-blue-500" />
                            </div>
                          )}
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-1.5 mb-3">
                          <MapPin className={`w-3 h-3 ${
                            theme === "dark" ? "text-zinc-600" : "text-gray-500"
                          }`} />
                          <span className={`text-xs font-light tracking-wide truncate ${
                            theme === "dark" ? "text-zinc-500" : "text-gray-600"
                          }`}>
                            {producer.location}
                          </span>
                        </div>

                        {/* Social Stats */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Users className={`w-3 h-3 ${
                              theme === "dark" ? "text-zinc-600" : "text-gray-500"
                            }`} />
                            <span className={`text-xs font-light ${
                              theme === "dark" ? "text-zinc-500" : "text-gray-600"
                            }`}>
                              {formatNumber(producer.followersCount)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Music2 className={`w-3 h-3 ${
                              theme === "dark" ? "text-zinc-600" : "text-gray-500"
                            }`} />
                            <span className={`text-xs font-light ${
                              theme === "dark" ? "text-zinc-500" : "text-gray-600"
                            }`}>
                              {producer.totalPosts}
                            </span>
                          </div>
                          {producer.beats.length > 0 && (
                            <div className={`text-xs font-light px-2 py-0.5 rounded border bg-purple-500/10 text-purple-400 border-purple-500/20`}>
                              {producer.beats.length} beats
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Work */}
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Play className={`w-3 h-3 ${
                        theme === "dark" ? "text-zinc-600" : "text-gray-500"
                      }`} />
                      <span className={`text-xs font-light tracking-wide ${
                        theme === "dark" ? "text-zinc-400" : "text-gray-600"
                      }`}>Recent Work</span>
                    </div>
                    
                    {producer.recentWorks && producer.recentWorks.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {producer.recentWorks.slice(0, 1).map((work, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${
                              theme === "dark" 
                                ? "bg-zinc-900 border-zinc-800" 
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <img
                              src={work.image}
                              alt={work.title}
                              className="w-10 h-10 rounded object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-light tracking-wide truncate ${
                                theme === "dark" ? "text-white" : "text-gray-900"
                              }`}>
                                {work.title}
                              </div>
                              <div className={`text-xs font-light tracking-wide truncate ${
                                theme === "dark" ? "text-zinc-500" : "text-gray-600"
                              }`}>
                                Beat
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Role-based Action Buttons */}
                    <ProducerCardActions producer={producer} />
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {filteredProducers.length === 0 && (
                <div className={`text-center py-16 rounded-xl border col-span-full ${
                  theme === "dark"
                    ? "bg-zinc-950 border-zinc-800"
                    : "bg-white border-gray-300"
                }`}>
                  <Music2 className={`w-12 h-12 mx-auto mb-3 ${
                    theme === "dark" ? "text-zinc-700" : "text-gray-400"
                  }`} />
                  <p className={`text-sm font-light tracking-wide mb-1 ${
                    theme === "dark" ? "text-zinc-400" : "text-gray-600"
                  }`}>
                    No producers found
                  </p>
                  <p className={`text-xs font-light tracking-wide ${
                    theme === "dark" ? "text-zinc-600" : "text-gray-500"
                  }`}>
                    Try adjusting your filters or search query
                  </p>
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}