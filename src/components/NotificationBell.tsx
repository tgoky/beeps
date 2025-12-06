"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, Check, CheckCheck, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import Link from "next/link";
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
  };
}

export const NotificationBell = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
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

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });

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

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Fetch on mount and when opened
  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Format time ago
  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  // Handle notification click - navigate and mark as read
  const handleNotificationClick = async (notification: Notification) => {
    const route = getNotificationRoute(
      notification.type,
      notification.referenceType,
      notification.referenceId
    );

    // Mark as read if unread
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate if there's a route
    if (route.path) {
      if (route.closeDropdown) {
        setIsOpen(false);
      }
      router.push(route.path);
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
      case "ACCEPTED":
        return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" strokeWidth={2.5} />;
      case "COMPLETED":
        return <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" strokeWidth={2.5} />;
      case "PENDING":
        return <AlertCircle className="w-3.5 h-3.5 text-yellow-400" strokeWidth={2.5} />;
      case "CANCELLED":
      case "REJECTED":
        return <XCircle className="w-3.5 h-3.5 text-red-400" strokeWidth={2.5} />;
      default:
        return <AlertCircle className={`w-3.5 h-3.5 ${theme === "dark" ? "text-zinc-400" : "text-gray-400"}`} strokeWidth={2.5} />;
    }
  };

  // Get status color classes
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
      case "ACCEPTED":
        return theme === "dark"
          ? "bg-green-500/10 text-green-400 border-green-500/20"
          : "bg-green-500/10 text-green-600 border-green-500/20";
      case "COMPLETED":
        return theme === "dark"
          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
          : "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "PENDING":
        return theme === "dark"
          ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
          : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "CANCELLED":
      case "REJECTED":
        return theme === "dark"
          ? "bg-red-500/10 text-red-400 border-red-500/20"
          : "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return theme === "dark"
          ? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
          : "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative p-2 rounded-lg transition-all duration-200
          ${theme === "dark"
            ? "hover:bg-gray-800/60 text-gray-400 hover:text-gray-300"
            : "hover:bg-gray-100 text-gray-600 hover:text-gray-700"
          }
          active:scale-95
        `}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className={`
              absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px]
              flex items-center justify-center text-[10px] font-semibold
              bg-red-500 text-white rounded-full px-1
              animate-pulse
            `}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={`
            absolute right-0 mt-2 w-96 rounded-xl shadow-2xl border z-50
            ${theme === "dark"
              ? "bg-gray-900 border-gray-800"
              : "bg-white border-gray-200"
            }
          `}
        >
          {/* Header */}
          <div className={`
            flex items-center justify-between p-4 border-b
            ${theme === "dark" ? "border-gray-800" : "border-gray-200"}
          `}>
            <h3 className={`
              text-sm font-semibold
              ${theme === "dark" ? "text-gray-200" : "text-gray-900"}
            `}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className={`
                  text-xs font-medium px-2 py-1 rounded-lg transition-all
                  ${theme === "dark"
                    ? "text-purple-400 hover:bg-purple-500/10"
                    : "text-purple-600 hover:bg-purple-50"
                  }
                `}
              >
                <CheckCheck className="w-3.5 h-3.5 inline mr-1" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className={`
                flex flex-col items-center justify-center p-8 text-center
              `}>
                <Bell className={`
                  w-12 h-12 mb-3
                  ${theme === "dark" ? "text-gray-700" : "text-gray-300"}
                `} />
                <p className={`
                  text-sm font-medium
                  ${theme === "dark" ? "text-gray-400" : "text-gray-600"}
                `}>
                  No notifications yet
                </p>
                <p className={`
                  text-xs mt-1
                  ${theme === "dark" ? "text-gray-600" : "text-gray-500"}
                `}>
                  We'll notify you when something happens
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {notifications.map((notification) => {
                  const route = getNotificationRoute(
                    notification.type,
                    notification.referenceType,
                    notification.referenceId
                  );
                  const isClickable = !!route.path;

                  return (
                    <div
                      key={notification.id}
                      className={`
                        p-4 transition-all
                        ${isClickable ? "cursor-pointer" : "cursor-default"}
                        ${!notification.isRead
                          ? theme === "dark"
                            ? "bg-purple-500/5 hover:bg-purple-500/10"
                            : "bg-purple-50/50 hover:bg-purple-50"
                          : theme === "dark"
                          ? isClickable ? "hover:bg-gray-800/40" : ""
                          : isClickable ? "hover:bg-gray-50" : ""
                        }
                      `}
                      onClick={() => isClickable && handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`
                              text-sm font-medium truncate
                              ${theme === "dark" ? "text-gray-200" : "text-gray-900"}
                            `}>
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <span className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full"></span>
                            )}
                          </div>
                          <p className={`
                            text-xs line-clamp-2
                            ${theme === "dark" ? "text-gray-400" : "text-gray-600"}
                          `}>
                            {notification.message}
                          </p>

                          <div className="flex items-center gap-2 mt-1.5">
                            <p className={`
                              text-xs
                              ${theme === "dark" ? "text-gray-600" : "text-gray-500"}
                            `}>
                              {formatTimeAgo(notification.createdAt)}
                            </p>

                            {/* Status Badge */}
                            {notification.relatedData?.status && (
                              <span
                                className={`
                                  inline-flex items-center gap-1 text-[10px] font-medium tracking-wide
                                  px-2 py-0.5 rounded-full border
                                  ${getStatusColor(notification.relatedData.status)}
                                `}
                              >
                                {getStatusIcon(notification.relatedData.status)}
                                {notification.relatedData.status.charAt(0) + notification.relatedData.status.slice(1).toLowerCase()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className={`
                                p-1.5 rounded-lg transition-all
                                ${theme === "dark"
                                  ? "hover:bg-gray-700 text-gray-500 hover:text-gray-400"
                                  : "hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                                }
                              `}
                              title="Mark as read"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className={`
                              p-1.5 rounded-lg transition-all
                              ${theme === "dark"
                                ? "hover:bg-red-500/10 text-gray-500 hover:text-red-400"
                                : "hover:bg-red-50 text-gray-400 hover:text-red-600"
                              }
                            `}
                            title="Delete"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
