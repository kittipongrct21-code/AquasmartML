"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProfile } from "@/lib/api";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/components/providers/ToastProvider";
import { useI18n } from "@/lib/i18n-context";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export default function SignupPage() {
  const router = useRouter();
  const { showError, showSuccess, showWarning } = useToast();
  const { t: dict } = useI18n();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        setIsCheckingSession(true);

        const sessionData = await supabase.auth.getSession();
        const user = sessionData.data.session?.user ?? null;

        if (!isMounted) return;

        if (user) {
          try {
            const profile = await getProfile(user.id);

            if (!isMounted) return;

            if (profile?.role === "admin") {
              router.replace("/admin/fish");
              return;
            }
          } catch (error) {
            console.warn("Signup page profile redirect fallback:", error);
          }

          router.replace("/profile");
        }
      } catch (error) {
        console.error("Failed to check session:", error);
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password || !confirmPassword) {
      showWarning("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      showWarning("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      showWarning("Password and confirm password do not match.");
      return;
    }

    try {
      setIsSubmitting(true);

      const signupResponse = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          display_name: displayName.trim() || null,
        }),
      });

      const signupText = await signupResponse.text();
      let signupJson: { message?: string; detail?: string } = {};

      try {
        signupJson = signupText ? JSON.parse(signupText) : {};
      } catch {
        throw new Error(signupText || "Failed to create account.");
      }

      if (!signupResponse.ok) {
        throw new Error(signupJson.detail || "Failed to create account.");
      }

      showSuccess(signupJson.message || "Account created successfully.");

      try {
        const signInResult = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInResult.error) {
          throw signInResult.error;
        }

        const user = signInResult.data.user;

        if (!user) {
          router.push("/auth/login");
          router.refresh();
          return;
        }

        try {
          const profile = await getProfile(user.id);

          if (profile?.role === "admin") {
            router.push("/admin/fish");
            router.refresh();
            return;
          }
        } catch (error) {
          console.warn("Signup role lookup fallback:", error);
        }

        router.push("/profile");
        router.refresh();
      } catch (signInError) {
        console.warn("Auto sign-in after signup failed:", signInError);
        showSuccess("Account created. Please sign in to continue.");
        router.push("/auth/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to sign up:", error);
      showError(
        error instanceof Error ? error.message : "Failed to create account."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingSession) {
    return (
      <main className="min-h-screen px-4 py-8">
        <section className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">{dict.profile.checkingSession}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <section className="mx-auto max-w-md space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-blue-600">Auth</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
            {dict.auth.signupTitle}
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {dict.auth.signupDesc}
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="display-name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                {dict.auth.displayNameLabel}
              </label>
              <input
                id="display-name"
                type="text"
                autoComplete="nickname"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder={dict.auth.displayNamePlaceholder}
                className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                {dict.auth.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={dict.auth.emailPlaceholder}
                className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                {dict.auth.passwordLabel}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={dict.auth.passwordPlaceholder}
                className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <p className="mt-2 text-xs text-slate-500">
                {dict.auth.passwordTip}
              </p>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                {dict.auth.confirmPasswordLabel}
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder={dict.auth.confirmPasswordPlaceholder}
                className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSubmitting ? dict.auth.signingUp : dict.auth.submitSignup}
              </button>

              <Link
                href="/"
                className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                {dict.auth.backToHome}
              </Link>
            </div>
          </form>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-600">{dict.auth.hasAccount}</p>

          <div className="mt-4">
            <Link
              href="/auth/login"
              className="inline-flex rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              {dict.auth.submitLogin}
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}