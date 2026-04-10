import { apiFetch } from "@/lib/api-fetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
const BASE = `${API_URL}/transaction/vendor-status-mappings`;

const headers = (json = true) => {
  const h: Record<string, string> = {
    Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}`,
  };
  if (json) h["Content-Type"] = "application/json";
  return h;
};

/** Bruno: Transaction → Vendor Status Mapping. */
export const vendorStatusMappingService = {
  async list(params?: { page?: number; limit?: number; vendorId?: number; search?: string }) {
    const q = new URLSearchParams();
    q.set("page", String(params?.page ?? 1));
    q.set("limit", String(params?.limit ?? 20));
    // Bruno: ...&vendorId=1&search=OUT — include keys when filtering; omit when unset
    if (params?.vendorId != null) q.set("vendorId", String(params.vendorId));
    if (params?.search != null && params.search !== "")
      q.set("search", params.search);
    const response = await apiFetch(`${BASE}?${q}`, { headers: headers() });
    if (!response.ok) throw new Error("Failed to list vendor status mappings");
    return response.json();
  },

  async getById(id: number | string) {
    const response = await apiFetch(`${BASE}/${id}`, { headers: headers() });
    if (!response.ok) throw new Error("Failed to fetch vendor status mapping");
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
      throw new Error((err as { message?: string }).message || "Failed to create mapping");
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
      throw new Error((err as { message?: string }).message || "Failed to update mapping");
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
      throw new Error((err as { message?: string }).message || "Failed to delete mapping");
    }
    return response.json().catch(() => ({}));
  },
};
