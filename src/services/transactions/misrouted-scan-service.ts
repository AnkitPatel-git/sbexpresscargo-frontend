import { apiFetch } from "@/lib/api-fetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
const BASE = `${API_URL}/transaction/misrouted-scan`;

const headers = (json = true) => {
  const h: Record<string, string> = {
    Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}`,
  };
  if (json) h["Content-Type"] = "application/json";
  return h;
};

/** Bruno: Transaction → Misrouted Scan. */
export const misroutedScanService = {
  async list(page = 1, limit = 20) {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    const response = await apiFetch(`${BASE}?${q}`, { headers: headers() });
    if (!response.ok) throw new Error("Failed to list misrouted scans");
    return response.json();
  },

  async getById(id: number | string) {
    const response = await apiFetch(`${BASE}/${id}`, { headers: headers() });
    if (!response.ok) throw new Error("Failed to fetch misrouted scan");
    return response.json();
  },

  async create(body: unknown) {
    const response = await apiFetch(BASE, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || "Failed to create misrouted scan");
    }
    return response.json();
  },

  async update(id: number | string, body: unknown) {
    const response = await apiFetch(`${BASE}/${id}`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || "Failed to update misrouted scan");
    }
    return response.json();
  },

  async delete(id: number | string) {
    const response = await apiFetch(`${BASE}/${id}`, {
      method: "DELETE",
      headers: headers(false),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || "Failed to delete misrouted scan");
    }
    return response.json().catch(() => ({}));
  },

  async exportCsv(): Promise<Blob> {
    const response = await apiFetch(`${BASE}/export`, { headers: headers(false) });
    if (!response.ok) throw new Error("Failed to export misrouted scans");
    return response.blob();
  },
};
