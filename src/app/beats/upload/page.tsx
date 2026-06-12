"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Music,
  UploadCloud,
  X,
  Plus,
  Loader2,
  CheckCircle2,
  Tag,
  AlertCircle,
  Image as ImageIcon,
  Settings2,
  ShieldCheck
} from "lucide-react";

const GENRES = [
  "Hip Hop", "Trap", "R&B", "Pop", "Electronic", "Rock",
  "Jazz", "Soul", "Lo-fi", "Drill", "Afrobeats", "Reggae"
];

const MOODS = [
  "Energetic", "Chill", "Dark", "Happy", "Sad", "Aggressive",
  "Romantic", "Mysterious", "Uplifting", "Melancholic"
];

export default function UploadBeat() {
  const router = useRouter();
  const { permissions } = usePermissions();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    bpm: "",
    key: "",
    price: "",
    type: "LEASE",
    audioUrl: "",
    imageUrl: "",
  });

  const [genres, setGenres] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [statusText, setStatusText] = useState("");

  if (!permissions?.canUploadBeats) {
    return (
      <div className="flex h-full overflow-y-auto items-center justify-center bg-black px-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center shadow-2xl">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-500" />
          <h1 className="text-2xl font-light tracking-tight">Access Denied</h1>
          <p className="mt-2 text-sm font-light tracking-wide text-zinc-500 mb-6">
            You need a producer profile to upload beats. Create a production club to get producer access.
          </p>
          <button
            onClick={() => router.push("/beats")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold tracking-wide text-white transition-all hover:bg-purple-700"
          >
            Back to Beats
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleGenre = (genre: string) => setGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]);
  const toggleMood = (mood: string) => setMoods(prev => prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]);

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  const computeFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      if (!formData.title || !formData.bpm || !formData.price || (!formData.audioUrl && !file)) {
        throw new Error("Please fill in all required fields and select an audio file.");
      }
      if (genres.length === 0) throw new Error("Please select at least one genre");

      let untaggedWavKey = null;
      let fileHash = null;

      if (file) {
        setStatusText("Computing cryptographic hash...");
        fileHash = await computeFileHash(file);

        setStatusText("Connecting to Beeps Vault...");
        const presignRes = await fetch("/api/upload/presigned", {
          method: "POST",
          body: JSON.stringify({ fileName: file.name, fileType: file.type, fileCategory: "wav" })
        });
        if (!presignRes.ok) throw new Error("Failed to secure upload link.");
        const { uploadUrl, fileKey } = await presignRes.json();

        setStatusText("Uploading High-Quality Audio...");
        const uploadRes = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
        if (!uploadRes.ok) throw new Error("File upload failed.");
        
        untaggedWavKey = fileKey;
      }

      setStatusText("Running Beeps Shield Scans...");
      const response = await fetch("/api/beats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, genres, moods, tags, untaggedWavKey, fileHash }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Failed to upload beat");

      setSuccess(true);
      setStatusText("Success!");
      setTimeout(() => router.push("/beats"), 2000);
    } catch (error: any) {
      console.error("Error uploading beat:", error);
      setError(error.message || "Failed to upload beat");
    } finally {
      setLoading(false);
      setStatusText("");
    }
  };

  const labelClass = "text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 block mb-2";
  const inputClass = "w-full px-4 py-3.5 rounded-xl border border-zinc-800 bg-[#08080a] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors font-light tracking-wide";

  return (
    <div className="h-full overflow-y-auto bg-[#030303] text-zinc-200 selection:bg-purple-500/30">
      <main className="relative mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light tracking-tight text-white sm:text-4xl mb-2">
            Upload Beat
          </h1>
          <p className="text-sm font-light tracking-wide text-zinc-500 flex items-center gap-2">
            Share your production with artists worldwide. 
            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-xs">
              <ShieldCheck size={12} /> Protected by Beeps Shield
            </span>
          </p>
        </div>

        {/* Banners */}
        {success && (
          <div className="mb-6 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 flex items-start gap-3">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Beat uploaded successfully!</p>
              <p className="text-xs opacity-80 mt-1">Redirecting to marketplace...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm font-light tracking-wide flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Main Grid Layout */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-6">
          
          {/* LEFT COLUMN: Core Info & Audio */}
          <div className="space-y-6 min-w-0">
            
            {/* Audio File Upload */}
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6 sm:p-8 shadow-xl">
               <h2 className="mb-6 flex items-center gap-2 text-lg font-light tracking-tight text-white">
                <Music className="text-purple-400" size={20} /> Audio File
              </h2>
              <div>
                <label className={labelClass}>High-Quality Audio (.WAV / .MP3) <span className="text-purple-500">*</span></label>
                <input
                  type="file"
                  accept=".wav,.mp3"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-zinc-400 file:bg-white file:text-black file:border-0 file:px-4 file:py-2 file:rounded-full file:font-bold file:mr-4 file:cursor-pointer hover:border-zinc-700 transition-colors cursor-pointer"
                />
                <p className="text-[11px] font-light text-zinc-500 mt-2 flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-purple-500" />
                  File is automatically fingerprinted for copyright protection and exclusivity locking.
                </p>
              </div>
            </div>

            {/* Basic Information */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-xl">
              <h2 className="mb-6 flex items-center gap-2 text-lg font-light tracking-tight text-white">
                <Settings2 className="text-zinc-400" size={20} /> Basic Details
              </h2>
              
              <div className="space-y-5">
                <div>
                  <label className={labelClass}>Title <span className="text-purple-500">*</span></label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Dark Trap Anthem"
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the vibe, instruments used, or inspiration..."
                    rows={4}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className={labelClass}>BPM <span className="text-purple-500">*</span></label>
                    <input
                      type="number"
                      name="bpm"
                      value={formData.bpm}
                      onChange={handleInputChange}
                      placeholder="140"
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Key</label>
                    <input
                      type="text"
                      name="key"
                      value={formData.key}
                      onChange={handleInputChange}
                      placeholder="C minor"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>License <span className="text-purple-500">*</span></label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className={inputClass}
                    >
                      <option value="LEASE">Lease</option>
                      <option value="EXCLUSIVE">Exclusive</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Price ($) <span className="text-purple-500">*</span></label>
                    <input
                      type="number"
                      step="0.01"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="29.99"
                      required
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Submit Button (Desktop: Bottom of Left Col, Mobile: Bottom of screen) */}
            <div className="hidden lg:flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push("/beats")}
                disabled={loading}
                className="flex-1 py-4 px-6 rounded-xl font-semibold transition-all border border-zinc-700 bg-[#08080a] text-zinc-300 hover:bg-zinc-900 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title || !file}
                className="flex-[2] py-4 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> {statusText || "Processing..."}</>
                ) : (
                  <><UploadCloud className="w-5 h-5" /> Upload to Marketplace</>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Metadata & Artwork */}
          <aside className="space-y-6">
            
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
              <h2 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                <ImageIcon size={14} className="text-zinc-400" /> Cover Artwork
              </h2>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/cover.jpg"
                className={inputClass}
              />
              {formData.imageUrl && (
                <div className="mt-4 aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-[#08080a]">
                  <img src={formData.imageUrl} alt="Cover Preview" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
              <h2 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                <Tag size={14} className="text-zinc-400" /> Genres <span className="text-purple-500">*</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {GENRES.map(genre => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      genres.includes(genre)
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                        : "bg-[#08080a] text-zinc-400 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
              <h2 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                <Tag size={14} className="text-zinc-400" /> Moods
              </h2>
              <div className="flex flex-wrap gap-2">
                {MOODS.map(mood => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => toggleMood(mood)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      moods.includes(mood)
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                        : "bg-[#08080a] text-zinc-400 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
              <h2 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                <Tag size={14} className="text-zinc-400" /> Custom Tags
              </h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="e.g., 808, guitar"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-3.5 rounded-xl transition-all flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <div key={tag} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-[#08080a] border-zinc-800 text-zinc-300">
                      <span className="text-xs">{tag}</span>
                      <button type="button" onClick={() => removeTag(tag)} className="p-0.5 rounded-md hover:bg-red-500/20 hover:text-red-400 transition-colors text-zinc-500">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Mobile Submit Button (Visible only on small screens) */}
            <div className="flex lg:hidden gap-4 pt-4 pb-8">
               <button
                type="submit"
                disabled={loading || !formData.title || !file}
                className="w-full py-4 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 shadow-lg shadow-purple-500/20"
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> {statusText || "Processing..."}</> : <><UploadCloud className="w-5 h-5" /> Publish Beat</>}
              </button>
            </div>

          </aside>
        </form>
      </main>
    </div>
  );
}