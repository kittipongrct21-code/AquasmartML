"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getPredictionHistory, deleteHistory, type HistoryItem } from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";
import { useI18n } from "@/lib/i18n-context";
import { supabase } from "@/lib/supabase-client";

export default function HistoryPage() {
  const { showError, showSuccess } = useToast();
  const { t: dict } = useI18n(); // เปลี่ยนชื่อให้เป็น dict เพื่อดึงข้อมูลได้ง่าย
  
  const [sessionUser, setSessionUser] = useState<{ id: string } | null>(null);
  const [allHistoryItems, setAllHistoryItems] = useState<HistoryItem[]>([]);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      try {
        setIsCheckingSession(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (session?.user) setSessionUser({ id: session.user.id });
        else setSessionUser(null);
      } catch (error) { console.error("Failed to check session:", error); } 
      finally { if (isMounted) setIsCheckingSession(false); }
    }
    checkSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setSessionUser({ id: session.user.id });
      else setSessionUser(null);
    });
    return () => { isMounted = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      if (!sessionUser?.id) return;
      try {
        setIsLoading(true);
        const items = await getPredictionHistory(sessionUser.id);
        if (isMounted) setAllHistoryItems(items);
      } catch (error) {
        console.error("Failed to load history:", error);
        if (isMounted) showError("Failed to load history.");
      } finally { if (isMounted) setIsLoading(false); }
    }
    loadHistory();
    return () => { isMounted = false; };
  }, [sessionUser?.id, showError]);

  // กรองปลาที่ไม่ซ้ำ
  const uniqueHistoryItems = useMemo(() => {
    const seen = new Map<string, HistoryItem>();
    allHistoryItems.forEach((item) => {
      const uniqueKey = (item.fish_name || item.predicted_class || "unknown").toLowerCase();
      const existing = seen.get(uniqueKey);
      const currentItemDate = item.created_at ? new Date(item.created_at).getTime() : 0;
      const existingItemDate = existing?.created_at ? new Date(existing.created_at).getTime() : 0;
      if (!existing || currentItemDate > existingItemDate) {
        seen.set(uniqueKey, item);
      }
    });
    return Array.from(seen.values()).sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [allHistoryItems]);

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this history record?")) return;
    try {
      setDeletingId(id);
      await deleteHistory(id);
      setAllHistoryItems((prev) => prev.filter((item) => item.id !== id));
      showSuccess("History deleted successfully");
    } catch (error) {
      console.error("Failed to delete history:", error);
      showError(error instanceof Error ? error.message : "Failed to delete history");
    } finally { setDeletingId(null); }
  }

  function formatDate(dateString?: string | null) {
    if (!dateString) return dict.history.unknownDate;
    try { return new Date(dateString).toLocaleString(); } 
    catch { return dict.history.unknownDate; }
  }

  if (isCheckingSession) {
    return (<main className="min-h-screen px-4 py-8"><section className="mx-auto max-w-5xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">{dict.common.loading}</p></section></main>);
  }

  if (!sessionUser) {
    return (
      <main className="min-h-screen px-4 py-8">
        <section className="mx-auto max-w-5xl space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-semibold text-blue-600">{dict.nav.history}</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{dict.history.title}</h1>
            <p className="mt-2 text-sm text-slate-600">{dict.history.desc}</p>
          </section>
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="rounded-2xl bg-amber-50 px-4 py-4 text-sm text-amber-700">{dict.history.notSignedInWarning}</div>
            <div className="mt-5 flex gap-3">
              <Link href="/auth/login" className="rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700">{dict.history.signInToView}</Link>
            </div>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <section className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">{dict.nav.history}</p>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">{dict.history.title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{dict.history.desc}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/profile" className="rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-200">{dict.history.backToProfile}</Link>
              <Link href="/identify" className="rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700">{dict.history.predictMore}</Link>
            </div>
          </div>
          {/* 🔧 แก้ไขตรงนี้: ใช้ Dictionary แทนข้อความ Hardcode */}
          <div className="mt-6 flex items-center gap-2 text-sm font-medium text-slate-600">
            <span className="flex h-6 items-center rounded-full bg-blue-50 px-2.5 text-blue-700">{uniqueHistoryItems.length}</span>
            {dict.history.records} ({dict.history.uniqueFishDesc})
          </div>
        </section>

        {isLoading ? (
           <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">{dict.history.loading}</p></section>
        ) : uniqueHistoryItems.length === 0 ? (
           <section className="rounded-3xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
             <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
               <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <h3 className="mt-4 text-lg font-bold text-slate-900">{dict.history.noHistoryTitle}</h3>
             <p className="mt-2 text-sm text-slate-500">{dict.history.noHistoryDesc}</p>
             <div className="mt-6">
               <Link href="/identify" className="inline-flex rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">{dict.history.goToPrediction}</Link>
             </div>
           </section>
        ) : (
           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {uniqueHistoryItems.map((item) => (
               <div key={item.id} className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md hover:ring-slate-300">
                 <div className="relative aspect-4/3 w-full bg-slate-100">
                  {item.uploaded_image_url || item.image_url ? (
                     <img src={item.uploaded_image_url || item.image_url || ""} alt={item.predicted_class} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                     <div className="flex h-full items-center justify-center text-slate-400"><svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                  )}
                  {item.confidence_percent !== null && item.confidence_percent !== undefined && (
                     <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">{Math.round(item.confidence_percent)}% {dict.history.confidence}</div>
                  )}
                 </div>
                 <div className="flex flex-1 flex-col p-5">
                   <div className="mb-2 text-xs font-medium text-slate-500">{formatDate(item.created_at)}</div>
                   <h3 className="mb-1 text-lg font-bold text-slate-900 line-clamp-1">{item.predicted_class}</h3>
                  {item.fish_name && (
                     <div className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600">
                       <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {dict.history.match}: {item.fish_name}
                     </div>
                  )}
                   <div className="mt-auto flex items-center justify-between pt-4">
                    {item.fish_id ? (
                       <Link href={`/fish/${item.fish_id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700">{dict.catalog.openDetails} →</Link>
                    ) : (
                       <span className="text-sm text-slate-400">{dict.history.unknownType}</span>
                    )}
                     <button type="button" onClick={() => handleDelete(item.id)} disabled={deletingId === item.id} className="rounded-full bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50" title={dict.history.delete}>
                      {deletingId === item.id ? (
                         <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      ) : (
                         <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      )}
                     </button>
                   </div>
                 </div>
               </div>
            ))}
           </div>
        )}
      </section>
    </main>
  );
}
