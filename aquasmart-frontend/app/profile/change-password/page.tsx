"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { changePassword } from "@/lib/api";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/components/providers/ToastProvider";
import AccessGuard from "@/components/guards/AccessGuard";
import { useI18n } from "@/lib/i18n-context";
import { Eye, EyeOff } from "lucide-react";

type SessionUser = {
  id: string;
  email?: string | null;
};

export default function ChangePasswordPage() {
  return (
    <AccessGuard requireAuth>
      <ChangePasswordPageContent />
    </AccessGuard>
  );
}

function ChangePasswordPageContent() {
  const router = useRouter();
  const { showError, showSuccess, showWarning } = useToast();
  const { t: dict, locale } = useI18n();

  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

        if (!user) {
          setSessionUser(null);
          return;
        }

        setSessionUser({
          id: user.id,
          email: user.email ?? null,
        });
      } catch (error) {
        console.error("Failed to check session:", error);
        if (!isMounted) return;

        showError(
          error instanceof Error ? error.message : "Failed to load session."
        );
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;

      if (!user) {
        setSessionUser(null);
        return;
      }

      setSessionUser({
        id: user.id,
        email: user.email ?? null,
      });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [showError]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!sessionUser?.id) {
      showWarning(locale === "th" ? "กรุณาเข้าสู่ระบบก่อน" : "You must sign in first.");
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      showWarning(locale === "th" ? "กรุณากรอกรหัสผ่านให้ครบทุกช่อง" : "Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      showWarning(locale === "th" ? "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" : "New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showWarning(locale === "th" ? "รหัสผ่านใหม่และรหัสผ่านยืนยันไม่ตรงกัน" : "New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      showWarning(locale === "th" ? "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน" : "New password must be different from current password.");
      return;
    }

    try {
      setIsSubmitting(true);

      await changePassword(sessionUser.id, {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      showSuccess(locale === "th" ? "เปลี่ยนรหัสผ่านสำเร็จแล้ว" : "Password changed successfully.");
      router.push("/profile");
      router.refresh();
    } catch (error) {
      console.error("Failed to change password:", error);
      showError(
        error instanceof Error ? error.message : (locale === "th" ? "เปลี่ยนรหัสผ่านไม่สำเร็จ" : "Failed to change password.")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingSession || !sessionUser) {
    return (
      <main className="min-h-screen px-4 py-8">
        <section className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">{dict.profile.checkingSession}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <section className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                {locale === "th" ? "ตั้งค่าบัญชี" : "Account Settings"}
              </p>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
                {dict.profile.securityTitle}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                {locale === "th"
                  ? "อัปเดตรหัสผ่านบัญชีของคุณโดยระบุรหัสผ่านปัจจุบันและตั้งรหัสผ่านใหม่ที่ปลอดภัย"
                  : "Update your password using your current password and a new secure password."}
              </p>
            </div>

            <Link
              href="/profile"
              className="rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              {dict.history.backToProfile}
            </Link>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="current-password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                {dict.profile.currentPasswordLabel}
              </label>
              <div className="relative">
                <input
                  id="current-password"
                  name="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder={dict.profile.currentPasswordPlaceholder}
                  className="block w-full rounded-2xl border border-slate-200 bg-white pl-4 pr-12 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="new-password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  {dict.profile.newPasswordLabel}
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    name="new-password"
                    type={showNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder={dict.profile.newPasswordPlaceholder}
                    className="block w-full rounded-2xl border border-slate-200 bg-white pl-4 pr-12 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {dict.profile.newPasswordTip}
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  {dict.profile.confirmNewPasswordLabel}
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder={dict.profile.confirmNewPasswordPlaceholder}
                    className="block w-full rounded-2xl border border-slate-200 bg-white pl-4 pr-12 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {locale === "th" ? "บัญชีผู้ใช้" : "Account"}
              </p>
              <p className="mt-2 break-all text-sm font-semibold text-slate-700">
                {sessionUser.email || "Signed-in account"}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSubmitting ? dict.profile.changingPassword : dict.profile.changePassword}
              </button>

              <Link
                href="/profile"
                className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                {dict.common.cancel}
              </Link>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}

