"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AccessGuard from "@/components/guards/AccessGuard";
import { Home, LayoutDashboard, Fish, Users, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/components/providers/ToastProvider";
import { useI18n } from "@/lib/i18n-context"; // ✅ ดึงระบบสลับภาษาเข้ามาควบคุมเมนูข้าง

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { locale } = useI18n(); // ✅ เรียกใช้เช็กภาษาปัจจุบัน (th / en)

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
      {/* 🛠️ ไม้ตายทลายความสูงย้วย: 
          หักลบความสูงแถบบนออกด้วย calc(100vh - 76px) และล็อกพื้นที่ด้วย overflow-hidden ไม่ให้หน้าจอยืดตามเนื้อหา */}
      <div 
        className="bg-slate-50 flex flex-col md:flex-row overflow-hidden w-full"
        style={{ height: "calc(100vh - 76px)" }}
      >
        
        {/* 📁 Sidebar: จำกัดความสูงให้อยู่ในบล็อก h-full พอดีกับหน้าจอ ไม่ลากยาวเกินจริง */}
        <aside className="w-full md:w-64 bg-white text-slate-700 flex flex-col justify-between shrink-0 border-r border-slate-200 shadow-sm h-full">
          <div>
            {/* ชุดลิงก์เมนูนำทางสไตล์สีน้ำเงิน-ขาว พร้อมระบบสลับ 2 ภาษาอัตโนมัติ */}
            <nav className="p-4 space-y-1">
              <SidebarLink 
                href="/" 
                icon={<Home className="h-5 w-5" />} 
                label={locale === "th" ? "หน้าแรก" : "Home"} 
                active={pathname === "/"} 
              />
              <SidebarLink 
                href="/admin" 
                icon={<LayoutDashboard className="h-5 w-5" />} 
                label={locale === "th" ? "แดชบอร์ดแอดมิน" : "Admin Dashboard"} 
                active={pathname === "/admin"} 
              />
              <SidebarLink 
                href="/admin/fish" 
                icon={<Fish className="h-5 w-5" />} 
                label={locale === "th" ? "จัดการข้อมูลปลา" : "Fish Management"} 
                active={pathname.startsWith("/admin/fish")} 
              />
              <SidebarLink 
                href="/admin/users" 
                icon={<Users className="h-5 w-5" />} 
                label={locale === "th" ? "จัดการผู้ใช้งาน" : "User Management"} 
                active={pathname.startsWith("/admin/users")} 
              />
            </nav>
          </div>

          {/* ปุ่มออกจากระบบล็อกพิกัดไว้ที่ท้าย Sidebar ด้านล่างสุดพอดีจอ */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 transition duration-200"
            >
              <LogOut className="h-5 w-5 text-rose-500" />
              {locale === "th" ? "ออกจากระบบ" : "Sign Out"}
            </button>
          </div>
        </aside>

        {/* 🖥️ กล่องพื้นที่เนื้อหาขวามือ: 
            ปล่อยให้เลื่อนขึ้นลง (Scroll) อิสระเฉพาะฝั่งเนื้อหาเมื่อข้อมูลยาว โดยแถบเมนูข้างจะถูกตรึงนิ่งอยู่กับที่ */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto">
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