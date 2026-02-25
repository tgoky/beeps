"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Music2,
  Star,
  MapPin,
  Edit3,
  MessageCircle,
  CheckCircle2,
  Play,
  Users,
  Award,
  Headphones,
  Send,
  Loader2,
  AlertCircle,
  X,
  Heart,
  Share2,
  Zap,
  Trophy,
  Globe,
  Instagram,
  Twitter,
  Youtube,
  ChevronRight,
  ArrowUpRight,
  Clock,
  DollarSign,
} from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { usePermissions } from "@/hooks/usePermissions";
import { useProducer } from "@/hooks/useProducers";

const formatNumber = (num: number): string => {
  if (!num) return "0";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
};

// ──────────────────────────────────────────────────────────────
// Reusable Micro-Components
// ──────────────────────────────────────────────────────────────

const SocialButton = ({ icon: Icon, href, theme }: { icon: any; href?: string; theme: string }) => (
  <a
    href={href || "#"}
    target="_blank"
    rel="noopener noreferrer"
    className={`p-2.5 rounded-full transition-colors ${
      theme === "dark"
        ? "bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700"
        : "bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200"
    }`}
  >
    <Icon className="w-4 h-4" />
  </a>
);

// ──────────────────────────────────────────────────────────────
// Request Service Modal
// ──────────────────────────────────────────────────────────────
interface RequestServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  producerName: string;
  producerId: string;
  theme: string;
}

