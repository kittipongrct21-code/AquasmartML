"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Key, Search, ShieldCheck, Mail, Calendar, X, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

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
  const { showSuccess, showWarning, showError } = useToast();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  
  // States โมดอลควบคุมระบบ popup เปลี่ยนรหัสผ่านความปลอดภัย
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // ✅ FIXED: ดึงข้อมูลรายชื่อจากตาราง profiles ของฐานข้อมูลโดยตรง ไม่ผ่านเส้น fetch หลังบ้านที่ยังสร้างไม่เสร็จ
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
      setPageError(error.message || "Failed to establish connection with Supabase database profiles.");
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

  function handleOpenResetModal(user: UserProfile) {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmPassword("");
  }

  function handleCloseModal() {
    setSelectedUser(null);
    setIsSubmittingPassword(false);
  }

  // 🔐 ฟังก์ชันจำลองคำสั่งเปลี่ยนรหัสผ่านสิทธิ์แอดมินความปลอดภัย
  async function handleSavePassword() {
    if (!selectedUser) return;

    if (!newPassword.trim() || !confirmPassword.trim()) {
      showWarning("กรุณากรอกรหัสผ่านให้ครบถ้วนทั่งสองช่อง");
      return;
    }

    if (newPassword.length < 6) {
      showWarning("ตามกฎความปลอดภัย รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (newPassword !== confirmPassword) {
      showWarning("การยืนยันผิดพลาด: รหัสผ่านทั้งสองช่องกรอกไม่ตรงกัน");
      return;
    }

    try {
      setIsSubmittingPassword(true);
      
      // 💡 ข้อชี้แจงระบบ: เนื่องจากคำสั่งแก้ไขรหัสผ่านของ Supabase บัญชีผู้อื่น ต้องใช้คีย์ลับระดับ Service Role ในเซิร์ฟเวอร์เท่านั้น
      // เพื่อไม่ให้หน้าบ้านล่มในเฟสทดสอบ UI พี่จำลองสัญญานตอบกลับแบบสำเร็จให้ก่อน เพื่อรอเส้นทาง API หลังบ้านเชื่อมต่อเต็มสูบครับ
      await new Promise((resolve) => setTimeout(resolve, 800));

      showSuccess(`[ระบบทดสอบ] ทำการส่งชุดคำสั่งบังคับเปลี่ยนรหัสผ่านใหม่ให้แก่คุณ ${selectedUser.display_name || selectedUser.email} สำเร็จแล้ว`);
      handleCloseModal();
    } catch (error: any) {
      console.error("Password mutation failed:", error);
      showError(error.message || "Failed to re-route password updates.");
    } finally {
      setIsSubmittingPassword(false);
    }
  }

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
      
      {/* กล่องหัวข้อหน้าควบคุมสมาชิกระบบ */}
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div>
          <p className="text-sm font-semibold text-blue-600">Admin Control Panel</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
            User Management
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            ดึงรายชื่อและข้อมูลผู้ใช้งานจากตารางฐานข้อมูล profiles จริง พร้อมระบบเครื่องมือช่วยเหลือสมาชิกระบบเมื่อพบบัญชีสูญหาย
          </p>
        </div>
      </section>

      {/* แถบสีแดงแจ้งกรณีดึงโครงสร้างตารางติดขัด */}
      {pageError ? (
        <div className="rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700 flex items-center gap-3 font-bold">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{pageError}</span>
        </div>
      ) : null}

      {/* แถบค้นหาค้นหาผู้ใช้งานรายบุคคล */}
      <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 flex items-center gap-3">
        <Search className="h-5 w-5 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ค้นหาชื่อผู้ใช้งาน หรืออีเมลที่ต้องการตรวจสอบ..."
          className="block w-full text-sm text-slate-700 outline-none bg-transparent font-semibold"
        />
      </section>

      {/* ตารางข้อมูลที่ดึงฟิลด์ตามตาราง profiles เป๊ะๆ */}
      <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-4">ผู้ใช้งานสมาชิกระบบ</th>
                <th className="px-6 py-4">อีเมลใช้งานจริง</th>
                <th className="px-6 py-4">บทบาทสิทธิ์ (Role)</th>
                <th className="px-6 py-4">วันที่ลงทะเบียนเข้าร่วม</th>
                <th className="px-6 py-4 text-right">เครื่องมือแอดมิน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">
                    ไม่พบบัญชีผู้ใช้งานที่ตรงตามคีย์ข้อความค้นหาของคุณในระบบฐานข้อมูล
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                          {user.display_name ? user.display_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
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
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenResetModal(user)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs font-bold text-blue-600 shadow-sm transition hover:bg-blue-50"
                      >
                        <Key className="h-3.5 w-3.5" />
                        แก้ไขรหัสผ่าน
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* บล็อก Popup บังคับกรอกรหัสผ่านใหม่ */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 relative">
            
            <button 
              type="button" 
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 text-blue-600 pb-2 border-b border-slate-100">
              <ShieldCheck className="h-6 w-6" />
              <h3 className="text-xl font-black text-slate-900">Protocol Overriding</h3>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">เป้าหมายสิทธิ์ UUID บัญชี</p>
              <p className="text-xs font-mono bg-slate-200/60 p-1.5 rounded text-slate-600 overflow-x-auto">{selectedUser.id}</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{selectedUser.display_name || "No Name Display"}</p>
              <p className="text-xs text-slate-500 font-semibold">{selectedUser.email}</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <label className="mb-2 block text-sm font-bold text-slate-700">ระบุรหัสผ่านใหม่ที่ต้องการบังคับเปลี่ยน</label>
                <input
                  type={showPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร..."
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute bottom-3.5 right-4 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">พิมพ์ยืนยันรหัสผ่านใหม่อีกครั้ง</label>
                <input
                  type={showPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้งให้ตรงกันเป๊ะ..."
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 font-semibold"
                />
              </div>
            </div>

            <div className="pt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmittingPassword}
                className="w-full rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
              >
                ยกเลิกรายการ
              </button>
              <button
                type="button"
                onClick={handleSavePassword}
                disabled={isSubmittingPassword}
                className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 shadow-sm disabled:bg-slate-300"
              >
                {isSubmittingPassword ? "กำลังประมวลผล..." : "ยืนยันรหัสผ่านใหม่"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
