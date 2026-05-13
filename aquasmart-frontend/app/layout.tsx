import type { Metadata } from "next";
import "./globals.css";
import AppNavbar from "@/components/AppNavbar";
import { ToastProvider } from "@/components/providers/ToastProvider";

export const metadata: Metadata = {
  title: "AquaSmart ML",
  description: "Fish identification and fish information web application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /**
   * IMPORTANT:
   * - Global navbar lives here
   * - Global toast provider lives here
   * - Public pages and admin pages both flow through this root layout
   *
   * FUTURE:
   * - If you add theme provider / auth provider later, add them here
   * - Do not add another top navbar inside child layouts unless you really want stacked navbars
   */
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <ToastProvider>
          <AppNavbar />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}