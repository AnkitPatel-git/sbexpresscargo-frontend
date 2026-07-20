import { apiClient } from "@/lib/api-client";
import { apiFetch } from "@/lib/api-fetch";
import {
  ApiResponse,
  InvoiceDetail,
  InvoiceGenerationPayload,
  InvoiceListResponse,
  InvoiceLockLogEntry,
  InvoiceLockLogQuery,
  InvoicePdfFormat,
  InvoiceSendEmailPayload,
  InvoiceStatus,
} from "@/types/document/invoice";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

function authHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}`,
  };
}

async function readError(response: Response, fallback: string) {
  try {
    const err = await response.json();
    if (err && typeof err.message === "string") return err.message;
  } catch {
    /* non-JSON error body */
  }
  return fallback;
}

function parseFilename(response: Response, fallback: string) {
  const cd = response.headers.get("content-disposition");
  const match = cd?.match(/filename="?([^";\n]+)"?/i);
  return match?.[1]?.trim() || fallback;
}

export const invoiceService = {
  listInvoices: (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: InvoiceStatus;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));
    if (params.search) query.append("search", params.search);
    if (params.status) query.append("status", params.status);
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
    apiClient<ApiResponse<unknown>>(
      `/document/invoice/print?invoiceIds=${encodeURIComponent(invoiceIds)}`,
    ),

  getInvoiceById: (id: number | string) =>
    apiClient<ApiResponse<InvoiceDetail>>(`/document/invoice/${id}`),

  lockInvoice: (id: number | string) =>
    apiClient<ApiResponse<InvoiceDetail>>(`/document/invoice/${id}/lock`, {
      method: "POST",
    }),

  unlockInvoice: (id: number | string) =>
    apiClient<ApiResponse<InvoiceDetail>>(`/document/invoice/${id}/unlock`, {
      method: "POST",
    }),

  getInvoiceLockLog: (params: InvoiceLockLogQuery = {}) => {
    const query = new URLSearchParams();
    if (params.fromDate) query.append("fromDate", params.fromDate);
    if (params.toDate) query.append("toDate", params.toDate);
    if (params.lockType) query.append("lockType", params.lockType);
    if (params.serviceCenterId) {
      query.append("serviceCenterId", String(params.serviceCenterId));
    }
    const qs = query.toString();
    return apiClient<ApiResponse<InvoiceLockLogEntry[]>>(
      `/document/invoice/lock-log${qs ? `?${qs}` : ""}`,
    );
  },

  sendInvoiceEmail: (payload: InvoiceSendEmailPayload) =>
    apiClient<ApiResponse<unknown>>("/document/invoice/send-email", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** GET /document/invoice/:id/pdf — tax invoice PDF for the selected format. */
  downloadInvoicePdf: async (
    id: number | string,
    format: InvoicePdfFormat = "CUSTOMER_1",
  ): Promise<{ blob: Blob; filename: string }> => {
    const query = new URLSearchParams({ format });
    const response = await apiFetch(
      `${API_URL}/document/invoice/${id}/pdf?${query.toString()}`,
      { headers: authHeaders() },
    );
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to download invoice PDF"));
    }
    return {
      blob: await response.blob(),
      filename: parseFilename(response, `invoice-${id}-${format}.pdf`),
    };
  },

  /** GET /document/invoice/export — CSV file (not JSON). */
  exportInvoicesCsv: async (): Promise<Blob> => {
    const response = await apiFetch(`${API_URL}/document/invoice/export`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to export invoices"));
    }
    return response.blob();
  },
};
