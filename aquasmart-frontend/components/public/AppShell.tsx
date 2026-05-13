"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BottomNav from "@/components/public/BottomNav";

type AppShellProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  hideHeader?: boolean;
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/history", label: "History" },
  { href: "/profile", label: "Profile" },
];

export default function AppShell({
  children,
  title,
  subtitle,
  rightSlot,
  hideHeader = false,
}: AppShellProps) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl">🐟</span>
              <span className="text-2xl font-bold text-slate-900">
                AquaSmart<span className="text-blue-600">ML</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-2 md:flex">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {rightSlot}
            <Link
              href="/profile"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 md:pb-10 md:pt-8">
        {!hideHeader && (title || subtitle) ? (
          <section className="rounded-[28px] bg-white p-6 shadow-sm sm:p-8">
            {title ? (
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                {title}
              </h1>
            ) : null}
            {subtitle ? (
              <p className="mt-3 text-base text-slate-600">{subtitle}</p>
            ) : null}
          </section>
        ) : null}

        <div className={hideHeader ? "" : "mt-6"}>{children}</div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white md:hidden">
        <BottomNav />
      </div>
    </main>
  );
}