import { apiClient } from "@/lib/api-client";
import { ApiResponse, InvoiceGenerationPayload, InvoiceListResponse } from "@/types/document/invoice";

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
};
