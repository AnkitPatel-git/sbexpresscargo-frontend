import { apiFetch } from "@/lib/api-fetch";
import type { ReceiptCreateBodyBruno } from "@/types/transactions/receipt-bruno";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
const BASE = `${API_URL}/transaction/receipt`;

const headers = (json = true) => {
  const h: Record<string, string> = {
    Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}`,
  };
  if (json) h["Content-Type"] = "application/json";
  return h;
};

/** Bruno: Transaction → Receipt. */
export const receiptService = {
  async listReceipts(params?: {
    page?: number;
    limit?: number;
    shipmentId?: string | number;
    receiptNo?: string;
  }) {
    const q = new URLSearchParams();
    q.set("page", String(params?.page ?? 1));
    q.set("limit", String(params?.limit ?? 20));
    // Bruno: always sends shipmentId= & receiptNo= (empty string when unset)
    q.set(
      "shipmentId",
      params?.shipmentId != null && params.shipmentId !== ""
        ? String(params.shipmentId)
        : "",
    );
    q.set("receiptNo", params?.receiptNo ?? "");
    const response = await apiFetch(`${BASE}?${q}`, { headers: headers() });
    if (!response.ok) throw new Error("Failed to list receipts");
    return response.json();
  },

  async getReceiptById(id: number | string) {
    const response = await apiFetch(`${BASE}/${id}`, { headers: headers() });
    if (!response.ok) throw new Error("Failed to fetch receipt");
    return response.json();
  },

  async createReceipt(body: ReceiptCreateBodyBruno) {
    const response = await apiFetch(BASE, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || "Failed to create receipt");
    }
    return response.json();
  },

  async updateReceipt(id: number | string, body: Partial<ReceiptCreateBodyBruno>) {
    const response = await apiFetch(`${BASE}/${id}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || "Failed to update receipt");
    }
    return response.json();
  },

  async deleteReceipt(id: number | string) {
    const response = await apiFetch(`${BASE}/${id}`, {
      method: "DELETE",
      headers: headers(false),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || "Failed to delete receipt");
    }
    return response.json().catch(() => ({}));
  },
};
