"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";
import { useTheme } from "./ThemeProvider";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-400" strokeWidth={2.5} />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-400" strokeWidth={2.5} />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-400" strokeWidth={2.5} />;
      case "info":
        return <Info className="w-5 h-5 text-blue-400" strokeWidth={2.5} />;
    }
  };

  const getToastColors = (type: ToastType) => {
    const baseColors = {
      success: theme === "dark"
        ? "bg-green-500/10 border-green-500/20"
        : "bg-green-500/10 border-green-500/20",
      error: theme === "dark"
        ? "bg-red-500/10 border-red-500/20"
        : "bg-red-500/10 border-red-500/20",
      warning: theme === "dark"
        ? "bg-yellow-500/10 border-yellow-500/20"
        : "bg-yellow-500/10 border-yellow-500/20",
      info: theme === "dark"
        ? "bg-blue-500/10 border-blue-500/20"
        : "bg-blue-500/10 border-blue-500/20",
    };
    return baseColors[type];
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm
              ${getToastColors(toast.type)}
              ${theme === "dark" ? "bg-zinc-900/90" : "bg-white/90"}
              animate-in slide-in-from-bottom-5 duration-300
              shadow-lg
            `}
          >
            {getToastIcon(toast.type)}
            <p className={`
              text-sm font-light tracking-wide flex-1
              ${theme === "dark" ? "text-white" : "text-gray-900"}
            `}>
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className={`
                p-1 rounded-lg transition-colors duration-200
                ${theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-gray-100"}
              `}
            >
              <X className={`w-4 h-4 ${theme === "dark" ? "text-zinc-400" : "text-gray-600"}`} strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
