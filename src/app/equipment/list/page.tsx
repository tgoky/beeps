"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/providers/ThemeProvider";
import { usePermissions } from "@/hooks/usePermissions";
import { Package, Upload, Loader2, CheckCircle2, DollarSign } from "lucide-react";

const CATEGORIES = [
  "Microphone", "Audio Interface", "MIDI Controller", "Synthesizer",
  "Drum Machine", "Headphones", "Monitors", "Plugin", "DAW", "Other"
];

const CONDITIONS = ["New", "Like New", "Good", "Fair"];

export default function ListEquipment() {
  const router = useRouter();
  const { theme } = useTheme();
  const { permissions } = usePermissions();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Microphone",
    price: "",
    rentalRate: "",
    condition: "New",
    imageUrl: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      if (!formData.name || !formData.price) {
        throw new Error("Please fill in all required fields");
      }

      const response = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to list equipment");

      setSuccess(true);
      setTimeout(() => router.push("/equipment"), 2000);
    } catch (error: any) {
      setError(error.message || "Failed to list equipment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-950" : "bg-gray-50"}`}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>
            List Equipment
          </h1>
          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Sell or rent your music gear
          </p>
        </div>

        {success && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            theme === "dark" ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-green-50 border border-green-200 text-green-600"
          }`}>
            <CheckCircle2 className="w-5 h-5" />
            <div>
              <p className="font-medium">Equipment listed successfully!</p>
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
          <div className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-900/40 border-gray-800/60" : "bg-white border-gray-200"}`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${theme === "dark" ? "text-gray-200" : "text-gray-900"}`}>
              <Package className="w-5 h-5" />
              Equipment Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Neumann U87 Microphone"
                  required
                  className={`w-full p-3 rounded-lg border ${theme === "dark" ? "bg-gray-800/40 border-gray-700/60 text-gray-300" : "bg-white border-gray-300 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the equipment, its features, and condition..."
                  rows={4}
                  className={`w-full p-3 rounded-lg border resize-none ${theme === "dark" ? "bg-gray-800/40 border-gray-700/60 text-gray-300" : "bg-white border-gray-300 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                    Condition <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className={`w-full p-3 rounded-lg border ${theme === "dark" ? "bg-gray-800/40 border-gray-700/60 text-gray-300" : "bg-white border-gray-300 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                  >
                    {CONDITIONS.map(cond => <option key={cond} value={cond}>{cond}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                    Sale Price ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="499.99"
                    required
                    className={`w-full p-3 rounded-lg border ${theme === "dark" ? "bg-gray-800/40 border-gray-700/60 text-gray-300" : "bg-white border-gray-300 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                    Rental Rate ($/day) (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="rentalRate"
                    value={formData.rentalRate}
                    onChange={handleInputChange}
                    placeholder="25.00"
                    className={`w-full p-3 rounded-lg border ${theme === "dark" ? "bg-gray-800/40 border-gray-700/60 text-gray-300" : "bg-white border-gray-300 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  Image URL
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/equipment.jpg"
                  className={`w-full p-3 rounded-lg border ${theme === "dark" ? "bg-gray-800/40 border-gray-700/60 text-gray-300" : "bg-white border-gray-300 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push("/equipment")}
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
                loading ? (theme === "dark" ? "bg-gray-800 text-gray-500 cursor-not-allowed" : "bg-gray-300 text-gray-500 cursor-not-allowed") : (theme === "dark" ? "bg-purple-600 hover:bg-purple-700 text-white active:scale-95" : "bg-purple-600 hover:bg-purple-700 text-white active:scale-95")
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Listing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  List Equipment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
