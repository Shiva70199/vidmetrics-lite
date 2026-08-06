"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LayoutShell } from "@/components/LayoutShell";
import { EChartsPanel, type ChartType } from "@/components/EChartsPanel";
import { useAuth, useRequireAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { ApiError, api, type ColumnInfo, type ComputeResponse, type Dataset } from "@/lib/api";

async function loadAllDatasets(token: string): Promise<Dataset[]> {
  const first = await api.listDatasets(token, 1, 50);
  if (first.total_pages <= 1) return first.items;
  const all = [...first.items];
  for (let page = 2; page <= first.total_pages; page++) {
    const res = await api.listDatasets(token, page, 50);
    all.push(...res.items);
  }
  return all;
}

function initColumnSelection(cols: ColumnInfo[]) {
  const firstNumeric = cols.find((c) => c.is_numeric);
  let statsColumn = firstNumeric?.name ?? "";
  let xColumn = cols[0]?.name ?? "";
  let yColumn = firstNumeric?.name ?? "";

  if (cols.length === 1 && cols[0].is_numeric) {
    xColumn = cols[0].name;
    yColumn = cols[0].name;
    statsColumn = cols[0].name;
  }

  return { statsColumn, xColumn, yColumn };
}

export default function AnalyticsPage() {
  const { token, logout, loading: authLoading } = useAuth();
  useRequireAuth();
  const { showToast } = useToast();

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [statsColumn, setStatsColumn] = useState("");
  const [stats, setStats] = useState<ComputeResponse | null>(null);
  const [xColumn, setXColumn] = useState("");
  const [yColumn, setYColumn] = useState("");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [chartX, setChartX] = useState<unknown[]>([]);
  const [chartY, setChartY] = useState<(number | null)[]>([]);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingColumns, setLoadingColumns] = useState(false);
  const [computing, setComputing] = useState(false);

  const fetchDatasets = useCallback(async () => {
    if (!token) return;
    setLoadingDatasets(true);
    setLoadError(null);
    try {
      const items = await loadAllDatasets(token);
      setDatasets(items);
      setSelectedId((current) => {
        if (current && items.some((d) => d.id === current)) return current;
        return items[0]?.id ?? null;
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      const message = err instanceof ApiError ? err.message : "Failed to load datasets.";
      setLoadError(message);
      showToast(message, "error");
    } finally {
      setLoadingDatasets(false);
    }
  }, [token, logout, showToast]);

  useEffect(() => {
    if (authLoading || !token) return;
    fetchDatasets();
  }, [authLoading, token, fetchDatasets]);

  useEffect(() => {
    if (!token || !selectedId) return;
    setLoadingColumns(true);
    setStats(null);
    setStatsColumn("");
    setXColumn("");
    setYColumn("");
    setChartX([]);
    setChartY([]);
    api
      .getColumns(token, selectedId)
      .then((cols) => {
        setColumns(cols);
        const selection = initColumnSelection(cols);
        setStatsColumn(selection.statsColumn);
        setXColumn(selection.xColumn);
        setYColumn(selection.yColumn);
      })
      .catch((err) => showToast(err instanceof ApiError ? err.message : "Failed to load columns.", "error"))
      .finally(() => setLoadingColumns(false));
  }, [token, selectedId, showToast]);

  useEffect(() => {
    if (!token || !selectedId || !statsColumn) return;
    setComputing(true);
    api
      .compute(token, selectedId, statsColumn)
      .then(setStats)
      .catch((err) => {
        setStats(null);
        showToast(err instanceof ApiError ? err.message : "Compute failed.", "error");
      })
      .finally(() => setComputing(false));
  }, [token, selectedId, statsColumn, showToast]);

  useEffect(() => {
    if (!token || !selectedId || !xColumn || !yColumn) return;
    api
      .chartData(token, selectedId, xColumn, yColumn)
      .then((data) => {
        setChartX(data.x);
        setChartY(data.y);
      })
      .catch((err) => {
        setChartX([]);
        setChartY([]);
        showToast(err instanceof ApiError ? err.message : "Chart data failed.", "error");
      });
  }, [token, selectedId, xColumn, yColumn, showToast]);

  const numericColumns = useMemo(() => columns.filter((c) => c.is_numeric), [columns]);
  const hasChartData = chartY.some((v) => v !== null && v !== undefined);

  return (
    <LayoutShell withSidebar>
      <section className="space-y-8">
        <div>
          <p className="section-title">Analytics</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-black sm:text-4xl">
            Statistics & charts
          </h1>
        </div>

        {loadingDatasets ? (
          <div className="h-32 animate-pulse rounded-xl bg-neutral-200" />
        ) : loadError ? (
          <div className="premium-card p-6">
            <p className="text-sm text-rose-700">{loadError}</p>
            <button type="button" onClick={fetchDatasets} className="accent-button mt-4 rounded-xl">
              Retry
            </button>
          </div>
        ) : datasets.length === 0 ? (
          <div className="premium-card p-6 text-sm text-neutral-600">
            No datasets yet.{" "}
            <Link href="/datasets" className="font-semibold text-[#2563eb] hover:underline">
              Upload a dataset
            </Link>{" "}
            to run analytics.
          </div>
        ) : (
          <>
            <div className="premium-card p-6">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Dataset
              </label>
              <select
                className="input-surface mt-2 rounded-xl"
                value={selectedId ?? ""}
                onChange={(e) => setSelectedId(Number(e.target.value))}
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="premium-card p-6">
              <p className="section-title">Statistics</p>
              {loadingColumns ? (
                <div className="mt-4 h-20 animate-pulse rounded-xl bg-neutral-200" />
              ) : (
                <>
                  <select
                    className="input-surface mt-4 max-w-sm rounded-xl"
                    value={statsColumn}
                    onChange={(e) => setStatsColumn(e.target.value)}
                  >
                    <option value="">Select numeric column</option>
                    {numericColumns.map((col) => (
                      <option key={col.name} value={col.name}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                  {computing ? (
                    <div className="mt-4 h-16 animate-pulse rounded-xl bg-neutral-200" />
                  ) : stats ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                      <div className="rounded-xl border border-neutral-200 bg-white px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Min</p>
                        <p className="mt-2 text-xl font-semibold">{stats.min ?? "—"}</p>
                      </div>
                      <div className="rounded-xl border border-neutral-200 bg-white px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Max</p>
                        <p className="mt-2 text-xl font-semibold">{stats.max ?? "—"}</p>
                      </div>
                      <div className="rounded-xl border border-neutral-200 bg-white px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Sum</p>
                        <p className="mt-2 text-xl font-semibold">{stats.sum ?? "—"}</p>
                      </div>
                      <div className="rounded-xl border border-neutral-200 bg-white px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Valid rows</p>
                        <p className="mt-2 text-xl font-semibold">{stats.count}</p>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <div className="premium-card p-6">
              <p className="section-title">Visualization</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <select
                  className="input-surface rounded-xl"
                  value={xColumn}
                  onChange={(e) => setXColumn(e.target.value)}
                >
                  {columns.map((col) => (
                    <option key={col.name} value={col.name}>
                      X: {col.name}
                    </option>
                  ))}
                </select>
                <select
                  className="input-surface rounded-xl"
                  value={yColumn}
                  onChange={(e) => setYColumn(e.target.value)}
                >
                  {numericColumns.map((col) => (
                    <option key={col.name} value={col.name}>
                      Y: {col.name}
                    </option>
                  ))}
                </select>
                <select
                  className="input-surface rounded-xl"
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as ChartType)}
                >
                  <option value="bar">Bar</option>
                  <option value="line">Line</option>
                  <option value="scatter">Scatter</option>
                </select>
              </div>
              <div className="mt-6">
                {hasChartData ? (
                  <EChartsPanel
                    type={chartType}
                    xLabel={xColumn}
                    yLabel={yColumn}
                    xData={chartX}
                    yData={chartY}
                  />
                ) : (
                  <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-sm text-neutral-500">
                    Select numeric columns to render a chart.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </LayoutShell>
  );
}
