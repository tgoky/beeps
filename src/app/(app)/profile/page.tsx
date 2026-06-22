"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { useMyProfile, useUpdateMyProfile } from "@/hooks/api/useMyProfile";
import { ROLE_PROFILE_FIELDS } from "@/lib/profile-fields";
import { getRoleDisplayName } from "@/lib/permissions";
import { formatAmount } from "@/lib/currency";
import dayjs from "dayjs";
import {
  CheckCircle2, Crown, MapPin, Link as LinkIcon, Mail, Settings, Loader2,
  Headphones, Mic, FileText, Package, Building2, Users, Wallet,
  Upload, Music2, Heart, MessageCircle, Plus, ArrowLeft, AlertCircle, ArrowRight
} from "lucide-react";
import type { UserRole } from "@prisma/client";

const ROLE_ICON: Record<string, any> = {
  PRODUCER: Headphones, ARTIST: Mic, LYRICIST: FileText,
  GEAR_SALES: Package, STUDIO_OWNER: Building2, OTHER: Users,
};

const ACTIVITY_ICON: Record<string, any> = {
  UPLOAD: Upload, COLLAB: Users, LIKE: Heart, FOLLOW: Users, COMPLETE: CheckCircle2,
  JOIN_CLUB: Users, LEAVE_CLUB: Users, JOB_REQUEST_SENT: MessageCircle,
  JOB_STATUS_UPDATED: CheckCircle2, SESSION_STARTED: Music2, SESSION_ENDED: CheckCircle2,
  PAYMENT_RECEIVED: Wallet,
};

const formatNumber = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n ?? 0);
};

