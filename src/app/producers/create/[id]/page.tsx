"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "../../../../providers/ThemeProvider";
import { producerData } from "@app/producers/producersdata";
import {
  Star,
  MapPin,
  Play,
  Pause,
  Heart,
  Share2,
  MessageCircle,
  Music,
  Award,
  BadgeCheck,
  TrendingUp,
  Headphones,
  ChevronRight,
} from "lucide-react";

export default function ProducerProfile() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("works");
  const [isFollowing, setIsFollowing] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState("");
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [likedTracks, setLikedTracks] = useState<number[]>([]);
  
  const producer = producerData.find(p => p.id === Number(params.id));

  if (!producer) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === "dark" ? "bg-black" : "bg-white"
      }`}>
        <div className="text-center p-8">
          <h1 className={`text-xl font-semibold mb-2 ${
            theme === "dark" ? "text-gray-200" : "text-gray-900"
          }`}>
            Producer not found
          </h1>
          <button
            onClick={() => router.push("/producers")}
            className="px-4 py-2 rounded-lg font-medium bg-purple-600 hover:bg-purple-700 text-white"
          >
            Back to Producers
          </button>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const togglePlay = (trackIndex: number) => {
    setCurrentlyPlaying(currentlyPlaying === trackIndex ? null : trackIndex);
  };

  const toggleLike = (trackIndex: number) => {
    setLikedTracks(prev => 
      prev.includes(trackIndex) 
        ? prev.filter(id => id !== trackIndex)
        : [...prev, trackIndex]
    );
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-black" : "bg-white"}`}>
      {/* Hero Section */}
      <div className="relative h-64 overflow-hidden">
        <img 
          src={producer.cover} 
          alt={producer.name}
          className="w-full h-full object-cover"
        />
        <div className={`absolute inset-0 ${
          theme === "dark" 
            ? "bg-gradient-to-t from-black via-black/50 to-transparent"
            : "bg-gradient-to-t from-white via-white/50 to-transparent"
        }`} />
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 -mt-20 relative z-10 pb-12">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <img
              src={producer.avatar}
              alt={producer.name}
              className={`w-32 h-32 rounded-2xl object-cover border-4 shadow-2xl ${
                theme === "dark" ? "border-black" : "border-white"
              }`}
            />
           
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className={`text-3xl md:text-4xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {producer.name}
                  </h1>
                  <BadgeCheck className="w-7 h-7 text-blue-400" />
                </div>
                <div className={`flex items-center gap-4 text-sm flex-wrap ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}>
                  <span>@{producer.handle}</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {producer.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span className={`font-semibold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      {producer.rating}
                    </span>
                  </div>
                   {producer.online ? (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      <span className="text-green-500 font-medium">Online</span>
    </div>
  ) : (
    <span className={theme === "dark" ? "text-gray-500" : "text-gray-400"}>
      Active {producer.lastActive}
    </span>
  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`px-6 py-2.5 rounded-full font-semibold transition-all ${
                    isFollowing
                      ? theme === "dark"
                        ? "bg-white/10 text-white hover:bg-white/20"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      : theme === "dark"
                        ? "bg-white text-black hover:bg-gray-200"
                        : "bg-black text-white hover:bg-gray-800"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
                <button
                  onClick={() => setShowMessageModal(true)}
                  className={`p-2.5 rounded-full transition-all ${
                    theme === "dark"
                      ? "bg-white/10 hover:bg-white/20 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                  }`}
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
                <button className={`p-2.5 rounded-full transition-all ${
                  theme === "dark"
                    ? "bg-white/10 hover:bg-white/20 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                }`}>
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 mb-4">
              <div>
                <div className={`text-2xl font-bold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  {formatNumber(producer.social.followers)}
                </div>
                <div className={`text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}>
                  Followers
                </div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  {producer.recentWorks.length}
                </div>
                <div className={`text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}>
                  Tracks
                </div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  {formatNumber(producer.recentWorks.reduce((acc, work) => acc + work.plays, 0))}
                </div>
                <div className={`text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}>
                  Total Plays
                </div>
              </div>
            </div>

            {/* Bio */}
            {producer.bio && (
              <p className={`text-sm leading-relaxed max-w-2xl ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                {producer.bio}
              </p>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {producer.genres.map((genre, i) => (
                <span key={i} className={`px-3 py-1 rounded-full text-xs font-medium ${
                  theme === "dark"
                    ? "bg-white/10 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}>
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
    {/* Tabs */}
<div className={`flex gap-2 mb-8 p-1 rounded-xl w-fit ${
  theme === "dark" ? "bg-white/5" : "bg-gray-100"
}`}>
  {[
    { key: "works", label: "Works" },
    { key: "services", label: "Services" },
    { key: "about", label: "About" },
  ].map(({ key, label }) => (
    <button
      key={key}
      onClick={() => setActiveTab(key)}
      className={`px-6 py-2.5 font-medium transition-all rounded-lg ${
        activeTab === key
          ? theme === "dark"
            ? "bg-white text-black"
            : "bg-black text-white"
          : theme === "dark"
            ? "text-gray-400 hover:text-gray-200 bg-transparent"
            : "text-gray-600 hover:text-gray-900 bg-transparent"
      }`}
    >
      {label}
    </button>
  ))}
</div>

        {/* Content */}
        <div>
          {/* Recent Works */}
          {activeTab === "works" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {producer.recentWorks.map((work, index) => (
                <div
                  key={index}
                  className={`group rounded-xl p-4 transition-all cursor-pointer border ${
                    theme === "dark"
                      ? "bg-white/5 hover:bg-white/10 border-white/10"
                      : "bg-gray-50 hover:bg-gray-100 border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <button
                      onClick={() => togglePlay(index)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        currentlyPlaying === index
                          ? theme === "dark"
                            ? 'bg-white text-black'
                            : 'bg-black text-white'
                          : theme === "dark"
                            ? 'bg-white/20 text-white hover:bg-white/30'
                            : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                      }`}
                    >
                      {currentlyPlaying === index ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" />
                      )}
                    </button>
                    <img
                      src={work.image}
                      alt={work.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold truncate text-sm ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {work.title}
                      </h3>
                      <p className={`text-xs truncate ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}>
                        {work.artist}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center justify-between text-xs ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}>
                    <div className="flex items-center gap-1">
                      <Headphones className="w-3 h-3" />
                      {formatNumber(work.plays)}
                    </div>
                    <button
                      onClick={() => toggleLike(index)}
                      className={`transition-colors ${
                        likedTracks.includes(index) ? 'text-red-500' : 'hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${likedTracks.includes(index) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Services */}
          {activeTab === "services" && producer.services && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {producer.services.map((service, index) => (
                <div
                  key={index}
                  className={`rounded-2xl p-6 border transition-all group ${
                    theme === "dark"
                      ? "bg-white/5 border-white/10 hover:border-white/20"
                      : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <div className={`text-2xl font-bold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      {service.price}
                    </div>
                  </div>
                  
                  <h3 className={`font-bold text-lg mb-2 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {service.name}
                  </h3>
                  <p className={`text-sm mb-4 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}>
                    {service.description}
                  </p>
                  
                  <button className={`w-full py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group-hover:gap-3 ${
                    theme === "dark"
                      ? "bg-white text-black hover:bg-gray-200"
                      : "bg-black text-white hover:bg-gray-800"
                  }`}>
                    Book Now
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* About */}
          {activeTab === "about" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`rounded-2xl p-6 border ${
                theme === "dark"
                  ? "bg-white/5 border-white/10"
                  : "bg-gray-50 border-gray-200"
              }`}>
                <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  <Award className="w-5 h-5 text-yellow-500" />
                  Specialties
                </h3>
                <div className="space-y-3">
                  {producer.skills.map((skill, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <span className={`text-sm ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}>
                        {skill}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-2xl p-6 border ${
                theme === "dark"
                  ? "bg-white/5 border-white/10"
                  : "bg-gray-50 border-gray-200"
              }`}>
                <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Experience
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className={`text-2xl font-bold mb-1 ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      10+ Years
                    </div>
                    <div className={`text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}>
                      Industry Experience
                    </div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold mb-1 ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      {producer.credits?.length || 247}+
                    </div>
                    <div className={`text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}>
                      Completed Projects
                    </div>
                  </div>
                </div>
              </div>

              {producer.featuredGear && (
                <div className={`rounded-2xl p-6 border md:col-span-2 ${
                  theme === "dark"
                    ? "bg-white/5 border-white/10"
                    : "bg-gray-50 border-gray-200"
                }`}>
                  <h3 className={`font-bold text-lg mb-4 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    Studio Gear
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {producer.featuredGear.map((gear, i) => (
                      <div key={i} className={`text-sm ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}>
                        • {gear}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-2xl border ${
            theme === "dark" 
              ? "bg-gray-900 border-gray-800" 
              : "bg-white border-gray-200"
          }`}>
            <div className={`p-6 border-b ${
              theme === "dark" ? "border-gray-800" : "border-gray-200"
            }`}>
              <h3 className={`font-bold text-lg ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Message {producer.name}
              </h3>
            </div>
            
            <div className="p-6">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Hey ${producer.name}! I'd love to work with you on...`}
                rows={4}
                className={`w-full p-4 rounded-xl border resize-none ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className={`flex-1 py-2.5 rounded-xl font-medium border transition-colors ${
                    theme === "dark"
                      ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                      : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowMessageModal(false);
                    setMessage("");
                  }}
                  disabled={!message.trim()}
                  className={`flex-1 py-2.5 rounded-xl font-medium text-white transition-colors ${
                    !message.trim()
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}