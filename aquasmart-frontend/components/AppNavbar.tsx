"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { LanguageToggle } from "./LanguageToggle";

type NavItem = {
  href: string;
  label: string;
  translationKey: string; // ← เพิ่มฟิลด์นี้เพื่อแมปตรงๆ
};

const PUBLIC_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", translationKey: "home" },
  { href: "/fish", label: "Browse & Search", translationKey: "catalog" },
  { href: "/identify", label: "AI Identify", translationKey: "identify" },
  { href: "/history", label: "History", translationKey: "history" },
  { href: "/profile", label: "Profile", translationKey: "profile" },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin/fish", label: "Fish Management", translationKey: "title" },
  { href: "/admin/fish/new", label: "Add Fish", translationKey: "addNew" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppNavbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, locale } = useI18n();

  const isAdminPage = useMemo(() => pathname.startsWith("/admin"), [pathname]);
  const navItems = isAdminPage ? ADMIN_NAV_ITEMS : PUBLIC_NAV_ITEMS;

  // Safety check: ถ้า t หรือ t.nav ยังไม่พร้อม ให้ใช้ค่าสำรอง
  const getNavLabel = (item: NavItem) => {
    try {
      if (!t?.nav) return item.label;
      const key = item.translationKey as keyof typeof t.nav;
      const value = (t.nav as any)[key];
      return typeof value === "string" && value.trim() ? value : item.label;
    } catch {
      return item.label;
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href={isAdminPage ? "/admin/fish" : "/"} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white font-bold shadow-lg shadow-blue-500/20">
            AS
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              AquaSmart <span className="text-blue-600">ML</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">
              {isAdminPage ? "Admin Panel" : "Fish Identification System"}
            </p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const label = getNavLabel(item);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "rounded-2xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
                    : "rounded-2xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                }
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Link
            href="/identify"
            className="hidden sm:inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition"
          >
            {getNavLabel({ href: "/identify", label: "Identify", translationKey: "identify" })}
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden rounded-xl bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMenuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              const label = getNavLabel(item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}