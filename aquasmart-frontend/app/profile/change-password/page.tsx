"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { changePassword } from "@/lib/api";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/components/providers/ToastProvider";
import AccessGuard from "@/components/guards/AccessGuard";

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

  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
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
      showWarning("You must sign in first.");
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      showWarning("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      showWarning("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showWarning("New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      showWarning("New password must be different from current password.");
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

      showSuccess("Password changed successfully.");
      router.push("/profile");
      router.refresh();
    } catch (error) {
      console.error("Failed to change password:", error);
      showError(
        error instanceof Error ? error.message : "Failed to change password."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingSession || !sessionUser) {
    return (
      <main className="min-h-screen px-4 py-8">
        <section className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Checking session...</p>
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
              <p className="text-sm font-semibold text-blue-600">Security</p>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
                Change Password
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Update your password using your current password and a new secure
                password.
              </p>
            </div>

            <Link
              href="/profile"
              className="rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Back to Profile
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
                Current Password
              </label>
              <input
                id="current-password"
                name="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Enter current password"
                className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="new-password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  New Password
                </label>
                <input
                  id="new-password"
                  name="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Enter new password"
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Must be at least 6 characters.
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Account
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
                {isSubmitting ? "Updating..." : "Change Password"}
              </button>

              <Link
                href="/profile"
                className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Cancel
              </Link>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}
