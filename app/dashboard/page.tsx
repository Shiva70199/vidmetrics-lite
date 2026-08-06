"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutShell } from "@/components/LayoutShell";
import { ApiError, api, type DashboardStats } from "@/lib/api";
import { useAuth, useRequireAuth } from "@/lib/auth";

export default function DashboardPage() {
  const { token, logout } = useAuth();
  useRequireAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api
      .dashboardStats(token)
      .then(setStats)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          return;
        }
        setError(err instanceof ApiError ? err.message : "Failed to load dashboard.");
      })
      .finally(() => setLoading(false));
  }, [token, logout]);

  if (loading) {
    return (
      <LayoutShell withSidebar>
        <div className="space-y-6">
          <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-neutral-200" />
            ))}
          </div>
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell withSidebar>
      <section className="space-y-8">
        <div>
          <p className="section-title">Home</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-black sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Overview of your datasets and quick actions.
          </p>
        </div>

        {error && (
          <div className="premium-card p-5 text-sm text-rose-700">{error}</div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="premium-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Total datasets
            </p>
            <p className="mt-3 text-3xl font-semibold text-black">
              {stats?.total_datasets ?? 0}
            </p>
          </div>
          <div className="premium-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Total rows
            </p>
            <p className="mt-3 text-3xl font-semibold text-black">
              {(stats?.total_rows ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="premium-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Latest upload
            </p>
            <p className="mt-3 line-clamp-2 text-sm font-semibold text-neutral-900">
              {stats?.latest_upload?.name ?? "—"}
            </p>
          </div>
          <div className="premium-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Available charts
            </p>
            <p className="mt-3 text-sm font-medium capitalize text-neutral-800">
              {(stats?.available_charts ?? []).join(", ") || "—"}
            </p>
          </div>
        </div>

        <div className="premium-card p-6">
          <p className="section-title">Quick actions</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link href="/datasets" className="accent-button text-center">
              Upload dataset
            </Link>
            <Link
              href="/datasets"
              className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-6 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
            >
              View datasets
            </Link>
            <Link
              href="/analytics"
              className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-6 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
            >
              Analytics
            </Link>
          </div>
        </div>
      </section>
    </LayoutShell>
  );
}
