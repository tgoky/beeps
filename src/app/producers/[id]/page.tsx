"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Music2,
  Star,
  MapPin,
  MessageCircle,
  CheckCircle2,
  Play,
  Users,
  Award,
  Headphones,
  Zap,
  Trophy,
  Globe,
  Mic2,
  Instagram,
  Twitter,
  X,
  Loader2,
  AlertCircle,
  Briefcase,
  Clock
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useGetIdentity } from "@refinedev/core";
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

const SocialButton = ({ icon: Icon, href }: { icon: any; href?: string }) => (
  <a
    href={href || "#"}
    target="_blank"
    rel="noopener noreferrer"
    className="p-2.5 rounded-full transition-colors bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
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
}

function RequestServiceModal({
  isOpen,
  onClose,
  producerName,
  producerId,
}: RequestServiceModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    desc: "",
    budget: "",
    deadline: "",
  });

  const handleClose = () => {
    setStep(1);
    setError("");
    setFormData({ title: "", desc: "", budget: "", deadline: "" });
    onClose();
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.desc.trim()) {
      setError("Please fill in the project title and description.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producerId,
          projectTitle: formData.title,
          projectDescription: formData.desc,
          budget: formData.budget || undefined,
          deadline: formData.deadline || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send request");
      router.push(`/service-requests/${data.serviceRequest.id}`);
      handleClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 bg-[#0A0A0A] border border-zinc-800">
        <div className="p-6 flex justify-between items-center border-b border-zinc-800 bg-[#030303]">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">
              Book {producerName}
            </h2>
            <p className="text-xs mt-1 text-zinc-500 font-medium">
              Step {step} of 2
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full transition-colors hover:bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="h-1 bg-zinc-900 w-full">
          <div
            className="h-full bg-purple-500 transition-all duration-300 rounded-r-full"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>

        <div className="p-6 min-h-[280px]">
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full Album Production"
                  className="w-full px-4 py-3 rounded-xl outline-none border transition-all text-sm bg-zinc-900 border-zinc-800 focus:border-purple-500 text-white placeholder:text-zinc-600"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">
                  Brief Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your vision, references, and requirements..."
                  className="w-full px-4 py-3 rounded-xl outline-none border transition-all resize-none text-sm bg-zinc-900 border-zinc-800 focus:border-purple-500 text-white placeholder:text-zinc-600"
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">
                    Budget ($)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-xl outline-none border transition-all text-sm bg-zinc-900 border-zinc-800 focus:border-purple-500 text-white placeholder:text-zinc-600"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">
                    Deadline
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 rounded-xl outline-none border transition-all text-sm bg-zinc-900 border-zinc-800 focus:border-purple-500 text-white [color-scheme:dark]"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>
              <div className="p-4 rounded-xl flex gap-3 items-start bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Zap className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm leading-relaxed">
                  Once the producer accepts, you will pay into escrow. Funds are only released when you confirm the work has been delivered.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-xl flex gap-2 items-start text-sm bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-zinc-800 flex gap-3 bg-[#030303]">
          {step === 2 && (
            <button
              onClick={() => { setError(""); setStep(1); }}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl font-medium text-sm text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={step === 1 ? () => { setError(""); setStep(2); } : handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all bg-white text-black hover:bg-zinc-200 disabled:opacity-50 shadow-lg shadow-white/10"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : step === 1 ? (
              "Continue"
            ) : (
              "Send Request"
            )}
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
  const { permissions } = usePermissions();
  const { data: user } = useGetIdentity<any>();

  const [activeTab, setActiveTab] = useState<"works" | "about" | "services">("works");
  const [showRequestModal, setShowRequestModal] = useState(false);

  const { data: producer, isLoading, error } = useProducer(producerId);

  const isOwnProfile = user?.id === producerId;

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto flex items-center justify-center bg-[#030303]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error || !producer)
    return (
      <div className="h-full overflow-y-auto flex flex-col items-center justify-center bg-[#030303]">
        <AlertCircle className="w-10 h-10 mb-3 text-red-500" />
        <p className="text-zinc-400 font-medium">Failed to load producer profile.</p>
        <button onClick={() => router.back()} className="mt-4 text-purple-400 hover:text-purple-300 text-sm">
          Go Back
        </button>
      </div>
    );

  const displayName = producer.name || producer.email.split("@")[0];

  const genres = producer.genres || [];
  const specialties = producer.specialties || [];
  const beats = producer.beats || [];
  const studios = producer.studios || [];

  return (
    <div className="h-full overflow-y-auto bg-[#030303] text-white selection:bg-purple-500/30">
      
      {/* ──────────────── COMPACT CREATIVE HEADER ──────────────── */}
      <div className="relative border-b border-zinc-800/50 bg-gradient-to-b from-zinc-900/40 to-transparent">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-10">
          
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-between">
            
            {/* Left: Avatar & Info Block */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 flex-1 min-w-0">
              
              {/* Avatar with Ambient Glow */}
              <div className="relative shrink-0 group">
                <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full group-hover:bg-purple-500/30 transition-colors duration-500" />
                <img
                  src={producer.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${producer.id}`}
                  alt={displayName}
                  className="relative z-10 w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-2 border-zinc-800 shadow-2xl"
                />
                {producer.isOnline && (
                  <div className="absolute z-20 bottom-1 right-2 w-5 h-5 bg-green-500 border-4 border-[#0A0A0A] rounded-full" title="Online Now"></div>
                )}
              </div>
              
              {/* Producer Info */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left mt-2 md:mt-0 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white truncate">
                    {displayName}
                  </h1>
                  {producer.verified && (
                    <CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0" />
                  )}
                </div>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-sm font-medium text-zinc-400 mb-4">
                   <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {producer.location || "Worldwide"}</span>
                   <span className="flex items-center gap-1.5 text-yellow-500"><Star className="w-4 h-4 fill-current" /> {producer.rating || "4.9"}</span>
                   <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Resp: {producer.responseTime || "1 hr"}</span>
                </div>

                {/* Inline Stats (To save vertical space) */}
                <div className="flex flex-wrap justify-center md:justify-start gap-6 mb-4 px-4 py-2 bg-zinc-900/50 rounded-xl border border-zinc-800/50 w-max">
                   <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-bold text-white">{formatNumber(producer.followersCount || 0)}</span>
                      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Followers</span>
                   </div>
                   <div className="w-px h-4 bg-zinc-800 self-center" />
                   <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-bold text-white">{beats.length}</span>
                      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Tracks</span>
                   </div>
                   <div className="w-px h-4 bg-zinc-800 self-center" />
                   <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-bold text-white">1.2M</span>
                      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Plays</span>
                   </div>
                </div>

                {/* Genres */}
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                   {genres.map((g) => (
                      <span key={g} className="px-3 py-1 rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300">
                         {g}
                      </span>
                   ))}
                </div>
              </div>
            </div>

            {/* Right: Actions & Socials */}
            <div className="flex flex-col items-center md:items-end gap-4 w-full md:w-auto shrink-0 mt-2 md:mt-4">
              <div className="flex gap-2">
                 <SocialButton icon={Instagram} />
                 <SocialButton icon={Twitter} />
                 <SocialButton icon={Globe} />
              </div>

              <div className="flex flex-row md:flex-col gap-2 w-full md:w-40">
                 {isOwnProfile ? (
                    <button onClick={() => router.push(`/producers/edit/${producerId}`)} className="w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-all bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800">
                       Edit Profile
                    </button>
                 ) : (
                    <>
                      <button 
                        onClick={() => setShowRequestModal(true)}
                        className="flex-1 md:w-full py-2.5 px-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10"
                      >
                         Hire Producer
                      </button>
                      <button className="flex-1 md:w-full py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800">
                         <MessageCircle className="w-4 h-4" /> Message
                      </button>
                    </>
                 )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ──────────────── CONTENT TABS ──────────────── */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-8 pb-20">
        
        {/* Soft Tabs Navigation */}
        <div className="flex border-b border-zinc-800 mb-8 overflow-x-auto scrollbar-hide">
          {[
            { id: "works", label: "Discography" },
            { id: "services", label: "Services" },
            { id: "about", label: "About" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-6 text-sm font-medium transition-colors border-b-2 relative top-[1px] whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-white text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
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
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Latest Tracks</h3>
                </div>

                {beats.length > 0 ? (
                  beats.map((beat) => (
                    <div
                      key={beat.id}
                      className="group flex items-center gap-4 p-3 rounded-xl transition-colors border border-transparent hover:border-zinc-800 hover:bg-[#0A0A0A] cursor-pointer"
                      onClick={() => router.push(`/beats/${beat.id}`)}
                    >
                      {/* Image */}
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-900 border border-zinc-800">
                        <img
                          src={beat.imageUrl || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400"}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          alt={beat.title}
                        />
                        <button className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-6 h-6 text-white fill-white" />
                        </button>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate group-hover:text-purple-400 transition-colors">
                          {beat.title}
                        </h4>
                        <p className="text-xs mt-1 text-zinc-500 flex items-center gap-2">
                          <span>{beat.bpm} BPM</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-700" />
                          <span>{beat.genre?.[0] || "Hip Hop"}</span>
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-4 pr-2">
                        <span className="text-sm font-semibold text-white">
                          ${beat.price}
                        </span>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="px-4 py-2 rounded-lg text-xs font-medium transition-colors bg-white text-black hover:bg-zinc-200"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center border border-dashed border-zinc-800 rounded-xl bg-[#0A0A0A]">
                    <Music2 className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                    <p className="text-sm text-zinc-400">No tracks published yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "services" && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Available Services</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      title: "Mixing & Mastering",
                      price: "$150",
                      icon: Headphones,
                      desc: "Professional mixing with analog gear processing and industry standard loudness.",
                    },
                    {
                      title: "Custom Beat Production",
                      price: "$300+",
                      icon: Music2,
                      desc: "Exclusive instrumental made from scratch to your exact specifications.",
                    },
                    {
                      title: "Vocal Tuning",
                      price: "$80",
                      icon: Mic2,
                      desc: "Manual pitch correction, timing alignment, and vocal processing.",
                    },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="p-5 rounded-xl border transition-all border-zinc-800 bg-[#0A0A0A] hover:border-zinc-700 flex flex-col h-full"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <s.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-white bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800">
                            {s.price}
                        </span>
                      </div>
                      <h4 className="font-semibold text-white mb-2">{s.title}</h4>
                      <p className="text-sm text-zinc-400 mb-6 flex-1">
                        {s.desc}
                      </p>
                      <button
                        onClick={() => setShowRequestModal(true)}
                        className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors border border-zinc-700 bg-zinc-900 text-white hover:bg-white hover:text-black"
                      >
                        Request Service
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "about" && (
              <div className="p-6 rounded-xl border border-zinc-800 bg-[#0A0A0A]">
                <h3 className="font-semibold text-lg text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-zinc-400" /> Biography
                </h3>
                <p className="text-sm leading-loose text-zinc-400 mb-8">
                  {producer.bio || "This producer hasn't added a biography yet."}
                </p>
                
                <div className="space-y-8">
                   <div>
                      <h4 className="text-sm font-semibold text-white mb-3">Specialties</h4>
                      <div className="flex flex-wrap gap-2">
                         {specialties.length > 0 ? specialties.map(s => (
                            <span key={s} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300">{s}</span>
                         )) : <span className="text-sm text-zinc-500">Not specified</span>}
                      </div>
                   </div>
                   <div>
                      <h4 className="text-sm font-semibold text-white mb-3">Gear & Equipment</h4>
                      <div className="flex flex-wrap gap-2">
                         {["Ableton Live 11", "Pro Tools", "UAD Apollo Twin", "Neve 1073", "Focal Monitors"].map(s => (
                            <span key={s} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300">{s}</span>
                         ))}
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Studios Widget */}
            <div className="rounded-xl border border-zinc-800 bg-[#0A0A0A] p-5">
              <div className="flex items-center gap-2 mb-5">
                <Briefcase className="w-4 h-4 text-zinc-400" />
                <h3 className="font-semibold text-sm text-white">Affiliated Studios</h3>
              </div>
              <div className="space-y-4">
                {studios.length > 0 ? studios.map((studio) => (
                  <div key={studio.id} className="flex gap-3 items-center group cursor-pointer" onClick={() => router.push(`/studios?id=${studio.id}`)}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-zinc-900 border border-zinc-800 group-hover:border-zinc-600 transition-colors">
                      <MapPin className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors">{studio.name}</h4>
                      <p className="text-xs text-zinc-500 truncate">
                        {studio.location}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="text-sm text-zinc-500 text-center py-4">
                    No studio affiliations listed.
                  </div>
                )}
              </div>
            </div>

            {/* Credits / Awards */}
            <div className="rounded-xl border border-zinc-800 bg-[#0A0A0A] p-5">
              <div className="flex items-center gap-2 mb-5">
                <Trophy className="w-4 h-4 text-zinc-400" />
                <h3 className="font-semibold text-sm text-white">Achievements</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="text-sm font-medium text-zinc-300">Verified Pro Member</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <Award className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-zinc-300">Top Rated Seller 2024</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Zap className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-zinc-300">Lightning Fast Responder</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}