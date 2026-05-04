import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AquaSmart ML Admin",
  description: "Admin dashboard for AquaSmart ML",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}