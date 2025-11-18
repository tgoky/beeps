"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/providers/ThemeProvider";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Building2,
  MapPin,
  DollarSign,
  Upload,
  X,
  Plus,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function ListStudio() {
  const router = useRouter();
  const { theme } = useTheme();
  const { permissions, canAccess } = usePermissions();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    latitude: "",
    longitude: "",
    hourlyRate: "",
    capacity: "1-5 people",
    imageUrl: "",
  });

  const [equipment, setEquipment] = useState<string[]>([]);
  const [newEquipment, setNewEquipment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Check if user has permission to create studios
  if (!permissions?.canCreateStudios) {
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
              You need producer or studio owner permissions to list studios. Create a production club to get producer access.
            </p>
          </div>
          <button
            onClick={() => router.push("/studios")}
            className={`px-4 py-2 rounded-lg transition-all ${
              theme === "dark"
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
          >
            Back to Studios
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

  const addEquipment = () => {
    if (newEquipment.trim() && !equipment.includes(newEquipment.trim())) {
      setEquipment([...equipment, newEquipment.trim()]);
      setNewEquipment("");
    }
  };

  const removeEquipment = (item: string) => {
    setEquipment(equipment.filter((eq) => eq !== item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Validate required fields
      if (!formData.name || !formData.location || !formData.hourlyRate) {
        throw new Error("Please fill in all required fields");
      }

      const response = await fetch("/api/studios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          equipment,
          hourlyRate: parseFloat(formData.hourlyRate),
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create studio listing");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/studios");
      }, 2000);
    } catch (error: any) {
      console.error("Error creating studio:", error);
      setError(error.message || "Failed to create studio listing");
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
            List Your Studio
          </h1>
          <p className={`text-sm ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>
            Share your recording space with artists and producers
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
              <p className="font-medium">Studio listed successfully!</p>
              <p className="text-sm opacity-90">Redirecting to studios page...</p>
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
          {/* Basic Information */}
          <div className={`p-6 rounded-xl border ${
            theme === "dark"
              ? "bg-gray-900/40 border-gray-800/60"
              : "bg-white border-gray-200"
          }`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
              theme === "dark" ? "text-gray-200" : "text-gray-900"
            }`}>
              <Building2 className="w-5 h-5" />
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  Studio Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Sunset Sound Studios"
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
                  placeholder="Describe your studio, its features, and what makes it special..."
                  rows={4}
                  className={`w-full p-3 rounded-lg border transition-all resize-none ${
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
                  Image URL
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/studio-image.jpg"
                  className={`w-full p-3 rounded-lg border transition-all ${
                    theme === "dark"
                      ? "bg-gray-800/40 border-gray-700/60 text-gray-300 placeholder-gray-500 focus:border-purple-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500"
                  } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                />
                <p className={`text-xs mt-1 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-500"
                }`}>
                  Enter a direct link to your studio image
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className={`p-6 rounded-xl border ${
            theme === "dark"
              ? "bg-gray-900/40 border-gray-800/60"
              : "bg-white border-gray-200"
          }`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
              theme === "dark" ? "text-gray-200" : "text-gray-900"
            }`}>
              <MapPin className="w-5 h-5" />
              Location
            </h2>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., 123 Music Ave, Los Angeles, CA"
                  required
                  className={`w-full p-3 rounded-lg border transition-all ${
                    theme === "dark"
                      ? "bg-gray-800/40 border-gray-700/60 text-gray-300 placeholder-gray-500 focus:border-purple-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500"
                  } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Latitude (Optional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    placeholder="34.0522"
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
                    Longitude (Optional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    placeholder="-118.2437"
                    className={`w-full p-3 rounded-lg border transition-all ${
                      theme === "dark"
                        ? "bg-gray-800/40 border-gray-700/60 text-gray-300 placeholder-gray-500"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                    } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Capacity */}
          <div className={`p-6 rounded-xl border ${
            theme === "dark"
              ? "bg-gray-900/40 border-gray-800/60"
              : "bg-white border-gray-200"
          }`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
              theme === "dark" ? "text-gray-200" : "text-gray-900"
            }`}>
              <DollarSign className="w-5 h-5" />
              Pricing & Capacity
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  Hourly Rate ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleInputChange}
                  placeholder="50.00"
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
                  Capacity
                </label>
                <select
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className={`w-full p-3 rounded-lg border transition-all ${
                    theme === "dark"
                      ? "bg-gray-800/40 border-gray-700/60 text-gray-300"
                      : "bg-white border-gray-300 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                >
                  <option value="1-5 people">1-5 people</option>
                  <option value="6-10 people">6-10 people</option>
                  <option value="11-20 people">11-20 people</option>
                  <option value="20+ people">20+ people</option>
                </select>
              </div>
            </div>
          </div>

          {/* Equipment */}
          <div className={`p-6 rounded-xl border ${
            theme === "dark"
              ? "bg-gray-900/40 border-gray-800/60"
              : "bg-white border-gray-200"
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${
              theme === "dark" ? "text-gray-200" : "text-gray-900"
            }`}>
              Equipment
            </h2>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newEquipment}
                  onChange={(e) => setNewEquipment(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addEquipment())}
                  placeholder="e.g., Neumann U87 Microphone"
                  className={`flex-1 p-3 rounded-lg border transition-all ${
                    theme === "dark"
                      ? "bg-gray-800/40 border-gray-700/60 text-gray-300 placeholder-gray-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                />
                <button
                  type="button"
                  onClick={addEquipment}
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

              {equipment.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {equipment.map((item) => (
                    <div
                      key={item}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                        theme === "dark"
                          ? "bg-gray-800/40 border-gray-700/60 text-gray-300"
                          : "bg-gray-50 border-gray-200 text-gray-700"
                      }`}
                    >
                      <span className="text-sm">{item}</span>
                      <button
                        type="button"
                        onClick={() => removeEquipment(item)}
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
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push("/studios")}
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
                  Creating Listing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  List Studio
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
