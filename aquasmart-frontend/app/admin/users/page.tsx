"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Search, Mail, Calendar, AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

type UserProfile = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  updated_at: string | null;
};

export default function AdminUsersPage() {
  const { locale } = useI18n();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  async function loadUsersData() {
    try {
      setIsLoading(true);
      setPageError("");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setUsers(data || []);
    } catch (error: any) {
      console.error("User manager routine crash:", error);
      setPageError(
        locale === "th" 
          ? "ไม่สามารถเชื่อมต่อฐานข้อมูลรายชื่อผู้ใช้งานระบบได้" 
          : "Failed to establish connection with Supabase database profiles."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsersData();
  }, []);

  const filteredUsers = users.filter(user => 
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (user.display_name && user.display_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 animate-pulse">
          <div className="h-8 bg-slate-200 rounded-xl w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded-xl w-2/3 mt-3"></div>
        </section>
        <section className="h-64 bg-white rounded-3xl shadow-sm ring-1 ring-slate-200 animate-pulse"></section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* ส่วนหัวหน้าจัดการผู้ใช้ */}
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div>
          <p className="text-sm font-semibold text-blue-600">Admin Control Panel</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
            {locale === "th" ? "จัดการผู้ใช้งาน" : "User Management"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {locale === "th" 
              ? "ดึงรายชื่อและข้อมูลผู้ใช้งานจากตารางฐานข้อมูล profiles จริง เพื่อตรวจสอบผู้เข้าร่วมใช้งานระบบ" 
              : "Fetch live profile listings from database records to audit registered ecosystem participants."}
          </p>
        </div>
      </section>

      {pageError ? (
        <div className="rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700 flex items-center gap-3 font-bold">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{pageError}</span>
        </div>
      ) : null}

      {/* แถบค้นหาข้อมูล */}
      <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 flex items-center gap-3">
        <Search className="h-5 w-5 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={locale === "th" ? "ค้นหาชื่อผู้ใช้งาน หรืออีเมลที่ต้องการตรวจสอบ..." : "Search user accounts by name or email address..."}
          className="block w-full text-sm text-slate-700 outline-none bg-transparent font-semibold"
        />
      </section>

      {/* ตารางสมาชิกเวอร์ชันคลีน (ตัดคอลัมน์เครื่องมือออก) */}
      <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-4">{locale === "th" ? "ผู้ใช้งานสมาชิกระบบ" : "User Profiles"}</th>
                <th className="px-6 py-4">{locale === "th" ? "อีเมลใช้งานจริง" : "Verified Email"}</th>
                <th className="px-6 py-4">{locale === "th" ? "บทบาทสิทธิ์ (Role)" : "Access Role"}</th>
                <th className="px-6 py-4">{locale === "th" ? "วันที่ลงทะเบียนเข้าร่วม" : "Joined Date"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic">
                    {locale === "th" ? "ไม่พบบัญชีผู้ใช้งานที่ตรงตามคีย์ข้อความค้นหาของคุณ" : "No matching user profiles found in records."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        
                        {/* รูปโปรไฟล์จริงจากฐานข้อมูล */}
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black shrink-0 ring-1 ring-slate-100">
                          {user.avatar_url ? (
                            <img 
                              src={user.avatar_url} 
                              alt={user.display_name || "User profile"} 
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            user.display_name ? user.display_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()
                          )}
                        </div>
                        
                        <span className="font-bold text-slate-900">{user.display_name || "AquaSmart User"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-4 w-4 text-slate-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        user.role === "admin" 
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50" 
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {user.created_at ? new Date(user.created_at).toLocaleDateString(locale === "th" ? "th-TH" : "en-US") : "-"}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}