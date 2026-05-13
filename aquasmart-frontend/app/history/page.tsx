"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/components/providers/ToastProvider";
import AccessGuard from "@/components/guards/AccessGuard";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

type SessionUser = {
  id: string;
  email?: string | null;
};

type HistoryItem = {
  id: number;
  user_id?: string | null;
  uploaded_image_url?: string | null;
  predicted_class: string;
  confidence_percent?: number | null;
  result_json?: Record<string, unknown> | null;
  created_at?: string | null;
  fish_id?: number | null;
  fish_name?: string | null;
  raw_predicted_class?: string | null;
  prediction_type?: string | null;
  image_url?: string | null;
};

export default function HistoryPage() {
  return (
    <AccessGuard mode="signed_in">
      <HistoryPageContent />
    </AccessGuard>
  );
}

function HistoryPageContent() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();

  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        setIsCheckingSession(true);
        setPageError("");

        const sessionData = await supabase.auth.getSession();
        const user = sessionData.data.session?.user ?? null;

        if (!isMounted) return;

        if (!user) {
          setSessionUser(null);
          setHistoryItems([]);
          return;
        }

        setSessionUser({
          id: user.id,
          email: user.email ?? null,
        });
      } catch (error) {
        console.error("Failed to check session:", error);
        if (!isMounted) return;

        setPageError(
          error instanceof Error ? error.message : "Failed to load session."
        );
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;

      if (!user) {
        setSessionUser(null);
        setHistoryItems([]);
        return;
      }

      setSessionUser({
        id: user.id,
        email: user.email ?? null,
      });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      if (!sessionUser?.id) return;

      try {
        setIsLoadingHistory(true);
        setPageError("");

        const response = await fetch(
          `${API_BASE_URL}/prediction/history/${sessionUser.id}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const text = await response.text();
        let json: { data?: HistoryItem[]; detail?: string } = {};

        try {
          json = text ? JSON.parse(text) : {};
        } catch {
          throw new Error(text || "Failed to load history.");
        }

        if (!response.ok) {
          throw new Error(json.detail || "Failed to load history.");
        }

        if (!isMounted) return;
        setHistoryItems(json.data || []);
      } catch (error) {
        console.error("Failed to load history:", error);
        if (!isMounted) return;

        const message =
          error instanceof Error ? error.message : "Failed to load history.";

        setHistoryItems([]);
        setPageError(message);
        showError(message);
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false);
        }
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [sessionUser?.id, showError]);

  const totalItems = historyItems.length;

  const knownCount = useMemo(() => {
    return historyItems.filter(
      (item) =>
        item.predicted_class !== "unknown_fish" &&
        item.predicted_class !== "not_a_fish"
    ).length;
  }, [historyItems]);

  const unknownCount = useMemo(() => {
    return historyItems.filter(
      (item) =>
        item.predicted_class === "unknown_fish" ||
        item.predicted_class === "not_a_fish"
    ).length;
  }, [historyItems]);

  async function handleDeleteHistory(historyId: number) {
    const confirmed = window.confirm("Delete this history record?");
    if (!confirmed) return;

    try {
      setDeletingId(historyId);

      const response = await fetch(`${API_BASE_URL}/history/${historyId}`, {
        method: "DELETE",
      });

      const text = await response.text();
      let json: { message?: string; detail?: string } = {};

      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(text || "Failed to delete history.");
      }

      if (!response.ok) {
        throw new Error(json.detail || "Failed to delete history.");
      }

      setHistoryItems((prev) => prev.filter((item) => item.id !== historyId));
      showSuccess(json.message || "History deleted successfully.");
    } catch (error) {
      console.error("Delete history error:", error);
      showError(
        error instanceof Error ? error.message : "Failed to delete history."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function handleOpenFishDetail(fishId?: number | null) {
    if (!fishId) return;
    router.push(`/fish/${fishId}`);
  }

  function formatDate(value?: string | null) {
    if (!value) return "Unknown time";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString();
  }

  function getDisplayImage(item: HistoryItem) {
    return item.image_url || item.uploaded_image_url || "";
  }

  function getDisplayTitle(item: HistoryItem) {
    if (item.fish_name) return item.fish_name;
    if (item.raw_predicted_class) return humanizePrediction(item.raw_predicted_class);
    return humanizePrediction(item.predicted_class);
  }

  function getDisplaySubtitle(item: HistoryItem) {
    if (item.predicted_class === "unknown_fish") {
      return "The model could not confidently match this image to a known fish record.";
    }

    if (item.predicted_class === "not_a_fish") {
      return "The uploaded image was not recognized as a fish.";
    }

    return "Prediction completed and saved in your history.";
  }

  if (isCheckingSession || !sessionUser) {
    return (
      <main className="min-h-screen px-4 py-8">
        <section className="mx-auto max-w-6xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Checking session...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">History</p>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
                Prediction History
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Review your saved AI fish predictions, open matched fish pages,
                or remove old records from your history.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/identify"
                className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Identify Fish
              </Link>
              <Link
                href="/fish"
                className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Browse Catalog
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <HistoryStatCard label="Total Records" value={String(totalItems)} />
            <HistoryStatCard label="Known Matches" value={String(knownCount)} />
            <HistoryStatCard label="Unknown Results" value={String(unknownCount)} />
          </div>
        </section>

        {isLoadingHistory ? (
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
              Loading prediction history...
            </div>
          </section>
        ) : null}

        {!isLoadingHistory && pageError ? (
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700">
              {pageError}
            </div>
          </section>
        ) : null}

        {!isLoadingHistory && !pageError && historyItems.length === 0 ? (
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
              No prediction history found yet.
            </div>

            <div className="mt-4">
              <Link
                href="/identify"
                className="inline-flex rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Start your first prediction
              </Link>
            </div>
          </section>
        ) : null}

        {!isLoadingHistory && !pageError && historyItems.length > 0 ? (
          <section className="grid gap-5 lg:grid-cols-2">
            {historyItems.map((item) => {
              const displayImage = getDisplayImage(item);
              const title = getDisplayTitle(item);
              const subtitle = getDisplaySubtitle(item);
              const confidence = Math.max(
                0,
                Math.min(100, item.confidence_percent || 0)
              );

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200"
                >
                  <div className="grid gap-0 sm:grid-cols-[180px_minmax(0,1fr)]">
                    <div className="flex min-h-[180px] items-center justify-center overflow-hidden bg-slate-50">
                      {displayImage ? (
                        <img
                          src={displayImage}
                          alt={title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-100">
                          <span className="text-base font-bold text-slate-400">
                            AS
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                            Saved Prediction
                          </p>
                          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                            {title}
                          </h2>
                        </div>

                        <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                          {item.prediction_type || "Prediction"}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {subtitle}
                      </p>

                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-700">
                            Confidence
                          </span>
                          <span className="font-bold text-blue-700">
                            {confidence.toFixed(0)}%
                          </span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{ width: `${confidence}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <MiniInfo label="Predicted Class" value={item.predicted_class} />
                        <MiniInfo
                          label="Raw Class"
                          value={item.raw_predicted_class || "-"}
                        />
                        <MiniInfo
                          label="Matched Fish"
                          value={item.fish_name || "No direct match"}
                        />
                        <MiniInfo
                          label="Saved At"
                          value={formatDate(item.created_at)}
                        />
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        {item.fish_id ? (
                          <button
                            type="button"
                            onClick={() => handleOpenFishDetail(item.fish_id)}
                            className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                          >
                            Open fish details
                          </button>
                        ) : (
                          <Link
                            href="/fish"
                            className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                          >
                            Browse catalog
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteHistory(item.id)}
                          disabled={deletingId === item.id}
                          className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === item.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : null}
      </section>
    </main>
  );
}

function HistoryStatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold leading-7 text-slate-900">
        {value}
      </p>
    </div>
  );
}

function humanizePrediction(value?: string | null) {
  return (value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}