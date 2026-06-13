"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useUserBySupabaseId } from "@/hooks/api/useUserData";
import { generateLicenseCertificate } from "@/lib/generateCertificate";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  Lock,
  MessageCircle,
  PackageCheck,
  Shield,
  TriangleAlert,
  Unlock,
  User,
  XCircle,
  AlertCircle,
  DownloadCloud,
  UploadCloud,
  ShieldCheck,
  Paperclip,
  Send,
  Volume2,
  X
} from "lucide-react";

interface ServiceRequestDetails {
  id: string;
  projectTitle: string;
  projectDescription: string;
  budget: string | null;
  deadline: string | null;
  status: string;
  producerResponse: string | null;
  deliveryUrl: string | null;
  deliveryNotes: string | null;
  deliveryCode: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
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
    email?: string;
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

function EscrowTimeline({ request }: { request: ServiceRequestDetails }) {
  const steps = [
    { key: "sent",     label: "Request Sent",        done: true },
    { key: "accepted", label: "Producer Accepted",   done: ["ACCEPTED","IN_PROGRESS","DELIVERED","COMPLETED"].includes(request.status) },
    { key: "paid",     label: "Payment in Escrow",   done: request.paymentStatus === "PAYMENT_HELD" || request.paymentStatus === "PAYMENT_RELEASED" },
    { key: "work",     label: "Work In Progress",    done: ["IN_PROGRESS","DELIVERED","COMPLETED"].includes(request.status) },
    { key: "delivered",label: "Work Delivered",      done: ["DELIVERED","COMPLETED"].includes(request.status) },
    { key: "released", label: "Payment Released",    done: request.paymentStatus === "PAYMENT_RELEASED" },
  ];

  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-[#08080a]">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-6">Escrow Progress</h3>
      <div className="flex items-center gap-0">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                step.done
                  ? "bg-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  : "bg-zinc-900 border-zinc-800"
              }`}>
                {step.done
                  ? <Check className="w-4 h-4 text-black" strokeWidth={3} />
                  : <span className="w-2 h-2 rounded-full bg-zinc-700" />
                }
              </div>
              <span className={`text-[9px] font-medium text-center uppercase tracking-wide leading-tight w-16 ${
                step.done ? "text-emerald-400" : "text-zinc-600"
              }`}>{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-[2px] w-full mb-6 transition-all ${
                step.done && steps[i + 1].done ? "bg-emerald-500" : "bg-zinc-800"
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ServiceRequestDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const { data: currentUser, isLoading: userLoading } = useUserBySupabaseId(supabaseUser?.id, {
    enabled: !!supabaseUser?.id,
  });

  const [request, setRequest] = useState<ServiceRequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [statusText, setStatusText] = useState("");

  const [responseText, setResponseText] = useState("");
  const [deliveryFile, setDeliveryFile] = useState<File | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [deliveryCode, setDeliveryCode] = useState("");
  const [agreementData, setAgreementData] = useState<any>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser();
      setSupabaseUser(user);
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (params.id) {
      fetchRequest().then(() => fetchMessages());
    }
  }, [params.id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/service-requests/${params.id}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed to fetch");
      const data = await res.json();
      setRequest(data.serviceRequest);
      
      if (data.serviceRequest.status === "COMPLETED") {
        fetch(`/api/users/me/licenses`)
          .then(r => r.json())
          .then(d => {
            const match = d.licenses?.find((l: any) => l.beatId === "custom" && l.amountPaid == data.serviceRequest.budget);
            if (match) setAgreementData(match);
          }).catch(e => console.error("Could not fetch agreement details"));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/service-requests/${params.id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (e) { console.error(e); }
  };

  const callAction = async (url: string, body: object = {}) => {
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
      
      if (data.url) {
        window.location.href = data.url;
        return true;
      }

      await fetchRequest();
      setShowRevisionForm(false);
      setRevisionNotes("");
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

  const computeFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleDeliverWork = async () => {
    if (!deliveryFile) return setActionError("Please select a file to deliver.");
    setActionLoading(true);
    setActionError("");

    try {
      setStatusText("Computing cryptographic hash...");
      const fileHash = await computeFileHash(deliveryFile);

      setStatusText("Connecting to Beeps Vault...");
      const presignRes = await fetch("/api/upload/presigned", {
        method: "POST",
        body: JSON.stringify({ fileName: deliveryFile.name, fileType: deliveryFile.type, fileCategory: "delivery" })
      });
      if (!presignRes.ok) throw new Error("Failed to secure upload link.");
      const { uploadUrl, fileKey } = await presignRes.json();

      setStatusText("Uploading High-Quality Files...");
      const uploadRes = await fetch(uploadUrl, { method: "PUT", body: deliveryFile, headers: { "Content-Type": deliveryFile.type } });
      if (!uploadRes.ok) throw new Error("File upload failed.");

      setStatusText("Running Beeps Shield Scans...");
      const submitRes = await fetch(`/api/service-requests/${request!.id}/deliver`, {
        method: "POST",
        body: JSON.stringify({ deliveryFileKey: fileKey, fileHash, deliveryNotes })
      });
      const submitData = await submitRes.json();

      if (!submitRes.ok) throw new Error(submitData.error || "Delivery blocked.");

      setStatusText("Delivery Successful!");
      await fetchRequest();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
      setStatusText("");
    }
  };

  const handleConfirmDelivery = async () => {
    if (!deliveryCode) return setActionError("Please enter your delivery code.");
    setActionLoading(true);
    setActionError("");
    setStatusText("Securing License & Releasing Funds...");

    try {
      const res = await callAction(`/api/service-requests/${request!.id}/confirm-delivery`, { 
        deliveryCode 
      });
      if (res) {
        await fetchRequest();
      }
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
      setStatusText("");
    }
  };

  const handleDownloadCertificate = () => {
    if (!agreementData || !request) return;
    
    const mockBeat = { title: request.projectTitle };
    generateLicenseCertificate(agreementData, mockBeat, request.client.fullName, request.producer.fullName);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !previewFile) return;
    setIsSendingMsg(true);

    try {
      let fileKey = null;
      if (previewFile) {
        setStatusText("Uploading Preview Audio...");
        const presignRes = await fetch("/api/upload/presigned", {
          method: "POST",
          body: JSON.stringify({ fileName: previewFile.name, fileType: previewFile.type, fileCategory: "preview" })
        });
        const { uploadUrl, fileKey: key } = await presignRes.json();
        await fetch(uploadUrl, { method: "PUT", body: previewFile, headers: { "Content-Type": previewFile.type } });
        fileKey = key;
      }

      const res = await fetch(`/api/service-requests/${params.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage,
          fileKey,
          fileName: previewFile?.name,
          fileType: previewFile?.type
        })
      });
      
      if (res.ok) {
        const { message } = await res.json();
        setMessages(prev => [...prev, message]);
        setNewMessage("");
        setPreviewFile(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSendingMsg(false);
      setStatusText("");
    }
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const fmtShort = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const isPageLoading = loading || (supabaseUser && userLoading) || (!currentUser && !error && !request);

  if (isPageLoading) return (
    <div className="h-full overflow-y-auto bg-black text-white">
      <main className="mx-auto flex min-h-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_370px]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-2xl">
            <div className="h-10 w-2/3 bg-zinc-800 animate-pulse rounded-lg mb-6" />
            <div className="h-32 bg-zinc-900 rounded-xl animate-pulse" />
          </div>
          <aside className="hidden space-y-6 lg:block">
            <div className="h-64 rounded-2xl border border-zinc-800 bg-zinc-950 animate-pulse" />
          </aside>
        </div>
      </main>
    </div>
  );

  if (error || !request) return (
    <div className="flex h-full overflow-y-auto items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center shadow-2xl">
        <XCircle className="mx-auto mb-4 h-10 w-10 text-red-500" />
        <h1 className="text-2xl font-light tracking-tight">Request Not Found</h1>
        <p className="mt-2 text-sm font-light tracking-wide text-zinc-500">{error || "This service request could not be loaded."}</p>
        <button
          onClick={() => router.push("/bookings")}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium tracking-wide text-black transition-colors hover:bg-zinc-200"
        >
          <ArrowLeft size={16} /> Back to Bookings
        </button>
      </div>
    </div>
  );

  const isProducer = currentUser?.id === request.producer.id;
  const isClient   = currentUser?.id === request.client.id;
  const other = isProducer ? request.client : request.producer;
  
  const reqCurrency = request.producer.currency || "USD";

  const budgetNum = request.budget ? parseFloat(request.budget) : 0;
  const platformFeeNum = request.platformFee ? parseFloat(request.platformFee) : budgetNum * 0.1;
  const producerPayoutNum = budgetNum - platformFeeNum;

  const statusCfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG["PENDING"];
  const paymentCfg = PAYMENT_CONFIG[request.paymentStatus] ?? PAYMENT_CONFIG["UNPAID"];
  const hasOpenDispute = request.disputeStatus === "OPEN" || request.disputeStatus === "UNDER_REVIEW";

  return (
    <div className="h-full overflow-y-auto bg-black text-zinc-200 selection:bg-white selection:text-black">
      <main className="relative mx-auto max-w-7xl px-4 pb-24 pt-5 sm:px-6 lg:px-8">
        
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push("/bookings")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 text-zinc-300 shadow-lg transition-colors hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium tracking-wide ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium tracking-wide ${paymentCfg.color}`}>
              {request.paymentStatus === "PAYMENT_HELD" && <Lock size={14} />}
              {request.paymentStatus === "PAYMENT_RELEASED" && <Unlock size={14} />}
              {paymentCfg.label}
            </span>
          </div>
        </div>

        {actionError && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm font-light tracking-wide flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            {actionError}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_370px]">
          
          <div className="min-w-0 space-y-6">
            
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl p-6 sm:p-8">
              <h1 className="text-3xl font-light tracking-tight text-white sm:text-4xl mb-6">
                {request.projectTitle}
              </h1>
              
              <div className="rounded-xl border border-zinc-800/60 bg-[#08080a] p-5 mb-8">
                <h2 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                  <FileText size={14} className="text-zinc-400" /> Project Description
                </h2>
                <p className="text-sm font-light tracking-wide leading-relaxed text-zinc-300 whitespace-pre-wrap">
                  {request.projectDescription}
                </p>
              </div>

              <EscrowTimeline request={request} />
            </div>

            {/* ============================================================== */}
            {/* EMBEDDED WORKSPACE CHAT & PREVIEW ROOM */}
            {/* ============================================================== */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 flex flex-col shadow-xl overflow-hidden">
              <div className="bg-[#08080a] border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-zinc-400">
                  <MessageCircle size={16} className="text-purple-500" /> Project Workspace
                </h2>
                <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-1 rounded">WIP Previews</span>
              </div>

              <div className="p-6 h-[400px] overflow-y-auto flex flex-col gap-6 bg-[url('/noise.png')] bg-repeat opacity-95">
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                    <Volume2 size={32} className="mb-2 opacity-50" />
                    <p className="text-sm">No messages yet. Drop a rough draft MP3 here to get feedback.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === currentUser?.id;
                    return (
                      <div key={msg.id} className={`flex gap-3 max-w-[80%] ${isMe ? "self-end flex-row-reverse" : "self-start"}`}>
                        <img src={msg.sender.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender.id}`} className="w-8 h-8 rounded-full bg-zinc-800" />
                        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                          <span className="text-[10px] text-zinc-500 mb-1">{msg.sender.fullName || msg.sender.username}</span>
                          
                          <div className={`p-4 rounded-2xl ${isMe ? "bg-purple-600 text-white rounded-tr-sm" : "bg-zinc-800 text-zinc-200 rounded-tl-sm"}`}>
                            {msg.content && <p className="text-sm font-light leading-relaxed">{msg.content}</p>}
                            
                            {msg.fileUrl && msg.fileType?.includes('audio') && (
                              <div className={`mt-3 p-3 rounded-xl flex flex-col gap-2 ${isMe ? 'bg-purple-700/50' : 'bg-zinc-900/50'}`}>
                                <span className="text-xs font-semibold flex items-center gap-1.5 opacity-90"><Volume2 size={14} /> {msg.fileName}</span>
                                <audio controls src={msg.fileUrl} className="h-8 w-full max-w-[250px]" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="bg-[#08080a] border-t border-zinc-800 p-4">
                {previewFile && (
                  <div className="mb-3 px-3 py-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg text-xs flex justify-between items-center">
                    <span className="truncate">{previewFile.name}</span>
                    <button onClick={() => setPreviewFile(null)}><X size={14} /></button>
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <label className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-400 cursor-pointer transition-colors">
                    <Paperclip size={18} />
                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => setPreviewFile(e.target.files?.[0] || null)} />
                  </label>
                  
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message or attach a preview..."
                    rows={1}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-500 resize-none"
                  />
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={isSendingMsg || (!newMessage.trim() && !previewFile)}
                    className="p-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white transition-colors disabled:opacity-50"
                  >
                    {isSendingMsg ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Producer Delivery with R2 Upload */}
            {isProducer && request.status === "IN_PROGRESS" && request.paymentStatus === "PAYMENT_HELD" && (
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 shadow-xl">
                <h2 className="text-lg font-light tracking-tight text-white mb-2">Deliver Final Work</h2>
                <p className="text-sm font-light tracking-wide text-zinc-400 mb-4">
                  Upload your final WAV or ZIP file directly to the secure Beeps Vault. 
                </p>
                
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-200/80 p-3 rounded-xl text-xs flex items-center gap-2 mb-6">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span>Files are scanned by Beeps Shield for exclusivity and copyrighted materials upon upload.</span>
                </div>

                {request.client?.email && (
                  <div className="bg-blue-500/10 border border-blue-500/20 text-blue-200/80 p-3 rounded-xl text-xs font-light tracking-wide flex items-start gap-2 mb-6">
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-blue-400" />
                    <span>If using a private Google Drive link, ensure you grant access to the client's email: <strong className="text-white select-all">{request.client.email}</strong></span>
                  </div>
                )}

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 block mb-2">Final Deliverable (WAV / ZIP)</label>
                    <input
                      type="file"
                      accept=".wav,.zip"
                      onChange={(e) => setDeliveryFile(e.target.files?.[0] || null)}
                      className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-zinc-400 file:bg-white file:text-black file:border-0 file:px-4 file:py-2 file:rounded-full file:font-bold file:mr-4 file:cursor-pointer hover:border-zinc-700 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 block mb-2">Delivery Notes (BPM, Key, etc.)</label>
                    <textarea
                      rows={3}
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="e.g. Here are the stems. The BPM is 140 and the Key is C Minor..."
                      className="w-full px-4 py-3.5 rounded-xl border border-zinc-800 bg-[#08080a] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors font-light tracking-wide resize-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleDeliverWork}
                  disabled={actionLoading || !deliveryFile}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold tracking-wide text-white transition-all hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  {actionLoading ? statusText : "Upload to Beeps Vault & Deliver"}
                </button>
              </div>
            )}

            {/* Client Review with Download and Code Entry */}
            {isClient && request.status === "DELIVERED" && request.paymentStatus === "PAYMENT_HELD" && !hasOpenDispute && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 shadow-xl">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <PackageCheck size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-light tracking-tight text-white mb-1">Work Delivered!</h2>
                    <p className="text-sm font-light tracking-wide text-zinc-400 mb-2">
                      Review your files. If approved, enter your confirmation code to legally execute the agreement and release funds.
                    </p>
                    {request.autoReleaseAt && (
                      <p className="text-xs text-emerald-400/80 bg-emerald-500/10 px-3 py-1.5 rounded-lg inline-block font-medium">
                        Auto-approves on {new Date(request.autoReleaseAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {request.deliveryUrl && (
                  <div className="mb-6 p-5 rounded-xl border border-emerald-500/20 bg-[#08080a]">
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-500 mb-3">Beeps Vault - Protected Files</h3>
                    <a
                      href={`/api/service-requests/${request.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-3.5 text-sm font-medium text-emerald-400 transition-all border border-emerald-500/20"
                    >
                      <DownloadCloud size={18} />
                      Download Files for Review
                    </a>
                  </div>
                )}
                
                {!showRevisionForm ? (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Enter Code (e.g., 123456)"
                        value={deliveryCode}
                        onChange={(e) => setDeliveryCode(e.target.value)}
                        className="flex-1 px-4 py-3.5 rounded-xl border border-zinc-800 bg-black font-mono uppercase tracking-widest text-center text-white outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={handleConfirmDelivery}
                        disabled={actionLoading || !deliveryCode}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold tracking-wide text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        {actionLoading ? statusText : "Approve & Certify"}
                      </button>
                    </div>

                    <button
                      onClick={() => setShowRevisionForm(true)}
                      disabled={actionLoading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-[#08080a] px-6 py-3.5 text-sm font-medium tracking-wide text-zinc-300 transition-all hover:bg-zinc-900 hover:text-white disabled:opacity-50"
                    >
                      Request Revision
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-zinc-800 bg-[#08080a] p-4 mt-4">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400 mb-3">Request Revisions</h4>
                    <textarea
                      rows={3}
                      placeholder="Describe what needs to be changed (e.g., 'Make the bass louder, fix the vocal timing at 1:12')..."
                      value={revisionNotes}
                      onChange={(e) => setRevisionNotes(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-sm font-light text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors mb-3 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => callAction(`/api/service-requests/${request.id}/request-revision`, { notes: revisionNotes })}
                        disabled={actionLoading || revisionNotes.trim().length < 5}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-zinc-200 transition-all disabled:opacity-50"
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Revision Request"}
                      </button>
                      <button 
                        onClick={() => setShowRevisionForm(false)} 
                        className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-transparent px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Completed Certificate Section */}
            {isClient && request.status === "COMPLETED" && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 shadow-xl">
                 <div className="flex items-start gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">Deal Certified & Executed</h2>
                    <p className="text-sm text-zinc-400">Your Exclusive Work-for-Hire license has been generated and cryptographically signed. Funds have been released.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <a
                    href={`/api/service-requests/${request.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-black px-4 py-3.5 text-sm font-bold transition-all hover:bg-zinc-200"
                  >
                    <DownloadCloud size={18} /> Download Files
                  </a>

                  <button
                    onClick={handleDownloadCertificate}
                    disabled={!agreementData}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 text-white px-4 py-3.5 text-sm font-bold transition-all hover:bg-amber-700 disabled:opacity-50"
                  >
                    <FileText size={18} /> {agreementData ? "Print Certificate" : "Loading Cert..."}
                  </button>
                </div>
              </div>
            )}

            {(request.producerResponse || request.deliveryNotes) && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
                <h2 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                  <MessageCircle size={14} className="text-zinc-400" /> 
                  {["DELIVERED","COMPLETED"].includes(request.status) ? "Delivery Notes" : "Producer's Comments"}
                </h2>
                <div className="rounded-xl border border-zinc-800/60 bg-[#08080a] p-5">
                  <p className="text-sm font-light tracking-wide leading-relaxed text-zinc-300">
                    {request.deliveryNotes || request.producerResponse}
                  </p>
                </div>
              </div>
            )}

            {isProducer && request.status === "PENDING" && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
                <h2 className="text-lg font-light tracking-tight text-white mb-4">Respond to Request</h2>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Add a message to the client outlining next steps..."
                  rows={4}
                  className="w-full px-4 py-3.5 rounded-xl border border-zinc-800 bg-[#08080a] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors font-light tracking-wide resize-none mb-4"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => patchStatus("ACCEPTED", { producerResponse: responseText || undefined })}
                    disabled={actionLoading}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-sm font-semibold tracking-wide text-black transition-all hover:bg-zinc-200 disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Accept Project
                  </button>
                  <button
                    onClick={() => patchStatus("REJECTED", { producerResponse: responseText || undefined })}
                    disabled={actionLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-[#08080a] px-6 py-3.5 text-sm font-medium tracking-wide text-zinc-300 transition-all hover:bg-zinc-900 hover:text-white disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            )}

            {isClient && request.status === "PENDING" && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
                <h2 className="text-lg font-light tracking-tight text-white mb-2">Awaiting Producer Response</h2>
                <p className="text-sm font-light tracking-wide text-zinc-400 mb-6">
                  The producer has not responded yet. You can cancel this request if you changed your mind.
                </p>
                <button
                  onClick={() => patchStatus("CANCELLED")}
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-6 py-3.5 text-sm font-medium tracking-wide text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50"
                >
                  Cancel Request
                </button>
              </div>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-5 lg:self-start">
            
            {budgetNum > 0 && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-light tracking-tight text-white">Escrow Total</h2>
                  <Shield className="w-5 h-5 text-zinc-500" />
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-light tracking-wide text-zinc-400">Budget</span>
                    <span className="text-lg font-light text-white">{formatAmount(budgetNum, reqCurrency)}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-light tracking-wide text-zinc-500">Platform Fee (10%)</span>
                    <span className="text-sm font-light text-zinc-400">{formatAmount(platformFeeNum, reqCurrency)}</span>
                  </div>
                  <div className="h-px w-full bg-zinc-800" />
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">Producer Payout</span>
                    <span className="text-xl font-light text-emerald-400">{formatAmount(producerPayoutNum, reqCurrency)}</span>
                  </div>
                </div>

                {isClient && request.status === "ACCEPTED" && request.paymentStatus === "UNPAID" && (
                  <button
                    onClick={() => callAction(`/api/service-requests/${request.id}/pay`)}
                    disabled={actionLoading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-sm font-semibold tracking-wide text-black transition-all hover:bg-zinc-200 active:scale-[0.98] shadow-lg shadow-white/10"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    Fund Escrow ({formatAmount(budgetNum, reqCurrency)})
                  </button>
                )}

                {request.paymentStatus === "PAYMENT_HELD" && !request.clientConfirmedDelivery && !hasOpenDispute && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3">
                    <Lock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-light tracking-wide leading-relaxed text-emerald-100/70">
                      Funds securely locked in escrow. Money is only released upon your final approval.
                    </p>
                  </div>
                )}

                {request.status === "COMPLETED" && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3 mt-4">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-light tracking-wide leading-relaxed text-emerald-100/70">
                      Payment of {formatAmount(producerPayoutNum, reqCurrency)} has been successfully released to the producer.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl">
              <div className="space-y-4">
                {request.deadline && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1">Target Deadline</p>
                    <p className="text-sm font-light text-zinc-200">{fmt(request.deadline)}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1">Created On</p>
                  <p className="text-sm font-light text-zinc-400">{fmtShort(request.createdAt)}</p>
                </div>
                {request.deliveredAt && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1">Delivered On</p>
                    <p className="text-sm font-light text-emerald-400">{fmtShort(request.deliveredAt)}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-4">
                {isProducer ? "Client Details" : "Producer Details"}
              </p>
              <div className="flex items-center gap-3 mb-5">
                <img
                  src={other?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${other?.id}`}
                  alt={other?.fullName || other?.username}
                  className="w-12 h-12 rounded-full object-cover border border-zinc-800 bg-[#08080a]"
                />
                <div>
                  <p className="font-light text-white">{other?.fullName || other?.username}</p>
                  <p className="text-xs font-light text-zinc-500">@{other?.username}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => router.push(`/messages/${other?.id}`)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-[#08080a] px-3 py-2 text-xs font-medium tracking-wide text-zinc-300 transition-all hover:bg-zinc-900 hover:text-white"
                >
                  <MessageCircle size={14} /> Message
                </button>
                {!isProducer && (
                  <button
                    onClick={() => router.push(`/producers/${other?.id}`)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-[#08080a] px-3 py-2 text-xs font-medium tracking-wide text-zinc-300 transition-all hover:bg-zinc-900 hover:text-white"
                  >
                    <User size={14} /> Profile
                  </button>
                )}
              </div>
            </div>

            {hasOpenDispute ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 shadow-xl">
                <div className="flex items-center gap-2 mb-3">
                  <TriangleAlert className="w-5 h-5 text-red-500" />
                  <h3 className="text-sm font-semibold text-red-400">Dispute Active</h3>
                </div>
                <p className="text-xs font-light leading-relaxed text-red-200/70 mb-3">
                  Reason: {request.disputeReason}
                </p>
                <div className="rounded-lg bg-black/40 p-3">
                  <p className="text-[11px] font-light text-red-400">
                    Our admin team is currently reviewing this transaction. Payments are frozen until resolution.
                  </p>
                </div>
              </div>
            ) : isClient && request.status === "DELIVERED" && request.paymentStatus === "PAYMENT_HELD" ? (
              <div>
                {!showDisputeForm ? (
                  <button
                    onClick={() => setShowDisputeForm(true)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-transparent px-4 py-3.5 text-xs font-medium tracking-wide text-red-400 transition-all hover:bg-red-500/10"
                  >
                    <TriangleAlert size={14} /> Raise a Dispute
                  </button>
                ) : (
                  <div className="rounded-2xl border border-red-500/30 bg-zinc-950 p-5 shadow-xl">
                    <h4 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-red-400 mb-3">Report Issue</h4>
                    <textarea
                      rows={3}
                      placeholder="Describe the issue in detail..."
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-zinc-800 bg-[#08080a] text-xs font-light text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors mb-3 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => callAction(`/api/service-requests/${request.id}/dispute`, { reason: disputeReason })}
                        disabled={actionLoading || disputeReason.trim().length < 10}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-all disabled:opacity-50"
                      >
                        {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Submit"}
                      </button>
                      <button 
                        onClick={() => setShowDisputeForm(false)} 
                        className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-transparent px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

          </aside>
        </section>
      </main>
    </div>
  );
}