"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  deleteFish,
  getAdminFish,
  toggleFishStatus,
  type FishListItem,
} from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";

export default function AdminFishPage() {
  const { showError, showSuccess } = useToast();

  const [fishList, setFishList] = useState<FishListItem[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [fishType, setFishType] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [pageError, setPageError] = useState("");

  const totalCount = fishList.length;

  const activeCount = useMemo(
    () => fishList.filter((fish) => fish.is_active).length,
    [fishList]
  );

  const inactiveCount = useMemo(
    () => fishList.filter((fish) => !fish.is_active).length,
    [fishList]
  );

  async function loadFish() {
    try {
      setIsLoading(true);
      setPageError("");

      const data = await getAdminFish({
        q: search.trim() || undefined,
        status: status || undefined,
        category: category.trim() || undefined,
        fish_type: fishType.trim() || undefined,
      });

      setFishList(data || []);
    } catch (error) {
      console.error("Failed to load admin fish:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to load fish management data.";

      setFishList([]);
      setPageError(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadFish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleApplyFilters() {
    await loadFish();
  }

  function handleClearFilters() {
    setSearch("");
    setStatus("");
    setCategory("");
    setFishType("");
    setPageError("");
  }

  async function handleToggleStatus(fishId: number) {
    try {
      setIsMutating(true);
      await toggleFishStatus(fishId);
      showSuccess("Fish status updated successfully.");
      await loadFish();
    } catch (error) {
      console.error("Failed to toggle fish status:", error);
      showError(
        error instanceof Error
          ? error.message
          : "Failed to update fish status."
      );
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDeleteFish(fishId: number, fishName: string) {
    const confirmed = window.confirm(
      `Delete "${fishName}"?\n\nThis will remove the fish record, info, and images.`
    );

    if (!confirmed) return;

    try {
      setIsMutating(true);
      await deleteFish(fishId);
      showSuccess(`Deleted "${fishName}" successfully.`);
      await loadFish();
    } catch (error) {
      console.error("Failed to delete fish:", error);
      showError(error instanceof Error ? error.message : "Failed to delete fish.");
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <section className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">Admin</p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
              Fish Management
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Manage fish records, search the database, publish or unpublish
              fish, and open edit pages.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/fish"
              className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              Open Public Catalog
            </Link>

            <Link
              href="/admin/fish/new"
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Add New Fish
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Fish" value={String(totalCount)} />
          <StatCard label="Active" value={String(activeCount)} />
          <StatCard label="Inactive" value={String(inactiveCount)} />
          <StatCard
            label="Current Status Filter"
            value={status ? capitalize(status) : "All"}
          />
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="md:col-span-2">
            <label
              htmlFor="search"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Search
            </label>
            <input
              id="search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by fish name or slug"
              className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="category"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Category
            </label>
            <input
              id="category"
              type="text"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Farmed Fish"
              className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="fish-type"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Type
            </label>
            <input
              id="fish-type"
              type="text"
              value={fishType}
              onChange={(event) => setFishType(event.target.value)}
              placeholder="Freshwater"
              className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleApplyFilters}
            disabled={isLoading || isMutating}
            className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isLoading ? "Loading..." : "Apply Filters"}
          </button>

          <button
            type="button"
            onClick={handleClearFilters}
            disabled={isLoading || isMutating}
            className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Clear Filters
          </button>
        </div>
      </section>

      {pageError ? (
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700">
            {pageError}
          </div>
        </section>
      ) : null}

      {isLoading ? (
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
            Loading fish management data...
          </div>
        </section>
      ) : null}

      {!isLoading && !pageError && fishList.length === 0 ? (
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
            No fish found for the current filters.
          </div>
        </section>
      ) : null}

      {!isLoading && !pageError && fishList.length > 0 ? (
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr className="text-left text-sm text-slate-500">
                  <th className="px-5 py-4 font-semibold">Fish</th>
                  <th className="px-5 py-4 font-semibold">Category</th>
                  <th className="px-5 py-4 font-semibold">Type</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {fishList.map((fish) => (
                  <tr
                    key={fish.id}
                    className="border-t border-slate-100 text-sm text-slate-700"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 overflow-hidden rounded-2xl bg-slate-100">
                          {fish.cover_image_url ? (
                            <img
                              src={fish.cover_image_url}
                              alt={fish.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <span className="text-xs font-bold text-slate-400">
                                AS
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900">
                            {fish.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            ID {fish.id} · {fish.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">{fish.category || "-"}</td>
                    <td className="px-5 py-4">{fish.type || "-"}</td>

                    <td className="px-5 py-4">
                      <span
                        className={
                          fish.is_active
                            ? "rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"
                            : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                        }
                      >
                        {fish.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/fish/${fish.id}`}
                          className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                        >
                          View
                        </Link>

                        <Link
                          href={`/admin/fish/${fish.id}/edit`}
                          className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50"
                        >
                          Edit
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(fish.id)}
                          disabled={isMutating}
                          className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-amber-700 shadow-sm ring-1 ring-amber-100 transition hover:bg-amber-50 disabled:opacity-60"
                        >
                          {fish.is_active ? "Unpublish" : "Publish"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteFish(fish.id, fish.name)}
                          disabled={isMutating}
                          className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-red-700 shadow-sm ring-1 ring-red-100 transition hover:bg-red-50 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 p-4 md:hidden">
            {fishList.map((fish) => (
              <article
                key={fish.id}
                className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div className="flex gap-3">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                    {fish.cover_image_url ? (
                      <img
                        src={fish.cover_image_url}
                        alt={fish.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-xs font-bold text-slate-400">
                          AS
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">{fish.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {fish.category || "No category"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      ID {fish.id} · {fish.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    href={`/admin/fish/${fish.id}`}
                    className="rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-700"
                  >
                    View
                  </Link>

                  <Link
                    href={`/admin/fish/${fish.id}/edit`}
                    className="rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white"
                  >
                    Edit
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(fish.id)}
                    disabled={isMutating}
                    className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 disabled:opacity-60"
                  >
                    {fish.is_active ? "Unpublish" : "Publish"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteFish(fish.id, fish.name)}
                    disabled={isMutating}
                    className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
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

function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}