"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Toast = { id: number; type: "success" | "error"; msg: string };

const ToastCtx = createContext<(type: Toast["type"], msg: string) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((type: Toast["type"], msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-enter px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 font-body-md text-body-md ${
              t.type === "success"
                ? "bg-secondary text-on-secondary"
                : "bg-error text-on-error"
            }`}
          >
            <span className="text-base leading-none">{t.type === "success" ? "✔" : "✖"}</span>
            <span>{t.msg}</span>
            <button
              className="ml-2 opacity-80 hover:opacity-100"
              onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
