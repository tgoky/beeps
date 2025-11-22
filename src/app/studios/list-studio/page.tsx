"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/providers/ThemeProvider";
import { usePermissions } from "@/hooks/usePermissions";
import { LocationSelector, type LocationData } from "@/components/LocationSelector";
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
    country: "",
    state: "",
    city: "",
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
        theme === "dark" ? "bg-black" : "bg-gray-50"
      }`}>
        <div className="text-center max-w-md mx-auto p-6">
          <div className={`p-4 rounded-lg mb-4 border ${
            theme === "dark"
              ? "bg-red-500/10 border-red-500/20"
              : "bg-red-50 border-red-200"
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
                ? "bg-white hover:bg-zinc-100 text-black"
                : "bg-black hover:bg-gray-900 text-white"
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

  const handleLocationChange = (locationData: LocationData) => {
    setFormData({
      ...formData,
      location: locationData.fullAddress || `${locationData.city}, ${locationData.state}, ${locationData.country}`,
      country: locationData.country,
      state: locationData.state,
      city: locationData.city,
      latitude: locationData.latitude?.toString() || "",
      longitude: locationData.longitude?.toString() || "",
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
      theme === "dark" ? "bg-black" : "bg-gray-50"
    }`}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-light tracking-tight mb-2 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            List Your Studio
          </h1>
          <p className={`text-sm font-light tracking-wide ${
            theme === "dark" ? "text-zinc-500" : "text-gray-600"
          }`}>
            Share your recording space with artists and producers
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 border ${
            theme === "dark"
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-green-50 border-green-200 text-green-600"
          }`}>
            <CheckCircle2 className="w-5 h-5" strokeWidth={2} />
            <div>
              <p className="font-medium tracking-wide">Studio listed successfully!</p>
              <p className="text-sm font-light tracking-wide opacity-90">Redirecting to studios page...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={`mb-6 p-4 rounded-lg border ${
            theme === "dark"
              ? "bg-red-500/10 border-red-500/20 text-red-400"
              : "bg-red-50 border-red-200 text-red-600"
          }`}>
            <p className="text-sm font-light tracking-wide">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className={`p-6 rounded-xl border ${
            theme === "dark"
              ? "bg-zinc-950 border-zinc-800"
              : "bg-white border-gray-200"
          }`}>
            <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 tracking-wide ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              <Building2 className="w-5 h-5" strokeWidth={2} />
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-2 tracking-wider uppercase ${
                  theme === "dark" ? "text-zinc-400" : "text-gray-700"
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
                  className={`w-full px-4 py-3.5 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide focus:outline-none ${
                    theme === "dark"
                      ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus:border-white focus:bg-black"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-2 tracking-wider uppercase ${
                  theme === "dark" ? "text-zinc-400" : "text-gray-700"
                }`}>
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your studio, its features, and what makes it special..."
                  rows={4}
                  className={`w-full px-4 py-3.5 text-sm font-light rounded-lg border transition-all duration-200 resize-none tracking-wide focus:outline-none ${
                    theme === "dark"
                      ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus:border-white focus:bg-black"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-2 tracking-wider uppercase ${
                  theme === "dark" ? "text-zinc-400" : "text-gray-700"
                }`}>
                  Image URL
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/studio-image.jpg"
                  className={`w-full px-4 py-3.5 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide focus:outline-none ${
                    theme === "dark"
                      ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus:border-white focus:bg-black"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900"
                  }`}
                />
                <p className={`text-xs font-light mt-2 tracking-wide ${
                  theme === "dark" ? "text-zinc-500" : "text-gray-500"
                }`}>
                  Enter a direct link to your studio image
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className={`p-6 rounded-xl border ${
            theme === "dark"
              ? "bg-zinc-950 border-zinc-800"
              : "bg-white border-gray-200"
          }`}>
            <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 tracking-wide ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              <MapPin className="w-5 h-5" strokeWidth={2} />
              Location
            </h2>

            <LocationSelector
              onLocationChange={handleLocationChange}
              showGeolocation={true}
            />

            {formData.location && (
              <div className={`mt-4 p-3 rounded-lg border ${
                theme === "dark"
                  ? "bg-green-500/10 border-green-500/20"
                  : "bg-green-50 border-green-200"
              }`}>
                <p className={`text-sm font-medium tracking-wide ${
                  theme === "dark" ? "text-green-400" : "text-green-600"
                }`}>
                  Selected Location: {formData.location}
                </p>
                {formData.latitude && formData.longitude && (
                  <p className={`text-xs font-light mt-1 tracking-wide ${
                    theme === "dark" ? "text-green-500" : "text-green-700"
                  }`}>
                    Coordinates: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Pricing & Capacity */}
          <div className={`p-6 rounded-xl border ${
            theme === "dark"
              ? "bg-zinc-950 border-zinc-800"
              : "bg-white border-gray-200"
          }`}>
            <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 tracking-wide ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              <DollarSign className="w-5 h-5" strokeWidth={2} />
              Pricing & Capacity
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-medium mb-2 tracking-wider uppercase ${
                  theme === "dark" ? "text-zinc-400" : "text-gray-700"
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
                  className={`w-full px-4 py-3.5 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide focus:outline-none ${
                    theme === "dark"
                      ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus:border-white focus:bg-black"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-2 tracking-wider uppercase ${
                  theme === "dark" ? "text-zinc-400" : "text-gray-700"
                }`}>
                  Capacity
                </label>
                <select
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3.5 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide focus:outline-none ${
                    theme === "dark"
                      ? "bg-zinc-950 border-zinc-800 text-white focus:border-white focus:bg-black"
                      : "bg-white border-gray-300 text-gray-900 focus:border-gray-900"
                  }`}
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
              ? "bg-zinc-950 border-zinc-800"
              : "bg-white border-gray-200"
          }`}>
            <h2 className={`text-lg font-medium mb-4 tracking-wide ${
              theme === "dark" ? "text-white" : "text-gray-900"
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
                  className={`flex-1 px-4 py-3.5 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide focus:outline-none ${
                    theme === "dark"
                      ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus:border-white focus:bg-black"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900"
                  }`}
                />
                <button
                  type="button"
                  onClick={addEquipment}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 tracking-wide active:scale-[0.98] ${
                    theme === "dark"
                      ? "bg-white hover:bg-zinc-100 text-black border border-white"
                      : "bg-black hover:bg-gray-900 text-white border border-black"
                  }`}
                >
                  <Plus className="w-4 h-4" strokeWidth={2} />
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
                          ? "bg-black border-zinc-800 text-zinc-300"
                          : "bg-gray-50 border-gray-200 text-gray-700"
                      }`}
                    >
                      <span className="text-sm font-light tracking-wide">{item}</span>
                      <button
                        type="button"
                        onClick={() => removeEquipment(item)}
                        className={`p-1 rounded hover:bg-red-500/10 transition-all ${
                          theme === "dark" ? "text-red-400" : "text-red-600"
                        }`}
                      >
                        <X className="w-3 h-3" strokeWidth={2} />
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
              className={`flex-1 py-3.5 px-6 rounded-lg font-medium transition-all duration-200 tracking-wide ${
                theme === "dark"
                  ? "bg-zinc-950 hover:bg-black text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300"
              } ${loading ? "opacity-50 cursor-not-allowed" : "active:scale-[0.98]"}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3.5 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 tracking-wide border ${
                loading
                  ? theme === "dark"
                    ? "bg-zinc-900 text-zinc-600 cursor-not-allowed border-zinc-800"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300"
                  : theme === "dark"
                  ? "bg-white hover:bg-zinc-100 text-black border-white active:scale-[0.98]"
                  : "bg-black hover:bg-gray-900 text-white border-black active:scale-[0.98]"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                  Creating Listing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
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