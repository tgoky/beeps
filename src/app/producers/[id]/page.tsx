"use client";

import { useState } from "react";
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
  AlertCircle
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

export default function ProducerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const producerId = params.id as string;
  const { theme } = useTheme();
  const { permissions, user } = usePermissions();

  const [activeTab, setActiveTab] = useState<"works" | "about" | "reviews">("works");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form state
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");

  // Fetch producer data
  const { data: producer, isLoading, error } = useProducer(producerId);

  // Determine permissions
  const isOwnProfile = user?.id === producerId;
  const canEdit = isOwnProfile && permissions.canEditProducerProfile;
  const canRequestService = !isOwnProfile && permissions.canRequestProducerService;

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
        setShowRequestModal(false);
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

  // Producer Action Buttons (for producer viewing their own profile)
  const ProducerActions = () => (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => router.push(`/producers/edit/${producerId}`)}
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
        onClick={() => router.push(`/producers/${producerId}/upload-work`)}
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
        onClick={() => router.push(`/service-requests?asProducer=true`)}
        className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
          theme === "dark"
            ? "border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600"
            : "border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400"
        }`}
      >
        <Briefcase className="w-4 h-4" strokeWidth={2} />
        Manage Requests
      </button>

      <button
        onClick={() => router.push(`/producers/${producerId}/settings`)}
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
        onClick={() => router.push(`/messages/${producerId}`)}
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
            Request Service from {producer?.name || producer?.email?.split('@')[0]}
          </h2>
          <p className={`text-sm font-light mt-1 tracking-wide ${
            theme === "dark" ? "text-zinc-500" : "text-gray-600"
          }`}>
            Tell {producer?.name || producer?.email?.split('@')[0]} about your project
          </p>
        </div>

        <div className="p-6 space-y-6">
          {submitError && (
            <div className={`p-4 rounded-lg border flex items-start gap-3 ${
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
            <div className={`p-4 rounded-lg border flex items-start gap-3 ${
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
            <label className={`block text-xs font-medium tracking-wider uppercase ${
              theme === "dark" ? "text-zinc-400" : "text-gray-600"
            }`}>
              Project Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
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
              Project Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
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
                Budget (Optional)
              </label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
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
                Deadline (Optional)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
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
            onClick={() => {
              setShowRequestModal(false);
              setSubmitError(null);
              setSubmitSuccess(false);
            }}
            disabled={isSubmitting}
            className={`flex-1 px-5 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === "dark"
                ? "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
                : "border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitRequest}
            disabled={isSubmitting}
            className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
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

  // Loading State
  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === "dark" ? "bg-black" : "bg-gray-50"
      }`}>
        <Loader2 className={`w-8 h-8 animate-spin ${
          theme === "dark" ? "text-zinc-600" : "text-gray-400"
        }`} />
      </div>
    );
  }

  // Error State
  if (error || !producer) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${
        theme === "dark" ? "bg-black" : "bg-gray-50"
      }`}>
        <div className={`p-6 rounded-lg border max-w-md text-center ${
          theme === "dark"
            ? "bg-zinc-950 border-zinc-800"
            : "bg-white border-gray-300"
        }`}>
          <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${
            theme === "dark" ? "text-zinc-600" : "text-gray-400"
          }`} />
          <h2 className={`text-lg font-light mb-2 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            Producer not found
          </h2>
          <p className={`text-sm font-light mb-4 ${
            theme === "dark" ? "text-zinc-500" : "text-gray-600"
          }`}>
            The producer you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push("/producers")}
            className={`px-5 py-3 text-sm font-medium rounded-lg border transition-all duration-200 ${
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

  // Calculate stats
  const totalPlays = producer.beats.reduce((sum, beat) => sum + (beat.likeCount * 100), 0);

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
                    src={producer.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${producer.id}`}
                    alt={producer.name || producer.email}
                    className={`w-32 h-32 rounded-xl object-cover border-4 -mt-20 ${
                      theme === "dark" ? "border-black" : "border-white"
                    }`}
                  />
                  <div className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 ${
                    theme === "dark" ? "border-black" : "border-white"
                  } bg-green-500`} />
                </div>

                <div className="flex-1 min-w-0 pt-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h1 className={`text-2xl font-light tracking-tight mb-1 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {producer.name || producer.email.split('@')[0]}
                      </h1>
                      <p className={`text-sm font-light tracking-wide ${
                        theme === "dark" ? "text-zinc-500" : "text-gray-600"
                      }`}>
                        @{(producer.name || producer.email.split('@')[0]).toLowerCase().replace(/\s+/g, '')}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      <span className={`text-sm font-light ${
                        theme === "dark" ? "text-zinc-400" : "text-gray-600"
                      }`}>
                        4.8
                      </span>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 mb-4">
                    <MapPin className={`w-4 h-4 ${
                      theme === "dark" ? "text-zinc-600" : "text-gray-500"
                    }`} />
                    <span className={`text-sm font-light tracking-wide ${
                      theme === "dark" ? "text-zinc-500" : "text-gray-600"
                    }`}>
                      {producer.studios[0]?.location || producer.location || "Remote"}
                    </span>
                  </div>

                  {/* Bio */}
                  {producer.bio && (
                    <p className={`text-sm font-light tracking-wide mb-4 ${
                      theme === "dark" ? "text-zinc-400" : "text-gray-600"
                    }`}>
                      {producer.bio}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-6 mb-6">
                    <div className="flex items-center gap-2">
                      <Users className={`w-4 h-4 ${
                        theme === "dark" ? "text-zinc-600" : "text-gray-500"
                      }`} />
                      <span className={`text-sm font-light ${
                        theme === "dark" ? "text-zinc-500" : "text-gray-600"
                      }`}>
                        {formatNumber(Math.floor(Math.random() * 5000) + 500)} followers
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Play className={`w-4 h-4 ${
                        theme === "dark" ? "text-zinc-600" : "text-gray-500"
                      }`} />
                      <span className={`text-sm font-light ${
                        theme === "dark" ? "text-zinc-500" : "text-gray-600"
                      }`}>
                        {formatNumber(totalPlays)} plays
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Music2 className={`w-4 h-4 ${
                        theme === "dark" ? "text-zinc-600" : "text-gray-500"
                      }`} />
                      <span className={`text-sm font-light ${
                        theme === "dark" ? "text-zinc-500" : "text-gray-600"
                      }`}>
                        {producer.beats.length + producer.studios.length + producer.services.length} posts
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isOwnProfile && canEdit ? <ProducerActions /> : canRequestService && <ClientActions />}
                </div>
              </div>
            </div>
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
                { key: "works", label: "Recent Works", icon: Music2 },
                { key: "about", label: "About", icon: Award },
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
              <div className="space-y-4">
                {producer.beats.length > 0 ? (
                  producer.beats.map((beat) => (
                    <div
                      key={beat.id}
                      className={`p-6 rounded-xl border ${
                        theme === "dark"
                          ? "bg-zinc-950 border-zinc-800"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f"
                          alt={beat.title}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h3 className={`text-lg font-light tracking-tight mb-1 ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}>
                            {beat.title}
                          </h3>
                          <p className={`text-sm font-light tracking-wide mb-2 ${
                            theme === "dark" ? "text-zinc-500" : "text-gray-600"
                          }`}>
                            {formatNumber(beat.likeCount * 100)} plays
                          </p>
                          <div className="flex items-center gap-2">
                            <button className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                              theme === "dark"
                                ? "bg-white text-black border-white hover:bg-zinc-100"
                                : "bg-black text-white border-black hover:bg-gray-800"
                            }`}>
                              <Play className="w-3 h-3 inline mr-1" />
                              Play
                            </button>
                            <span className={`text-sm font-medium ${
                              theme === "dark" ? "text-white" : "text-gray-900"
                            }`}>
                              ${beat.price}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`p-12 rounded-xl border text-center ${
                    theme === "dark"
                      ? "bg-zinc-950 border-zinc-800"
                      : "bg-white border-gray-300"
                  }`}>
                    <Music2 className={`w-12 h-12 mx-auto mb-3 ${
                      theme === "dark" ? "text-zinc-700" : "text-gray-400"
                    }`} />
                    <p className={`text-sm font-light ${
                      theme === "dark" ? "text-zinc-500" : "text-gray-600"
                    }`}>
                      No recent works yet
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "about" && (
              <div className={`p-6 rounded-xl border ${
                theme === "dark"
                  ? "bg-zinc-950 border-zinc-800"
                  : "bg-white border-gray-300"
              }`}>
                <h3 className={`text-lg font-light tracking-tight mb-4 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  About
                </h3>
                <p className={`text-sm font-light tracking-wide ${
                  theme === "dark" ? "text-zinc-400" : "text-gray-600"
                }`}>
                  {producer.bio || "No bio available yet."}
                </p>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className={`p-12 rounded-xl border text-center ${
                theme === "dark"
                  ? "bg-zinc-950 border-zinc-800"
                  : "bg-white border-gray-300"
              }`}>
                <Star className={`w-12 h-12 mx-auto mb-3 ${
                  theme === "dark" ? "text-zinc-700" : "text-gray-400"
                }`} />
                <p className={`text-sm font-light ${
                  theme === "dark" ? "text-zinc-500" : "text-gray-600"
                }`}>
                  No reviews yet
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className={`p-6 rounded-xl border ${
              theme === "dark"
                ? "bg-zinc-950 border-zinc-800"
                : "bg-white border-gray-300"
            }`}>
              <h3 className={`text-sm font-medium tracking-wide mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-light ${
                    theme === "dark" ? "text-zinc-400" : "text-gray-600"
                  }`}>
                    Completed Projects
                  </span>
                  <span className={`text-sm font-medium ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {producer.beats.length + producer.services.length}+
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-light ${
                    theme === "dark" ? "text-zinc-400" : "text-gray-600"
                  }`}>
                    Response Time
                  </span>
                  <span className={`text-sm font-medium ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    ~2 hours
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-light ${
                    theme === "dark" ? "text-zinc-400" : "text-gray-600"
                  }`}>
                    Satisfaction
                  </span>
                  <span className={`text-sm font-medium ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    98%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request Service Modal */}
      {showRequestModal && <RequestServiceModal />}
    </div>
  );
}
