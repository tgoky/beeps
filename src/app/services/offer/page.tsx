"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/providers/ThemeProvider";
import { usePermissions } from "@/hooks/usePermissions";
import { LocationSelector, type LocationData } from "@/components/LocationSelector";
import { Briefcase, Clock, DollarSign, Loader2, CheckCircle2, MapPin } from "lucide-react";

const CATEGORIES = [
  "Mixing & Mastering",
  "Music Production",
  "Vocal Recording",
  "Beat Making",
  "Audio Engineering",
  "Songwriting",
  "Sound Design",
  "Podcast Production",
  "Other"
];

export default function OfferService() {
  const router = useRouter();
  const { theme } = useTheme();
  const { permissions } = usePermissions();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Mixing & Mastering",
    price: "",
    deliveryTime: "3",
    imageUrl: "",
    location: "",
    country: "",
    state: "",
    city: "",
    latitude: "",
    longitude: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      if (!formData.title || !formData.price || !formData.deliveryTime) {
        throw new Error("Please fill in all required fields");
      }

      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          deliveryTime: parseInt(formData.deliveryTime),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to offer service");

      setSuccess(true);
      setTimeout(() => router.push("/services"), 2000);
    } catch (error: any) {
      setError(error.message || "Failed to offer service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-950" : "bg-gray-50"}`}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>
            Offer Your Service
          </h1>
          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Share your skills and expertise with artists and producers
          </p>
        </div>

        {success && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            theme === "dark" ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-green-50 border border-green-200 text-green-600"
          }`}>
            <CheckCircle2 className="w-5 h-5" />
            <div>
              <p className="font-medium">Service listed successfully!</p>
              <p className="text-sm opacity-90">Redirecting...</p>
            </div>
          </div>
        )}

        {error && (
          <div className={`mb-6 p-4 rounded-lg ${
            theme === "dark" ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-red-50 border border-red-200 text-red-600"
          }`}>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Details */}
          <div className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-900/40 border-gray-800/60" : "bg-white border-gray-200"}`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${theme === "dark" ? "text-gray-200" : "text-gray-900"}`}>
              <Briefcase className="w-5 h-5" />
              Service Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  Service Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Professional Mixing & Mastering"
                  required
                  className={`w-full p-3 rounded-lg border ${theme === "dark" ? "bg-gray-800/40 border-gray-700/60 text-gray-300" : "bg-white border-gray-300 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your service, experience, and what clients can expect..."
                  rows={5}
                  required
                  className={`w-full p-3 rounded-lg border resize-none ${theme === "dark" ? "bg-gray-800/40 border-gray-700/60 text-gray-300" : "bg-white border-gray-300 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`w-full p-3 rounded-lg border ${theme === "dark" ? "bg-gray-800/40 border-gray-700/60 text-gray-300" : "bg-white border-gray-300 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                    Price ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="150.00"
                    required
                    className={`w-full p-3 rounded-lg border ${theme === "dark" ? "bg-gray-800/40 border-gray-700/60 text-gray-300" : "bg-white border-gray-300 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                    Delivery Time (days) <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="deliveryTime"
                    value={formData.deliveryTime}
                    onChange={handleInputChange}
                    className={`w-full p-3 rounded-lg border ${theme === "dark" ? "bg-gray-800/40 border-gray-700/60 text-gray-300" : "bg-white border-gray-300 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                  >
                    <option value="1">1 day</option>
                    <option value="2">2 days</option>
                    <option value="3">3 days</option>
                    <option value="5">5 days</option>
                    <option value="7">1 week</option>
                    <option value="14">2 weeks</option>
                    <option value="30">1 month</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  Portfolio/Cover Image URL
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/portfolio.jpg"
                  className={`w-full p-3 rounded-lg border ${theme === "dark" ? "bg-gray-800/40 border-gray-700/60 text-gray-300" : "bg-white border-gray-300 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-900/40 border-gray-800/60" : "bg-white border-gray-200"}`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${theme === "dark" ? "text-gray-200" : "text-gray-900"}`}>
              <MapPin className="w-5 h-5" />
              Location
            </h2>

            <p className={`text-sm mb-4 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              Let clients know where you&apos;re based (services can be offered remotely)
            </p>

            <LocationSelector
              onLocationChange={handleLocationChange}
              showGeolocation={true}
            />

            {formData.location && (
              <div className={`mt-4 p-3 rounded-lg border ${
                theme === "dark" ? "bg-green-500/10 border-green-500/20" : "bg-green-50 border-green-200"
              }`}>
                <p className={`text-sm font-medium ${theme === "dark" ? "text-green-400" : "text-green-600"}`}>
                  Selected Location: {formData.location}
                </p>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push("/services")}
              disabled={loading}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                theme === "dark" ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
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
                  Listing Service...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  List Service
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
