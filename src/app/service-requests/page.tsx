"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Filter,
  Calendar,
  DollarSign,
  User,
  MessageCircle,
} from "lucide-react";

interface ServiceRequest {
  id: string;
  projectTitle: string;
  projectDescription: string;
  budget: string | null;
  deadline: string | null;
  status: string;
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
  };
}

export default function ServiceRequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const { data: user, isLoading: userLoading } = useGetIdentity<any>();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "completed">("all");
  const [viewMode, setViewMode] = useState<"sent" | "received">("sent");

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "REJECTED":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "COMPLETED":
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case "IN_PROGRESS":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "REJECTED":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "COMPLETED":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "IN_PROGRESS":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Show loading spinner while user data is loading
  if (userLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-black" : "bg-gray-50"}`}>
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-black" : "bg-gray-50"}`}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className={`flex items-center gap-2 mb-4 px-4 py-2 rounded-lg border transition-all ${
              theme === "dark"
                ? "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white"
                : "bg-white border-gray-300 text-gray-600 hover:text-gray-900"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <h1 className={`text-3xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
            Service Requests
          </h1>
          <p className={`text-sm ${theme === "dark" ? "text-zinc-400" : "text-gray-600"}`}>
            Manage your producer service requests
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div
            className={`p-4 rounded-lg border mb-6 flex items-start gap-3 ${
              theme === "dark"
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-red-50 border-red-200 text-red-600"
            }`}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium mb-1">Error loading service requests</h4>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={() => fetchRequests()}
              className={`text-sm font-medium px-3 py-1 rounded-lg transition-all ${
                theme === "dark"
                  ? "hover:bg-red-500/20"
                  : "hover:bg-red-100"
              }`}
            >
              Retry
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* View Mode Toggle */}
          <div
            className={`inline-flex p-1 rounded-lg border ${
              theme === "dark" ? "bg-zinc-950 border-zinc-800" : "bg-white border-gray-300"
            }`}
          >
            <button
              onClick={() => setViewMode("sent")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                viewMode === "sent"
                  ? theme === "dark"
                    ? "bg-white text-black"
                    : "bg-black text-white"
                  : theme === "dark"
                  ? "text-zinc-400 hover:text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Sent Requests
            </button>
            <button
              onClick={() => setViewMode("received")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                viewMode === "received"
                  ? theme === "dark"
                    ? "bg-white text-black"
                    : "bg-black text-white"
                  : theme === "dark"
                  ? "text-zinc-400 hover:text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Received Requests
            </button>
          </div>

          {/* Status Filter */}
          <div
            className={`inline-flex p-1 rounded-lg border ${
              theme === "dark" ? "bg-zinc-950 border-zinc-800" : "bg-white border-gray-300"
            }`}
          >
            {(["all", "pending", "accepted", "completed"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
                  filter === status
                    ? theme === "dark"
                      ? "bg-purple-500 text-white"
                      : "bg-purple-600 text-white"
                    : theme === "dark"
                    ? "text-zinc-400 hover:text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : requests.length === 0 ? (
          <div
            className={`text-center py-16 rounded-xl border ${
              theme === "dark" ? "bg-zinc-950 border-zinc-800" : "bg-white border-gray-300"
            }`}
          >
            <Briefcase className={`w-16 h-16 mx-auto mb-4 ${theme === "dark" ? "text-zinc-700" : "text-gray-400"}`} />
            <h3 className={`text-lg font-medium mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              No service requests
            </h3>
            <p className={`text-sm ${theme === "dark" ? "text-zinc-500" : "text-gray-600"}`}>
              {viewMode === "sent"
                ? "You haven't sent any service requests yet"
                : "You haven't received any service requests yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const isHighlighted = highlightId === request.id;
              const otherUser = viewMode === "sent" ? request.producer : request.client;

              return (
                <div
                  key={request.id}
                  id={`request-${request.id}`}
                  className={`p-6 rounded-xl border transition-all ${
                    isHighlighted
                      ? theme === "dark"
                        ? "bg-purple-500/10 border-purple-500/50 ring-2 ring-purple-500/20"
                        : "bg-purple-50 border-purple-500/50 ring-2 ring-purple-500/20"
                      : theme === "dark"
                      ? "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                      : "bg-white border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                          {request.projectTitle}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {getStatusIcon(request.status)}
                          {request.status}
                        </span>
                      </div>

                      <p className={`text-sm mb-4 ${theme === "dark" ? "text-zinc-400" : "text-gray-600"}`}>
                        {request.projectDescription}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className={`w-4 h-4 ${theme === "dark" ? "text-zinc-500" : "text-gray-500"}`} />
                          <span className={theme === "dark" ? "text-zinc-400" : "text-gray-600"}>
                            {viewMode === "sent" ? "Producer:" : "Client:"} {otherUser.fullName || otherUser.username}
                          </span>
                        </div>

                        {request.budget && (
                          <div className="flex items-center gap-2">
                            <DollarSign className={`w-4 h-4 ${theme === "dark" ? "text-zinc-500" : "text-gray-500"}`} />
                            <span className={theme === "dark" ? "text-zinc-400" : "text-gray-600"}>
                              ${request.budget}
                            </span>
                          </div>
                        )}

                        {request.deadline && (
                          <div className="flex items-center gap-2">
                            <Calendar className={`w-4 h-4 ${theme === "dark" ? "text-zinc-500" : "text-gray-500"}`} />
                            <span className={theme === "dark" ? "text-zinc-400" : "text-gray-600"}>
                              Due: {formatDate(request.deadline)}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Clock className={`w-4 h-4 ${theme === "dark" ? "text-zinc-500" : "text-gray-500"}`} />
                          <span className={theme === "dark" ? "text-zinc-400" : "text-gray-600"}>
                            {formatDate(request.createdAt)}
                          </span>
                        </div>
                      </div>

                      {request.producerResponse && (
                        <div
                          className={`mt-4 p-4 rounded-lg border ${
                            theme === "dark" ? "bg-zinc-900 border-zinc-800" : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <MessageCircle className={`w-4 h-4 ${theme === "dark" ? "text-zinc-500" : "text-gray-500"}`} />
                            <span className={`text-sm font-medium ${theme === "dark" ? "text-zinc-300" : "text-gray-700"}`}>
                              Producer Response:
                            </span>
                          </div>
                          <p className={`text-sm ${theme === "dark" ? "text-zinc-400" : "text-gray-600"}`}>
                            {request.producerResponse}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
