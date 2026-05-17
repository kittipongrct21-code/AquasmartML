"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/components/providers/ToastProvider";
import { useI18n } from "@/lib/i18n-context";
import ValidationModal from "@/components/common/ValidationModal";

export default function ForgotPasswordPage() {
  const { showSuccess } = useToast();
  const { t: dict, locale } = useI18n();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorModal, setErrorModal] = useState({
    open: false,
    title: "",
    message: "",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorModal({ open: false, title: "", message: "" });

    if (!email.trim()) {
      setErrorModal({
        open: true,
        title: locale === "th" ? "ข้อมูลไม่ครบถ้วน" : "Missing information",
        message:
          locale === "th"
            ? "กรุณากรอกอีเมลที่ใช้เข้าสู่ระบบ"
            : "Please enter your account email.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const redirectTo = `${window.location.origin}/auth/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) throw error;

      setIsSent(true);
      showSuccess(
        locale === "th"
          ? "ส่งอีเมลรีเซ็ตรหัสผ่านแล้ว กรุณาตรวจสอบกล่องจดหมายของคุณ"
          : "Password reset email sent. Please check your inbox."
      );
    } catch (error) {
      console.error("Failed to send reset password email:", error);
      setErrorModal({
        open: true,
        title: locale === "th" ? "ส่งอีเมลไม่สำเร็จ" : "Request failed",
        message:
          error instanceof Error
            ? error.message
            : locale === "th"
            ? "ไม่สามารถส่งอีเมลรีเซ็ตรหัสผ่านได้"
            : "Unable to send password reset email.",
      });
    } finally {
      setIsSubmitting(false);
    }
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
            {locale === "th" ? "ลืมรหัสผ่าน" : "Forgot Password"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {locale === "th"
              ? "กรอกอีเมลที่ใช้สมัคร ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้"
              : "Enter your account email and we will send you a password reset link."}
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

            {isSent ? (
              <div className="rounded-2xl bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
                {locale === "th"
                  ? "ส่งอีเมลรีเซ็ตรหัสผ่านแล้ว กรุณาเช็กอีเมลและกดลิงก์ในข้อความ"
                  : "Reset email has been sent. Please check your inbox and open the link."}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSubmitting
                  ? locale === "th"
                    ? "กำลังส่ง..."
                    : "Sending..."
                  : locale === "th"
                  ? "ส่งลิงก์รีเซ็ต"
                  : "Send Reset Link"}
              </button>

              <Link
                href="/auth/login"
                className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                {locale === "th" ? "กลับหน้าเข้าสู่ระบบ" : "Back to Login"}
              </Link>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}
