"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sb } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import { Field, Spinner, btnPrimary, inputCls } from "@/components/ui";
import { getUserRole, roleHome } from "@/app/actions";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthForm() {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function validate() {
    const e: typeof errors = {};
    if (!email.trim()) e.email = "Email is required.";
    else if (!emailRe.test(email)) e.email = "Enter a valid email address.";
    if (!password) e.password = "Password is required.";
    else if (password.length < 6) e.password = "Password must be at least 6 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setBusy(true);
    try {
      const supabase = sb();
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setFormError(error.message);
          toast("error", error.message);
        } else {
          toast("success", "Welcome back!");
          const role = await getUserRole();
          router.replace(await roleHome(role));
        }
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setFormError(error.message);
          toast("error", error.message);
        } else if (data.session) {
          toast("success", "Account created!");
          const role = await getUserRole();
          router.replace(await roleHome(role));
        } else {
          toast("success", "Check your inbox to confirm your email, then log in.");
          setTab("login");
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-surface-container-lowest rounded-xl p-6 shadow-bloom border border-[#E2E8F0] relative z-10">
      {/* Tabs */}
      <div className="flex border-b border-outline-variant mb-6">
        {(["login", "signup"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setFormError(null);
              setErrors({});
            }}
            className={`flex-1 pb-3 text-center text-title-lg transition-colors ${
              tab === t ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-primary"
            }`}
          >
            {t === "login" ? "Login" : "Sign Up"}
          </button>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-headline-md mb-2">{tab === "login" ? "Welcome back" : "Create your account"}</h2>
        <p className="text-body-sm text-on-surface-variant">
          {tab === "login" ? "Please enter your details to sign in." : "Start managing your classes in minutes."}
        </p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <Field label="Email Address" error={errors.email}>
          <input
            type="email"
            autoComplete="email"
            className={inputCls}
            placeholder="teacher@school.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" error={errors.password}>
          <input
            type="password"
            autoComplete={tab === "login" ? "current-password" : "new-password"}
            className={inputCls}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {formError && (
          <p className="text-body-sm text-error bg-error-container/50 rounded-md px-3 py-2">{formError}</p>
        )}

        <button type="submit" disabled={busy} className={`${btnPrimary} mt-2 w-full`}>
          {busy && <Spinner />}
          {tab === "login" ? "Sign In" : "Sign Up"}
        </button>
      </form>

      <div className="mt-6 text-center text-body-sm text-on-surface-variant">
        {tab === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <button className="text-primary font-medium hover:underline" onClick={() => setTab("signup")}>
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button className="text-primary font-medium hover:underline" onClick={() => setTab("login")}>
              Log in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
