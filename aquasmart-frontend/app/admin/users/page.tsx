"use client";

import { useState } from "react";
import { Key, Search, ShieldCheck, Mail, Calendar, X, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

// Mock รายชื่อผู้ใช้งานในระบบสำหรับทดสอบฟังก์ชันจัดการรหัสผ่าน
const MOCK_USERS = [
  { id: "u1", email: "kittipongtharapun@gmail.com", display_name: "Kitti Tarapun", role: "admin", created_at: "2026-01-15" },
  { id: "u2", email: "somchai.aqua@hotmail.com", display_name: "สมชาย รักสายพันธุ์ปลา", role: "user", created_at: "2026-02-20" },
  { id: "u3", email: "farmer_thailand@gmail.com", display_name: "สมศักดิ์ บ่อเงินบ่อทอง", role: "user", created_at: "2026-03-05" },
  { id: "u4", email: "ornamental_fish99@yahoo.com", display_name: "นภาพร ตู้ปลางาม", role: "user", created_at: "2026-04-12" },
];

export default function AdminUsersPage() {
  const { showSuccess, showWarning } = useToast();
  
  const [users] = useState(MOCK_USERS);
  const [searchTerm, setSearchTerm] = useState("");
  
  // States คุม Popup โมดอลแก้ไขรหัสผ่าน
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function handleOpenResetModal(user: any) {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmPassword("");
  }

  function handleCloseModal() {
    setSelectedUser(null);
  }

  function handleSavePassword() {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      showWarning("กรุณากรอกรหัสผ่านให้ครบทุกช่อง");
      return;
    }

    if (newPassword.length < 6) {
      showWarning("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (newPassword !== confirmPassword) {
      showWarning("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    showSuccess(`เปลี่ยนรหัสผ่านให้คุณ ${selectedUser.display_name} เรียบร้อยแล้ว`);
    handleCloseModal();
  }

  return (
    <div className="space-y-6">
      
      {/* 📁 หัวข้อหน้าระบบ */}
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">Admin Control</p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
              User Management
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              ดูข้อมูลรายชื่อผู้ใช้งานทั้งหมด คอนโทรลบทบาท และจัดการรีเซ็ตรหัสผ่านความปลอดภัยให้แก่สมาชิก
            </p>
          </div>
        </div>
      </section>

      {/* 🔍 กล่องค้นหาผู้ใช้งาน */}
      <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 flex items-center gap-3">
        <Search className="h-5 w-5 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ค้นหาด้วยอีเมล หรือ ชื่อแสดงผลของผู้ใช้งาน..."
          className="block w-full text-sm text-slate-700 outline-none bg-transparent"
        />
      </section>

      {/* 👥 ตารางรายชื่อผู้ใช้ในระบบ */}
      <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-4">ผู้ใช้งาน (User Profile)</th>
                <th className="px-6 py-4">อีเมลติดต่อ</th>
                <th className="px-6 py-4">บทบาทระบบ</th>
                <th className="px-6 py-4">วันที่สมัครสมาชิก</th>
                <th className="px-6 py-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">
                    ไม่พบข้อมูลผู้ใช้งานที่ตรงตามเงื่อนไขค้นหา
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                          {user.display_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900">{user.display_name}</span>
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
                        {user.created_at}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenResetModal(user)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs font-bold text-blue-600 shadow-sm transition hover:bg-blue-50"
                      >
                        <Key className="h-3.5 w-3.5" />
                        แก้รหัสผ่าน
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 🔐 โมดอล Popup เปลี่ยนรหัสผ่านให้บัญชีผู้ใช้ (UX ดึงสายตาชัดเจน) */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 relative animate-fade-in">
            
            <button 
              type="button" 
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 text-blue-600 pb-2 border-b border-slate-100">
              <ShieldCheck className="h-6 w-6" />
              <h3 className="text-xl font-black text-slate-900">เปลี่ยนรหัสผ่านผู้ใช้</h3>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">กำลังจัดการบัญชีของ</p>
              <p className="text-sm font-bold text-slate-800">{selectedUser.display_name}</p>
              <p className="text-xs text-slate-500 font-medium">{selectedUser.email}</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <label className="mb-2 block text-sm font-bold text-slate-700">รหัสผ่านใหม่ (New Password)</label>
                <input
                  type={showPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร..."
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                <label className="mb-2 block text-sm font-bold text-slate-700">ยืนยันรหัสผ่านใหม่ (Confirm Password)</label>
                <input
                  type={showPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้งเพื่อยืนยัน..."
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="pt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-full rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSavePassword}
                className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 shadow-sm"
              >
                บันทึกรหัสผ่าน
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
