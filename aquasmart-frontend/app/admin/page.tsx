"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { BarChart3, Fish, Eye, Users, Award } from "lucide-react";

type DashboardStats = {
  totalPredictions: number;
  totalFishSpecies: number;
  totalUsers: number;
  averageConfidence: number;
};

type TopFishItem = {
  name: string;
  predicted_class: string;
  count: number;
  avgConfidence: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topFishList, setTopFishList] = useState<TopFishItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchLiveMetrics() {
      try {
        setIsLoading(true);
        setPageError("");

        // 1. ดึงสถิติจนับจำนวนแถวจริงจาก Supabase Tables ทั่ง 3 ตารางหลัก
        const [historyRes, speciesRes, profilesRes] = await Promise.all([
          supabase.from("prediction_history").select("predicted_class, confidence_percent, fish_name", { count: "exact" }),
          supabase.from("fish_species").select("id", { count: "exact" }),
          supabase.from("profiles").select("id", { count: "exact" })
        ]);

        if (historyRes.error) throw historyRes.error;
        if (speciesRes.error) throw speciesRes.error;
        if (profilesRes.error) throw profilesRes.error;

        const historyData = historyRes.data || [];
        
        // 2. คำนวณหาค่าความเชื่อมั่นเฉลี่ย (Average Confidence) ของ AI
        let totalConfidence = 0;
        historyData.forEach(row => {
          totalConfidence += Number(row.confidence_percent || 0);
        });
        const avgConfidence = historyData.length > 0 ? (totalConfidence / historyData.length) : 0;

        // 3. ประมวลผลลอจิกจัดอันดับกลุ่มปลาที่คนเข้าดูและทำนายมากที่สุด Top 5 ยอดนิยม
        const countsMap: Record<string, { count: number; totalConf: number; name: string }> = {};
        
        historyData.forEach(row => {
          const className = row.predicted_class || "unknown";
          const rawName = row.fish_name || className;
          const conf = Number(row.confidence_percent || 0);
          
          if (!countsMap[className]) {
            countsMap[className] = { count: 0, totalConf: 0, name: rawName };
          }
          countsMap[className].count += 1;
          countsMap[className].totalConf += conf;
        });

        // แปลงโครงสร้างเพื่อทำ Sorting เรียงอันดับจากมากไปน้อย
        const sortedFish: TopFishItem[] = Object.entries(countsMap).map(([className, item]) => ({
          predicted_class: className,
          name: item.name,
          count: item.count,
          avgConfidence: item.count > 0 ? (item.totalConf / item.count) : 0
        })).sort((a, b) => b.count - a.count).slice(0, 5); // คัดตัดเฉพาะอันดับ Top 5 ตามคำสั่ง

        if (!isMounted) return;

        setStats({
          totalPredictions: historyRes.count || 0,
          totalFishSpecies: speciesRes.count || 0,
          totalUsers: profilesRes.count || 0,
          averageConfidence: avgConfidence
        });

        setTopFishList(sortedFish);
      } catch (error: any) {
        console.error("Live metrics calculation error:", error);
        if (isMounted) {
          setPageError(error.message || "Failed to compile analytical data logs from Supabase client.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchLiveMetrics();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <section className="p-6 text-slate-500 font-bold animate-pulse">Calculating operational real-time metrics...</section>;
  }

  return (
    <div className="space-y-6">
      
      {/* กล่องหัวข้อหน้า Dashboard */}
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div>
          {/* <p className="text-sm font-semibold text-blue-600">Live Infrastructure Analytics</p> */}
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            หน้าจอประมวลผลสรุปสถิติจริง ดึงยอดนับและวิเคราะห์อันดับข้อมูลโดยตรงจากโครงสร้างตารางระบบฐานข้อมูลหลัก
          </p>
        </div>
      </section>

      {/* บล็อกพ่นแจ้งเตือนเมื่อโครงสร้างระบบเชื่อมต่อติดขัด */}
      {pageError ? (
        <div className="rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700 flex items-center gap-3 font-bold">
          <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23b91c1c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'></circle><line x1='12' y1='8' x2='12' y2='12'></line><line x1='12' y1='16' x2='12.01' y2='16'></line></svg>" className="h-5 w-5" alt="error" />
          <span>{pageError}</span>
        </div>
      ) : null}

      {/* บล็อกสถิติการ์ดภาพรวมข้อมูลจริง */}
      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardStatCard 
            label="ยอดการจำแนกภาพ AI ทั้งหมด" 
            value={`${stats.totalPredictions.toLocaleString()} ครั้ง`} 
            icon={<BarChart3 className="text-blue-600" />} 
            bg="bg-blue-50" 
          />
          <DashboardStatCard 
            label="สายพันธุ์ปลาในฐานข้อมูล" 
            value={`${stats.totalFishSpecies.toLocaleString()} สายพันธุ์`} 
            icon={<Fish className="text-blue-600" />} 
            bg="bg-blue-50" 
          />
          <DashboardStatCard 
            label="บัญชีผู้ใช้งานที่ลงทะเบียน" 
            value={`${stats.totalUsers.toLocaleString()} บัญชี`} 
            icon={<Users className="text-blue-600" />} 
            bg="bg-blue-50" 
          />
          <DashboardStatCard 
            label="ความแม่นยำ AI เฉลี่ย" 
            value={`${stats.averageConfidence.toFixed(1)} %`} 
            icon={<Award className="text-blue-600" />} 
            bg="bg-blue-50" 
          />
        </div>
      ) : null}

      {/* แผงตารางสรุปยอดปลา Top 5 ยอดนิยมจริง */}
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Eye className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-black text-slate-900">
            สถิติตรวจจับทำนายสูงสุด 5 อันดับแรก (Top 5 Real Predictions)
          </h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-4">อันดับยอดนิยม</th>
                <th className="px-6 py-4">คลาสโมเดล / สายพันธุ์ปลา</th>
                <th className="px-6 py-4">รหัสระบุคลาสดิบ</th>
                <th className="px-6 py-4">ความแม่นยำโมเดลเฉลี่ย</th>
                <th className="px-6 py-4 text-right">จำนวนประวัติวิเคราะห์ (ครั้ง)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
              {topFishList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">
                    ไม่พบข้อมูลล็อกบันทึกในตารางประวัติผลการทำนาย
                  </td>
                </tr>
              ) : (
                topFishList.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                        index === 0 ? "bg-blue-600 text-white" :
                        index === 1 ? "bg-blue-100 text-blue-800" :
                        index === 2 ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">{item.name}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">{item.predicted_class}</td>
                    <td className="px-6 py-4 text-blue-600 font-bold">{item.avgConfidence.toFixed(1)}%</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">{item.count.toLocaleString()} ครั้ง</td>
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
