"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/providers/ThemeProvider";
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
  DollarSign,
  User,
  MessageCircle,
  Check,
  X as XIcon,
  Play,
  FileText,
  Shield,
  Lock,
  Unlock,
  PackageCheck,
  TriangleAlert,
  CreditCard,
  Send,
} from "lucide-react";

interface ServiceRequestDetails {
  id: string;
  projectTitle: string;
  projectDescription: string;
  budget: string | null;
  deadline: string | null;
  status: string;
  producerResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Escrow fields
  paymentStatus: string;
  platformFee: string | null;
  deliveredAt: string | null;
  clientConfirmedDelivery: boolean;
  autoReleaseAt: string | null;
  disputeStatus: string | null;
  disputeReason: string | null;
  disputedAt: string | null;
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
  };
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; darkColor: string; label: string }> = {
  PENDING:     { color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", darkColor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", label: "Pending" },
  ACCEPTED:    { color: "bg-green-500/10 text-green-600 border-green-500/20",   darkColor: "bg-green-500/10 text-green-400 border-green-500/20",   label: "Accepted" },
  REJECTED:    { color: "bg-red-500/10 text-red-600 border-red-500/20",         darkColor: "bg-red-500/10 text-red-400 border-red-500/20",         label: "Rejected" },
  IN_PROGRESS: { color: "bg-blue-500/10 text-blue-600 border-blue-500/20",      darkColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",      label: "In Progress" },
  DELIVERED:   { color: "bg-purple-500/10 text-purple-600 border-purple-500/20",darkColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",label: "Delivered" },
  COMPLETED:   { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", darkColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Completed" },
  CANCELLED:   { color: "bg-red-500/10 text-red-600 border-red-500/20",         darkColor: "bg-red-500/10 text-red-400 border-red-500/20",         label: "Cancelled" },
};

const PAYMENT_CONFIG: Record<string, { color: string; darkColor: string; label: string }> = {
  UNPAID:           { color: "bg-gray-100 text-gray-600 border-gray-200",             darkColor: "bg-zinc-800 text-zinc-400 border-zinc-700",           label: "Unpaid" },
  PAYMENT_HELD:     { color: "bg-orange-500/10 text-orange-600 border-orange-500/20", darkColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",label: "In Escrow" },
  PAYMENT_RELEASED: { color: "bg-green-500/10 text-green-600 border-green-500/20",    darkColor: "bg-green-500/10 text-green-400 border-green-500/20",   label: "Released" },
  REFUNDED:         { color: "bg-blue-500/10 text-blue-600 border-blue-500/20",       darkColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",      label: "Refunded" },
};

// ─── Escrow Timeline ──────────────────────────────────────────────────────────

function EscrowTimeline({ request, isDark }: { request: ServiceRequestDetails; isDark: boolean }) {
  const steps = [
    { key: "sent",     label: "Request Sent",        done: true },
    { key: "accepted", label: "Producer Accepted",   done: ["ACCEPTED","IN_PROGRESS","DELIVERED","COMPLETED"].includes(request.status) },
    { key: "paid",     label: "Payment in Escrow",   done: request.paymentStatus === "PAYMENT_HELD" || request.paymentStatus === "PAYMENT_RELEASED" },
    { key: "work",     label: "Work In Progress",    done: ["IN_PROGRESS","DELIVERED","COMPLETED"].includes(request.status) },
    { key: "delivered",label: "Work Delivered",      done: ["DELIVERED","COMPLETED"].includes(request.status) },
    { key: "released", label: "Payment Released",    done: request.paymentStatus === "PAYMENT_RELEASED" },
  ];

  return (
    <div className={`p-5 rounded-xl border ${isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-gray-200"}`}>
      <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? "text-zinc-500" : "text-gray-500"}`}>Progress</h3>
      <div className="flex items-center gap-0">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                step.done
                  ? "bg-green-500 border-green-500"
                  : isDark ? "bg-zinc-800 border-zinc-600" : "bg-gray-100 border-gray-300"
              }`}>
                {step.done
                  ? <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  : <span className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-zinc-600" : "bg-gray-300"}`} />
                }
              </div>
              <span className={`text-[9px] font-medium text-center leading-tight w-14 ${
                step.done ? (isDark ? "text-white" : "text-gray-900") : (isDark ? "text-zinc-600" : "text-gray-400")
              }`}>{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-full mb-4 transition-all ${
                step.done && steps[i + 1].done ? "bg-green-500" : isDark ? "bg-zinc-700" : "bg-gray-200"
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ServiceRequestDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { data: user, isLoading: userLoading } = useGetIdentity<any>();

  const [request, setRequest] = useState<ServiceRequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  // Form states
  const [responseText, setResponseText] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [deliveryCodeInput, setDeliveryCodeInput] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  const bg = isDark ? "bg-black" : "bg-gray-50";
  const card = isDark ? "bg-zinc-900/40" : "bg-white";
  const border = isDark ? "border-zinc-800" : "border-gray-200";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textMuted = isDark ? "text-zinc-400" : "text-gray-600";
  const textFaint = isDark ? "text-zinc-500" : "text-gray-400";
  const btnPrimary = isDark
    ? "bg-white text-black hover:bg-zinc-100 border-white"
    : "bg-black text-white hover:bg-gray-800 border-black";
  const btnSecondary = isDark
    ? "bg-transparent text-zinc-400 hover:text-white border-zinc-700 hover:border-zinc-500"
    : "bg-transparent text-gray-600 hover:text-black border-gray-300 hover:border-gray-400";

  useEffect(() => { if (user) fetchRequest(); }, [user, params.id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/service-requests/${params.id}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed to fetch");
      setRequest((await res.json()).serviceRequest);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const callAction = async (url: string, body: object, successMsg?: string) => {
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      await fetchRequest();
      return true;
    } catch (e: any) {
      setActionError(e.message || "Something went wrong");
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const patchStatus = async (status: string, extra: object = {}) => {
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(`/api/service-requests/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      await fetchRequest();
    } catch (e: any) {
      setActionError(e.message || "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const fmtShort = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (userLoading || loading) return (
    <div className={`min-h-screen flex items-center justify-center ${bg}`}>
      <Loader2 className={`w-8 h-8 animate-spin ${isDark ? "text-white" : "text-black"}`} />
    </div>
  );

  if (error || !request) return (
    <div className={`min-h-screen flex items-center justify-center ${bg}`}>
      <div className="text-center">
        <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className={`mb-4 ${textMuted}`}>{error || "Request not found"}</p>
        <button onClick={() => router.push("/service-requests")} className={`px-5 py-2.5 rounded-lg text-sm font-medium border transition-all ${btnPrimary}`}>
          Back to Requests
        </button>
      </div>
    </div>
  );

  const isProducer = user?.id === request.producer.id;
  const isClient   = user?.id === request.client.id;
  const other = isProducer ? request.client : request.producer;
  const budget = request.budget ? parseFloat(request.budget) : null;
  const platformFee = request.platformFee ? parseFloat(request.platformFee) : null;
  const producerPayout = budget && platformFee ? budget - platformFee : budget;
  const statusCfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG["PENDING"];
  const paymentCfg = PAYMENT_CONFIG[request.paymentStatus] ?? PAYMENT_CONFIG["UNPAID"];

  const hasOpenDispute = request.disputeStatus === "OPEN" || request.disputeStatus === "UNDER_REVIEW";

  return (
    <div className={`min-h-screen ${bg} ${textPrimary}`}>
      <div className="max-w-3xl mx-auto p-6">

        {/* Back */}
        <button
          onClick={() => router.push("/service-requests")}
          className={`inline-flex items-center gap-2 text-sm font-medium mb-6 transition-colors ${textFaint} hover:${textPrimary}`}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Service Requests
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <h1 className="text-2xl font-light tracking-tight">{request.projectTitle}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${isDark ? statusCfg.darkColor : statusCfg.color}`}>
                {statusCfg.label}
              </span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border flex items-center gap-1.5 ${isDark ? paymentCfg.darkColor : paymentCfg.color}`}>
                {request.paymentStatus === "PAYMENT_HELD" && <Lock className="w-3 h-3" />}
                {request.paymentStatus === "PAYMENT_RELEASED" && <Unlock className="w-3 h-3" />}
                {paymentCfg.label}
              </span>
              {hasOpenDispute && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-red-500/10 text-red-400 border-red-500/20 flex items-center gap-1.5">
                  <TriangleAlert className="w-3 h-3" /> Disputed
                </span>
              )}
            </div>
          </div>

          {/* Progress timeline */}
          <EscrowTimeline request={request} isDark={isDark} />
        </div>

        {/* Action error */}
        {actionError && (
          <div className={`mb-4 p-3 rounded-lg flex gap-2 items-start text-sm border ${
            isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-700"
          }`}>
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {actionError}
          </div>
        )}

        <div className="space-y-4">

          {/* ── Escrow / Payment Panel ─────────────────────────────────── */}
          {budget && (
            <div className={`p-5 rounded-xl border ${card} ${border}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${textFaint}`}>Escrow</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${textFaint}`}>Total</p>
                  <p className="text-lg font-semibold">${budget.toFixed(2)}</p>
                </div>
                <div>
                  <p className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${textFaint}`}>Platform (10%)</p>
                  <p className={`text-lg font-semibold ${textMuted}`}>${(platformFee ?? budget * 0.1).toFixed(2)}</p>
                </div>
                <div>
                  <p className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${textFaint}`}>Producer Gets</p>
                  <p className="text-lg font-semibold text-green-500">${(producerPayout ?? budget * 0.9).toFixed(2)}</p>
                </div>
              </div>

              {/* ── CLIENT: Pay Now ── */}
              {isClient && request.status === "ACCEPTED" && request.paymentStatus === "UNPAID" && (
                <div className={`p-4 rounded-lg border mb-0 ${isDark ? "bg-orange-500/10 border-orange-500/20" : "bg-orange-50 border-orange-200"}`}>
                  <p className={`text-sm font-medium mb-3 ${isDark ? "text-orange-300" : "text-orange-700"}`}>
                    The producer accepted your request. Pay now to lock in your slot and get work started.
                  </p>
                  <button
                    onClick={() => callAction(`/api/service-requests/${request.id}/pay`, {})}
                    disabled={actionLoading}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border transition-all disabled:opacity-50 ${btnPrimary}`}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    Pay ${budget.toFixed(2)} — Secure in Escrow
                  </button>
                </div>
              )}

              {/* Escrow locked info */}
              {request.paymentStatus === "PAYMENT_HELD" && !request.clientConfirmedDelivery && !hasOpenDispute && (
                <div className={`flex items-start gap-2.5 text-sm ${isDark ? "text-orange-300" : "text-orange-700"}`}>
                  <Lock className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>Funds locked in escrow. Released only when the client confirms the delivery code.</p>
                </div>
              )}
            </div>
          )}

          {/* ── PRODUCER: Mark as Delivered ───────────────────────────── */}
          {isProducer && request.status === "IN_PROGRESS" && request.paymentStatus === "PAYMENT_HELD" && (
            <div className={`p-5 rounded-xl border ${card} ${border}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${textFaint}`}>Deliver Work</h3>
              <p className={`text-sm mb-4 ${textMuted}`}>
                Once you mark as delivered, the client receives your unique delivery code. They enter it to confirm receipt and release your payment.
              </p>
              <div className="mb-3">
                <label className={`text-xs font-semibold block mb-1.5 ${textFaint}`}>Delivery Notes (optional)</label>
                <textarea
                  rows={3}
                  placeholder="Add notes about your delivery, file links, etc..."
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm resize-none focus:outline-none transition-all ${
                    isDark ? "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-zinc-500" : "bg-gray-50 border-gray-200 focus:border-gray-400"
                  }`}
                />
              </div>
              <button
                onClick={() => callAction(`/api/service-requests/${request.id}/deliver`, { deliveryNotes })}
                disabled={actionLoading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border transition-all disabled:opacity-50 ${btnPrimary}`}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
                Mark as Delivered
              </button>
            </div>
          )}

          {/* ── CLIENT: Confirm Delivery (enter code) ─────────────────── */}
          {isClient && request.status === "DELIVERED" && request.paymentStatus === "PAYMENT_HELD" && !hasOpenDispute && (
            <div className={`p-5 rounded-xl border ${isDark ? "bg-purple-500/10 border-purple-500/20" : "bg-purple-50 border-purple-200"}`}>
              <div className="flex items-start gap-3 mb-4">
                <PackageCheck className={`w-5 h-5 mt-0.5 shrink-0 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
                <div>
                  <p className={`text-sm font-semibold mb-1 ${isDark ? "text-purple-300" : "text-purple-800"}`}>
                    The producer has delivered your work!
                  </p>
                  <p className={`text-xs ${isDark ? "text-purple-400" : "text-purple-700"}`}>
                    Check your notifications for the delivery code. Enter it below to confirm receipt and release payment.
                    {request.autoReleaseAt && (
                      <span className="block mt-1 font-medium">
                        Auto-releases: {fmtShort(request.autoReleaseAt)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="BEEPS-DEL-XXXXXXXX-XXXXXXXX"
                  value={deliveryCodeInput}
                  onChange={(e) => setDeliveryCodeInput(e.target.value)}
                  className={`flex-1 px-3 py-2.5 rounded-lg border text-sm font-mono focus:outline-none transition-all ${
                    isDark ? "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-600 focus:border-purple-500" : "bg-white border-purple-200 focus:border-purple-400"
                  }`}
                />
                <button
                  onClick={() => callAction(`/api/service-requests/${request.id}/confirm-delivery`, { deliveryCode: deliveryCodeInput })}
                  disabled={actionLoading || !deliveryCodeInput.trim()}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border transition-all disabled:opacity-50 ${
                    isDark ? "bg-purple-600 border-purple-600 text-white hover:bg-purple-700" : "bg-purple-600 border-purple-600 text-white hover:bg-purple-700"
                  }`}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                  Confirm & Release
                </button>
              </div>
            </div>
          )}

          {/* ── Completed ─────────────────────────────────────────────── */}
          {request.status === "COMPLETED" && (
            <div className={`p-5 rounded-xl border flex items-start gap-3 ${isDark ? "bg-green-500/10 border-green-500/20" : "bg-green-50 border-green-200"}`}>
              <CheckCircle2 className={`w-5 h-5 mt-0.5 shrink-0 ${isDark ? "text-green-400" : "text-green-600"}`} />
              <div>
                <p className={`text-sm font-semibold ${isDark ? "text-green-300" : "text-green-800"}`}>Project Completed</p>
                <p className={`text-xs mt-0.5 ${isDark ? "text-green-400" : "text-green-700"}`}>
                  Client confirmed delivery. Payment of ${producerPayout?.toFixed(2)} released to producer.
                </p>
              </div>
            </div>
          )}

          {/* ── Dispute Panel ─────────────────────────────────────────── */}
          {hasOpenDispute && (
            <div className={`p-5 rounded-xl border ${isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-start gap-3">
                <TriangleAlert className={`w-5 h-5 mt-0.5 shrink-0 ${isDark ? "text-red-400" : "text-red-600"}`} />
                <div>
                  <p className={`text-sm font-semibold mb-1 ${isDark ? "text-red-300" : "text-red-700"}`}>
                    Dispute Open — Payment Frozen
                  </p>
                  <p className={`text-xs mb-2 ${isDark ? "text-red-400" : "text-red-600"}`}>
                    Reason: {request.disputeReason}
                  </p>
                  <p className={`text-xs ${isDark ? "text-red-500" : "text-red-500"}`}>
                    Our team is reviewing this dispute. Both parties will be notified of the resolution.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Raise dispute button (client, after delivery, within 48h, no existing dispute) */}
          {isClient && request.status === "DELIVERED" && request.paymentStatus === "PAYMENT_HELD" && !hasOpenDispute && (
            <div>
              {!showDisputeForm ? (
                <button
                  onClick={() => setShowDisputeForm(true)}
                  className={`text-xs font-medium flex items-center gap-1.5 transition-colors ${isDark ? "text-red-400 hover:text-red-300" : "text-red-500 hover:text-red-600"}`}
                >
                  <TriangleAlert className="w-3.5 h-3.5" /> Work not satisfactory? Raise a dispute
                </button>
              ) : (
                <div className={`p-5 rounded-xl border ${card} ${border}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${textFaint}`}>Raise Dispute</h4>
                  <textarea
                    rows={3}
                    placeholder="Describe the issue in detail (min 10 characters)..."
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm resize-none focus:outline-none mb-3 transition-all ${
                      isDark ? "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-red-500" : "bg-gray-50 border-gray-200 focus:border-red-400"
                    }`}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => callAction(`/api/service-requests/${request.id}/dispute`, { reason: disputeReason })}
                      disabled={actionLoading || disputeReason.trim().length < 10}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 border border-red-600 disabled:opacity-50 transition-all"
                    >
                      {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TriangleAlert className="w-3.5 h-3.5" />}
                      Submit Dispute
                    </button>
                    <button onClick={() => setShowDisputeForm(false)} className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${btnSecondary}`}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Project Info ──────────────────────────────────────────── */}
          <div className={`p-5 rounded-xl border ${card} ${border}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${textFaint}`}>Project Details</h3>
            <p className={`text-sm leading-relaxed ${textMuted}`}>{request.projectDescription}</p>
          </div>

          {/* ── Meta ──────────────────────────────────────────────────── */}
          <div className={`p-5 rounded-xl border ${card} ${border}`}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {request.budget && (
                <div>
                  <p className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${textFaint}`}>Budget</p>
                  <p className="text-sm font-medium">${parseFloat(request.budget).toFixed(2)}</p>
                </div>
              )}
              {request.deadline && (
                <div>
                  <p className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${textFaint}`}>Deadline</p>
                  <p className="text-sm font-medium">{fmt(request.deadline)}</p>
                </div>
              )}
              <div>
                <p className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${textFaint}`}>Created</p>
                <p className="text-sm font-medium">{fmtShort(request.createdAt)}</p>
              </div>
              {request.deliveredAt && (
                <div>
                  <p className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${textFaint}`}>Delivered</p>
                  <p className="text-sm font-medium">{fmtShort(request.deliveredAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Parties ───────────────────────────────────────────────── */}
          <div className={`p-5 rounded-xl border ${card} ${border}`}>
            <p className={`text-[10px] uppercase font-bold tracking-wider mb-3 ${textFaint}`}>{isProducer ? "Client" : "Producer"}</p>
            <div className="flex items-center gap-3">
              <img
                src={other.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${other.id}`}
                alt={other.fullName || other.username}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-sm">{other.fullName || other.username}</p>
                <p className={`text-xs ${textFaint}`}>@{other.username}</p>
              </div>
            </div>
          </div>

          {/* ── Producer response / notes ─────────────────────────────── */}
          {request.producerResponse && (
            <div className={`p-5 rounded-xl border ${card} ${border}`}>
              <p className={`text-[10px] uppercase font-bold tracking-wider mb-3 ${textFaint}`}>
                {["DELIVERED","COMPLETED"].includes(request.status) ? "Delivery Notes" : "Producer Response"}
              </p>
              <p className={`text-sm leading-relaxed ${textMuted}`}>{request.producerResponse}</p>
            </div>
          )}

          {/* ── Producer: Accept / Reject (PENDING) ───────────────────── */}
          {isProducer && request.status === "PENDING" && (
            <div className={`p-5 rounded-xl border ${card} ${border}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${textFaint}`}>Respond to Request</h3>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Add a message to the client (optional)..."
                rows={3}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm resize-none focus:outline-none mb-3 transition-all ${
                  isDark ? "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-white" : "bg-gray-50 border-gray-200 focus:border-gray-400"
                }`}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => patchStatus("ACCEPTED", { producerResponse: responseText || undefined })}
                  disabled={actionLoading}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border transition-all disabled:opacity-50 ${
                    isDark ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20" : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  }`}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Accept
                </button>
                <button
                  onClick={() => patchStatus("REJECTED", { producerResponse: responseText || undefined })}
                  disabled={actionLoading}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border transition-all disabled:opacity-50 ${
                    isDark ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20" : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                  }`}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XIcon className="w-4 h-4" />}
                  Decline
                </button>
              </div>
            </div>
          )}

          {/* ── Client: Cancel (PENDING only) ─────────────────────────── */}
          {isClient && request.status === "PENDING" && (
            <div className="flex justify-end">
              <button
                onClick={() => { if (confirm("Cancel this request?")) patchStatus("CANCELLED"); }}
                disabled={actionLoading}
                className={`text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 ${isDark ? "text-red-400 hover:text-red-300" : "text-red-500 hover:text-red-600"}`}
              >
                <XIcon className="w-3.5 h-3.5" /> Cancel Request
              </button>
            </div>
          )}

          {/* ── Message / View Profile ─────────────────────────────────── */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => router.push(`/messages/${other.id}`)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${btnSecondary}`}
            >
              <MessageCircle className="w-4 h-4" />
              Message {isProducer ? "Client" : "Producer"}
            </button>
            {!isProducer && (
              <button
                onClick={() => router.push(`/producers/${other.id}`)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${btnSecondary}`}
              >
                <User className="w-4 h-4" />
                View Profile
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
