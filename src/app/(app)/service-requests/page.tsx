"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetIdentity } from "@refinedev/core";
import {
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Calendar,
  User,
  Check,
  X as XIcon,
  Lock,
  Unlock,
  ShieldCheck,
  TriangleAlert
} from "lucide-react";

interface ServiceRequest {
  id: string;
  projectTitle: string;
  projectDescription: string;
  budget: string | null;
  deadline: string | null;
  status: string;
  paymentStatus: string;
  disputeStatus: string | null;
  producerResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
  client: {
    id: string;
    username: string;
    fullName: string | null;
    avatar: string | null;
    primaryRole: string;
  };
  producer: {
    id: string;
    username: string;
    fullName: string | null;
    avatar: string | null;
    primaryRole: string;
    currency?: string;
  };
}

const formatAmount = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  PENDING:     { color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", label: "Pending" },
  ACCEPTED:    { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Accepted" },
  REJECTED:    { color: "bg-red-500/10 text-red-400 border-red-500/20", label: "Rejected" },
  IN_PROGRESS: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", label: "In Progress" },
  DELIVERED:   { color: "bg-purple-500/10 text-purple-400 border-purple-500/20", label: "Delivered" },
  COMPLETED:   { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Completed" },
  CANCELLED:   { color: "bg-red-500/10 text-red-400 border-red-500/20", label: "Cancelled" },
};

const PAYMENT_CONFIG: Record<string, { color: string; label: string }> = {
  UNPAID:           { color: "bg-[#08080a] text-zinc-400 border-zinc-800", label: "Unpaid" },
  PAYMENT_HELD:     { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "In Escrow" },
  PAYMENT_RELEASED: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Released" },
  REFUNDED:         { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", label: "Refunded" },
};

export default function ServiceRequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: user, isLoading: userLoading } = useGetIdentity<any>();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "completed">("all");
  const [viewMode, setViewMode] = useState<"sent" | "received">("sent");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const highlightId = searchParams.get("highlight");

  // Fetch service requests
  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [viewMode, filter, user]);

  // Auto-scroll to highlighted request
  useEffect(() => {
    if (highlightId && requests.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(`request-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
    }
  }, [highlightId, requests]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append("asProducer", viewMode === "received" ? "true" : "false");
      if (filter !== "all") {
        params.append("status", filter.toUpperCase());
      }

      const response = await fetch(`/api/service-requests?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch requests");
      }

      const data = await response.json();
      setRequests(data.serviceRequests || []);
    } catch (error: any) {
      console.error("Error fetching service requests:", error);
      setError(error.message || "Failed to load service requests");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, status: string, response?: string) => {
    try {
      setUpdatingId(requestId);
      const res = await fetch(`/api/service-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, producerResponse: response }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update request");
      }

      await fetchRequests();
    } catch (error: any) {
      alert(error.message || "Failed to update service request");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to cancel this service request?")) return;

    try {
      setUpdatingId(requestId);
      const res = await fetch(`/api/service-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to cancel request");
      }

      await fetchRequests();
    } catch (error: any) {
      alert(error.message || "Failed to cancel service request");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-black text-zinc-200 selection:bg-white selection:text-black">
      <main className="relative mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        
        {/* Header & Filters Aligned */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <button
              onClick={() => router.back()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 text-zinc-300 shadow-lg transition-colors hover:border-zinc-700 hover:bg-zinc-900 hover:text-white mb-6"
              aria-label="Go back"
            >
              <ArrowLeft size={18} strokeWidth={1.5} />
            </button>

            <h1 className="text-3xl font-light tracking-tight text-white sm:text-4xl mb-2">
              Service Requests
            </h1>
            <p className="text-sm font-light tracking-wide text-zinc-500">
              Manage your incoming and outgoing producer requests.
            </p>
          </div>

          {/* Filters & Toggles Moved to Extreme Right */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* View Mode Toggle */}
            <div className="inline-flex w-full sm:w-auto p-1 rounded-xl border border-zinc-800 bg-zinc-950 shadow-inner">
              <button
                onClick={() => setViewMode("sent")}
                className={`flex-1 sm:flex-none px-5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
                  viewMode === "sent"
                    ? "bg-[#08080a] text-white shadow-sm border border-zinc-700"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                }`}
              >
                Sent
              </button>
              <button
                onClick={() => setViewMode("received")}
                className={`flex-1 sm:flex-none px-5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
                  viewMode === "received"
                    ? "bg-[#08080a] text-white shadow-sm border border-zinc-700"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                }`}
              >
                Received
              </button>
            </div>

            {/* Status Filter */}
            <div className="inline-flex w-full sm:w-auto p-1 rounded-xl border border-zinc-800 bg-zinc-950 shadow-inner overflow-x-auto scrollbar-hide">
              {(["all", "pending", "accepted", "completed"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${
                    filter === status
                      ? "bg-white text-black shadow-sm border border-white"
                      : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm font-light tracking-wide flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-300 mb-1">Error loading service requests</h4>
              <p>{error}</p>
            </div>
            <button
              onClick={() => fetchRequests()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 hover:bg-red-500/30 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Requests List */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          </div>
        ) : requests.length === 0 ? (
          <div className="py-24 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50">
            <Briefcase className="w-12 h-12 text-zinc-700 mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-lg font-light tracking-tight text-white mb-2">
              No service requests found
            </h3>
            <p className="text-sm font-light tracking-wide text-zinc-500">
              {viewMode === "sent"
                ? "You haven't requested any services from producers yet."
                : "You don't have any incoming requests right now."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {requests.map((request) => {
              const isHighlighted = highlightId === request.id;
              const otherUser = viewMode === "sent" ? request.producer : request.client;
              const reqCurrency = request.producer.currency || "USD";
              
              const statusCfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG["PENDING"];
              const paymentCfg = PAYMENT_CONFIG[request.paymentStatus] ?? PAYMENT_CONFIG["UNPAID"];
              const hasOpenDispute = request.disputeStatus === "OPEN" || request.disputeStatus === "UNDER_REVIEW";

              return (
                <div
                  key={request.id}
                  id={`request-${request.id}`}
                  className={`rounded-2xl border bg-zinc-950 p-6 transition-all ${
                    isHighlighted
                      ? "border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                      : "border-zinc-800 hover:border-zinc-700 hover:bg-[#08080a]"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    
                    {/* Left: Core Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3 className="text-xl font-light tracking-tight text-white truncate">
                          {request.projectTitle}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${statusCfg.color}`}>
                            {statusCfg.label}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${paymentCfg.color}`}>
                            {request.paymentStatus === "PAYMENT_HELD" && <Lock size={10} />}
                            {request.paymentStatus === "PAYMENT_RELEASED" && <Unlock size={10} />}
                            {paymentCfg.label}
                          </span>
                          {hasOpenDispute && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-red-400">
                              <TriangleAlert size={10} /> Disputed
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-sm font-light tracking-wide leading-relaxed text-zinc-400 mb-6 line-clamp-2">
                        {request.projectDescription}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-zinc-600" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                              {viewMode === "sent" ? "Producer" : "Client"}
                            </span>
                            <span className="text-xs font-light text-zinc-300">
                              {otherUser.fullName || otherUser.username}
                            </span>
                          </div>
                        </div>

                        {request.budget && (
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-zinc-600" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                                Escrow Budget
                              </span>
                              <span className="text-xs font-light text-zinc-300">
                                {formatAmount(parseFloat(request.budget), reqCurrency)}
                              </span>
                            </div>
                          </div>
                        )}

                        {request.deadline && (
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-zinc-600" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                                Deadline
                              </span>
                              <span className="text-xs font-light text-zinc-300">
                                {formatDate(request.deadline)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end gap-3 shrink-0 pt-2 border-t border-zinc-800 lg:border-none lg:pt-0">
                      
                      {/* Stealth Open Workspace Button */}
                      <button
                        onClick={() => router.push(`/service-requests/${request.id}`)}
                        className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-xs font-medium tracking-wide text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white active:scale-[0.98]"
                      >
                        <Briefcase size={14} /> Open Workspace
                      </button>

                      {/* Quick Actions based on status */}
                      {viewMode === "received" && request.status === "PENDING" && (
                        <div className="flex gap-2 w-full lg:w-auto">
                          <button
                            onClick={() => handleUpdateStatus(request.id, "ACCEPTED")}
                            disabled={updatingId === request.id}
                            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs font-medium tracking-wide text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
                          >
                            {updatingId === request.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            Accept
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(request.id, "REJECTED")}
                            disabled={updatingId === request.id}
                            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-[#08080a] px-4 py-2.5 text-xs font-medium tracking-wide text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white disabled:opacity-50"
                          >
                            <XIcon size={14} /> Decline
                          </button>
                        </div>
                      )}

                      {viewMode === "sent" && request.status === "PENDING" && (
                        <button
                          onClick={() => handleCancelRequest(request.id)}
                          disabled={updatingId === request.id}
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-transparent px-4 py-2.5 text-xs font-medium tracking-wide text-red-400 transition-all hover:bg-red-500/10 disabled:opacity-50"
                        >
                          {updatingId === request.id ? <Loader2 size={14} className="animate-spin" /> : <XIcon size={14} />}
                          Cancel Request
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}