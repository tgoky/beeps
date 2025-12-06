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

export default function ServiceRequestDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { theme } = useTheme();
  const { data: user, isLoading: userLoading } = useGetIdentity<any>();

  const [request, setRequest] = useState<ServiceRequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [responseText, setResponseText] = useState("");

  useEffect(() => {
    if (user) {
      fetchRequest();
    }
  }, [user, params.id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/service-requests/${params.id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch service request");
      }

      const data = await response.json();
      setRequest(data.serviceRequest);
    } catch (error: any) {
      console.error("Error fetching service request:", error);
      setError(error.message || "Failed to load service request");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!request) return;

    try {
      setUpdating(true);
      const res = await fetch(`/api/service-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          producerResponse: responseText || undefined
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update request");
      }

      await fetchRequest();
      setResponseText("");
    } catch (error: any) {
      alert(error.message || "Failed to update service request");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!request || !confirm("Are you sure you want to cancel this service request?")) return;

    try {
      setUpdating(true);
      const res = await fetch(`/api/service-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to cancel request");
      }

      await fetchRequest();
    } catch (error: any) {
      alert(error.message || "Failed to cancel service request");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACCEPTED":
        return <CheckCircle2 className="w-5 h-5 text-green-400" strokeWidth={2.5} />;
      case "REJECTED":
        return <XCircle className="w-5 h-5 text-red-400" strokeWidth={2.5} />;
      case "COMPLETED":
        return <CheckCircle2 className="w-5 h-5 text-blue-400" strokeWidth={2.5} />;
      case "IN_PROGRESS":
        return <Clock className="w-5 h-5 text-yellow-400" strokeWidth={2.5} />;
      case "PENDING":
        return <AlertCircle className="w-5 h-5 text-yellow-400" strokeWidth={2.5} />;
      case "CANCELLED":
        return <XCircle className="w-5 h-5 text-red-400" strokeWidth={2.5} />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" strokeWidth={2.5} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACCEPTED":
        return theme === "dark"
          ? "bg-green-500/10 text-green-400 border-green-500/20"
          : "bg-green-500/10 text-green-600 border-green-500/20";
      case "REJECTED":
        return theme === "dark"
          ? "bg-red-500/10 text-red-400 border-red-500/20"
          : "bg-red-500/10 text-red-600 border-red-500/20";
      case "COMPLETED":
        return theme === "dark"
          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
          : "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "IN_PROGRESS":
        return theme === "dark"
          ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
          : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "PENDING":
        return theme === "dark"
          ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
          : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "CANCELLED":
        return theme === "dark"
          ? "bg-red-500/10 text-red-400 border-red-500/20"
          : "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return theme === "dark"
          ? "bg-gray-500/10 text-gray-400 border-gray-500/20"
          : "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Theme styles
  const bgPrimary = theme === "dark" ? "bg-black" : "bg-gray-50";
  const bgCard = theme === "dark" ? "bg-zinc-900/40" : "bg-white";
  const borderPrimary = theme === "dark" ? "border-zinc-800" : "border-gray-300";
  const textPrimary = theme === "dark" ? "text-white" : "text-gray-900";
  const textSecondary = theme === "dark" ? "text-zinc-400" : "text-gray-600";
  const textTertiary = theme === "dark" ? "text-zinc-500" : "text-gray-500";

  const buttonPrimary = theme === "dark"
    ? "bg-white border-white text-black hover:bg-zinc-100 active:scale-[0.98]"
    : "bg-black border-black text-white hover:bg-gray-800 active:scale-[0.98]";

  const buttonSecondary = theme === "dark"
    ? "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white hover:bg-black"
    : "bg-gray-50 border-gray-300 text-gray-600 hover:border-gray-400 hover:text-black hover:bg-white";

  if (userLoading || loading) {
    return (
      <div className={`min-h-screen p-6 transition-colors duration-200 ${bgPrimary} ${textPrimary}`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-24">
            <div className="space-y-4 text-center">
              <Loader2 className={`w-8 h-8 animate-spin mx-auto`} strokeWidth={2.5} />
              <p className="text-sm font-light tracking-wide">Loading service request...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className={`min-h-screen p-6 transition-colors duration-200 ${bgPrimary} ${textPrimary}`}>
        <div className="max-w-4xl mx-auto">
          <div className={`p-12 rounded-xl text-center border ${borderPrimary} ${bgCard}`}>
            <XCircle className={`w-16 h-16 ${textTertiary} mx-auto mb-4`} strokeWidth={1.5} />
            <h3 className="text-lg font-light tracking-tight mb-2">Service request not found</h3>
            <p className="text-sm font-light tracking-wide mb-6">{error || "The service request you're looking for doesn't exist"}</p>
            <button
              onClick={() => router.push("/service-requests")}
              className={`inline-flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 ${buttonPrimary} tracking-wide active:scale-[0.98]`}
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2} />
              <span>Back to Service Requests</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isProducer = user?.id === request.producer.id;
  const isClient = user?.id === request.client.id;
  const otherUser = isProducer ? request.client : request.producer;

  return (
    <div className={`min-h-screen p-6 transition-colors duration-200 ${bgPrimary} ${textPrimary}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/service-requests")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-all duration-200 mb-6 ${buttonSecondary} tracking-wide active:scale-[0.98]`}
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            <span>Back to Service Requests</span>
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${theme === "dark" ? "bg-white" : "bg-black"}`}>
              <Briefcase className={`w-5 h-5 ${theme === "dark" ? "text-black" : "text-white"}`} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-light tracking-tight">Service Request Details</h1>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium tracking-wide px-4 py-2 rounded-full border flex items-center gap-2 ${getStatusColor(request.status)}`}>
              {getStatusIcon(request.status)}
              {request.status}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Project Information */}
          <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
            <h3 className="text-xl font-light tracking-tight mb-4">{request.projectTitle}</h3>
            <p className={`text-sm leading-relaxed ${textSecondary}`}>{request.projectDescription}</p>
          </div>

          {/* Request Details */}
          <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
            <h3 className="text-lg font-light tracking-tight mb-6">Request Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {request.budget && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className={`w-4 h-4 ${textTertiary}`} strokeWidth={2} />
                    <p className="text-xs font-medium tracking-wider uppercase">Budget</p>
                  </div>
                  <p className="text-lg font-light tracking-wide">${request.budget}</p>
                </div>
              )}

              {request.deadline && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${textTertiary}`} strokeWidth={2} />
                    <p className="text-xs font-medium tracking-wider uppercase">Deadline</p>
                  </div>
                  <p className="text-lg font-light tracking-wide">{formatDate(request.deadline)}</p>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-xs font-medium tracking-wider uppercase">Created</p>
                <p className="text-sm font-light tracking-wide">{formatDateTime(request.createdAt)}</p>
              </div>

              {request.respondedAt && (
                <div className="space-y-3">
                  <p className="text-xs font-medium tracking-wider uppercase">Responded</p>
                  <p className="text-sm font-light tracking-wide">{formatDateTime(request.respondedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Client/Producer Info */}
          <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
            <div className="flex items-center gap-2 mb-4">
              <User className={`w-4 h-4 ${textTertiary}`} strokeWidth={2} />
              <p className="text-xs font-medium tracking-wider uppercase">{isProducer ? "Client" : "Producer"}</p>
            </div>
            <div className="flex items-center gap-4">
              <img
                src={otherUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.id}`}
                alt={otherUser.fullName || otherUser.username}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="space-y-1">
                <p className="text-lg font-light tracking-tight">{otherUser.fullName || otherUser.username}</p>
                <p className="text-sm font-light tracking-wide">@{otherUser.username}</p>
              </div>
            </div>
          </div>

          {/* Producer Response */}
          {request.producerResponse && (
            <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className={`w-4 h-4 ${textTertiary}`} strokeWidth={2} />
                <p className="text-xs font-medium tracking-wider uppercase">Producer Response</p>
              </div>
              <p className={`text-sm font-light tracking-wide leading-relaxed ${textSecondary}`}>{request.producerResponse}</p>
            </div>
          )}

          {/* Response Textarea for Producer */}
          {isProducer && request.status === "PENDING" && (
            <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
              <div className="flex items-center gap-2 mb-4">
                <FileText className={`w-4 h-4 ${textTertiary}`} strokeWidth={2} />
                <p className="text-xs font-medium tracking-wider uppercase">Your Response (Optional)</p>
              </div>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Add a message to the client..."
                rows={4}
                className={`w-full px-4 py-3 text-sm rounded-lg border resize-none transition-all focus:outline-none focus:ring-2 ${
                  theme === "dark"
                    ? "bg-zinc-900/50 border-zinc-800 text-white placeholder-zinc-500 focus:border-white focus:ring-white/20"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-gray-900/20"
                }`}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className={`p-6 rounded-xl border ${borderPrimary} ${bgCard}`}>
            <div className="flex flex-wrap gap-3">
              {/* Producer Actions */}
              {isProducer && request.status === "PENDING" && (
                <>
                  <button
                    onClick={() => handleUpdateStatus("ACCEPTED")}
                    disabled={updating}
                    className={`flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 ${
                      theme === "dark"
                        ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20"
                        : "bg-green-500/10 border-green-500/20 text-green-600 hover:bg-green-500/20"
                    } tracking-wide active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {updating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" strokeWidth={2} />
                        <span>Accept Request</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleUpdateStatus("REJECTED")}
                    disabled={updating}
                    className={`flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 ${
                      theme === "dark"
                        ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                        : "bg-red-500/10 border-red-500/20 text-red-600 hover:bg-red-500/20"
                    } tracking-wide active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {updating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <XIcon className="w-4 h-4" strokeWidth={2} />
                        <span>Reject Request</span>
                      </>
                    )}
                  </button>
                </>
              )}

              {isProducer && request.status === "ACCEPTED" && (
                <button
                  onClick={() => handleUpdateStatus("IN_PROGRESS")}
                  disabled={updating}
                  className={`flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 ${buttonPrimary} tracking-wide flex-1 justify-center`}
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" strokeWidth={2} />
                      <span>Start Work</span>
                    </>
                  )}
                </button>
              )}

              {isProducer && request.status === "IN_PROGRESS" && (
                <button
                  onClick={() => handleUpdateStatus("COMPLETED")}
                  disabled={updating}
                  className={`flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 ${buttonPrimary} tracking-wide flex-1 justify-center`}
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                      <span>Mark as Complete</span>
                    </>
                  )}
                </button>
              )}

              {/* Client Actions */}
              {isClient && (request.status === "PENDING" || request.status === "ACCEPTED") && (
                <button
                  onClick={handleCancelRequest}
                  disabled={updating}
                  className={`flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 ${
                    theme === "dark"
                      ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                      : "bg-red-500/10 border-red-500/20 text-red-600 hover:bg-red-500/20"
                  } tracking-wide active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <>
                      <XIcon className="w-4 h-4" strokeWidth={2} />
                      <span>Cancel Request</span>
                    </>
                  )}
                </button>
              )}

              {/* Message Button */}
              <button
                onClick={() => router.push(`/messages/${otherUser.id}`)}
                className={`flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 ${
                  theme === "dark"
                    ? "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
                    : "bg-blue-500/10 border-blue-500/20 text-blue-600 hover:bg-blue-500/20"
                } tracking-wide active:scale-[0.98]`}
              >
                <MessageCircle className="w-4 h-4" strokeWidth={2} />
                <span>Message {isProducer ? "Client" : "Producer"}</span>
              </button>

              {/* View Profile */}
              <button
                onClick={() => router.push(`/producers/${otherUser.id}`)}
                className={`flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 ${buttonSecondary} tracking-wide active:scale-[0.98]`}
              >
                <User className="w-4 h-4" strokeWidth={2} />
                <span>View Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
