import { apiFetch } from "@/lib/api-fetch";
import type {
  ReceiptCreatePayload,
  ReceiptDetail,
  ReceiptListParams,
  ReceiptListResponse,
  ReceiptSingleResponse,
  ReceiptUpdatePayload,
} from "@/types/transactions/receipt";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
const BASE = `${API_URL}/transaction/receipt`;

function authHeaders(json = true) {
  const h: Record<string, string> = {
    Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}`,
  };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

async function readError(response: Response, fallback: string) {
  try {
    const err = await response.json();
    return (err as { message?: string }).message || fallback;
  } catch {
    return fallback;
  }
}

function appendListQuery(q: URLSearchParams, params?: ReceiptListParams) {
  q.set("page", String(params?.page ?? 1));
  q.set("limit", String(params?.limit ?? 20));
  if (params?.sortBy) q.set("sortBy", params.sortBy);
  if (params?.sortOrder) q.set("sortOrder", params.sortOrder);
  if (params?.shipmentId != null && Number.isFinite(params.shipmentId)) {
    q.set("shipmentId", String(params.shipmentId));
  }
  if (params?.receiptNo?.trim()) q.set("receiptNo", params.receiptNo.trim());
  if (params?.fromDate?.trim()) q.set("fromDate", params.fromDate.trim());
  if (params?.toDate?.trim()) q.set("toDate", params.toDate.trim());
}

export const receiptService = {
  async listReceipts(params?: ReceiptListParams): Promise<ReceiptListResponse> {
    const q = new URLSearchParams();
    appendListQuery(q, params);
    const response = await apiFetch(`${BASE}?${q}`, { headers: authHeaders() });
    if (!response.ok) throw new Error(await readError(response, "Failed to list receipts"));
    return response.json() as Promise<ReceiptListResponse>;
  },

  async getReceiptById(id: number): Promise<ReceiptDetail> {
    const response = await apiFetch(`${BASE}/${id}`, { headers: authHeaders() });
    if (!response.ok) throw new Error(await readError(response, "Failed to fetch receipt"));
    const json = (await response.json()) as ReceiptSingleResponse;
    return json.data;
  },

  async createReceipt(body: ReceiptCreatePayload): Promise<ReceiptDetail> {
    const response = await apiFetch(BASE, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(await readError(response, "Failed to create receipt"));
    const json = (await response.json()) as ReceiptSingleResponse;
    return json.data;
  },

  async updateReceipt(id: number, body: ReceiptUpdatePayload): Promise<ReceiptDetail> {
    const response = await apiFetch(`${BASE}/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(await readError(response, "Failed to update receipt"));
    const json = (await response.json()) as ReceiptSingleResponse;
    return json.data;
  },

  async deleteReceipt(id: number): Promise<void> {
    const response = await apiFetch(`${BASE}/${id}`, {
      method: "DELETE",
      headers: authHeaders(false),
    });
    if (!response.ok) throw new Error(await readError(response, "Failed to delete receipt"));
  },
};
