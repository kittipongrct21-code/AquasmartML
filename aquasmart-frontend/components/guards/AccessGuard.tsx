"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getProfile } from "@/lib/api";
import { supabase } from "@/lib/supabase-client";
import { Loader2 } from "lucide-react";

interface AccessGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
  mode?: "auth" | "admin";
}

export function AccessGuard({
  children,
  requireAuth = false,
  fallback,
  mode = "auth",
}: AccessGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let active = true;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;

        const signedIn = !!session;
        const needsAuth = requireAuth || mode === "admin";

        setIsAuthenticated(signedIn);

        if (needsAuth && !session) {
          router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }

        if (mode === "admin" && session?.user) {
          const profile = await getProfile(session.user.id);
          if (!active) return;

          const allowed = profile?.role === "admin";
          setIsAuthorized(allowed);

          if (!allowed) {
            router.push("/profile");
            return;
          }
        } else {
          setIsAuthorized(signedIn || !needsAuth);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        if (!active) return;
        setIsAuthorized(false);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const signedIn = !!session;
      const needsAuth = requireAuth || mode === "admin";

      setIsAuthenticated(signedIn);

      if (needsAuth && !session) {
        router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
        setIsAuthorized(false);
        return;
      }

      if (mode !== "admin") {
        setIsAuthorized(signedIn || !needsAuth);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router, pathname, requireAuth, mode]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if ((requireAuth || mode === "admin") && !isAuthenticated) {
    return fallback ? <>{fallback}</> : null;
  }

  if (mode === "admin" && !isAuthorized) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

export default AccessGuard;
