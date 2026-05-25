"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/providers/ThemeProvider";
import { usePermissions } from "@/hooks/usePermissions";
import { LocationSelector, type LocationData } from "@/components/LocationSelector";
import { formatAmount, getCurrencyConfig } from "@/lib/currency";
import { X, Plus, ArrowRight, ArrowLeft } from "lucide-react";

// NOTE: If you are using Supabase Storage, you would import your client here
import { supabaseBrowserClient } from "@/utils/supabase/client";

const VERIFICATION_DOC_TYPES = [
  { key: "utility_bill", label: "Utility Bill", hint: "Recent electricity or water bill showing the studio address" },
  { key: "id", label: "Gov ID", hint: "National ID, passport, or driver's license" },
  { key: "studio_photo", label: "Studio Photo", hint: "Clear photo showing the inside or exterior" },
  { key: "lease", label: "Lease", hint: "Rental agreement or property ownership document" },
  { key: "other", label: "Other", hint: "Any other verifiable document" },
] as const;

export default function ListStudio() {
  const router = useRouter();
  const { theme } = useTheme();
  const { permissions } = usePermissions();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    streetAddress: "",
    country: "",
    countryCode: "",
    state: "",
    city: "",
    latitude: "",
    longitude: "",
    hourlyRate: "",
    currency: "USD",
    capacity: "1-5",
    imageUrl: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [newEquipment, setNewEquipment] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  
  // Updated: Handle both URL strings and raw File objects for verification
  const [verificationDocs, setVerificationDocs] = useState<{ type: string; url?: string; file?: File }[]>([]);
  const [newDocType, setNewDocType] = useState<string>("utility_bill");
  const [newDocUrl, setNewDocUrl] = useState("");
  const [newDocFile, setNewDocFile] = useState<File | null>(null);

  const isDark = theme === "dark";

  if (!permissions?.canCreateStudios) {
    return (
      <div className={`h-screen w-full flex flex-col items-center justify-center ${isDark ? "bg-black text-white" : "bg-white text-black"}`}>
        <h1 className="text-4xl md:text-6xl font-light tracking-tighter mb-4">Access Restricted.</h1>
        <p className="text-sm tracking-widest uppercase opacity-50 mb-12 text-center max-w-md">
          Producer or studio owner permissions required to list spaces.
        </p>
        <button
          onClick={() => router.push("/studios")}
          className={`px-8 py-4 text-xs font-medium tracking-[0.2em] uppercase transition-transform hover:scale-105 ${
            isDark ? "bg-white text-black" : "bg-black text-white"
          }`}
        >
          Return to Studios
        </button>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setFormData({ ...formData, imageUrl: "" });
    }
  };

  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewDocFile(e.target.files[0]);
      setNewDocUrl(""); 
    }
  };

  const handleLocationChange = (locationData: LocationData) => {
    const currencyConfig = getCurrencyConfig(locationData.countryCode || locationData.country);
    setFormData(prev => ({
      ...prev,
      location: locationData.fullAddress || `${locationData.city}, ${locationData.state}, ${locationData.country}`,
      streetAddress: locationData.streetAddress || "",
      country: locationData.country,
      countryCode: locationData.countryCode,
      state: locationData.state,
      city: locationData.city,
      latitude: locationData.latitude?.toString() || "",
      longitude: locationData.longitude?.toString() || "",
      currency: currencyConfig.currency,
    }));
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
    if (!formData.name || !formData.location || !formData.hourlyRate || !formData.streetAddress) {
      setError("Please complete all required fields (Name, Location, Street Address, Rate).");
      return;
    }
    setCurrentStep(2);
    document.getElementById('scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addVerificationDoc = () => {
    if (newDocUrl.trim() || newDocFile) {
      setVerificationDocs(prev => [
        ...prev, 
        { type: newDocType, url: newDocUrl.trim(), file: newDocFile || undefined }
      ]);
      setNewDocUrl("");
      setNewDocFile(null);
    }
  };

  const removeVerificationDoc = (index: number) => {
    setVerificationDocs(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFileToStorage = async (file: File, bucket: string): Promise<string> => {
    // Generate a unique file name to prevent accidental overwrites
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`; // Saved at the root of the bucket

    // 1. Upload the file to the specified bucket
    const { error: uploadError } = await supabaseBrowserClient.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false // Don't overwrite if a file with the same name exists
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
    }

    // 2. Get the public URL for the uploaded file
    const { data } = supabaseBrowserClient.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  };
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // 1. Upload primary studio image if a file was selected
      let finalImageUrl = formData.imageUrl;
      if (imageFile) {
        finalImageUrl = await uploadFileToStorage(imageFile, 'studios');
      }

      // 2. Create the studio
      const studioResponse = await fetch("/api/studios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          imageUrl: finalImageUrl,
          equipment,
          countryCode: formData.countryCode,
          currency: formData.currency,
          hourlyRate: parseFloat(formData.hourlyRate),
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        }),
      });

      const studioData = await studioResponse.json();
      if (!studioResponse.ok) throw new Error(studioData.error || "Failed to create listing");

      const studioId = studioData.data?.id || studioData.studio?.id;

      // 3. Upload verification documents and submit verification request
      if (studioId && verificationDocs.length > 0) {
        const docUrls = await Promise.all(
          verificationDocs.map(async (doc) => {
            let fileUrl = doc.url;
            if (doc.file) {
              fileUrl = await uploadFileToStorage(doc.file, 'verifications');
            }
            return `[${doc.type}] ${fileUrl}`;
          })
        );

        await fetch(`/api/studios/${studioId}/verification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documents: docUrls }),
        });
      }

      setSuccess(true);
      setTimeout(() => router.push("/studios"), 3000);
    } catch (error: any) {
      setError(error.message || "Failed to create studio listing");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full bg-transparent border-b pb-4 text-xl md:text-3xl font-light tracking-tight focus:outline-none transition-colors rounded-none ${
    isDark 
      ? "border-zinc-800 text-white placeholder-zinc-700 focus:border-white" 
      : "border-gray-300 text-black placeholder-gray-400 focus:border-black"
  }`;

  const labelClass = `block text-[10px] font-semibold tracking-[0.2em] uppercase mb-4 opacity-50`;

  return (
    <div className={`flex flex-col lg:flex-row h-screen w-full overflow-hidden ${isDark ? "bg-black text-white" : "bg-white text-black"}`}>
      
      {/* Left Column: Editorial Header */}
      <div className={`lg:w-2/5 p-8 lg:p-16 flex flex-col border-b lg:border-b-0 lg:border-r ${isDark ? "border-zinc-900 bg-black" : "border-gray-100 bg-gray-50"}`}>
        <div className="mb-24">
          <h1 className="text-5xl lg:text-7xl font-light tracking-tighter leading-[0.9] mb-8">
            <span className="block">List</span>
            <span className="block">your</span>
            <span className="block">space.</span>
          </h1>
          <p className="text-sm font-light tracking-wide opacity-60 max-w-xs leading-relaxed">
            Join a curated network of premier recording environments.
          </p>
        </div>

        <div className="hidden lg:block">
          <div className="flex flex-col gap-10">
            {[
              { num: 1, title: "The Details", desc: "Identity & Capacity" },
              { num: 2, title: "Verification", desc: "Trust & Security" }
            ].map((step) => (
              <div key={step.num} className={`transition-all duration-500 ${currentStep === step.num ? "opacity-100 translate-x-2" : "opacity-30"}`}>
                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-1">
                  0{step.num} — {step.title}
                </p>
                <p className="text-sm font-light">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Scrollable Form */}
      <div id="scroll-container" className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden relative">
        <div className="max-w-3xl mx-auto p-8 lg:p-24 min-h-full flex flex-col justify-center">
          
          {success && (
            <div className="mb-16">
              <h2 className="text-4xl font-light tracking-tighter mb-4">Listing Live.</h2>
              {/* FIX 2: Dynamic Success Message */}
              {verificationDocs.length > 0 ? (
                <p className="text-sm font-light tracking-wide opacity-60">
                  Your space is currently under review. Verified status will be applied within 72 hours. Redirecting...
                </p>
              ) : (
                <p className="text-sm font-light tracking-wide opacity-60">
                  Your space is live but Unverified. You can submit documents later from your dashboard. Redirecting...
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="mb-12 p-6 bg-red-500/10 text-red-500 border border-red-500/20 text-sm font-medium tracking-wide">
              {error}
            </div>
          )}

          {!success && (
            <form onSubmit={currentStep === 1 ? handleStep1Next : handleSubmit} className="space-y-24">
              
              {currentStep === 1 && (
                <div className="space-y-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  
                  <div>
                    <label className={labelClass}>Name of Space *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Sunset Sound Studios" required className={inputClass} />
                  </div>

                  <div>
                    <label className={labelClass}>Description</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="The atmosphere, the acoustics, the history..." rows={3} className={`${inputClass} resize-none`} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-12">
                    <div>
                      <label className={labelClass}>Hourly Rate ({formData.currency}) *</label>
                      <input type="number" step="0.01" name="hourlyRate" value={formData.hourlyRate} onChange={handleInputChange} placeholder="150.00" required className={inputClass} />
                      <p className="mt-3 text-xs font-light tracking-wide opacity-50">
                        {formData.country
                          ? `Listings in ${formData.country} are priced in ${formData.currency}.`
                          : "Select the studio country below to set the listing currency."}
                        {formData.hourlyRate && ` Preview: ${formatAmount(Number(formData.hourlyRate), formData.currency)}/hr`}
                      </p>
                    </div>
                    <div>
                      <label className={labelClass}>Capacity (People)</label>
                      <select name="capacity" value={formData.capacity} onChange={handleInputChange} className={`${inputClass} appearance-none cursor-pointer pr-8`}>
                        <option value="1-5" className="text-black">1-5 individuals</option>
                        <option value="6-10" className="text-black">6-10 individuals</option>
                        <option value="11-20" className="text-black">11-20 individuals</option>
                        <option value="20+" className="text-black">20+ individuals</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Coordinates & Address *</label>
                    <div className="my-8">
                      <LocationSelector onLocationChange={handleLocationChange} showGeolocation={true} showStreetAddress={true} />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Primary Imagery</label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6 mt-4 border-b pb-4 border-zinc-800">
                      <label className={`cursor-pointer px-6 py-4 border text-[10px] font-semibold tracking-[0.2em] uppercase transition-colors whitespace-nowrap ${isDark ? "border-zinc-800 hover:bg-zinc-900" : "border-gray-200 hover:bg-gray-50"}`}>
                        {imageFile ? "Change File" : "Upload File"}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />
                      </label>
                      <span className="text-[10px] uppercase tracking-[0.2em] opacity-40">OR</span>
                      <input
                        type="url"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={(e) => {
                          handleInputChange(e);
                          if (e.target.value) setImageFile(null);
                        }}
                        placeholder="Paste image URL"
                        className={`flex-1 bg-transparent text-xl font-light tracking-tight focus:outline-none ${isDark ? "placeholder-zinc-700" : "placeholder-gray-400"}`}
                      />
                    </div>
                    {imageFile && (
                      <p className="mt-4 text-xs font-light tracking-wide opacity-70">
                        Selected: <span className="font-medium">{imageFile.name}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Technical Inventory</label>
                    <div className="flex gap-4 border-b pb-4 mb-8">
                      <input
                        type="text"
                        value={newEquipment}
                        onChange={(e) => setNewEquipment(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEquipment())}
                        placeholder="Neumann U87, SSL Console..."
                        className={`flex-1 bg-transparent text-xl font-light tracking-tight focus:outline-none ${isDark ? "placeholder-zinc-700" : "placeholder-gray-400"}`}
                      />
                      <button type="button" onClick={addEquipment} className="px-4 opacity-50 hover:opacity-100 transition-opacity">
                        <Plus className="w-6 h-6" strokeWidth={1} />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {equipment.map((item) => (
                        <div key={item} className={`group flex items-center gap-3 px-5 py-2 text-xs font-medium tracking-wide uppercase border rounded-full ${isDark ? "border-zinc-800" : "border-gray-200"}`}>
                          {item}
                          <button type="button" onClick={() => removeEquipment(item)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-3 h-3" strokeWidth={2} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-12 flex justify-end">
                    <button type="submit" className="group flex items-center gap-4 text-sm font-semibold tracking-[0.2em] uppercase hover:opacity-70 transition-opacity">
                      Next Step
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-16 animate-in fade-in slide-in-from-right-8 duration-700">
                  
                  <div>
                    <h2 className="text-3xl font-light tracking-tighter mb-4">Establish Trust.</h2>
                    <p className="text-sm font-light tracking-wide opacity-60 leading-relaxed max-w-lg">
                      Provide documentation to verify ownership and location. Verification takes up to 72 hours.
                    </p>
                  </div>

                  {/* FIX 3: Add File Upload to Verification Docs */}
                  <div>
                    <label className={labelClass}>Document Type</label>
                    <div className="flex flex-wrap gap-3 mb-8">
                      {VERIFICATION_DOC_TYPES.map(dt => (
                        <button
                          key={dt.key}
                          type="button"
                          onClick={() => setNewDocType(dt.key)}
                          className={`px-5 py-3 text-[10px] font-semibold tracking-[0.2em] uppercase transition-all ${
                            newDocType === dt.key
                              ? (isDark ? "bg-white text-black" : "bg-black text-white")
                              : (isDark ? "bg-zinc-900 text-zinc-500 hover:bg-zinc-800" : "bg-gray-100 text-gray-500 hover:bg-gray-200")
                          }`}
                        >
                          {dt.label}
                        </button>
                      ))}
                    </div>
                    
                    <p className="text-xs font-light opacity-50 mb-4">
                      {VERIFICATION_DOC_TYPES.find(d => d.key === newDocType)?.hint}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b pb-4">
                      <label className={`cursor-pointer px-4 py-3 border text-[10px] font-semibold tracking-[0.2em] uppercase transition-colors whitespace-nowrap ${isDark ? "border-zinc-800 hover:bg-zinc-900" : "border-gray-200 hover:bg-gray-50"}`}>
                        {newDocFile ? "File Added" : "Upload File"}
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleDocFileChange} />
                      </label>
                      <span className="text-[10px] uppercase tracking-[0.2em] opacity-40">OR</span>
                      <input
                        type="url"
                        value={newDocUrl}
                        onChange={(e) => {
                          setNewDocUrl(e.target.value);
                          if (e.target.value) setNewDocFile(null);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addVerificationDoc())}
                        placeholder={newDocFile ? newDocFile.name : "Paste secure link..."}
                        disabled={!!newDocFile}
                        className={`flex-1 bg-transparent text-lg md:text-xl font-light tracking-tight focus:outline-none disabled:opacity-50 ${isDark ? "placeholder-zinc-700" : "placeholder-gray-400"}`}
                      />
                      <button type="button" onClick={addVerificationDoc} className="opacity-50 hover:opacity-100 transition-opacity">
                        <Plus className="w-6 h-6" strokeWidth={1} />
                      </button>
                    </div>
                  </div>

                  {/* Document List */}
                  <div className="space-y-4">
                    {verificationDocs.map((doc, i) => (
                      <div key={i} className={`flex items-center justify-between p-6 border ${isDark ? "border-zinc-900" : "border-gray-100"}`}>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-1">
                            {VERIFICATION_DOC_TYPES.find(d => d.key === doc.type)?.label || doc.type}
                          </span>
                          <span className="text-sm font-light opacity-60 truncate max-w-[200px] md:max-w-md">
                            {doc.file ? doc.file.name : doc.url}
                          </span>
                        </div>
                        <button type="button" onClick={() => removeVerificationDoc(i)} className="p-2 opacity-50 hover:opacity-100 transition-opacity hover:text-red-500">
                          <X className="w-5 h-5" strokeWidth={1} />
                        </button>
                      </div>
                    ))}
                    {verificationDocs.length === 0 && (
                      <div className={`p-12 text-center border border-dashed ${isDark ? "border-zinc-800" : "border-gray-200"}`}>
                        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase opacity-40">No documents attached</p>
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="pt-12 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="group flex items-center gap-4 text-sm font-semibold tracking-[0.2em] uppercase hover:opacity-70 transition-opacity"
                    >
                      <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-2" strokeWidth={1.5} />
                      Back
                    </button>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className={`px-8 py-5 text-[10px] font-semibold tracking-[0.2em] uppercase transition-transform ${
                        loading ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"
                      } ${isDark ? "bg-white text-black" : "bg-black text-white"}`}
                    >
                      {loading ? "Processing..." : "Publish Space"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}