function ProfileLoadingState() {
  return (
    <div className="h-full overflow-y-auto bg-[#030303] text-white p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="h-40 rounded-2xl border border-zinc-800 bg-zinc-950 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-zinc-800 bg-zinc-950 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { permissions } = usePermissions();
  const { data, isLoading, error } = useMyProfile();
  const updateProfile = useUpdateMyProfile();

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  if (isLoading) return <ProfileLoadingState />;

  if (error || !data) {
    return (
      <div className="flex h-full items-center justify-center bg-[#030303] text-white px-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-500" />
          <h1 className="text-xl font-light">Could not load your profile</h1>
          <p className="mt-2 text-sm text-zinc-500">{(error as Error)?.message || "Please try again."}</p>
        </div>
      </div>
    );
  }

  const { user, activity, reputation, roleContent, secondaryRoles } = data;
  const RoleIcon = ROLE_ICON[user.primaryRole] || Users;
  const roleConfig = ROLE_PROFILE_FIELDS[user.primaryRole as keyof typeof ROLE_PROFILE_FIELDS];
  const roleProfile = user.producerProfile || user.artistProfile || user.lyricistProfile || user.gearProfile || user.studioProfile || {};

  const startEdit = () => {
    const initial: Record<string, string> = {
      fullName: user.fullName || "",
      bio: user.bio || "",
      location: user.location || "",
      website: user.website || "",
    };
    roleConfig?.fields.forEach((f) => {
      const val = (roleProfile as any)[f.key];
      initial[f.key] = Array.isArray(val) ? val.join(", ") : (val ?? "");
    });
    setForm(initial);
    setEditMode(true);
  };

  const handleSave = async () => {
    const payload: Record<string, any> = {
      fullName: form.fullName, bio: form.bio, location: form.location, website: form.website,
    };
    roleConfig?.fields.forEach((f) => {
      payload[f.key] = f.type === "tags"
        ? form[f.key].split(",").map((s) => s.trim()).filter(Boolean)
        : form[f.key];
    });
    await updateProfile.mutateAsync(payload);
    setEditMode(false);
  };

  // Click handler that maps reference models to their page components
  const handleActivityRouting = (act: any) => {
    if (!act.referenceType || !act.referenceId) return;
    const normType = act.referenceType.toUpperCase();
    
    if (normType === "BEAT") router.push(`/beats/${act.referenceId}`);
    else if (normType === "STUDIO") router.push(`/studios/${act.referenceId}`);
    else if (normType === "BOOKING") router.push(`/bookings/show/${act.referenceId}`);
    else if (normType === "SERVICE_REQUEST" || normType === "SERVICE") router.push(`/service-requests/${act.referenceId}`);
    else if (normType === "CLUB") router.push(`/club/${act.referenceId}`);
    else if (normType === "TRANSACTION") router.push(`/transactions/show/${act.referenceId}`);
    else if (normType === "EQUIPMENT") router.push(`/equipment/${act.referenceId}`);
    else if (normType === "COLLABORATION") router.push(`/collaborations/${act.referenceId}`);
  };

  const statCards: { label: string; value: string }[] = [
    { label: "Followers", value: formatNumber(user.followersCount) },
    { label: "Rating", value: reputation.avgRating ? Number(reputation.avgRating).toFixed(1) : "New" },
    { label: "Wallet", value: formatAmount(Number(user.wallet?.availableBalance ?? 0), user.wallet?.currency || user.currency) },
  ];

  if (user.primaryRole === "PRODUCER") {
    statCards.push(
      { label: "Beats Uploaded", value: String(user._count.uploadedBeats) },
      { label: "Beats Licensed", value: String(roleContent.meta.licensesSold ?? 0) },
    );
  } else if (user.primaryRole === "STUDIO_OWNER") {
    statCards.push(
      { label: "Studios Listed", value: String(user.studioProfile?._count?.studios ?? 0) },
      { label: "Total Bookings", value: String(roleContent.meta.bookingsTotal ?? 0) },
    );
  } else if (user.primaryRole === "GEAR_SALES") {
    statCards.push({ label: "Equipment Listed", value: String(user.gearProfile?._count?.equipment ?? 0) });
  } else {
    statCards.push(
      { label: "Posts", value: String(user._count.communityPosts) },
      { label: "Collabs Created", value: String(user._count.createdCollaborations) },
    );
  }

  const roleActionCTA = () => {
    if (permissions.canUploadBeats) return { label: "Upload Beat", onClick: () => router.push("/beats/upload") };
    if (permissions.canCreateStudios) return { label: "List Studio", onClick: () => router.push("/studios/list-studio") };
    return null;
  };
  const cta = roleActionCTA();

  return (
    <div className="h-full overflow-y-auto bg-[#030303] text-white">
      {/* Container upgraded to max-w-[1600px] matching widescreen design rules */}
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">

        {/* Hero Identity Block */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed={user.id}`}
              alt={user.fullName || user.username}
              className="w-24 h-24 rounded-full object-cover border border-zinc-800 bg-[#08080a]"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-light tracking-tight text-white">{user.fullName || user.username}</h1>
                {user.verified && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                {(user.membershipTier === "PRO" || user.membershipTier === "ENTERPRISE") && (
                  <Crown className="w-5 h-5 text-yellow-500" />
                )}
              </div>
              <p className="text-sm text-zinc-500">@{user.username}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-[#08080a] text-xs text-zinc-300">
                  <RoleIcon className="w-3.5 h-3.5" /> {getRoleDisplayName(user.primaryRole)}
                </span>
                {secondaryRoles.map((r: string) => (
                  <span key={r} className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-[#08080a] text-xs text-zinc-500">
                        {getRoleDisplayName(r as UserRole)}
                  </span>
                ))}
              </div>

              {user.bio && <p className="mt-4 text-sm text-zinc-300 max-w-4xl">{user.bio}</p>}

              <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500">
                {user.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{user.location}</span>}
                {user.website && (
                  <a href={`https://${user.website.replace(/^https?:\/\//, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white">
                    <LinkIcon className="w-3.5 h-3.5" />{user.website}
                  </a>
                )}
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{user.email}</span>
              </div>
            </div>

            <div className="flex gap-2 shrink-0 w-full sm:w-auto">
              {cta && (
                <button onClick={cta.onClick} className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors">
                  <Plus className="w-4 h-4" /> {cta.label}
                </button>
              )}
              <button onClick={startEdit} className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg border border-zinc-700 bg-[#08080a] text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors">
                <Settings className="w-4 h-4" /> Profile Settings
              </button>
            </div>
          </div>
        </div>

        {/* Stats Matrix Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-xl border border-zinc-800 bg-[#0A0A0A] p-4">
              <div className="text-2xl font-light text-white tracking-tight">{s.value}</div>
              <div className="text-xs text-zinc-500 mt-1 font-medium uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Wallet Escrow Dashboard */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Capital Breakdown
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div><p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1">Available</p><p className="text-xl font-medium text-white">{formatAmount(Number(user.wallet?.availableBalance ?? 0), user.wallet?.currency || user.currency)}</p></div>
            <div><p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1">Pending (Escrow)</p><p className="text-xl font-medium text-zinc-400">{formatAmount(Number(user.wallet?.pendingBalance ?? 0), user.wallet?.currency || user.currency)}</p></div>
            <div><p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1">Total Earned</p><p className="text-xl font-medium text-emerald-400">{formatAmount(Number(user.wallet?.totalEarned ?? 0), user.wallet?.currency || user.currency)}</p></div>
            <div><p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1">Withdrawn</p><p className="text-xl font-medium text-purple-400">{formatAmount(Number(user.wallet?.totalWithdrawn ?? 0), user.wallet?.currency || user.currency)}</p></div>
          </div>
        </div>

        {/* Splits Column Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Active Offerings Portfolio */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
              {roleContent.type === "beats" && "Your Assets Database"}
              {roleContent.type === "studios" && "Your Enrolled Studio Locations"}
              {roleContent.type === "equipment" && "Active Marketplace Listings"}
              {roleContent.type === "posts" && "Your Personal Blog Records"}
            </h2>
            <div className="space-y-3">
              {roleContent.items.length === 0 && (
                <p className="text-sm text-zinc-500 py-12 text-center border border-dashed border-zinc-800/60 rounded-xl">No active marketplace offerings deployed yet.</p>
              )}
              {roleContent.items.map((item: any) => {
                const itemClickUrl = roleContent.type === "beats" ? `/beats/${item.id}`
                  : roleContent.type === "studios" ? `/studios/${item.id}`
                  : roleContent.type === "equipment" ? `/equipment/${item.id}`
                  : `/community/${user.primaryRole.toLowerCase()}`;
                return (
                  <div 
                    key={item.id} 
                    onClick={() => router.push(itemClickUrl)}
                    className="group flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-[#08080a] hover:border-zinc-600 hover:bg-zinc-900/40 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.imageUrl && <img src={item.imageUrl} className="w-10 h-10 rounded-lg object-cover border border-zinc-800 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm text-white group-hover:text-purple-400 transition-colors truncate pr-2">{item.title || item.name || item.content?.slice(0, 60) || "Untitled Asset"}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{dayjs(item.createdAt).format("MMM D, YYYY")}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-all transform group-hover:translate-x-1 shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Activity Log Feed */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">Recent Network Activity</h2>
            <div className="space-y-3">
              {activity.length === 0 && <p className="text-sm text-zinc-500 py-12 text-center border border-dashed border-zinc-800/60 rounded-xl">No active event tracking records registered.</p>}
              {activity.map((a: any) => {
                const Icon = ACTIVITY_ICON[a.type] || Music2;
                const processLink = !!(a.referenceType && a.referenceId);
                return (
                  <div 
                    key={a.id} 
                    onClick={() => handleActivityRouting(a)}
                    className={`group/item flex items-start gap-3 p-3 rounded-xl border border-zinc-800 bg-[#08080a] transition-all duration-200 ${
                      processLink ? "cursor-pointer hover:border-zinc-600 hover:bg-zinc-900/40" : ""
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 group-hover/item:border-zinc-700 transition-colors shrink-0">
                      <Icon className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-zinc-200 group-hover/item:text-purple-400 transition-colors leading-tight">
                          {a.title}
                        </p>
                        {processLink && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 border border-zinc-800 bg-zinc-900 px-2 py-0.5 rounded opacity-60 group-hover/item:opacity-100 transition-opacity whitespace-nowrap shrink-0">
                            Inspect
                          </span>
                        )}
                      </div>
                      {a.description && <p className="text-xs text-zinc-500 mt-1 font-light tracking-wide">{a.description}</p>}
                      <p className="text-[10px] text-zinc-600 mt-1.5 font-medium">{dayjs(a.createdAt).format("MMM D, h:mm A")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Edit Drawer Modal */}
      {editMode && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl no-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-light text-white tracking-tight">Modify Settings Profile</h2>
              <button onClick={() => setEditMode(false)} className="text-zinc-500 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { key: "fullName", label: "Name Matrix" },
                { key: "location", label: "Location" },
                { key: "website", label: "Website Link" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500 block mb-1.5">{f.label}</label>
                  <input
                    value={form[f.key] || ""}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-[#08080a] text-sm text-white outline-none focus:border-zinc-500 transition-colors font-light tracking-wide"
                  />
                </div>
              ))}
              <div>
                <label className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500 block mb-1.5">Bio Narrative</label>
                <textarea
                  rows={3}
                  value={form.bio || ""}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-[#08080a] text-sm text-white outline-none focus:border-zinc-500 transition-colors font-light tracking-wide resize-none"
                />
              </div>

              {roleConfig?.fields.map((f) => (
                <div key={f.key}>
                  <label className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500 block mb-1.5">
                    {f.label}{f.type === "tags" && " (comma-separated entries)"}
                  </label>
                  {f.type === "textarea" ? (
                    <textarea
                      rows={3}
                      value={form[f.key] || ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-[#08080a] text-sm text-white outline-none focus:border-zinc-500 transition-colors font-light tracking-wide resize-none"
                    />
                  ) : (
                    <input
                      value={form[f.key] || ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-[#08080a] text-sm text-white outline-none focus:border-zinc-500 transition-colors font-light tracking-wide"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setEditMode(false)} className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-900 transition-colors text-sm font-medium">Cancel</button>
              <button
                onClick={handleSave}
                disabled={updateProfile.isPending}
                className="flex-1 py-3 rounded-xl bg-white text-black hover:bg-zinc-200 transition-all font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Commit Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}