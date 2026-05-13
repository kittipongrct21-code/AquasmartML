"use client";

import { useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";

export default function TestPage() {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  async function simulateAsyncSuccess() {
    try {
      setIsLoading(true);
      showInfo("Starting async success test...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showSuccess("Async success test completed.");
    } catch {
      showError("Unexpected error during async success test.");
    } finally {
      setIsLoading(false);
    }
  }

  async function simulateAsyncError() {
    try {
      setIsLoading(true);
      showInfo("Starting async error test...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      throw new Error("Simulated API failure from test page.");
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Simulated async error."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <section className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-blue-600">System Test</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            Toast Test Page
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Use this page to verify that the global toast system works correctly
            across success, error, warning, info, and async flows.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Basic Toast Tests</h2>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={() => showSuccess("Success toast is working.")}
                className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Show Success Toast
              </button>

              <button
                type="button"
                onClick={() => showError("Error toast is working.")}
                className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Show Error Toast
              </button>

              <button
                type="button"
                onClick={() => showWarning("Warning toast is working.")}
                className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
              >
                Show Warning Toast
              </button>

              <button
                type="button"
                onClick={() => showInfo("Info toast is working.")}
                className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Show Info Toast
              </button>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Async Toast Tests</h2>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={simulateAsyncSuccess}
                disabled={isLoading}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isLoading ? "Running..." : "Simulate Async Success"}
              </button>

              <button
                type="button"
                onClick={simulateAsyncError}
                disabled={isLoading}
                className="rounded-2xl bg-slate-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isLoading ? "Running..." : "Simulate Async Error"}
              </button>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
              Expected behavior:
              <ul className="mt-2 space-y-1">
                <li>• Toast appears at the top-right</li>
                <li>• Multiple toasts can stack</li>
                <li>• Toast auto-dismisses after a few seconds</li>
                <li>• Toast can be manually closed</li>
              </ul>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}