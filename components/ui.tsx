"use client";

import { barColor, gradeOf, initials } from "@/lib/types";

export const inputCls =
  "w-full px-4 py-2 border border-slate-200 rounded-md bg-surface-container-lowest text-on-surface placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 bg-primary text-on-primary font-medium py-2.5 px-4 rounded-md hover:bg-on-primary-fixed-variant transition-colors shadow-sm active:shadow-inner active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none";

export const btnOutline =
  "inline-flex items-center justify-center gap-2 bg-surface-container-lowest text-on-surface border border-outline-variant font-medium py-2.5 px-4 rounded-md hover:bg-surface-bright transition-colors shadow-sm disabled:opacity-60 disabled:pointer-events-none";

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-label-md text-on-surface">{label}</label>
      {children}
      {error && <p className="text-body-sm text-error">{error}</p>}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest w-full max-w-md rounded-xl shadow-xl border border-outline-variant/50 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-headline-sm mb-6">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function GradePill({ pct }: { pct: number | null }) {
  const g = gradeOf(pct);
  return (
    <span className={`text-label-md px-2 py-1 rounded whitespace-nowrap ${g.cls}`}>
      {g.label}
      {pct !== null ? ` (${Math.round(pct)}%)` : ""}
    </span>
  );
}

export function Progress({ pct }: { pct: number | null }) {
  const v = pct === null ? 0 : Math.min(100, Math.max(0, pct));
  return (
    <div className="flex items-center gap-2 min-w-32">
      <div className="flex-1 h-1.5 rounded-full bg-surface-container-high overflow-hidden">
        <div className={`h-full rounded-full ${barColor(pct)}`} style={{ width: `${v}%` }} />
      </div>
      <span className="text-label-md text-on-surface-variant w-9 text-right">
        {pct === null ? "—" : `${Math.round(pct)}%`}
      </span>
    </div>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const s = size === "lg" ? "w-16 h-16 text-xl" : size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div
      className={`${s} shrink-0 rounded-full bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center font-semibold`}
    >
      {initials(name)}
    </div>
  );
}

export function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
    />
  );
}

export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <div className="py-16 flex flex-col items-center gap-3 text-center">
      <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant text-2xl">
        {icon}
      </div>
      <p className="text-title-lg">{title}</p>
      {hint && <p className="text-body-md text-on-surface-variant max-w-xs">{hint}</p>}
    </div>
  );
}
