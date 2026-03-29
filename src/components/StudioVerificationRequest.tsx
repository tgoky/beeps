"use client";

import { useState } from "react";
import { BadgeCheck, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { StudioVerificationBadge } from "./StudioVerificationBadge";

interface StudioVerificationRequestProps {
  studioId: string;
  studioName: string;
  currentStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  verificationNotes?: string | null;
  onStatusChange?: (newStatus: string) => void;
}

export function StudioVerificationRequest({
  studioId,
  studioName,
  currentStatus,
  verificationNotes,
  onStatusChange,
}: StudioVerificationRequestProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [documentUrls, setDocumentUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const addDocument = () => {
    if (newUrl.trim() && !documentUrls.includes(newUrl.trim())) {
      setDocumentUrls([...documentUrls, newUrl.trim()]);
      setNewUrl("");
    }
  };

  const removeDocument = (url: string) => {
    setDocumentUrls(documentUrls.filter((d) => d !== url));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/studios/${studioId}/verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: documentUrls }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit verification request");
      }

      setSuccess(true);
      onStatusChange?.("PENDING");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentStatus === "VERIFIED") {
    return (
      <div className={`p-4 rounded-xl border ${
        isDark ? "bg-blue-500/5 border-blue-500/20" : "bg-blue-50 border-blue-200"
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <BadgeCheck size={18} className="text-blue-500" />
          <span className={`text-sm font-semibold ${isDark ? "text-blue-400" : "text-blue-600"}`}>
            Verified Studio
          </span>
        </div>
        <p className={`text-xs ${isDark ? "text-blue-500/70" : "text-blue-600/70"}`}>
          This studio has been verified by the Beeps team.
        </p>
      </div>
    );
  }

  if (currentStatus === "PENDING" || success) {
    return (
      <div className={`p-4 rounded-xl border ${
        isDark ? "bg-yellow-500/5 border-yellow-500/20" : "bg-yellow-50 border-yellow-200"
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <StudioVerificationBadge status="PENDING" showLabel />
        </div>
        <p className={`text-xs mt-2 ${isDark ? "text-yellow-500/70" : "text-yellow-600/70"}`}>
          Your verification request for &quot;{studioName}&quot; is under review. We&apos;ll notify you once it&apos;s processed.
        </p>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl border ${
      isDark ? "bg-zinc-950 border-zinc-800" : "bg-white border-gray-200"
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <BadgeCheck size={18} className={isDark ? "text-zinc-400" : "text-gray-600"} />
        <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
          Get Verified
        </span>
      </div>

      <p className={`text-xs mb-4 ${isDark ? "text-zinc-500" : "text-gray-500"}`}>
        Verified studios get a badge on their listing, building trust with artists. Submit documentation to verify your studio.
      </p>

      {currentStatus === "REJECTED" && verificationNotes && (
        <div className={`mb-4 p-3 rounded-lg border ${
          isDark ? "bg-red-500/5 border-red-500/20" : "bg-red-50 border-red-200"
        }`}>
          <div className="flex items-center gap-1.5 mb-1">
            <AlertCircle size={14} className="text-red-500" />
            <span className={`text-xs font-semibold ${isDark ? "text-red-400" : "text-red-600"}`}>
              Previous request was not approved
            </span>
          </div>
          <p className={`text-xs ${isDark ? "text-red-500/70" : "text-red-600/70"}`}>
            {verificationNotes}
          </p>
        </div>
      )}

      {/* Document URLs */}
      <div className="space-y-3 mb-4">
        <label className={`block text-xs font-medium tracking-wider uppercase ${
          isDark ? "text-zinc-400" : "text-gray-600"
        }`}>
          Supporting Documents (URLs)
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDocument())}
            placeholder="https://example.com/business-license.pdf"
            className={`flex-1 px-3 py-2.5 text-xs rounded-lg border transition-all focus:outline-none ${
              isDark
                ? "bg-black border-zinc-800 text-white placeholder-zinc-600 focus:border-white"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900"
            }`}
          />
          <button
            type="button"
            onClick={addDocument}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              isDark
                ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Add
          </button>
        </div>

        {documentUrls.length > 0 && (
          <div className="space-y-1.5">
            {documentUrls.map((url, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border ${
                  isDark
                    ? "bg-black border-zinc-800 text-zinc-400"
                    : "bg-gray-50 border-gray-200 text-gray-600"
                }`}
              >
                <Upload size={12} className="shrink-0" />
                <span className="truncate flex-1">{url}</span>
                <button
                  onClick={() => removeDocument(url)}
                  className="text-red-500 hover:text-red-400 shrink-0"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        <p className={`text-[10px] ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
          Business license, lease agreement, photos of studio, etc.
        </p>
      </div>

      {error && (
        <div className={`mb-3 p-2 rounded-lg text-xs ${
          isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600"
        }`}>
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`w-full py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
          isSubmitting
            ? "opacity-50 cursor-not-allowed"
            : "active:scale-[0.98]"
        } ${
          isDark
            ? "bg-white text-black hover:bg-zinc-100"
            : "bg-black text-white hover:bg-gray-900"
        }`}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <CheckCircle2 size={14} />
            Request Verification
          </>
        )}
      </button>
    </div>
  );
}