function RequestServiceModal({
  isOpen,
  onClose,
  producerName,
  producerId,
  theme,
}: RequestServiceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    desc: "",
    budget: "",
    deadline: "",
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border ${
          theme === "dark" ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200"
        }`}
      >
        <div className={`p-6 flex justify-between items-center ${theme === "dark" ? "border-zinc-800" : "border-gray-100"}`}>
          <div>
            <h2 className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Request: {producerName}
            </h2>
            <p className={`text-xs mt-0.5 ${theme === "dark" ? "text-zinc-500" : "text-gray-500"}`}>
              Step {step} of 2
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${theme === "dark" ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-gray-100"}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 min-h-[280px]">
          {step === 1 ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className={`text-xs font-semibold ${theme === "dark" ? "text-zinc-400" : "text-gray-600"}`}>
                  Project Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full Album Production"
                  className={`w-full px-4 py-2.5 rounded-lg outline-none border transition-all text-sm ${
                    theme === "dark"
                      ? "bg-zinc-800 border-zinc-700 focus:border-zinc-500 text-white"
                      : "bg-gray-50 border-gray-200 focus:border-gray-400 text-black"
                  }`}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className={`text-xs font-semibold ${theme === "dark" ? "text-zinc-400" : "text-gray-600"}`}>
                  Brief Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your vision..."
                  className={`w-full px-4 py-2.5 rounded-lg outline-none border transition-all resize-none text-sm ${
                    theme === "dark"
                      ? "bg-zinc-800 border-zinc-700 focus:border-zinc-500 text-white"
                      : "bg-gray-50 border-gray-200 focus:border-gray-400 text-black"
                  }`}
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={`text-xs font-semibold ${theme === "dark" ? "text-zinc-400" : "text-gray-600"}`}>
                    Budget ($)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className={`w-full px-4 py-2.5 rounded-lg outline-none border transition-all text-sm ${
                      theme === "dark"
                        ? "bg-zinc-800 border-zinc-700 focus:border-zinc-500 text-white"
                        : "bg-gray-50 border-gray-200 focus:border-gray-400 text-black"
                    }`}
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className={`text-xs font-semibold ${theme === "dark" ? "text-zinc-400" : "text-gray-600"}`}>
                    Deadline
                  </label>
                  <input
                    type="date"
                    className={`w-full px-4 py-2.5 rounded-lg outline-none border transition-all text-sm ${
                      theme === "dark"
                        ? "bg-zinc-800 border-zinc-700 focus:border-zinc-500 text-white"
                        : "bg-gray-50 border-gray-200 focus:border-gray-400 text-black"
                    }`}
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>
              <div
                className={`p-4 rounded-lg flex gap-3 items-start ${
                  theme === "dark" ? "bg-yellow-500/10 text-yellow-200" : "bg-blue-50 text-blue-800"
                }`}
              >
                <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs leading-relaxed opacity-80">
                  This producer usually responds within 2 hours. High-budget projects are prioritized.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className={`p-4 border-t flex gap-3 ${theme === "dark" ? "border-zinc-800" : "border-gray-100"}`}>
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className={`px-6 py-2.5 rounded-lg font-semibold text-sm ${
                theme === "dark" ? "text-zinc-400 hover:text-white" : "text-gray-500 hover:text-black"
              }`}
            >
              Back
            </button>
          )}
          <button
            onClick={() => (step === 1 ? setStep(2) : handleSubmit())}
            disabled={isSubmitting}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              theme === "dark"
                ? "bg-white text-black hover:bg-zinc-200"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : step === 1 ? "Continue" : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main Profile Page
// ──────────────────────────────────────────────────────────────
export default function ProducerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const producerId = params.id as string;
  const { theme } = useTheme();
  const { permissions, user } = usePermissions();

  const [activeTab, setActiveTab] = useState<"works" | "about" | "services">("works");
  const [showRequestModal, setShowRequestModal] = useState(false);

  const { data: producer, isLoading, error } = useProducer(producerId);

  const isOwnProfile = user?.id === producerId;
  const canEdit = isOwnProfile && permissions.canEditProducerProfile;

  if (isLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          theme === "dark" ? "bg-zinc-950" : "bg-gray-50"
        }`}
      >
        <Loader2 className={`w-6 h-6 animate-spin ${theme === "dark" ? "text-white" : "text-black"}`} />
      </div>
    );
  }

  if (error || !producer)
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          theme === "dark" ? "bg-zinc-950" : "bg-gray-50"
        }`}
      >
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
          <p className={theme === "dark" ? "text-white" : "text-black"}>Failed to load producer.</p>
        </div>
      </div>
    );

  const displayName = producer.name || producer.email.split("@")[0];

  // Safe Access Wrappers
  const genres = producer.genres || [];
  const specialties = producer.specialties || [];
  const beats = producer.beats || [];
  const studios = producer.studios || [];

  return (
    <div
      className={`min-h-screen font-sans selection:bg-blue-500/30 ${
        theme === "dark" ? "bg-zinc-950 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* ──────────────── HEADER / HERO ──────────────── */}
      <div className="relative border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Left: Avatar Column */}
            <div className="flex flex-col items-center md:items-start gap-4 w-full md:w-auto">
              <div className="relative">
                <img
                  src={producer.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${producer.id}`}
                  alt={displayName}
                  className={`w-32 h-32 lg:w-40 lg:h-40 rounded-2xl object-cover shadow-lg ${
                    theme === "dark" ? "bg-zinc-900" : "bg-gray-100"
                  }`}
                />
                {producer.verified && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-lg shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
              
              {/* Action Buttons for Desktop */}
              <div className="hidden md:flex flex-col gap-2 w-40">
                 {isOwnProfile ? (
                    <button onClick={() => router.push(`/producers/edit/${producerId}`)} className={`w-full py-2 rounded-lg font-semibold text-sm border transition-all ${theme === "dark" ? "border-zinc-700 hover:bg-zinc-800" : "border-gray-300 hover:bg-gray-100"}`}>
                       Edit Profile
                    </button>
                 ) : (
                    <>
                      <button 
                        onClick={() => setShowRequestModal(true)}
                        className="w-full py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                         Hire Me
                      </button>
                      <button className={`w-full py-2 rounded-lg font-semibold text-sm border flex items-center justify-center gap-2 transition-all ${
                         theme === "dark" ? "border-zinc-700 hover:bg-zinc-800 text-zinc-300" : "border-gray-300 hover:bg-gray-100 text-gray-700"
                      }`}>
                         <MessageCircle className="w-4 h-4" /> Message
                      </button>
                    </>
                 )}
              </div>
            </div>

            {/* Right: Info Column */}
            <div className="flex-1 w-full text-center md:text-left">
              <div className="flex justify-between items-start">
                 <div>
                    <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-1">{displayName}</h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 text-sm text-zinc-400 mb-4">
                       <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {producer.location || "Worldwide"}</span>
                       <span className="flex items-center gap-1 text-yellow-400"><Star className="w-3.5 h-3.5 fill-current" /> 4.9 (128)</span>
                    </div>
                 </div>
                 {/* Socials */}
                 <div className="hidden md:flex gap-2">
                    <SocialButton icon={Instagram} theme={theme} />
                    <SocialButton icon={Twitter} theme={theme} />
                    <SocialButton icon={Globe} theme={theme} />
                 </div>
              </div>

              {/* Stats Row */}
              <div className="flex justify-center md:justify-start gap-6 mb-6 py-4 border-y border-zinc-800/50">
                 <div className="text-center">
                    <div className="text-xl font-bold">{formatNumber(producer.followersCount || 0)}</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider">Followers</div>
                 </div>
                 <div className="text-center">
                    <div className="text-xl font-bold">{beats.length}</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider">Tracks</div>
                 </div>
                 <div className="text-center">
                    <div className="text-xl font-bold">1.2M</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider">Plays</div>
                 </div>
              </div>

              {/* Bio & Tags */}
              <p className={`text-sm leading-relaxed mb-4 max-w-2xl ${theme === "dark" ? "text-zinc-400" : "text-gray-600"}`}>
                {producer.bio || "No bio provided."}
              </p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                 {genres.map((g) => (
                    <span
                       key={g}
                       className={`px-3 py-1 rounded-md text-xs font-medium ${
                          theme === "dark"
                             ? "bg-zinc-800 text-zinc-300"
                             : "bg-gray-200 text-gray-700"
                       }`}
                    >
                       {g}
                    </span>
                 ))}
              </div>
              
              {/* Action Buttons for Mobile */}
              <div className="flex md:hidden gap-2 mt-6">
                 {isOwnProfile ? (
                    <button onClick={() => router.push(`/producers/edit/${producerId}`)} className={`flex-1 py-2.5 rounded-lg font-semibold text-sm border transition-all ${theme === "dark" ? "border-zinc-700 hover:bg-zinc-800" : "border-gray-300 hover:bg-gray-100"}`}>
                       Edit Profile
                    </button>
                 ) : (
                    <>
                      <button 
                        onClick={() => setShowRequestModal(true)}
                        className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
                      >
                         Hire Me
                      </button>
                      <button className={`flex-1 py-2.5 rounded-lg font-semibold text-sm border transition-all ${
                         theme === "dark" ? "border-zinc-700 hover:bg-zinc-800" : "border-gray-300 hover:bg-gray-100"
                      }`}>
                         Message
                      </button>
                    </>
                 )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────── CONTENT TABS ──────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs Navigation */}
        <div className="flex gap-1 mb-8 p-1 rounded-lg inline-flex bg-zinc-900/50">
          {[
            { id: "works", label: "Discography" },
            { id: "services", label: "Services" },
            { id: "about", label: "About" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
                activeTab === tab.id
                  ? theme === "dark"
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "bg-white text-black shadow-sm"
                  : theme === "dark"
                  ? "text-zinc-500 hover:text-zinc-300"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === "works" && (
              <div className="space-y-3">
                {beats.length > 0 ? (
                  beats.map((beat) => (
                    <div
                      key={beat.id}
                      className={`group flex items-center gap-4 p-3 rounded-xl transition-colors ${
                        theme === "dark" ? "hover:bg-zinc-900/60" : "hover:bg-gray-100"
                      }`}
                    >
                      {/* Image */}
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
                        <img
                          src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400"
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                        <button className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-6 h-6 text-white fill-white" />
                        </button>
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold truncate ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                          {beat.title}
                        </h4>
                        <p className={`text-xs mt-0.5 ${theme === "dark" ? "text-zinc-500" : "text-gray-500"}`}>
                          140 BPM • A Minor
                        </p>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-4">
                        <span className={`text-sm font-bold ${theme === "dark" ? "text-white" : "text-black"}`}>
                          ${beat.price}
                        </span>
                        <button
                          className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${
                            theme === "dark"
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-black text-white hover:bg-gray-800"
                          }`}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-xl">
                    No works published yet.
                  </div>
                )}
              </div>
            )}

            {activeTab === "services" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: "Mixing",
                    price: "$150",
                    icon: Headphones,
                    desc: "Professional mixing with analog gear processing.",
                  },
                  {
                    title: "Mastering",
                    price: "$80",
                    icon: Zap,
                    desc: "Industry standard loudness and clarity.",
                  },
                  {
                    title: "Custom Beat",
                    price: "$300+",
                    icon: Music2,
                    desc: "Exclusive instrumental made to your specs.",
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className={`p-5 rounded-xl border transition-all hover:border-blue-500/50 ${
                      theme === "dark"
                        ? "bg-zinc-900/30 border-zinc-800 hover:bg-zinc-900/60"
                        : "bg-white border-gray-200 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                       <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-zinc-800" : "bg-gray-100"}`}>
                          <s.icon className="w-4 h-4 text-blue-500" />
                       </div>
                       <span className={`text-xs font-bold px-2 py-1 rounded-md ${theme === "dark" ? "bg-zinc-800 text-zinc-300" : "bg-gray-100 text-gray-600"}`}>
                          {s.price}
                       </span>
                    </div>
                    <h4 className={`font-bold ${theme === "dark" ? "text-white" : "text-black"}`}>{s.title}</h4>
                    <p className={`text-xs mt-1 mb-4 ${theme === "dark" ? "text-zinc-500" : "text-gray-500"}`}>
                      {s.desc}
                    </p>
                    <button
                      onClick={() => setShowRequestModal(true)}
                      className={`w-full py-2 rounded-lg text-xs font-semibold border transition-colors ${
                        theme === "dark"
                          ? "border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                          : "border-gray-200 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      Book Now
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "about" && (
              <div className={`p-6 rounded-xl border ${theme === "dark" ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-gray-200"}`}>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" /> Biography
                </h3>
                <p className={`text-sm leading-loose mb-6 ${theme === "dark" ? "text-zinc-400" : "text-gray-600"}`}>
                  {producer.bio || "No biography provided."}
                </p>
                
                <div className="space-y-6">
                   <div>
                      <h4 className="text-xs font-bold uppercase text-zinc-500 mb-3 tracking-wider">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                         {specialties.length > 0 ? specialties.map(s => (
                            <span key={s} className={`px-2.5 py-1 rounded-md text-xs font-medium ${theme === "dark" ? "bg-zinc-800 text-zinc-300" : "bg-gray-100 text-gray-600"}`}>{s}</span>
                         )) : <span className="text-xs text-zinc-500">Not specified</span>}
                      </div>
                   </div>
                   <div>
                      <h4 className="text-xs font-bold uppercase text-zinc-500 mb-3 tracking-wider">Gear & Equipment</h4>
                      <p className={`text-sm ${theme === "dark" ? "text-zinc-400" : "text-gray-600"}`}>
                         Ableton Live 11, Pro Tools, UAD Apollo, Neve 1073
                      </p>
                   </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Studios Widget */}
            <div className={`rounded-xl border p-5 ${theme === "dark" ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-gray-200"}`}>
              <div className="flex items-center gap-2 mb-4">
                <Headphones className="w-4 h-4 text-blue-500" />
                <h3 className="font-semibold text-sm">Affiliated Studios</h3>
              </div>
              <div className="space-y-3">
                {studios.length > 0 ? studios.map((studio) => (
                  <div key={studio.id} className="flex gap-3 items-center group cursor-pointer">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${theme === "dark" ? "bg-zinc-800 group-hover:bg-zinc-700" : "bg-gray-100 group-hover:bg-gray-200"}`}>
                      <MapPin className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium group-hover:text-blue-500 transition-colors">{studio.name}</h4>
                      <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-gray-500"}`}>
                        {studio.location}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="text-xs text-zinc-500 text-center py-2">
                    No affiliations listed.
                  </div>
                )}
              </div>
            </div>

            {/* Credits / Awards */}
            <div className={`rounded-xl border p-5 ${theme === "dark" ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-gray-200"}`}>
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <h3 className="font-semibold text-sm">Achievements</h3>
              </div>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-zinc-400">Verified Pro Member</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span className="text-zinc-400">Top Rated Seller 2023</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-zinc-400">Fast Responder</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Request Modal */}
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