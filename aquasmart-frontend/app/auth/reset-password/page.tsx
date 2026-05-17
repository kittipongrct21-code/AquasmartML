"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/components/providers/ToastProvider";
import { useI18n } from "@/lib/i18n-context";
import ValidationModal from "@/components/common/ValidationModal";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { showSuccess } = useToast();
  const { locale } = useI18n();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canReset, setCanReset] = useState(false);
  const [errorModal, setErrorModal] = useState({
    open: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        setCanReset(!!data.session);
      } catch (error) {
        console.error("Reset password bootstrap failed:", error);
      } finally {
        if (active) {
          setIsCheckingSession(false);
        }
      }
    }

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setCanReset(!!session);
        setIsCheckingSession(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorModal({ open: false, title: "", message: "" });

    if (!password || !confirmPassword) {
      setErrorModal({
        open: true,
        title: locale === "th" ? "ข้อมูลไม่ครบถ้วน" : "Missing information",
        message:
          locale === "th"
            ? "กรุณากรอกรหัสผ่านใหม่ให้ครบทั้งสองช่อง"
            : "Please fill in both password fields.",
      });
      return;
    }

    if (password.length < 6) {
      setErrorModal({
        open: true,
        title: locale === "th" ? "รหัสผ่านสั้นเกินไป" : "Password too short",
        message:
          locale === "th"
            ? "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร"
            : "Your new password must be at least 6 characters.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setErrorModal({
        open: true,
        title: locale === "th" ? "รหัสผ่านไม่ตรงกัน" : "Passwords do not match",
        message:
          locale === "th"
            ? "กรุณาตรวจสอบรหัสผ่านใหม่และยืนยันรหัสผ่านอีกครั้ง"
            : "Please make sure both passwords match.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      showSuccess(
        locale === "th"
          ? "ตั้งรหัสผ่านใหม่สำเร็จแล้ว"
          : "Your password has been reset successfully."
      );
      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.error("Failed to reset password:", error);
      setErrorModal({
        open: true,
        title: locale === "th" ? "รีเซ็ตรหัสผ่านไม่สำเร็จ" : "Reset failed",
        message:
          error instanceof Error
            ? error.message
            : locale === "th"
            ? "ไม่สามารถตั้งรหัสผ่านใหม่ได้"
            : "Unable to reset your password.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingSession) {
    return (
      <main className="min-h-screen px-4 py-8">
        <section className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">
            {locale === "th" ? "กำลังตรวจสอบลิงก์รีเซ็ต..." : "Checking reset link..."}
          </p>
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
            {locale === "th" ? "ตั้งรหัสผ่านใหม่" : "Reset Password"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {locale === "th"
              ? "ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณจากลิงก์ที่ส่งไปทางอีเมล"
              : "Create a new password for your account using the reset link from your email."}
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          {canReset ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  {locale === "th" ? "รหัสผ่านใหม่" : "New Password"}
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  {locale === "th" ? "ยืนยันรหัสผ่านใหม่" : "Confirm New Password"}
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSubmitting
                    ? locale === "th"
                      ? "กำลังบันทึก..."
                      : "Saving..."
                    : locale === "th"
                    ? "บันทึกรหัสผ่านใหม่"
                    : "Save New Password"}
                </button>

                <Link
                  href="/auth/login"
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  {locale === "th" ? "กลับหน้าเข้าสู่ระบบ" : "Back to Login"}
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-amber-50 px-4 py-4 text-sm text-amber-700">
                {locale === "th"
                  ? "ลิงก์รีเซ็ตรหัสผ่านนี้อาจหมดอายุหรือไม่สมบูรณ์ กรุณาขออีเมลรีเซ็ตใหม่อีกครั้ง"
                  : "This reset link may be invalid or expired. Please request a new password reset email."}
              </div>

              <Link
                href="/auth/forgot-password"
                className="inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                {locale === "th" ? "ขอลิงก์ใหม่" : "Request New Link"}
              </Link>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
