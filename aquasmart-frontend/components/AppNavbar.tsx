"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { LanguageToggle } from "./LanguageToggle";

type NavItem = {
  href: string;
  label: string;
};

const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin/fish", label: "Fish Management" },
  { href: "/admin/fish/new", label: "Add Fish" },
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
  const { t } = useI18n();

  const PUBLIC_NAV_ITEMS: NavItem[] = useMemo(() => [
    { href: "/", label: t.nav.home },
    { href: "/fish", label: t.nav.catalog },
    { href: "/identify", label: t.nav.identify },
    { href: "/history", label: t.nav.history },
    { href: "/profile", label: t.nav.profile },
  ], [t]);

  const isAdminPage = useMemo(() => pathname.startsWith("/admin"), [pathname]);
  const navItems = isAdminPage ? ADMIN_NAV_ITEMS : PUBLIC_NAV_ITEMS;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href={isAdminPage ? "/admin/fish" : "/"}
          className="flex items-center gap-3"
          onClick={() => setIsMenuOpen(false)}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50">
            <span className="text-sm font-bold text-blue-600">AS</span>
          </div>

          <div className="leading-tight">
            <p className="text-lg font-extrabold tracking-tight text-slate-900">
              AquaSmart<span className="text-blue-600">ML</span>
            </p>
            <p className="text-[11px] font-medium text-slate-500">
              {isAdminPage ? "Admin Panel" : "Fish Identification System"}
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);

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
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageToggle />
          {isAdminPage ? (
            <Link
              href="/"
              className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              Public Site
            </Link>
          ) : (
            <Link
              href="/identify"
              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              {t.nav.identify}
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-lg shadow-sm ring-1 ring-slate-200 md:hidden"
          aria-label="Open navigation menu"
        >
          ☰
        </button>
      </nav>

      {isMenuOpen ? (
        <div className="border-t border-slate-100 bg-white px-4 py-3 md:hidden">
          <div className="mx-auto grid max-w-6xl gap-2">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={
                    active
                      ? "rounded-2xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
                      : "rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  }
                >
                  {item.label}
                </Link>
              );
            })}

            {isAdminPage ? (
              <Link
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-700"
              >
                Public Site
              </Link>
            ) : (
              <Link
                href="/identify"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white"
              >
                {t.nav.identify}
              </Link>
            )}
            <div className="flex justify-center mt-2">
              <LanguageToggle />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}