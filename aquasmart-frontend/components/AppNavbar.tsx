"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { getProfile, type Profile } from "@/lib/api";
import { useI18n, getLocalizedValue } from "@/lib/i18n-context";
import { useToast } from "@/components/providers/ToastProvider";
import { LogOut, User, LayoutDashboard } from "lucide-react";

type SessionUser = {
  id: string;
  email?: string | null;
};

export default function AppNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { showSuccess, showError } = useToast();
  const { locale, setLocale, t: dict } = useI18n();

  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadNavbarProfile(userId: string) {
    try {
      const data = await getProfile(userId);
      setProfile(data);
    } catch (error) {
      console.error("Navbar profile fetching failed:", error);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        setIsLoading(true);
        const sessionData = await supabase.auth.getSession();
        const user = sessionData.data.session?.user ?? null;

        if (!isMounted) return;

        if (user) {
          setSessionUser({ id: user.id, email: user.email ?? null });
          await loadNavbarProfile(user.id);
        } else {
          setSessionUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("Session sync error on Navbar:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      const user = session?.user ?? null;
      if (user) {
        setSessionUser({ id: user.id, email: user.email ?? null });
        await loadNavbarProfile(user.id);
      } else {
        setSessionUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      showSuccess("Signed out successfully.");
      router.push("/");
      router.refresh();
    } catch (error: any) {
      showError(error.message || "Sign out failed.");
    }
  }

  const isAdmin = profile?.role === "admin";

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          
          {/* ส่วน Brand Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-black tracking-tight text-blue-600">
              AquaSmart<span className="text-slate-900">ML</span>
            </Link>
          </div>

          {/* แถบลิงก์เนวิเกชันหน้าสาธารณะ */}
          <div className="hidden md:flex items-center space-x-1">
            {/* ✅ เพิ่มปุ่มเมนู Home กลับมาประจำการตามคำสั่งเรียบร้อยครับ */}
            <Link
              href="/"
              className={`rounded-2xl px-4 py-2.5 text-sm font-bold transition-all ${
                pathname === "/" ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {dict.nav.home || "Home"}
            </Link>
            <Link
              href="/fish"
              className={`rounded-2xl px-4 py-2.5 text-sm font-bold transition-all ${
                pathname.startsWith("/fish") ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {dict.nav.browseFish || "Catalog"}
            </Link>
            <Link
              href="/identify"
              className={`rounded-2xl px-4 py-2.5 text-sm font-bold transition-all ${
                pathname === "/identify" ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {dict.nav.profile ? "AI Identify" : "Identify"}
            </Link>
            {sessionUser ? (
              <Link
                href="/history"
                className={`rounded-2xl px-4 py-2.5 text-sm font-bold transition-all ${
                  pathname === "/history" ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {dict.nav.predictionHistory || "History"}
              </Link>
            ) : null}
          </div>

          {/* ฝั่งขวา: เปลี่ยนภาษา, สิทธิ์ Admin Dashboard, ปุ่มล็อกอินสถานะ */}
          <div className="flex items-center space-x-4">
            
            {/* 🌐 ปุ่ม Pill Dynamic Language Toggle */}
            <div className="flex items-center rounded-2xl bg-slate-100 p-1 ring-1 ring-slate-200">
              <button
                type="button"
                onClick={() => setLocale("th")}
                className={`rounded-xl px-3 py-1.5 text-xs font-black transition-all ${
                  locale === "th" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                TH
              </button>
              <button
                type="button"
                onClick={() => setLocale("en")}
                className={`rounded-xl px-3 py-1.5 text-xs font-black transition-all ${
                  locale === "en" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                EN
              </button>
            </div>

            {/* 🛡️ ปุ่มเข้าสู่ระบบจัดการ Admin (พ่นแสดงเฉพาะ role === 'admin') */}
            {isAdmin ? (
              <Link
                href="/admin/fish"
                className="hidden sm:flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200/50 transition hover:bg-emerald-100"
              >
                <LayoutDashboard className="h-4 w-4 text-emerald-600" />
                Admin Panel
              </Link>
            ) : null}

            {/* ส่วนควบคุม Auth State */}
            {!isLoading ? (
              sessionUser ? (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/profile"
                    className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-2 ring-slate-200 hover:opacity-90"
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="User Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-slate-500" />
                    )}
                  </Link>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="rounded-2xl bg-rose-50 p-2.5 text-rose-600 transition hover:bg-rose-100 md:flex md:items-center md:gap-2 md:px-4"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden md:inline font-bold text-sm">Logout</span>
                  </button>
                </div>
              ) : (
                /* 🎯 ปุ่ม Sign In แบบ Solid CTA นำสายตาเด่นชัด */
                <Link
                  href="/auth/login"
                  className="rounded-2xl bg-blue-600 px-6 py-2.5 text-center text-sm font-extrabold text-white shadow-md shadow-blue-100 transition-all hover:bg-blue-700 active:scale-95"
                >
                  {dict.profile.signIn || "Sign In"}
                </Link>
              )
            ) : null}

          </div>

        </div>
      </div>
    </nav>
  );
}