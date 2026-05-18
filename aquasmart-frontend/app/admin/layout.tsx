"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AccessGuard from "@/components/guards/AccessGuard";
import { Home, LayoutDashboard, Fish, Users, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/components/providers/ToastProvider";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { showSuccess, showError } = useToast();

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

  return (
    <AccessGuard mode="admin">
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
        
        {/* 📁 Sidebar ปรับดีไซน์ใหม่เป็นโทนสีขาว-น้ำเงินตามสั่ง */}
        <aside className="w-full md:w-64 bg-white text-slate-700 flex flex-col justify-between shrink-0 border-r border-slate-200 shadow-sm">
          <div>
            
            {/* ส่วนป้ายหัวข้อปรับดีไซน์ใหม่ให้เข้าคู่กัน */}
            {/* <div className="h-20 flex items-center px-6 border-b border-slate-200 bg-white">
              <span className="text-xl font-black tracking-tight text-blue-600">
                AquaSmart<span className="text-slate-900">Admin</span>
              </span>
            </div> */}

            {/* ชุดลิงก์เมนูนำทางสไตล์สีขาว-น้ำเงินนำสายตา */}
            <nav className="p-4 space-y-1">
              <SidebarLink 
                href="/" 
                icon={<Home className="h-5 w-5" />} 
                label="Home" 
                active={pathname === "/"} 
              />
              <SidebarLink 
                href="/admin" 
                icon={<LayoutDashboard className="h-5 w-5" />} 
                label="Admin Dashboard" 
                active={pathname === "/admin"} 
              />
              <SidebarLink 
                href="/admin/fish" 
                icon={<Fish className="h-5 w-5" />} 
                label="Fish Management" 
                active={pathname.startsWith("/admin/fish")} 
              />
              <SidebarLink 
                href="/admin/users" 
                icon={<Users className="h-5 w-5" />} 
                label="User Management" 
                active={pathname.startsWith("/admin/users")} 
              />
            </nav>
          </div>

          {/* ปุ่มออกจากระบบดีไซน์แบบคลีนตัดขอบด้านล่าง */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 transition duration-200"
            >
              <LogOut className="h-5 w-5 text-rose-500" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* 🖥️ พื้นที่แสดงผลเนื้อหาระบบ */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="p-4 sm:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>

      </div>
    </AccessGuard>
  );
}

function SidebarLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
        active 
          ? "bg-blue-600 text-white shadow-md shadow-blue-200/80" 
          : "text-slate-600 hover:bg-slate-100 hover:text-blue-600"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}