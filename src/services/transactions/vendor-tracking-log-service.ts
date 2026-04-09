import { apiFetch } from "@/lib/api-fetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
const BASE = `${API_URL}/transaction/vendor-tracking-logs`;

const headers = (json = true) => {
  const h: Record<string, string> = {
    Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}`,
  };
  if (json) h["Content-Type"] = "application/json";
  return h;
};

/** Bruno: Transaction → Vendor Tracking Logs. */
export const vendorTrackingLogService = {
  async list(params?: {
    page?: number;
    limit?: number;
    shipmentId?: number;
    vendorId?: number;
    isProcessed?: boolean;
  }) {
    const q = new URLSearchParams();
    q.set("page", String(params?.page ?? 1));
    q.set("limit", String(params?.limit ?? 20));
    if (params?.shipmentId != null) q.set("shipmentId", String(params.shipmentId));
    if (params?.vendorId != null) q.set("vendorId", String(params.vendorId));
    if (params?.isProcessed != null) q.set("isProcessed", String(params.isProcessed));
    const response = await apiFetch(`${BASE}?${q}`, { headers: headers() });
    if (!response.ok) throw new Error("Failed to list vendor tracking logs");
    return response.json();
  },

  async getById(id: number | string) {
    const response = await apiFetch(`${BASE}/${id}`, { headers: headers() });
    if (!response.ok) throw new Error("Failed to fetch vendor tracking log");
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
      throw new Error((err as { message?: string }).message || "Failed to create log");
    }
    return response.json();
  },

  async update(id: number | string, body: unknown) {
    const response = await apiFetch(`${BASE}/${id}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || "Failed to update log");
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
      throw new Error((err as { message?: string }).message || "Failed to delete log");
    }
    return response.json().catch(() => ({}));
  },
};
