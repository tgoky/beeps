"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useStudio } from "@/hooks/useStudios";
import StudioBookingDrawer from "@/components/StudioBookingDrawer";
import { 
  Star, MapPin, X, ChevronLeft, ChevronRight,
  Wifi, Car, Coffee, Volume2, Mic2, BadgeCheck, CheckCircle2, Image as ImageIcon
} from "lucide-react";

export default function StudioProfilePage() {
  const { id } = useParams();
  const { data: studio, isLoading, error } = useStudio(id as string);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  if (isLoading) {
    return <div className="w-full h-full flex items-center justify-center text-zinc-500">Loading Studio...</div>;
  }

  if (error || !studio) {
    return <div className="w-full h-full flex items-center justify-center text-red-400">Studio not found.</div>;
  }

  const images = studio.imageUrls?.length ? studio.imageUrls : studio.imageUrl ? [studio.imageUrl] : [];

  // Lightbox Navigation
  const nextImage = () => setCurrentImageIdx((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIdx((prev) => (prev - 1 + images.length) % images.length);

  return (
    // h-full w-full ensures it fits perfectly inside your right-side dashboard area
    <div className="w-full h-full overflow-y-auto bg-[#030303] text-zinc-200 scrollbar-hide relative">
      <main className="max-w-6xl mx-auto px-6 py-8 md:py-10">
        
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-3 flex items-center gap-2">
            {studio.name}
            {studio.verificationStatus === "VERIFIED" && <BadgeCheck className="text-blue-500 shrink-0" size={24} />}
          </h1>
          <div className="flex items-center gap-4 text-sm font-medium text-zinc-400">
            <span className="flex items-center gap-1.5 text-zinc-200">
              <Star size={16} className="fill-yellow-500 text-yellow-500" /> {studio.rating || "New"}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={16} /> {studio.location}
            </span>
          </div>
        </div>

        {/* DYNAMIC GALLERY */}
        <div className="mb-10 relative">
          {images.length === 0 ? (
            <div className="w-full h-[300px] sm:h-[400px] bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-600">
              <Mic2 size={48} className="mb-3 opacity-50" />
              <span className="text-sm font-medium">No photos available</span>
            </div>
          ) : images.length === 1 ? (
            <div className="w-full h-[300px] sm:h-[400px] rounded-2xl overflow-hidden relative">
              <img src={images[0]} alt="Studio" className="w-full h-full object-cover" />
            </div>
          ) : images.length === 2 ? (
            <div className="grid grid-cols-2 gap-2 h-[300px] sm:h-[400px] rounded-2xl overflow-hidden relative">
              <img src={images[0]} alt="Studio 1" className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-pointer" onClick={() => setShowGallery(true)} />
              <img src={images[1]} alt="Studio 2" className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-pointer" onClick={() => setShowGallery(true)} />
            </div>
          ) : (
            // Airbnb Style Grid for 3+ images
            <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[350px] sm:h-[450px] rounded-2xl overflow-hidden relative group">
              <div className="col-span-4 sm:col-span-2 row-span-2 relative h-full">
                <img src={images[0]} alt="Main" className="absolute inset-0 w-full h-full object-cover hover:brightness-90 transition-all cursor-pointer" onClick={() => setShowGallery(true)} />
              </div>
              {images.slice(1, 5).map((img, i) => (
                <div key={i} className="hidden sm:block relative h-full overflow-hidden">
                  <img src={img} alt={`Studio ${i+1}`} className="absolute inset-0 w-full h-full object-cover hover:brightness-90 transition-all cursor-pointer" onClick={() => setShowGallery(true)} />
                </div>
              ))}
              <button 
                onClick={() => setShowGallery(true)}
                className="absolute bottom-4 right-4 bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold shadow-lg hover:bg-zinc-200 transition-colors z-10 flex items-center gap-2"
              >
                <ImageIcon size={16} />
                Show all {images.length} photos
              </button>
            </div>
          )}
        </div>

        {/* TWO-COLUMN LAYOUT (Notice: items-start allows the right column to be sticky) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12 relative items-start">
          
          {/* LEFT COLUMN: Content */}
          <div className="lg:col-span-2 space-y-10">
            
            <section className="pb-8 border-b border-zinc-800">
              <h2 className="text-xl font-semibold text-white mb-4">About the space</h2>
              <p className="text-base text-zinc-400 leading-relaxed whitespace-pre-line">
                {studio.description || "Premium recording environment. Contact for specific accommodations."}
              </p>
            </section>

            <section className="pb-8 border-b border-zinc-800">
              <h2 className="text-xl font-semibold text-white mb-6">What this place offers</h2>
              <div className="grid grid-cols-2 gap-y-4">
                {[
                  { icon: Wifi, label: "High-speed WiFi" },
                  { icon: Car, label: "Free Parking" },
                  { icon: Coffee, label: "Coffee Bar" },
                  { icon: Volume2, label: "Sound Proof" },
                ].map((amenity, i) => (
                  <div key={i} className="flex items-center gap-3 text-zinc-300">
                    <amenity.icon size={20} className="text-zinc-500" strokeWidth={1.5} />
                    <span className="text-sm">{amenity.label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="pb-8 border-b border-zinc-800">
              <h2 className="text-xl font-semibold text-white mb-6">Available Gear</h2>
              {studio.equipment && studio.equipment.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {studio.equipment.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 text-zinc-300">
                      <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">No specific equipment listed for this studio.</p>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN: Sticky Widget */}
          <div className="lg:col-span-1 sticky top-6">
            <div className="bg-[#0A0A0A] border border-zinc-800 p-6 rounded-2xl shadow-2xl">
              <div className="flex items-end gap-1 mb-6">
                <span className="text-3xl font-bold text-white">${studio.hourlyRate}</span>
                <span className="text-sm font-medium text-zinc-500 mb-1">/ hr</span>
              </div>
              
              <button 
                onClick={() => setIsDrawerOpen(true)}
                className="w-full py-3.5 rounded-xl bg-white text-black text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:bg-zinc-100 transition-all active:scale-[0.98] flex items-center justify-center mb-4"
              >
                Check Availability & Book
              </button>
              
              <p className="text-center text-xs text-zinc-500 font-medium">You won't be charged yet.</p>
            </div>
          </div>
        </div>
      </main>

      {/* RENDER DRAWER OVERLAY */}
      {isDrawerOpen && (
        <StudioBookingDrawer studioId={studio.id} onClose={() => setIsDrawerOpen(false)} />
      )}

      {/* FULL SCREEN LIGHTBOX FOR PHOTOS */}
      {showGallery && images.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col">
          <div className="p-6 flex justify-between items-center text-white shrink-0">
            <span className="text-sm font-medium text-zinc-400">
              {currentImageIdx + 1} / {images.length}
            </span>
            <button onClick={() => setShowGallery(false)} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 relative">
            <img 
              src={images[currentImageIdx]} 
              alt="Gallery Preview" 
              className="max-w-full max-h-full object-contain select-none"
            />
            {images.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-6 p-3 bg-black/50 text-white hover:bg-white hover:text-black rounded-full backdrop-blur-md transition-all">
                  <ChevronLeft size={24} />
                </button>
                <button onClick={nextImage} className="absolute right-6 p-3 bg-black/50 text-white hover:bg-white hover:text-black rounded-full backdrop-blur-md transition-all">
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}