"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  type Profile,
} from "@/lib/api";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/components/providers/ToastProvider";

type SessionUser = {
  id: string;
  email?: string | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const { showError, showSuccess, showWarning } = useToast();

  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        setIsCheckingSession(true);
        setPageError("");

        const sessionData = await supabase.auth.getSession();
        const user = sessionData.data.session?.user ?? null;

        if (!isMounted) return;

        if (!user) {
          setSessionUser(null);
          setProfile(null);
          return;
        }

        setSessionUser({
          id: user.id,
          email: user.email ?? null,
        });
      } catch (error) {
        console.error("Failed to check session:", error);
        if (!isMounted) return;

        const message =
          error instanceof Error ? error.message : "Failed to load session.";
        setPageError(message);
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
        setProfile(null);
        setDisplayName("");
        setAvatarPreview("");
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
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!sessionUser?.id) return;

      try {
        setIsLoadingProfile(true);
        setPageError("");

        const backendProfile = await getProfile(sessionUser.id);

        if (!isMounted) return;

        const mergedProfile: Profile = {
          ...backendProfile,
          email: backendProfile.email || sessionUser.email || null,
        };

        setProfile(mergedProfile);
        setDisplayName(mergedProfile.display_name || "");
        setAvatarPreview(mergedProfile.avatar_url || "");
      } catch (error) {
        console.error("Failed to load profile:", error);

        if (!isMounted) return;

        const fallbackProfile: Profile = {
          id: sessionUser.id,
          email: sessionUser.email || null,
          display_name: "",
          avatar_url: null,
          role: "user",
        };

        setProfile(fallbackProfile);
        setDisplayName("");
        setAvatarPreview("");

        const message =
          error instanceof Error ? error.message : "Failed to load profile.";
        setPageError(message);
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [sessionUser?.id, sessionUser?.email]);

  const emailValue = useMemo(() => {
    return profile?.email || sessionUser?.email || "Not available";
  }, [profile, sessionUser]);

  const roleValue = useMemo(() => {
    return profile?.role || "user";
  }, [profile]);

  async function handleSaveProfile() {
    if (!sessionUser?.id) {
      showWarning("You must sign in first.");
      return;
    }

    if (!displayName.trim()) {
      showWarning("Display name cannot be empty.");
      return;
    }

    try {
      setIsSavingProfile(true);

      const response = await updateProfile(sessionUser.id, {
        display_name: displayName.trim(),
      });

      const nextProfile: Profile = {
        ...(profile || {
          id: sessionUser.id,
          email: sessionUser.email || null,
          role: "user",
        }),
        display_name: displayName.trim(),
      };

      if (response?.data) {
        Object.assign(nextProfile, response.data);
      }

      if (!nextProfile.email) {
        nextProfile.email = sessionUser.email || null;
      }

      setProfile(nextProfile);
      showSuccess("Profile updated successfully.");
    } catch (error) {
      console.error("Failed to update profile:", error);
      showError(
        error instanceof Error ? error.message : "Failed to update profile."
      );
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !sessionUser?.id) return;

    if (!file.type.startsWith("image/")) {
      showWarning("Please select an image file.");
      event.target.value = "";
      return;
    }

    try {
      setIsUploadingAvatar(true);

      const localPreview = URL.createObjectURL(file);
      setAvatarPreview(localPreview);

      const response = await uploadAvatar(sessionUser.id, file);
      const avatarUrl = response.avatar_url;

      setProfile((prev) => ({
        ...(prev || {
          id: sessionUser.id,
          email: sessionUser.email || null,
          role: "user",
        }),
        avatar_url: avatarUrl,
      }));

      setAvatarPreview(avatarUrl);
      showSuccess("Avatar uploaded successfully.");
      URL.revokeObjectURL(localPreview);
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      showError(
        error instanceof Error ? error.message : "Failed to upload avatar."
      );
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  }

  async function handleSignOut() {
    try {
      setIsSigningOut(true);
      await supabase.auth.signOut();
      showSuccess("Signed out successfully.");
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Failed to sign out:", error);
      showError(error instanceof Error ? error.message : "Failed to sign out.");
    } finally {
      setIsSigningOut(false);
    }
  }

  if (isCheckingSession) {
    return (
      <main className="min-h-screen px-4 py-8">
        <section className="mx-auto max-w-5xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Checking session...</p>
        </section>
      </main>
    );
  }

  if (!sessionUser) {
    return (
      <main className="min-h-screen px-4 py-8">
        <section className="mx-auto max-w-5xl space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-semibold text-blue-600">Profile</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              Account Profile
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Sign in to manage your personal profile, avatar, password, and
              prediction history.
            </p>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="rounded-2xl bg-amber-50 px-4 py-4 text-sm text-amber-700">
              You are not signed in right now.
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Link
                href="/auth/login"
                className="rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Sign In
              </Link>

              <Link
                href="/auth/signup"
                className="rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Create Account
              </Link>

              <Link
                href="/"
                className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                Back to Home
              </Link>
            </div>
          </section>
        </section>
      </main>
    );
  }

  if (isLoadingProfile && !profile) {
    return (
      <main className="min-h-screen px-4 py-8">
        <section className="mx-auto max-w-5xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Loading profile...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <section className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">Profile</p>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
                Account Profile
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Manage your account information, upload an avatar, and access
                your personal settings.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSigningOut ? "Signing out..." : "Logout"}
            </button>
          </div>
        </section>

        {pageError ? (
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700">
              {pageError}
            </div>
          </section>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-4 ring-slate-100">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-slate-400">AS</span>
                )}
              </div>

              <h2 className="mt-4 text-xl font-bold text-slate-900">
                {displayName || "AquaSmart User"}
              </h2>

              <p className="mt-1 break-all text-sm text-slate-500">
                {emailValue}
              </p>

              <div className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Role: {roleValue}
              </div>

              <div className="mt-5 w-full">
                <label
                  htmlFor="avatar-upload"
                  className="inline-flex w-full cursor-pointer items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  {isUploadingAvatar ? "Uploading..." : "Upload Avatar"}
                </label>

                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                Basic Information
              </h2>

              <div className="mt-5 grid gap-4">
                <div>
                  <label
                    htmlFor="display-name"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Display Name
                  </label>
                  <input
                    id="display-name"
                    type="text"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Enter your display name"
                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {emailValue}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isSavingProfile ? "Saving..." : "Save Profile"}
                  </button>

                  <Link
                    href="/history"
                    className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    View History
                  </Link>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                Security Settings
              </h2>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                Open the dedicated password page to update your current password
                with a proper form and validation flow.
              </p>

              <div className="mt-4">
                <Link
                  href="/profile/change-password"
                  className="inline-flex rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Change Password
                </Link>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                Quick Actions
              </h2>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Link
                  href="/identify"
                  className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Identify Fish
                </Link>

                <Link
                  href="/fish"
                  className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Browse Fish
                </Link>

                <Link
                  href="/history"
                  className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Prediction History
                </Link>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}