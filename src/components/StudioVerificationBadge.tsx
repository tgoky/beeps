"use client";

import { BadgeCheck, Clock, XCircle, ShieldAlert } from "lucide-react";

interface StudioVerificationBadgeProps {
  status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function StudioVerificationBadge({
  status,
  size = "sm",
  showLabel = false,
}: StudioVerificationBadgeProps) {
  const iconSize = size === "sm" ? 14 : size === "md" ? 18 : 22;

  const config = {
    VERIFIED: {
      icon: BadgeCheck,
      color: "text-blue-500",
      label: "Verified Studio",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    PENDING: {
      icon: Clock,
      color: "text-yellow-500",
      label: "Verification Pending",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
    },
    REJECTED: {
      icon: XCircle,
      color: "text-red-500",
      label: "Verification Rejected",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
    UNVERIFIED: {
      icon: ShieldAlert,
      color: "text-zinc-500",
      label: "Not Verified",
      bg: "bg-zinc-500/10",
      border: "border-zinc-500/20",
    },
  };

  const { icon: Icon, color, label, bg, border } = config[status];

  if (!showLabel) {
    if (status === "UNVERIFIED") return null;
    return <Icon size={iconSize} className={`${color} shrink-0`} />;
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${bg} ${border} ${color}`}>
      <Icon size={12} />
      <span>{label}</span>
    </div>
  );
}
