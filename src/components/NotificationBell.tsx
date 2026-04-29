"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Bell, Check, CheckCheck, CheckCircle2, 
  XCircle, Handshake, Hand, MessageSquare, 
  Trash2, ShieldCheck, PlayCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getNotificationRoute } from "@/lib/notification-routing";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  referenceId?: string;
  referenceType?: string;
  relatedData?: {
    status?: string;
    imageUrl?: string;
  };
}

export const NotificationBell = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", { method: "POST" });
      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, { method: "DELETE" });
      if (response.ok) {
        const notificationToDelete = notifications.find(n => n.id === notificationId);
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        if (notificationToDelete && !notificationToDelete.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen]);

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const handleNotificationClick = async (notification: Notification) => {
    const route = getNotificationRoute(notification.type, notification.referenceType, notification.referenceId);
    if (!notification.isRead) await markAsRead(notification.id);
    if (route.path) {
      if (route.closeDropdown) setIsOpen(false);
      router.push(route.path);
    }
  };

  // Highly specific icon routing based on context
  const getStatusIcon = (type: string, status?: string) => {
    const t = type.toLowerCase();
    const s = (status || "").toLowerCase();

    // Secure / Payment Held
    if (s.includes("held") || t.includes("payment")) return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    
    // Work Started / Progress
    if (s.includes("start") || s === "active" || s.includes("progress")) return <PlayCircle className="w-4 h-4 text-blue-400" />;
    
    // Confirmed / Success
    if (s === "confirmed" || s === "accepted" || s === "completed" || s === "success") return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    
    // Failure / Rejected
    if (s === "rejected" || s === "cancelled" || s === "failed") return <XCircle className="w-4 h-4 text-red-500" />;
    
    // Marketplace Actions
    if (t.includes("swap") || t.includes("barter")) return <Handshake className="w-4 h-4 text-zinc-400" />;
    if (t.includes("request") || t.includes("book")) return <Hand className="w-4 h-4 text-zinc-400 -rotate-12" />;
    if (t.includes("comment") || t.includes("message")) return <MessageSquare className="w-4 h-4 text-zinc-400" />;
    
    // Fallback
    return <Bell className="w-4 h-4 text-zinc-400" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Clean Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center p-2 text-white hover:text-zinc-400 transition-colors outline-none border-none bg-transparent"
      >
        <Bell className="w-5 h-5" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-blue-500 border-2 border-black" />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-[380px] bg-[#0A0A0A] border border-white/10 shadow-2xl z-50 rounded-lg overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-zinc-500 hover:text-white transition-colors bg-transparent border-none outline-none"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto no-scrollbar flex flex-col">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 text-center">
                <Bell className="w-8 h-8 text-zinc-800 mb-3" strokeWidth={1.5} />
                <p className="text-sm font-medium text-zinc-400">No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const route = getNotificationRoute(notification.type, notification.referenceType, notification.referenceId);
                const isClickable = !!route.path;
                const imageUrl = notification.relatedData?.imageUrl;

                return (
                  <div
                    key={notification.id}
                    className={`p-4 flex gap-3 border-b border-white/5 transition-colors group ${
                      isClickable ? "cursor-pointer" : "cursor-default"
                    } ${!notification.isRead ? "bg-white/[0.02] hover:bg-white/[0.04]" : "bg-transparent hover:bg-white/[0.02]"}`}
                    onClick={() => isClickable && handleNotificationClick(notification)}
                  >
                    
                    {/* Studio/Item Picture (if available) */}
                    {imageUrl && (
                      <div className="shrink-0 pt-0.5">
                        <img 
                          src={imageUrl} 
                          alt="Thumbnail" 
                          className="w-10 h-10 object-cover rounded-md border border-white/10"
                        />
                      </div>
                    )}

                    <div className="flex-grow flex flex-col min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h4 className={`text-sm truncate ${!notification.isRead ? "text-white font-semibold" : "text-zinc-300 font-medium"}`}>
                            {notification.title}
                          </h4>
                          {/* Simple blue dot for unread */}
                          {!notification.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>

                      <div className="flex items-center gap-3 mt-2.5">
                        <span className="text-[11px] text-zinc-500 font-medium">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                        
                        {/* Status Icon mapped perfectly to the context */}
                        {getStatusIcon(notification.type, notification.relatedData?.status)}
                      </div>
                    </div>

                    {/* Hover Actions */}
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="text-zinc-500 hover:text-white transition-colors bg-transparent border-none p-0"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" strokeWidth={2} />
                        </button>
                      )}
                      
                      {/* Trash Icon for clean deletion */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="text-zinc-500 hover:text-red-500 transition-colors bg-transparent border-none p-0"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};