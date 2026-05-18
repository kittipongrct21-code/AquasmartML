import type { Metadata } from "next";
import "./globals.css";
import AppNavbar from "@/components/AppNavbar";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { I18nProvider } from "@/lib/i18n-context";

export const metadata: Metadata = {
  title: "AquaSmart ML - Fish Prediction",
  description: "Fish prediction and fish information web application",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <I18nProvider>
          <ToastProvider>
            <AppNavbar />
            {/* มาตรฐาน Padding ทุกหน้า */}
            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
              {children}
            </main>
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
