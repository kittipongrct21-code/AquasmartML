"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { getProfile, type Profile } from "@/lib/api";

type SessionUser = {
  id: string;
  email?: string | null;
};

type GuardMode = "signed_in" | "admin";

export default function AccessGuard({
  mode,
  children,
}: {
  mode: GuardMode;
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        setIsLoading(true);

        const sessionData = await supabase.auth.getSession();
        const user = sessionData.data.session?.user ?? null;

        if (!isMounted) return;

        if (!user) {
          setSessionUser(null);
          setProfile(null);
          return;
        }

        const nextUser: SessionUser = {
          id: user.id,
          email: user.email ?? null,
        };

        setSessionUser(nextUser);

        try {
          const backendProfile = await getProfile(user.id);

          if (!isMounted) return;

          setProfile({
            ...backendProfile,
            email: backendProfile.email || user.email || null,
          });
        } catch (error) {
          console.warn("AccessGuard profile fallback:", error);

          if (!isMounted) return;

          setProfile({
            id: user.id,
            email: user.email ?? null,
            display_name: "",
            avatar_url: null,
            role: "user",
          });
        }
      } catch (error) {
        console.error("AccessGuard bootstrap error:", error);

        if (!isMounted) return;

        setSessionUser(null);
        setProfile(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
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
        return;
      }

      const nextUser: SessionUser = {
        id: user.id,
        email: user.email ?? null,
      };

      setSessionUser(nextUser);

      try {
        const backendProfile = await getProfile(user.id);

        setProfile({
          ...backendProfile,
          email: backendProfile.email || user.email || null,
        });
      } catch (error) {
        console.warn("AccessGuard auth change fallback:", error);

        setProfile({
          id: user.id,
          email: user.email ?? null,
          display_name: "",
          avatar_url: null,
          role: "user",
        });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-slate-500">Checking access...</p>
      </section>
    );
  }

  if (mode === "signed_in" && !sessionUser) {
    return (
      <section className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-blue-600">Access Required</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            Sign in required
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            You need to sign in before accessing this page.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="rounded-2xl bg-amber-50 px-4 py-4 text-sm text-amber-700">
            Your current session does not have access to this page.
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/profile"
              className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Open Profile / Sign In
            </Link>

            <Link
              href="/"
              className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (mode === "admin") {
    const isAdmin = Boolean(sessionUser && profile?.role === "admin");

    if (!sessionUser || !isAdmin) {
      return (
        <section className="mx-auto max-w-4xl space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-semibold text-blue-600">Admin Access</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              Admin permission required
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              This page is only available for administrator accounts.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700">
              You do not have permission to access the admin area.
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/profile"
                className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Open Profile
              </Link>

              <Link
                href="/"
                className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </section>
      );
    }
  }

  return <>{children}</>;
}