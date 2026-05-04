"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FishSpeciesRow } from "@/types/fish";
import { apiFetch, API_BASE_URL } from "@/lib/api";
import DeleteFishModal from "@/components/admin/DeleteFishModal";

export default function AdminFishListPage() {
  const [rows, setRows] = useState<FishSpeciesRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedFish, setSelectedFish] = useState<FishSpeciesRow | null>(null);

  const loadFish = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await apiFetch<{ data: FishSpeciesRow[] }>("/admin/fish");
      setRows(res.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fish");
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (fish: FishSpeciesRow) => {
    setSelectedFish(fish);
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;
    setSelectedFish(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedFish) return;

    try {
      setDeleteLoading(true);
      await apiFetch(`/admin/fish/${selectedFish.id}`, {
        method: "DELETE",
      });
      setSelectedFish(null);
      await loadFish();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    loadFish();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Fish Management</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage fish data for AquaSmart ML.
            </p>
          </div>

          <Link
            href="/admin/fish/new"
            className="rounded-2xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            Add Fish
          </Link>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          {loading ? (
            <p className="text-slate-500">Loading...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : rows.length === 0 ? (
            <p className="text-slate-500">No fish found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Cover</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((fish) => (
                    <tr key={fish.id} className="border-b border-slate-100">
                      <td className="px-4 py-3">{fish.id}</td>
                      <td className="px-4 py-3">
                        {fish.cover_image_url ? (
                          <img
                            src={fish.cover_image_url}
                            alt={fish.name}
                            className="h-12 w-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-16 rounded-lg bg-slate-100" />
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{fish.name}</td>
                      <td className="px-4 py-3 text-slate-600">{fish.slug}</td>
                      <td className="px-4 py-3 text-slate-600">{fish.category || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{fish.type || "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            fish.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {fish.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/fish/${fish.id}/edit`}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-slate-700"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => openDeleteModal(fish)}
                            className="rounded-xl border border-red-200 px-3 py-2 text-red-600"
                          >
                            Delete
                          </button>
                          <a
                            href={`${API_BASE_URL}/admin/fish/${fish.id}`}
                            target="_blank"
                            className="rounded-xl border border-slate-200 px-3 py-2 text-slate-700"
                          >
                            View API
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <DeleteFishModal
        open={!!selectedFish}
        fishName={selectedFish?.name}
        loading={deleteLoading}
        onCancel={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
      />
    </main>
  );
}