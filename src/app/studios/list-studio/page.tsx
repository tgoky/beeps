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
  BadgeCheck,
  FileText,
  Camera,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Clock,
} from "lucide-react";

const VERIFICATION_DOC_TYPES = [
  { key: "utility_bill", label: "Utility / Light Bill", hint: "Recent electricity or water bill showing the studio address" },
  { key: "id", label: "Government-Issued ID", hint: "National ID, passport, or driver's license of the studio owner" },
  { key: "studio_photo", label: "Studio Photo", hint: "Clear photo showing the inside or exterior of your studio" },
  { key: "lease", label: "Lease / Ownership Document", hint: "Rental agreement or property ownership document" },
  { key: "other", label: "Other Supporting Document", hint: "Any other document that helps verify your studio" },
] as const;

export default function ListStudio() {
  const router = useRouter();
  const { theme } = useTheme();
  const { permissions, canAccess } = usePermissions();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    streetAddress: "",
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

  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1);
  // Verification documents: array of { type: string, url: string }
  const [verificationDocs, setVerificationDocs] = useState<{ type: string; url: string }[]>([]);
  const [newDocType, setNewDocType] = useState<string>("utility_bill");
  const [newDocUrl, setNewDocUrl] = useState("");

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
      streetAddress: locationData.streetAddress || "",
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

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!formData.name || !formData.location || !formData.hourlyRate) {
      setError("Please fill in all required fields (studio name, location, hourly rate)");
      return;
    }
    if (!formData.streetAddress) {
      setError("Street address is required so clients can navigate to your studio");
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addVerificationDoc = () => {
    if (newDocUrl.trim()) {
      setVerificationDocs(prev => [...prev, { type: newDocType, url: newDocUrl.trim() }]);
      setNewDocUrl("");
    }
  };

  const removeVerificationDoc = (index: number) => {
    setVerificationDocs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Create the studio listing
      const studioResponse = await fetch("/api/studios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          equipment,
          hourlyRate: parseFloat(formData.hourlyRate),
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        }),
      });

      const studioData = await studioResponse.json();
      if (!studioResponse.ok) {
        throw new Error(studioData.error || "Failed to create studio listing");
      }

      const studioId = studioData.data?.id || studioData.studio?.id;

      // Submit verification request with documents (even if empty, triggers PENDING status)
      if (studioId && verificationDocs.length > 0) {
        const docUrls = verificationDocs.map(d => `[${d.type}] ${d.url}`);
        await fetch(`/api/studios/${studioId}/verification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documents: docUrls }),
        });
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/studios");
      }, 3000);
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

        {/* Step Indicators */}
        <div className="flex items-center gap-3 mb-8">
          {[
            { num: 1, label: "Studio Info" },
            { num: 2, label: "Verification Docs" },
          ].map(({ num, label }, i) => (
            <div key={num} className="flex items-center gap-3">
              {i > 0 && (
                <div className={`w-8 h-px ${theme === "dark" ? "bg-zinc-800" : "bg-gray-300"}`} />
              )}
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border transition-all ${
                  currentStep === num
                    ? theme === "dark" ? "bg-white text-black border-white" : "bg-black text-white border-black"
                    : currentStep > num
                    ? theme === "dark" ? "bg-green-500 text-white border-green-500" : "bg-green-500 text-white border-green-500"
                    : theme === "dark" ? "bg-zinc-900 text-zinc-500 border-zinc-800" : "bg-gray-100 text-gray-400 border-gray-200"
                }`}>
                  {currentStep > num ? <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} /> : num}
                </div>
                <span className={`text-sm font-light tracking-wide hidden sm:block ${
                  currentStep === num
                    ? theme === "dark" ? "text-white" : "text-gray-900"
                    : theme === "dark" ? "text-zinc-600" : "text-gray-400"
                }`}>{label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Success Message */}
        {success && (
          <div className={`mb-6 p-5 rounded-xl flex items-start gap-3 border ${
            theme === "dark"
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-green-50 border-green-200 text-green-600"
          }`}>
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <p className="font-medium tracking-wide">Studio listed successfully!</p>
              <p className="text-sm font-light tracking-wide opacity-90 mt-1">
                Your studio is live but marked as <strong>Unverified</strong>. Verification takes up to 72 hours. Once approved, a verified badge will appear on your listing.
              </p>
              <p className="text-sm font-light tracking-wide opacity-80 mt-1">Redirecting to studios page...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={`mb-6 p-4 rounded-lg border flex items-start gap-2 ${
            theme === "dark"
              ? "bg-red-500/10 border-red-500/20 text-red-400"
              : "bg-red-50 border-red-200 text-red-600"
          }`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-sm font-light tracking-wide">{error}</p>
          </div>
        )}

        {/* Step 1: Studio Info */}
        {currentStep === 1 && (
        <form onSubmit={handleStep1Next} className="space-y-6">
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
              showStreetAddress={true}
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

          {/* Step 1 — Continue Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push("/studios")}
              className={`flex-1 py-3.5 px-6 rounded-lg font-medium transition-all duration-200 tracking-wide active:scale-[0.98] ${
                theme === "dark"
                  ? "bg-zinc-950 hover:bg-black text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 py-3.5 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 tracking-wide border active:scale-[0.98] ${
                theme === "dark"
                  ? "bg-white hover:bg-zinc-100 text-black border-white"
                  : "bg-black hover:bg-gray-900 text-white border-black"
              }`}
            >
              Continue to Verification
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </form>
        )}

        {/* Step 2: Verification Documents */}
        {currentStep === 2 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 72-hour notice */}
            <div className={`p-5 rounded-xl border flex items-start gap-3 ${
              theme === "dark"
                ? "bg-yellow-500/5 border-yellow-500/20"
                : "bg-yellow-50 border-yellow-200"
            }`}>
              <Clock className={`w-5 h-5 flex-shrink-0 mt-0.5 ${theme === "dark" ? "text-yellow-400" : "text-yellow-600"}`} strokeWidth={2} />
              <div>
                <p className={`text-sm font-semibold tracking-wide ${theme === "dark" ? "text-yellow-300" : "text-yellow-700"}`}>
                  Verification takes up to 72 hours
                </p>
                <p className={`text-xs font-light mt-1 tracking-wide ${theme === "dark" ? "text-yellow-400/70" : "text-yellow-600/80"}`}>
                  Your studio will be listed immediately but shown as <strong>Unverified</strong> until our team reviews your documents. Verified studios earn a badge that builds trust with artists.
                </p>
              </div>
            </div>

            {/* Document upload section */}
            <div className={`p-6 rounded-xl border ${
              theme === "dark" ? "bg-zinc-950 border-zinc-800" : "bg-white border-gray-200"
            }`}>
              <h2 className={`text-lg font-medium mb-1 flex items-center gap-2 tracking-wide ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                <BadgeCheck className="w-5 h-5" strokeWidth={2} />
                Verification Documents
              </h2>
              <p className={`text-xs font-light mb-5 tracking-wide ${theme === "dark" ? "text-zinc-500" : "text-gray-500"}`}>
                Submit at least one document to verify your studio ownership and location. Provide direct URLs to your files (Google Drive, Dropbox, etc).
              </p>

              {/* Add document row */}
              <div className="space-y-3 mb-5">
                <div className={`flex flex-col sm:flex-row gap-2`}>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value)}
                    className={`sm:w-56 px-3 py-3 text-sm font-light rounded-lg border transition-all focus:outline-none ${
                      theme === "dark"
                        ? "bg-black border-zinc-800 text-white focus:border-white"
                        : "bg-white border-gray-300 text-gray-900 focus:border-gray-900"
                    }`}
                  >
                    {VERIFICATION_DOC_TYPES.map(dt => (
                      <option key={dt.key} value={dt.key}>{dt.label}</option>
                    ))}
                  </select>
                  <input
                    type="url"
                    value={newDocUrl}
                    onChange={(e) => setNewDocUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addVerificationDoc())}
                    placeholder="https://drive.google.com/file/..."
                    className={`flex-1 px-3 py-3 text-sm font-light rounded-lg border transition-all focus:outline-none ${
                      theme === "dark"
                        ? "bg-black border-zinc-800 text-white placeholder-zinc-600 focus:border-white"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={addVerificationDoc}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all active:scale-[0.98] ${
                      theme === "dark"
                        ? "bg-zinc-800 text-white hover:bg-zinc-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Plus className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
                {/* Hint for selected doc type */}
                <p className={`text-xs font-light tracking-wide ${theme === "dark" ? "text-zinc-600" : "text-gray-400"}`}>
                  {VERIFICATION_DOC_TYPES.find(d => d.key === newDocType)?.hint}
                </p>
              </div>

              {/* Document list */}
              {verificationDocs.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {verificationDocs.map((doc, i) => {
                    const docType = VERIFICATION_DOC_TYPES.find(d => d.key === doc.type);
                    return (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${
                        theme === "dark"
                          ? "bg-black border-zinc-800 text-zinc-400"
                          : "bg-gray-50 border-gray-200 text-gray-600"
                      }`}>
                        <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={2} />
                        <div className="flex-1 min-w-0">
                          <span className={`text-xs font-semibold block mb-0.5 ${theme === "dark" ? "text-zinc-300" : "text-gray-700"}`}>
                            {docType?.label || doc.type}
                          </span>
                          <span className="text-xs font-light truncate block">{doc.url}</span>
                        </div>
                        <button type="button" onClick={() => removeVerificationDoc(i)} className="text-red-500 hover:text-red-400 flex-shrink-0">
                          <X className="w-4 h-4" strokeWidth={2} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`p-4 rounded-lg border border-dashed text-center text-sm font-light ${
                  theme === "dark" ? "border-zinc-800 text-zinc-600" : "border-gray-300 text-gray-400"
                }`}>
                  No documents added yet. You can skip this and submit later from your studio settings — but verification won&apos;t start until documents are provided.
                </div>
              )}
            </div>

            {/* What you need */}
            <div className={`p-5 rounded-xl border ${
              theme === "dark" ? "bg-zinc-950 border-zinc-800" : "bg-white border-gray-200"
            }`}>
              <h3 className={`text-sm font-semibold tracking-wide mb-3 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                Accepted document types
              </h3>
              <div className="space-y-2">
                {VERIFICATION_DOC_TYPES.map(dt => (
                  <div key={dt.key} className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${theme === "dark" ? "bg-zinc-600" : "bg-gray-400"}`} />
                    <div>
                      <span className={`text-xs font-medium ${theme === "dark" ? "text-zinc-300" : "text-gray-700"}`}>{dt.label}</span>
                      <span className={`text-xs font-light ml-1 ${theme === "dark" ? "text-zinc-600" : "text-gray-400"}`}>— {dt.hint}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => { setCurrentStep(1); setError(""); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={loading}
                className={`flex-1 py-3.5 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 tracking-wide border active:scale-[0.98] ${
                  theme === "dark"
                    ? "bg-zinc-950 hover:bg-black text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                Back
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
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                    List Studio &amp; Submit for Verification
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}