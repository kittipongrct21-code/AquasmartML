"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/components/providers/ToastProvider";
import { useI18n } from "@/lib/i18n-context";
import ValidationModal from "@/components/common/ValidationModal";

export default function SignupPage() {
  const router = useRouter();
  const { showSuccess } = useToast();
  const { t: dict } = useI18n();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      } catch (error) {
        console.error("Failed to check session:", error);
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

    // 1. Validate ข้อมูลเบื้องต้น
    if (!email.trim() || !password || !confirmPassword) {
      setErrorModal({
        open: true,
        title: "ข้อมูลไม่ครบถ้วน",
        message: "กรุณากรอกอีเมลและรหัสผ่านให้ครบทุกช่อง",
      });
      return;
    }

    if (password.length < 6) {
      setErrorModal({
        open: true,
        title: "รหัสผ่านสั้นเกินไป",
        message: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
      });
      return;
    }

    if (password !== confirmPassword) {
      setErrorModal({
        open: true,
        title: "รหัสผ่านไม่ตรงกัน",
        message: "กรุณาตรวจสอบรหัสผ่านและยืนยันรหัสผ่านอีกครั้ง",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // 2. เรียกใช้ Supabase ฝั่ง Frontend โดยตรงแทนการยิง fetch ไปหา Backend
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      // ดักจับ Error จาก Supabase
      if (authError) {
        const isAlreadyRegistered = authError.message.toLowerCase().includes("already registered");
        throw new Error(isAlreadyRegistered ? "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ" : authError.message);
      }

      // 3. ถ้าได้ User กลับมา ให้สร้าง Profile ต่อเลยโดยตรง
      if (authData.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: authData.user.id,
          email: email.trim(),
          display_name: displayName.trim() || email.split("@")[0],
          role: "user", // กำหนด Role พื้นฐาน
        });

        if (profileError) {
          console.warn("Profile creation warning:", profileError);
        }
      }

      // 💡 แก้ปัญหาตัวแดง: ใช้ String แทนการดึงจาก dict ที่ยังไม่มีคีย์นี้
      showSuccess("สร้างบัญชีสำเร็จ! / Account created successfully.");

      // 4. เช็กว่า Supabase Auto-login ให้หรือยัง
      if (authData.session) {
        router.push("/profile");
      } else {
        router.push("/auth/login");
      }
      router.refresh();

    } catch (error) {
      console.error("Failed to sign up:", error);
      setErrorModal({
        open: true,
        title: "สร้างบัญชีไม่สำเร็จ",
        message: error instanceof Error ? error.message : "Failed to create account.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingSession) {
    return (
      <main className="min-h-screen px-4 py-8">
        <section className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">{dict?.profile?.checkingSession || "Checking..."}</p>
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
            {dict?.auth?.signupTitle || "Sign Up"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {dict?.auth?.signupDesc || "Create a new account"}
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="display-name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                {dict?.auth?.displayNameLabel || "Display Name"}
              </label>
              <input
                id="display-name"
                type="text"
                autoComplete="nickname"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder={dict?.auth?.displayNamePlaceholder || "Your name"}
                className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                {dict?.auth?.emailLabel || "Email"}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={dict?.auth?.emailPlaceholder || "your@email.com"}
                className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                {dict?.auth?.passwordLabel || "Password"}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={dict?.auth?.passwordPlaceholder || "Password"}
                className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <p className="mt-2 text-xs text-slate-500">
                {dict?.auth?.passwordTip || "Min 6 characters"}
              </p>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                {dict?.auth?.confirmPasswordLabel || "Confirm Password"}
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder={dict?.auth?.confirmPasswordPlaceholder || "Confirm password"}
                className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSubmitting ? (dict?.auth?.signingUp || "Creating...") : (dict?.auth?.submitSignup || "Sign Up")}
              </button>

              <Link
                href="/"
                className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                {dict?.auth?.backToHome || "Back to Home"}
              </Link>
            </div>
          </form>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-600">{dict?.auth?.hasAccount || "Already have an account?"}</p>
          <div className="mt-4">
            <Link
              href="/auth/login"
              className="inline-flex rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              {dict?.auth?.submitLogin || "Log in"}
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}