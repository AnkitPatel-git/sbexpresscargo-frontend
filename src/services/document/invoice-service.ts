import { apiClient } from "@/lib/api-client";
import { apiFetch } from "@/lib/api-fetch";
import {
  ApiResponse,
  InvoiceGenerationPayload,
  InvoiceListResponse,
  InvoiceSendEmailPayload,
} from "@/types/document/invoice";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export const invoiceService = {
  listInvoices: (params: { page?: number; limit?: number; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));
    if (params.search) query.append("search", params.search);
    return apiClient<InvoiceListResponse>(`/document/invoice?${query.toString()}`);
  },

  previewInvoices: (payload: InvoiceGenerationPayload) =>
    apiClient<ApiResponse<unknown>>("/document/invoice/preview", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  generateInvoices: (payload: InvoiceGenerationPayload) =>
    apiClient<ApiResponse<unknown>>("/document/invoice/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getPrintData: (invoiceIds: string) =>
    apiClient<ApiResponse<unknown>>(`/document/invoice/print?invoiceIds=${encodeURIComponent(invoiceIds)}`),

  getInvoiceById: (id: number | string) =>
    apiClient<ApiResponse<unknown>>(`/document/invoice/${id}`),

  lockInvoice: (id: number | string) =>
    apiClient<ApiResponse<unknown>>(`/document/invoice/${id}/lock`, {
      method: "POST",
    }),

  unlockInvoice: (id: number | string) =>
    apiClient<ApiResponse<unknown>>(`/document/invoice/${id}/unlock`, {
      method: "POST",
    }),

  getInvoiceLockLog: () =>
    apiClient<ApiResponse<unknown>>("/document/invoice/lock-log"),

  sendInvoiceEmail: (payload: InvoiceSendEmailPayload) =>
    apiClient<ApiResponse<unknown>>("/document/invoice/send-email", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** GET /document/invoice/export — CSV file (not JSON). */
  exportInvoicesCsv: async (): Promise<Blob> => {
    const response = await apiFetch(`${API_URL}/document/invoice/export`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}`,
      },
    });
    if (!response.ok) {
      let message = "Failed to export invoices";
      try {
        const err = await response.json();
        if (err && typeof err.message === "string") message = err.message;
      } catch {
        /* non-JSON error body */
      }
      throw new Error(message);
    }
    return response.blob();
  },
};
