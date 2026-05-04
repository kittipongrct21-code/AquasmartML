import FishForm from "@/components/admin/FishForm";

export default function AdminNewFishPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Add Fish</h1>
            <p className="mt-1 text-sm text-slate-500">
              Create a new fish entry for AquaSmart ML.
            </p>
          </div>
        </div>

        <FishForm />
      </div>
    </main>
  );
}