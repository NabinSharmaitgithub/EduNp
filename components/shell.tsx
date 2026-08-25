"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { sb } from "@/lib/supabase/client";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/dashboard#classes", label: "My Classes", icon: "school" },
];

export function Shell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await sb().auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <nav className="hidden md:flex flex-col h-full py-6 fixed left-0 top-0 w-sidebar bg-surface-container-lowest border-r border-outline-variant shadow-sm z-50">
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              school
            </span>
          </div>
          <div>
            <h1 className="text-headline-md font-bold text-primary">EduAdmin</h1>
            <p className="text-body-sm text-on-surface-variant">Academic Management</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-1 px-4">
          {NAV.map((item) => {
            const active =
              item.href === "/dashboard" ? pathname === "/dashboard" && !item.href.includes("#") : false;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-r-lg font-semibold text-body-md transition-colors border-l-4 ${
                  active
                    ? "bg-primary-fixed text-on-primary-fixed-variant border-primary-container"
                    : "text-on-surface-variant hover:bg-surface-container-high border-transparent"
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="px-6 mt-auto flex flex-col gap-4">
          <div className="pt-4 border-t border-outline-variant flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-secondary-container/40 text-on-secondary-container flex items-center justify-center font-semibold">
              {email[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-body-sm truncate">{email}</p>
              <button
                onClick={logout}
                disabled={loggingOut}
                className="text-body-sm text-error hover:underline disabled:opacity-60"
              >
                {loggingOut ? "Signing out…" : "Log out"}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="md:ml-sidebar min-h-screen flex flex-col">{children}</main>
    </div>
  );
}
