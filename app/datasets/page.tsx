"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { LayoutShell } from "@/components/LayoutShell";
import { useAuth, useRequireAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { ApiError, api, type Dataset, type PreviewResponse } from "@/lib/api";

export default function DatasetsPage() {
  const { token, logout } = useAuth();
  useRequireAuth();
  const { showToast } = useToast();

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploadName, setUploadName] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [previewName, setPreviewName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Dataset | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadDatasets = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.listDatasets(token, page, 10, search);
      setDatasets(res.items);
      setTotalPages(res.total_pages);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      showToast(err instanceof ApiError ? err.message : "Failed to load datasets.", "error");
    } finally {
      setLoading(false);
    }
  }, [token, page, search, logout, showToast]);

  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (!token || !uploadFile) return;
    setUploading(true);
    try {
      await api.uploadDataset(token, uploadName.trim(), uploadFile);
      showToast("Dataset uploaded.", "success");
      setUploadName("");
      setUploadFile(null);
      setPage(1);
      await loadDatasets();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Upload failed.", "error");
    } finally {
      setUploading(false);
    }
  }

  async function openPreview(dataset: Dataset) {
    if (!token) return;
    try {
      const data = await api.previewDataset(token, dataset.id);
      setPreview(data);
      setPreviewName(dataset.name);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Preview failed.", "error");
    }
  }

  async function confirmDelete() {
    if (!token || !deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteDataset(token, deleteTarget.id);
      showToast("Dataset deleted.", "success");
      setDeleteTarget(null);
      await loadDatasets();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Delete failed.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <LayoutShell withSidebar>
      <section className="space-y-8">
        <div>
          <p className="section-title">Datasets</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-black sm:text-4xl">
            Manage datasets
          </h1>
        </div>

        <div className="premium-card p-6">
          <p className="section-title">Upload</p>
          <form onSubmit={handleUpload} className="mt-4 grid gap-4 sm:grid-cols-[1fr,1fr,auto]">
            <input
              type="text"
              placeholder="Dataset name"
              required
              className="input-surface rounded-xl"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
            />
            <input
              type="file"
              accept=".csv,text/csv"
              required
              className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-neutral-100 file:px-3 file:py-1 file:text-xs file:font-semibold"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            />
            <button type="submit" disabled={uploading} className="accent-button rounded-xl">
              {uploading ? "Uploading…" : "Upload CSV"}
            </button>
          </form>
        </div>

        <div className="premium-card p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="section-title">Your datasets</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPage(1);
                setSearch(searchInput);
              }}
              className="flex gap-2"
            >
              <input
                placeholder="Search by name"
                className="input-surface rounded-xl py-2"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button
                type="submit"
                className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold"
              >
                Search
              </button>
            </form>
          </div>

          {loading ? (
            <div className="mt-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-neutral-200" />
              ))}
            </div>
          ) : datasets.length === 0 ? (
            <p className="mt-6 text-sm text-neutral-600">
              No datasets yet. Upload a CSV to get started.
            </p>
          ) : (
            <div className="table-surface mt-6">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Rows</th>
                    <th>Columns</th>
                    <th>Uploaded</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {datasets.map((dataset) => (
                    <tr key={dataset.id}>
                      <td className="font-medium text-neutral-900">{dataset.name}</td>
                      <td>{dataset.row_count.toLocaleString()}</td>
                      <td>{dataset.column_count}</td>
                      <td>
                        {new Date(dataset.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold hover:bg-neutral-50"
                            onClick={() => openPreview(dataset)}
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                            onClick={() => setDeleteTarget(dataset)}
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
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <button
                type="button"
                disabled={page <= 1}
                className="rounded-full border border-neutral-300 px-4 py-2 font-semibold disabled:opacity-40"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="text-neutral-600">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                className="rounded-full border border-neutral-300 px-4 py-2 font-semibold disabled:opacity-40"
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>

      {preview && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
              <div>
                <p className="section-title">Preview</p>
                <h2 className="text-lg font-semibold text-black">{previewName}</h2>
                <p className="text-xs text-neutral-500">First 25 rows · {preview.total_rows} total</p>
              </div>
              <button
                type="button"
                className="rounded-full border border-neutral-300 px-3 py-1 text-sm font-semibold"
                onClick={() => setPreview(null)}
              >
                Close
              </button>
            </div>
            <div className="overflow-auto p-4">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr>
                    {preview.columns.map((col) => (
                      <th key={col} className="border-b px-3 py-2 font-semibold text-neutral-600">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, idx) => (
                    <tr key={idx} className="border-b border-neutral-100">
                      {preview.columns.map((col) => (
                        <td key={col} className="px-3 py-2 text-neutral-700">
                          {row[col] === null || row[col] === undefined ? "—" : String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-xl">
            <p className="section-title">Confirm delete</p>
            <h2 className="mt-2 text-lg font-semibold text-black">Delete {deleteTarget.name}?</h2>
            <p className="mt-2 text-sm text-neutral-600">
              This action cannot be undone. The dataset file will be permanently removed.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                className="rounded-full border border-rose-600 bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                onClick={confirmDelete}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutShell>
  );
}
