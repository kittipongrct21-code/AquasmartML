import type { Metadata } from "next";
import "./globals.css";
import AppNavbar from "@/components/AppNavbar";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { I18nProvider } from "@/lib/i18n-context";

export const metadata: Metadata = {
  title: "AquaSmart ML",
  description: "Fish identification and fish information web application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <I18nProvider>
          <ToastProvider>
            <AppNavbar />
            {children}
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}