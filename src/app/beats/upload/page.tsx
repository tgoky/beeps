"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/providers/ThemeProvider";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Music,
  Upload,
  X,
  Plus,
  Loader2,
  CheckCircle2,
  DollarSign,
  Tag,
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
  const { theme } = useTheme();
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

  // Check permissions
  if (!permissions?.canUploadBeats) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === "dark" ? "bg-gray-950" : "bg-gray-50"
      }`}>
        <div className="text-center max-w-md mx-auto p-6">
          <div className={`p-4 rounded-lg mb-4 ${
            theme === "dark"
              ? "bg-red-500/10 border border-red-500/20"
              : "bg-red-50 border border-red-200"
          }`}>
            <h2 className={`text-lg font-semibold mb-2 ${
              theme === "dark" ? "text-red-400" : "text-red-600"
            }`}>
              Access Denied
            </h2>
            <p className={`text-sm ${
              theme === "dark" ? "text-red-300" : "text-red-700"
            }`}>
              You need a producer profile to upload beats. Create a production club to get producer access.
            </p>
          </div>
          <button
            onClick={() => router.push("/beats")}
            className={`px-4 py-2 rounded-lg transition-all ${
              theme === "dark"
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
          >
            Back to Beats
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const toggleGenre = (genre: string) => {
    setGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const toggleMood = (mood: string) => {
    setMoods(prev =>
      prev.includes(mood)
        ? prev.filter(m => m !== mood)
        : [...prev, mood]
    );
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Validate
      if (!formData.title || !formData.bpm || !formData.price || !formData.audioUrl) {
        throw new Error("Please fill in all required fields");
      }

      if (genres.length === 0) {
        throw new Error("Please select at least one genre");
      }

      const response = await fetch("/api/beats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          genres,
          moods,
          tags,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload beat");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/beats");
      }, 2000);
    } catch (error: any) {
      console.error("Error uploading beat:", error);
      setError(error.message || "Failed to upload beat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${
      theme === "dark" ? "bg-gray-950" : "bg-gray-50"
    }`}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${
            theme === "dark" ? "text-gray-100" : "text-gray-900"
          }`}>
            Upload Beat
          </h1>
          <p className={`text-sm ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>
            Share your production with artists worldwide
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            theme === "dark"
              ? "bg-green-500/10 border border-green-500/20 text-green-400"
              : "bg-green-50 border border-green-200 text-green-600"
          }`}>
            <CheckCircle2 className="w-5 h-5" />
            <div>
              <p className="font-medium">Beat uploaded successfully!</p>
              <p className="text-sm opacity-90">Redirecting to beats page...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={`mb-6 p-4 rounded-lg ${
            theme === "dark"
              ? "bg-red-500/10 border border-red-500/20 text-red-400"
              : "bg-red-50 border border-red-200 text-red-600"
          }`}>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className={`p-6 rounded-xl border ${
            theme === "dark"
              ? "bg-gray-900/40 border-gray-800/60"
              : "bg-white border-gray-200"
          }`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
              theme === "dark" ? "text-gray-200" : "text-gray-900"
            }`}>
              <Music className="w-5 h-5" />
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Dark Trap Beat 2024"
                  required
                  className={`w-full p-3 rounded-lg border transition-all ${
                    theme === "dark"
                      ? "bg-gray-800/40 border-gray-700/60 text-gray-300 placeholder-gray-500 focus:border-purple-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500"
                  } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your beat, its vibe, and what makes it special..."
                  rows={4}
                  className={`w-full p-3 rounded-lg border transition-all resize-none ${
                    theme === "dark"
                      ? "bg-gray-800/40 border-gray-700/60 text-gray-300 placeholder-gray-500 focus:border-purple-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500"
                  } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    BPM <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="bpm"
                    value={formData.bpm}
                    onChange={handleInputChange}
                    placeholder="140"
                    required
                    className={`w-full p-3 rounded-lg border transition-all ${
                      theme === "dark"
                        ? "bg-gray-800/40 border-gray-700/60 text-gray-300 placeholder-gray-500"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                    } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Key
                  </label>
                  <input
                    type="text"
                    name="key"
                    value={formData.key}
                    onChange={handleInputChange}
                    placeholder="C minor"
                    className={`w-full p-3 rounded-lg border transition-all ${
                      theme === "dark"
                        ? "bg-gray-800/40 border-gray-700/60 text-gray-300 placeholder-gray-500"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                    } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Price ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="29.99"
                    required
                    className={`w-full p-3 rounded-lg border transition-all ${
                      theme === "dark"
                        ? "bg-gray-800/40 border-gray-700/60 text-gray-300 placeholder-gray-500"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                    } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  License Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className={`w-full p-3 rounded-lg border transition-all ${
                    theme === "dark"
                      ? "bg-gray-800/40 border-gray-700/60 text-gray-300"
                      : "bg-white border-gray-300 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                >
                  <option value="LEASE">Lease</option>
                  <option value="EXCLUSIVE">Exclusive</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  Audio URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  name="audioUrl"
                  value={formData.audioUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/beat.mp3"
                  required
                  className={`w-full p-3 rounded-lg border transition-all ${
                    theme === "dark"
                      ? "bg-gray-800/40 border-gray-700/60 text-gray-300 placeholder-gray-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  Cover Image URL
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/cover.jpg"
                  className={`w-full p-3 rounded-lg border transition-all ${
                    theme === "dark"
                      ? "bg-gray-800/40 border-gray-700/60 text-gray-300 placeholder-gray-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                />
              </div>
            </div>
          </div>

          {/* Genres */}
          <div className={`p-6 rounded-xl border ${
            theme === "dark"
              ? "bg-gray-900/40 border-gray-800/60"
              : "bg-white border-gray-200"
          }`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
              theme === "dark" ? "text-gray-200" : "text-gray-900"
            }`}>
              <Tag className="w-5 h-5" />
              Genres <span className="text-red-500">*</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(genre => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    genres.includes(genre)
                      ? theme === "dark"
                        ? "bg-purple-500/20 text-purple-400 border-2 border-purple-500/40"
                        : "bg-purple-50 text-purple-600 border-2 border-purple-200"
                      : theme === "dark"
                        ? "bg-gray-800/40 text-gray-400 border border-gray-700/60 hover:border-gray-600"
                        : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Moods */}
          <div className={`p-6 rounded-xl border ${
            theme === "dark"
              ? "bg-gray-900/40 border-gray-800/60"
              : "bg-white border-gray-200"
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${
              theme === "dark" ? "text-gray-200" : "text-gray-900"
            }`}>
              Moods (Optional)
            </h2>
            <div className="flex flex-wrap gap-2">
              {MOODS.map(mood => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => toggleMood(mood)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    moods.includes(mood)
                      ? theme === "dark"
                        ? "bg-purple-500/20 text-purple-400 border-2 border-purple-500/40"
                        : "bg-purple-50 text-purple-600 border-2 border-purple-200"
                      : theme === "dark"
                        ? "bg-gray-800/40 text-gray-400 border border-gray-700/60 hover:border-gray-600"
                        : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className={`p-6 rounded-xl border ${
            theme === "dark"
              ? "bg-gray-900/40 border-gray-800/60"
              : "bg-white border-gray-200"
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${
              theme === "dark" ? "text-gray-200" : "text-gray-900"
            }`}>
              Tags (Optional)
            </h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="e.g., dark, 808, trap"
                className={`flex-1 p-3 rounded-lg border transition-all ${
                  theme === "dark"
                    ? "bg-gray-800/40 border-gray-700/60 text-gray-300 placeholder-gray-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
              />
              <button
                type="button"
                onClick={addTag}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  theme === "dark"
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <div
                    key={tag}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                      theme === "dark"
                        ? "bg-gray-800/40 border-gray-700/60 text-gray-300"
                        : "bg-gray-50 border-gray-200 text-gray-700"
                    }`}
                  >
                    <span className="text-sm">{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className={`p-1 rounded hover:bg-red-500/10 transition-all ${
                        theme === "dark" ? "text-red-400" : "text-red-600"
                      }`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push("/beats")}
              disabled={loading}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                theme === "dark"
                  ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                loading
                  ? theme === "dark"
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : theme === "dark"
                  ? "bg-purple-600 hover:bg-purple-700 text-white active:scale-95"
                  : "bg-purple-600 hover:bg-purple-700 text-white active:scale-95"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Beat
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
