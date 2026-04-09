import { apiFetch } from "@/lib/api-fetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
const BASE = `${API_URL}/transaction/tracking-summary`;

const headers = (json = true) => {
  const h: Record<string, string> = {
    Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}`,
  };
  if (json) h["Content-Type"] = "application/json";
  return h;
};

/** Bruno: Transaction → Tracking Summary (`/transaction/tracking-summary`, not `/tracking/.../summary`). */
export const trackingSummaryService = {
  async list(params?: { page?: number; limit?: number; shipmentId?: number; awbNo?: string }) {
    const q = new URLSearchParams();
    q.set("page", String(params?.page ?? 1));
    q.set("limit", String(params?.limit ?? 20));
    if (params?.shipmentId != null) q.set("shipmentId", String(params.shipmentId));
    if (params?.awbNo) q.set("awbNo", params.awbNo);
    const response = await apiFetch(`${BASE}?${q}`, { headers: headers() });
    if (!response.ok) throw new Error("Failed to list tracking summaries");
    return response.json();
  },

  async getByShipmentId(shipmentId: number | string) {
    const response = await apiFetch(`${BASE}/${shipmentId}`, { headers: headers() });
    if (!response.ok) throw new Error("Failed to fetch tracking summary");
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
      throw new Error((err as { message?: string }).message || "Failed to create tracking summary");
    }
    return response.json();
  },

  async update(shipmentId: number | string, body: unknown) {
    const response = await apiFetch(`${BASE}/${shipmentId}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || "Failed to update tracking summary");
    }
    return response.json();
  },

  async delete(shipmentId: number | string) {
    const response = await apiFetch(`${BASE}/${shipmentId}`, {
      method: "DELETE",
      headers: headers(false),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || "Failed to delete tracking summary");
    }
    return response.json().catch(() => ({}));
  },
};
