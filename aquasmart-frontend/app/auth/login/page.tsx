"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/components/providers/ToastProvider";
import { useI18n } from "@/lib/i18n-context";
import ValidationModal from "@/components/common/ValidationModal";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { showSuccess } = useToast();
  const { t: dict, locale } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorModal, setErrorModal] = useState({
    open: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        setIsCheckingSession(true);
        const sessionData = await supabase.auth.getSession();
        const user = sessionData.data.session?.user ?? null;

        if (!isMounted) return;
        if (user) {
          router.replace("/profile");
        }
      } catch {
        // Ignore session bootstrap errors on the login page.
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorModal({ open: false, title: "", message: "" });

    if (!email.trim() || !password) {
      setErrorModal({
        open: true,
        title: locale === "th" ? "ข้อมูลไม่ครบถ้วน" : "Missing information",
        message: locale === "th" ? "กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน" : "Please enter both email and password.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
      if (!data.user) {
        throw new Error("Login succeeded but user session was not returned.");
      }

      showSuccess(
        locale === "th"
          ? "เข้าสู่ระบบสำเร็จ กำลังพาคุณไปยังหน้าโปรไฟล์..."
          : "Login successful! Redirecting to profile..."
      );
      router.push("/profile");
      router.refresh();
    } catch (error: unknown) {
      console.error("Failed to sign in:", error);

      const errorMessage = error instanceof Error ? error.message : "";
      const message =
        errorMessage.includes("Invalid login") ||
        errorMessage.includes("Incorrect password")
          ? (locale === "th"
              ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง"
              : "Invalid email or password. Please try again.")
          : (locale === "th"
              ? "เกิดข้อผิดพลาดในการเชื่อมต่อระบบ กรุณาลองใหม่อีกครั้ง"
              : "A connection error occurred. Please try again.");

      setErrorModal({
        open: true,
        title: locale === "th" ? "เข้าสู่ระบบไม่สำเร็จ" : "Login Failed",
        message,
      });
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
      <ValidationModal
        isOpen={errorModal.open}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal((prev) => ({ ...prev, open: false }))}
      />

      <section className="mx-auto max-w-md space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-blue-600">Auth</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
            {dict.auth.loginTitle}
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {dict.auth.loginDesc}
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <form onSubmit={handleSubmit} className="space-y-5">
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
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={dict.auth.passwordPlaceholder}
                  className="block w-full rounded-2xl border border-slate-200 bg-white pl-4 pr-12 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="mt-3 text-right">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                >
                  {locale === "th" ? "ลืมรหัสผ่าน?" : "Forgot password?"}
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSubmitting ? dict.auth.signingIn : dict.auth.submitLogin}
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
          <p className="text-sm text-slate-600">{dict.auth.noAccount}</p>
          <div className="mt-4">
            <Link
              href="/auth/signup"
              className="inline-flex rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              {dict.auth.submitSignup}
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
