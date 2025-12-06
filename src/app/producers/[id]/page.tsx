"use client";

import { useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
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
  Send,
  Clock,
  DollarSign,
  Loader2,
  AlertCircle,
  X,
  Heart,
  Share2,
  ExternalLink,
  Zap,
  Trophy,
  Target
} from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { usePermissions } from "@/hooks/usePermissions";
import { useProducer } from "@/hooks/useProducers";

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Extract modal to separate component to prevent re-creation on each render
interface RequestServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  producerName: string;
  producerId: string;
  theme: string;
}

function RequestServiceModal({ isOpen, onClose, producerName, producerId, theme }: RequestServiceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");

  const handleSubmitRequest = async () => {
    if (!projectTitle || !projectDescription) {
      setSubmitError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/service-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          producerId,
          projectTitle,
          projectDescription,
          budget: budget || null,
          deadline: deadline || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send request");
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        onClose();
        setProjectTitle("");
        setProjectDescription("");
        setBudget("");
        setDeadline("");
        setSubmitSuccess(false);
      }, 2000);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`w-full max-w-2xl rounded-2xl border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${
        theme === "dark"
          ? "bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border-zinc-800"
          : "bg-white border-gray-300"
      }`}>
        <div className={`p-6 border-b flex items-start justify-between ${
          theme === "dark" ? "border-zinc-800" : "border-gray-200"
        }`}>
          <div>
            <h2 className={`text-xl font-medium tracking-tight ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              Request Service from {producerName}
            </h2>
            <p className={`text-sm mt-1 tracking-wide ${
              theme === "dark" ? "text-zinc-400" : "text-gray-600"
            }`}>
              Tell {producerName} about your project
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all duration-200 ${
              theme === "dark"
                ? "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {submitError && (
            <div className={`p-4 rounded-lg border flex items-start gap-3 animate-in slide-in-from-top-2 duration-200 ${
              theme === "dark"
                ? "bg-red-500/10 border-red-500/20"
                : "bg-red-50 border-red-200"
            }`}>
              <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
                theme === "dark" ? "text-red-400" : "text-red-600"
              }`} />
              <p className={`text-sm ${
                theme === "dark" ? "text-red-400" : "text-red-600"
              }`}>
                {submitError}
              </p>
            </div>
          )}

          {submitSuccess && (
            <div className={`p-4 rounded-lg border flex items-start gap-3 animate-in slide-in-from-top-2 duration-200 ${
              theme === "dark"
                ? "bg-green-500/10 border-green-500/20"
                : "bg-green-50 border-green-200"
            }`}>
              <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${
                theme === "dark" ? "text-green-400" : "text-green-600"
              }`} />
              <p className={`text-sm ${
                theme === "dark" ? "text-green-400" : "text-green-600"
              }`}>
                Service request sent successfully!
              </p>
            </div>
          )}

          <div className="space-y-3">
            <label className={`block text-sm font-medium ${
              theme === "dark" ? "text-zinc-300" : "text-gray-700"
            }`}>
              Project Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="e.g., Need beats for my album"
              className={`w-full px-4 py-3 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                theme === "dark"
                  ? "bg-zinc-900/50 border-zinc-800 text-white placeholder-zinc-500 focus:border-white focus:ring-white/20"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-gray-900/20"
              }`}
            />
          </div>

          <div className="space-y-3">
            <label className={`block text-sm font-medium ${
              theme === "dark" ? "text-zinc-300" : "text-gray-700"
            }`}>
              Project Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Describe your project, timeline, and requirements..."
              className={`w-full px-4 py-3 text-sm rounded-lg border transition-all duration-200 resize-none focus:outline-none focus:ring-2 ${
                theme === "dark"
                  ? "bg-zinc-900/50 border-zinc-800 text-white placeholder-zinc-500 focus:border-white focus:ring-white/20"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-gray-900/20"
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className={`block text-sm font-medium ${
                theme === "dark" ? "text-zinc-300" : "text-gray-700"
              }`}>
                Budget (Optional)
              </label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="$500 - $1000"
                className={`w-full px-4 py-3 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                  theme === "dark"
                    ? "bg-zinc-900/50 border-zinc-800 text-white placeholder-zinc-500 focus:border-white focus:ring-white/20"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-gray-900/20"
                }`}
              />
            </div>

            <div className="space-y-3">
              <label className={`block text-sm font-medium ${
                theme === "dark" ? "text-zinc-300" : "text-gray-700"
              }`}>
                Deadline (Optional)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={`w-full px-4 py-3 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                  theme === "dark"
                    ? "bg-zinc-900/50 border-zinc-800 text-white focus:border-white focus:ring-white/20"
                    : "bg-white border-gray-300 text-gray-900 focus:border-gray-900 focus:ring-gray-900/20"
                }`}
              />
            </div>
          </div>
        </div>

        <div className={`p-6 border-t flex gap-3 ${
          theme === "dark" ? "border-zinc-800" : "border-gray-200"
        }`}>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className={`flex-1 px-5 py-3 text-sm font-medium rounded-lg border transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === "dark"
                ? "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 hover:bg-zinc-900"
                : "border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitRequest}
            disabled={isSubmitting}
            className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium rounded-lg border transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === "dark"
                ? "bg-white border-white text-black hover:bg-zinc-100"
                : "bg-black border-black text-white hover:bg-gray-800"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" strokeWidth={2} />
                Send Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProducerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const producerId = params.id as string;
  const { theme } = useTheme();
  const { permissions, user } = usePermissions();

  const [activeTab, setActiveTab] = useState<"works" | "about" | "reviews">("works");
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Fetch producer data
  const { data: producer, isLoading, error } = useProducer(producerId);

  // Determine permissions
  const isOwnProfile = user?.id === producerId;
  const canEdit = isOwnProfile && permissions.canEditProducerProfile;
  const canRequestService = !isOwnProfile && permissions.canRequestProducerService;

  // Loading State
  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === "dark" ? "bg-black" : "bg-gray-50"
      }`}>
        <div className="text-center">
          <Loader2 className={`w-12 h-12 mx-auto mb-4 animate-spin ${
            theme === "dark" ? "text-zinc-600" : "text-gray-400"
          }`} />
          <p className={`text-sm ${
            theme === "dark" ? "text-zinc-500" : "text-gray-600"
          }`}>
            Loading producer profile...
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !producer) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${
        theme === "dark" ? "bg-black" : "bg-gray-50"
      }`}>
        <div className={`p-8 rounded-2xl border max-w-md text-center ${
          theme === "dark"
            ? "bg-zinc-950 border-zinc-800"
            : "bg-white border-gray-300"
        }`}>
          <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${
            theme === "dark" ? "text-zinc-600" : "text-gray-400"
          }`} />
          <h2 className={`text-lg font-medium mb-2 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            Producer not found
          </h2>
          <p className={`text-sm mb-6 ${
            theme === "dark" ? "text-zinc-500" : "text-gray-600"
          }`}>
            The producer you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push("/producers")}
            className={`px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 ${
              theme === "dark"
                ? "bg-white border-white text-black hover:bg-zinc-100"
                : "bg-black border-black text-white hover:bg-gray-800"
            }`}
          >
            Back to Producers
          </button>
        </div>
      </div>
    );
  }

  const totalPlays = producer.beats.reduce((sum, beat) => sum + (beat.likeCount * 100), 0);
  const displayName = producer.name || producer.email.split('@')[0];

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-gray-900"
    }`}>
      {/* Hero Section with Gradient */}
      <div className="relative overflow-hidden">
        {/* Animated gradient background */}
        <div className={`absolute inset-0 ${
          theme === "dark"
            ? "bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent"
            : "bg-gradient-to-br from-purple-100 via-pink-50 to-transparent"
        } animate-gradient-x`} />

        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 py-16">
          {/* Back Button */}
          <button
            onClick={() => router.push("/producers")}
            className={`flex items-center gap-2 mb-8 px-4 py-2 text-sm rounded-lg border transition-all duration-200 hover:scale-105 ${
              theme === "dark"
                ? "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 backdrop-blur-sm"
                : "bg-white/50 border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400 backdrop-blur-sm"
            }`}
          >
            <MapPin className="w-4 h-4" />
            Back to Producers
          </button>

          <div className="flex flex-col lg:flex-row gap-12 items-start">
            {/* Profile Image & Quick Stats */}
            <div className="flex-shrink-0">
              <div className="relative group">
                <div className={`absolute inset-0 rounded-2xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 ${
                  theme === "dark"
                    ? "bg-gradient-to-br from-purple-500 to-pink-500"
                    : "bg-gradient-to-br from-purple-400 to-pink-400"
                }`} />
                <img
                  src={producer.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${producer.id}`}
                  alt={displayName}
                  className={`relative w-48 h-48 rounded-2xl object-cover border-4 shadow-2xl ${
                    theme === "dark" ? "border-zinc-900" : "border-white"
                  }`}
                />
                {producer.verified && (
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full border-4 bg-blue-500 flex items-center justify-center shadow-lg animate-in zoom-in duration-500 ${
                    theme === "dark" ? "border-black" : "border-white"
                  }">
                    <CheckCircle2 className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                )}
              </div>

              {/* Quick Stats Cards */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className={`p-4 rounded-xl border backdrop-blur-sm ${
                  theme === "dark"
                    ? "bg-zinc-900/50 border-zinc-800"
                    : "bg-white/50 border-gray-300"
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className={`w-4 h-4 ${
                      theme === "dark" ? "text-purple-400" : "text-purple-600"
                    }`} />
                    <span className={`text-xs font-medium ${
                      theme === "dark" ? "text-zinc-400" : "text-gray-600"
                    }`}>
                      Followers
                    </span>
                  </div>
                  <div className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {formatNumber(producer.followersCount)}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border backdrop-blur-sm ${
                  theme === "dark"
                    ? "bg-zinc-900/50 border-zinc-800"
                    : "bg-white/50 border-gray-300"
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Music2 className={`w-4 h-4 ${
                      theme === "dark" ? "text-pink-400" : "text-pink-600"
                    }`} />
                    <span className={`text-xs font-medium ${
                      theme === "dark" ? "text-zinc-400" : "text-gray-600"
                    }`}>
                      Beats
                    </span>
                  </div>
                  <div className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {producer.beats.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className={`text-4xl font-bold tracking-tight ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      {displayName}
                    </h1>
                    {producer.verified && (
                      <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                        theme === "dark"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "bg-blue-50 text-blue-600 border border-blue-200"
                      }`}>
                        <Zap className="w-3 h-3" />
                        Verified Pro
                      </div>
                    )}
                  </div>

                  {producer.location && (
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className={`w-4 h-4 ${
                        theme === "dark" ? "text-zinc-500" : "text-gray-500"
                      }`} />
                      <span className={`text-sm ${
                        theme === "dark" ? "text-zinc-400" : "text-gray-600"
                      }`}>
                        {producer.location}
                      </span>
                    </div>
                  )}

                  {producer.bio && (
                    <p className={`text-base mb-6 leading-relaxed ${
                      theme === "dark" ? "text-zinc-300" : "text-gray-700"
                    }`}>
                      {producer.bio}
                    </p>
                  )}

                  {/* Genre Tags */}
                  {producer.genres && producer.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {producer.genres.map((genre, idx) => (
                        <span
                          key={idx}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                            theme === "dark"
                              ? "bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-300 border-purple-500/20"
                              : "bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-purple-200"
                          }`}
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Specialties */}
                  {producer.specialties && producer.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                      {producer.specialties.map((specialty, idx) => (
                        <span
                          key={idx}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 ${
                            theme === "dark"
                              ? "bg-zinc-900 text-zinc-300 border border-zinc-800"
                              : "bg-gray-100 text-gray-700 border border-gray-200"
                          }`}
                        >
                          <Trophy className="w-3 h-3" />
                          {specialty}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button className={`p-3 rounded-lg border transition-all duration-200 hover:scale-110 ${
                    theme === "dark"
                      ? "border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-900"
                      : "border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50"
                  }`}>
                    <Heart className="w-5 h-5" />
                  </button>
                  <button className={`p-3 rounded-lg border transition-all duration-200 hover:scale-110 ${
                    theme === "dark"
                      ? "border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-900"
                      : "border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50"
                  }`}>
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Main Action Buttons */}
              {isOwnProfile && canEdit ? (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push(`/producers/edit/${producerId}`)}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 hover:scale-105 active:scale-95 ${
                      theme === "dark"
                        ? "bg-white border-white text-black hover:bg-zinc-100"
                        : "bg-black border-black text-white hover:bg-gray-800"
                    }`}
                  >
                    <Edit3 className="w-4 h-4" strokeWidth={2} />
                    Edit Profile
                  </button>
                  <button
                    onClick={() => router.push(`/service-requests?asProducer=true`)}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 hover:scale-105 active:scale-95 ${
                      theme === "dark"
                        ? "border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600 hover:bg-zinc-900"
                        : "border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    <Briefcase className="w-4 h-4" strokeWidth={2} />
                    Manage Requests
                  </button>
                </div>
              ) : canRequestService ? (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowRequestModal(true)}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg ${
                      theme === "dark"
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 border-transparent text-white hover:from-purple-500 hover:to-pink-500"
                        : "bg-gradient-to-r from-purple-600 to-pink-600 border-transparent text-white hover:from-purple-500 hover:to-pink-500"
                    }`}
                  >
                    <Briefcase className="w-4 h-4" strokeWidth={2} />
                    Request Service
                  </button>
                  <button
                    onClick={() => router.push(`/messages/${producerId}`)}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 hover:scale-105 active:scale-95 ${
                      theme === "dark"
                        ? "border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600 hover:bg-zinc-900"
                        : "border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" strokeWidth={2} />
                    Message
                  </button>
                  <button
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 hover:scale-105 active:scale-95 ${
                      theme === "dark"
                        ? "border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600 hover:bg-zinc-900"
                        : "border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    <Users className="w-4 h-4" strokeWidth={2} />
                    Follow
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className={`flex items-center gap-1 p-1.5 rounded-xl border w-fit ${
              theme === "dark"
                ? "bg-zinc-950 border-zinc-800"
                : "bg-white border-gray-300"
            }`}>
              {[
                { key: "works", label: "Recent Works", icon: Music2 },
                { key: "about", label: "About", icon: Award },
                { key: "reviews", label: "Reviews", icon: Star },
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === tab.key
                        ? theme === "dark"
                          ? "bg-white text-black shadow-lg"
                          : "bg-gray-900 text-white shadow-lg"
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
              <div className="space-y-4">
                {producer.beats.length > 0 ? (
                  producer.beats.map((beat) => (
                    <div
                      key={beat.id}
                      className={`group p-6 rounded-xl border transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
                        theme === "dark"
                          ? "bg-gradient-to-br from-zinc-950 to-zinc-900 border-zinc-800 hover:border-zinc-700 hover:shadow-2xl"
                          : "bg-white border-gray-300 hover:border-gray-400 hover:shadow-xl"
                      }`}
                    >
                      <div className="flex items-start gap-5">
                        <div className="relative">
                          <img
                            src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f"
                            alt={beat.title}
                            className="w-24 h-24 rounded-lg object-cover"
                          />
                          <div className={`absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center`}>
                            <Play className="w-8 h-8 text-white" fill="white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-lg font-semibold mb-2 ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}>
                            {beat.title}
                          </h3>
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-1.5">
                              <Play className={`w-4 h-4 ${
                                theme === "dark" ? "text-zinc-500" : "text-gray-500"
                              }`} />
                              <span className={`text-sm ${
                                theme === "dark" ? "text-zinc-400" : "text-gray-600"
                              }`}>
                                {formatNumber(beat.likeCount * 100)} plays
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Heart className={`w-4 h-4 ${
                                theme === "dark" ? "text-zinc-500" : "text-gray-500"
                              }`} />
                              <span className={`text-sm ${
                                theme === "dark" ? "text-zinc-400" : "text-gray-600"
                              }`}>
                                {beat.likeCount}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className={`text-2xl font-bold ${
                              theme === "dark" ? "text-purple-400" : "text-purple-600"
                            }`}>
                              ${beat.price}
                            </div>
                            <button className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 ${
                              theme === "dark"
                                ? "bg-white text-black hover:bg-zinc-100"
                                : "bg-black text-white hover:bg-gray-800"
                            }`}>
                              License
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`p-16 rounded-xl border text-center ${
                    theme === "dark"
                      ? "bg-zinc-950 border-zinc-800"
                      : "bg-white border-gray-300"
                  }`}>
                    <Music2 className={`w-16 h-16 mx-auto mb-4 ${
                      theme === "dark" ? "text-zinc-700" : "text-gray-400"
                    }`} />
                    <p className={`text-sm ${
                      theme === "dark" ? "text-zinc-500" : "text-gray-600"
                    }`}>
                      No beats available yet
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "about" && (
              <div className={`p-8 rounded-xl border ${
                theme === "dark"
                  ? "bg-gradient-to-br from-zinc-950 to-zinc-900 border-zinc-800"
                  : "bg-white border-gray-300"
              }`}>
                <h3 className={`text-xl font-semibold mb-4 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  About
                </h3>
                <p className={`text-base leading-relaxed ${
                  theme === "dark" ? "text-zinc-300" : "text-gray-700"
                }`}>
                  {producer.bio || "No bio available yet."}
                </p>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className={`p-16 rounded-xl border text-center ${
                theme === "dark"
                  ? "bg-zinc-950 border-zinc-800"
                  : "bg-white border-gray-300"
              }`}>
                <Star className={`w-16 h-16 mx-auto mb-4 ${
                  theme === "dark" ? "text-zinc-700" : "text-gray-400"
                }`} />
                <p className={`text-sm ${
                  theme === "dark" ? "text-zinc-500" : "text-gray-600"
                }`}>
                  No reviews yet
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <div className={`p-6 rounded-xl border ${
              theme === "dark"
                ? "bg-gradient-to-br from-zinc-950 to-zinc-900 border-zinc-800"
                : "bg-white border-gray-300"
            }`}>
              <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                <Target className="w-4 h-4" />
                Performance
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${
                      theme === "dark" ? "text-zinc-400" : "text-gray-600"
                    }`}>
                      Projects
                    </span>
                    <span className={`text-lg font-bold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      {producer.beats.length + producer.services.length}+
                    </span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${
                    theme === "dark" ? "bg-zinc-800" : "bg-gray-200"
                  }`}>
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: "85%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${
                      theme === "dark" ? "text-zinc-400" : "text-gray-600"
                    }`}>
                      Response Time
                    </span>
                    <span className={`text-lg font-bold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      ~2h
                    </span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${
                    theme === "dark" ? "bg-zinc-800" : "bg-gray-200"
                  }`}>
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500" style={{ width: "95%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${
                      theme === "dark" ? "text-zinc-400" : "text-gray-600"
                    }`}>
                      Satisfaction
                    </span>
                    <span className={`text-lg font-bold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      98%
                    </span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${
                    theme === "dark" ? "bg-zinc-800" : "bg-gray-200"
                  }`}>
                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: "98%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Studios */}
            {producer.studios && producer.studios.length > 0 && (
              <div className={`p-6 rounded-xl border ${
                theme === "dark"
                  ? "bg-gradient-to-br from-zinc-950 to-zinc-900 border-zinc-800"
                  : "bg-white border-gray-300"
              }`}>
                <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  <Headphones className="w-4 h-4" />
                  Studios
                </h3>
                <div className="space-y-3">
                  {producer.studios.map((studio) => (
                    <div
                      key={studio.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-105 ${
                        theme === "dark"
                          ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                          : "bg-gray-50 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`font-medium mb-1 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {studio.name}
                      </div>
                      <div className={`text-xs mb-2 ${
                        theme === "dark" ? "text-zinc-400" : "text-gray-600"
                      }`}>
                        {studio.location}
                      </div>
                      <div className={`text-sm font-bold ${
                        theme === "dark" ? "text-purple-400" : "text-purple-600"
                      }`}>
                        ${studio.hourlyRate}/hr
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request Service Modal */}
      <RequestServiceModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        producerName={displayName}
        producerId={producerId}
        theme={theme}
      />
    </div>
  );
}
