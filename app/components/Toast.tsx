"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

export type ToastProps = {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
};

export default function Toast({
  message,
  type = "info",
  duration = 4000,
  onClose,
}: Readonly<ToastProps>) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPercent = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remainingPercent);

      if (elapsed >= duration) {
        clearInterval(interval);
        onClose();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [duration, onClose]);

  const styleConfig = {
    success: {
      bg: "bg-lime-300 text-black",
      badge: "bg-black text-lime-300",
      progressBg: "bg-black",
      label: "SUCESSO",
      icon: "✓",
    },
    error: {
      bg: "bg-red-400 text-black",
      badge: "bg-black text-red-300",
      progressBg: "bg-black",
      label: "ERRO",
      icon: "✕",
    },
    info: {
      bg: "bg-amber-300 text-black",
      badge: "bg-black text-amber-300",
      progressBg: "bg-black",
      label: "AVISO",
      icon: "ℹ",
    },
  }[type];

  return (
    <aside
      aria-label="Notificação do sistema"
      role="status"
      aria-live="polite"
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-md animate-in fade-in slide-in-from-top-4 duration-200"
    >
      <div
        className={`relative ${styleConfig.bg} border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 overflow-hidden`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center justify-center w-6 h-6 border-2 border-black font-black text-xs ${styleConfig.badge}`}
            >
              {styleConfig.icon}
            </span>
            <span className="font-mono text-xs font-black tracking-wider uppercase">
              {styleConfig.label}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar notificação"
            className="p-1 leading-none font-mono font-bold text-sm bg-black text-white hover:bg-neutral-800 transition-colors cursor-pointer border border-black"
          >
            ✕
          </button>
        </div>

        <p className="mt-2 font-bold text-sm leading-snug break-words">
          {message}
        </p>

        {/* Linha indicadora de tempo limite */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20">
          <div
            className={`h-full ${styleConfig.progressBg} transition-all duration-75 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </aside>
  );
}

