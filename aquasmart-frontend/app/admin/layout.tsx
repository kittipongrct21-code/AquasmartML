import type { ReactNode } from "react";
import AccessGuard from "@/components/guards/AccessGuard";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AccessGuard mode="admin">
      <main className="min-h-screen bg-slate-100">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {children}
        </div>
      </main>
    </AccessGuard>
  );
}