"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Fish, Eye, Users, ShieldAlert, Award } from "lucide-react";

// Mock ข้อมูลอันดับปลาที่คนเข้าดูมากที่สุด Top 5 ตามสั่ง
const MOCK_TOP_FISH = [
  { id: 1, name: "Nile Tilapia (ปลานิล)", views: 1420, category: "ปลาน้ำจืด", confidence: "94.5%" },
  { id: 2, name: "Goldfish (ปลาทอง)", views: 1150, category: "ปลาสวยงาม", confidence: "91.2%" },
  { id: 3, name: "Siamese Fighting Fish (ปลากัด)", views: 980, category: "ปลาสวยงาม", confidence: "89.8%" },
  { id: 4, name: "Catfish (ปลาดุก)", views: 840, category: "ปลาน้ำจืด", confidence: "87.4%" },
  { id: 5, name: "Gourami (ปลาสลิด)", views: 620, category: "ปลาน้ำจืด", confidence: "85.1%" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      
      {/* 📋 หัวข้อแดชบอร์ด */}
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div>
          <p className="text-sm font-semibold text-blue-600">Overview</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            ระบบตรวจสอบสถิติ วิเคราะห์ความนิยมการเข้าชมสายพันธุ์ปลา และข้อมูลภาพรวมระบบ AquaSmart ML
          </p>
        </div>
      </section>

      {/* 📊 สถิติแบบการ์ดภาพรวมยอดนิยม */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard label="ยอดการจำแนกภาพ AI ทั้งหมด" value="4,820 ครั้ง" icon={<BarChart3 className="text-blue-600" />} bg="bg-blue-50" />
        <DashboardStatCard label="สายพันธุ์ปลาในคลัง" value="12 สายพันธุ์" icon={<Fish className="text-emerald-600" />} bg="bg-emerald-50" />
        <DashboardStatCard label="ยอดผู้ใช้งานทั้งหมด" value="154 คน" icon={<Users className="text-purple-600" />} bg="bg-purple-50" />
        <DashboardStatCard label="ความแม่นยำ AI เฉลี่ย" value="92.4 %" icon={<Award className="text-amber-600" />} bg="bg-amber-50" />
      </div>

      {/* 🏆 ตารางอันดับปลาที่คนเข้าดูมากที่สุด Top 5 */}
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Eye className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-black text-slate-900">
            ยอดปลาที่คนเข้าดูมากที่สุด 5 อันดับแรก (Top 5 Most Viewed)
          </h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-4">อันดับ</th>
                <th className="px-6 py-4">ชื่อสายพันธุ์ปลา</th>
                <th className="px-6 py-4">หมวดหมู่</th>
                <th className="px-6 py-4">ความแม่นยำโมเดล AI</th>
                <th className="px-6 py-4 text-right">ยอดการเข้าชม (ครั้ง)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
              {MOCK_TOP_FISH.map((fish, index) => (
                <tr key={fish.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4">
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                      index === 0 ? "bg-amber-100 text-amber-800" :
                      index === 1 ? "bg-slate-200 text-slate-800" :
                      index === 2 ? "bg-orange-100 text-orange-800" : "bg-slate-100 text-slate-600"
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">{fish.name}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      {fish.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-blue-600 font-bold">{fish.confidence}</td>
                  <td className="px-6 py-4 text-right font-black text-slate-900">{fish.views.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}

function DashboardStatCard({ label, value, icon, bg }: { label: string; value: string; icon: React.ReactNode; bg: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 flex items-center justify-between">
      <div className="space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
      </div>
      <div className={`h-12 w-12 rounded-2xl ${bg} flex items-center justify-center`}>
        {icon}
      </div>
    </div>
  );
}