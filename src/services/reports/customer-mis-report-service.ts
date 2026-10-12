import { apiFetch } from "@/lib/api-fetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export type CustomerMisQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  awbNo?: string;
  ewaybillNumber?: string;
  referenceNo?: string;
  bookDateFrom?: string;
  bookDateTo?: string;
  customerId?: number;
  shipperId?: number;
  serviceCenterId?: number;
  productId?: number;
  fromZoneId?: number;
  toZoneId?: number;
  currentStatus?: string;
};

export type CustomerMisRow = Record<string, string | number | null>;

export type CustomerMisResponse = {
  success: boolean;
  data: CustomerMisRow[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
  columns: string[];
  headers: Record<string, string>;
};

function authHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  };
}

function appendParams(queryParams: URLSearchParams, params?: CustomerMisQuery) {
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 20));
  queryParams.append("sortBy", params?.sortBy ?? "id");
  queryParams.append("sortOrder", params?.sortOrder ?? "desc");
  queryParams.append("search", params?.search ?? "");
  if (params?.awbNo) queryParams.append("awbNo", params.awbNo);
  if (params?.ewaybillNumber) queryParams.append("ewaybillNumber", params.ewaybillNumber);
  if (params?.referenceNo) queryParams.append("referenceNo", params.referenceNo);
  if (params?.bookDateFrom) queryParams.append("bookDateFrom", params.bookDateFrom);
  if (params?.bookDateTo) queryParams.append("bookDateTo", params.bookDateTo);
  if (params?.customerId) queryParams.append("customerId", String(params.customerId));
  if (params?.shipperId) queryParams.append("shipperId", String(params.shipperId));
  if (params?.serviceCenterId) queryParams.append("serviceCenterId", String(params.serviceCenterId));
  if (params?.productId) queryParams.append("productId", String(params.productId));
  if (params?.fromZoneId) queryParams.append("fromZoneId", String(params.fromZoneId));
  if (params?.toZoneId) queryParams.append("toZoneId", String(params.toZoneId));
  if (params?.currentStatus) queryParams.append("currentStatus", params.currentStatus);
}

async function readError(response: Response, fallback: string) {
  try {
    const err = await response.json();
    const message = err?.message;
    if (Array.isArray(message)) return message.join(", ");
    return message || fallback;
  } catch {
    return fallback;
  }
}

export const customerMisReportService = {
  async getReport(params?: CustomerMisQuery): Promise<CustomerMisResponse> {
    const queryParams = new URLSearchParams();
    appendParams(queryParams, params);
    const response = await apiFetch(`${API_URL}/report/customer-mis?${queryParams.toString()}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to load MIS"));
    }
    return response.json();
  },

  async exportXlsx(params?: CustomerMisQuery): Promise<{ blob: Blob; filename: string }> {
    const queryParams = new URLSearchParams();
    appendParams(queryParams, params);
    const response = await apiFetch(
      `${API_URL}/report/customer-mis/export?${queryParams.toString()}`,
      { headers: authHeaders() },
    );
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to export MIS"));
    }
    const cd = response.headers.get("content-disposition");
    const match = cd?.match(/filename="?([^";\n]+)"?/i);
    return {
      blob: await response.blob(),
      filename: match?.[1]?.trim() || "customer-mis.xlsx",
    };
  },
};
