"use client";

import { usePathname } from "next/navigation";
import PublicNavbar from "@/components/public/PublicNavbar";

export default function PublicShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <PublicNavbar />
      <div className="pb-24 md:pb-0">{children}</div>
    </>
  );
}