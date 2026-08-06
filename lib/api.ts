const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(", ")
          : data.error || "Request failed.";
    throw new ApiError(message, res.status);
  }
  return data as T;
}

export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface Dataset {
  id: number;
  name: string;
  row_count: number;
  column_count: number;
  columns: string[];
  created_at: string;
}

export interface DatasetListResponse {
  items: Dataset[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PreviewResponse {
  columns: string[];
  rows: Record<string, unknown>[];
  total_rows: number;
}

export interface ColumnInfo {
  name: string;
  dtype: string;
  is_numeric: boolean;
}

export interface ComputeResponse {
  column: string;
  min: number | null;
  max: number | null;
  sum: number | null;
  count: number;
}

export interface ChartDataResponse {
  x: unknown[];
  y: (number | null)[];
}

export interface DashboardStats {
  total_datasets: number;
  total_rows: number;
  latest_upload: Dataset | null;
  available_charts: string[];
}

export const api = {
  register: (email: string, password: string) =>
    request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: (token: string) => request<User>("/auth/me", {}, token),

  listDatasets: (token: string, page = 1, pageSize = 10, search = "") => {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      search,
    });
    return request<DatasetListResponse>(`/datasets?${params}`, {}, token);
  },

  uploadDataset: (token: string, name: string, file: File) => {
    const form = new FormData();
    form.append("name", name);
    form.append("file", file);
    return request<Dataset>("/datasets", { method: "POST", body: form }, token);
  },

  previewDataset: (token: string, id: number) =>
    request<PreviewResponse>(`/datasets/${id}/preview`, {}, token),

  deleteDataset: (token: string, id: number) =>
    request<void>(`/datasets/${id}`, { method: "DELETE" }, token),

  getColumns: (token: string, id: number) =>
    request<ColumnInfo[]>(`/datasets/${id}/columns`, {}, token),

  compute: (token: string, id: number, column: string) =>
    request<ComputeResponse>("/analytics/compute", {
      method: "POST",
      body: JSON.stringify({ dataset_id: id, column }),
    }, token),

  logout: (token: string) =>
    request<void>("/auth/logout", { method: "POST" }, token),

  chartData: (token: string, id: number, xColumn: string, yColumn: string) =>
    request<ChartDataResponse>(`/datasets/${id}/chart-data`, {
      method: "POST",
      body: JSON.stringify({ x_column: xColumn, y_column: yColumn }),
    }, token),

  dashboardStats: (token: string) =>
    request<DashboardStats>("/dashboard/stats", {}, token),
};
