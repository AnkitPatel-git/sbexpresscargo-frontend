import { apiFetch } from "@/lib/api-fetch";
import type {
  ApiEnvelope,
  CalculateRatePayload,
  CreateRateMasterPayload,
  RateMasterListResponse,
  RateMasterSingleResponse,
  RatePreviewPayload,
  UpdateRateMasterPayload,
} from "@/types/masters/rate";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export type RateMasterListQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  fromDate?: string;
  toDate?: string;
  updateType?: string;
  serviceCenter?: string;
  origin?: string;
  customer?: string;
  product?: string;
  vendor?: string;
  destination?: string;
  paymentType?: string;
  zeroContract?: boolean;
};

function appendRateMasterListFilters(
  queryParams: URLSearchParams,
  params?: RateMasterListQueryParams,
  options: { includePagination: boolean } = { includePagination: true },
) {
  if (options.includePagination) {
    if (params?.page) queryParams.append("page", String(params.page));
    if (params?.limit) queryParams.append("limit", String(params.limit));
  }
  queryParams.append("search", params?.search ?? "");
  queryParams.append("sortBy", params?.sortBy ?? "fromDate");
  queryParams.append("sortOrder", params?.sortOrder ?? "desc");
  if (params?.fromDate) queryParams.append("fromDate", params.fromDate);
  if (params?.toDate) queryParams.append("toDate", params.toDate);
  if (params?.updateType) queryParams.append("updateType", params.updateType);
  if (params?.serviceCenter) queryParams.append("serviceCenter", params.serviceCenter);
  if (params?.origin) queryParams.append("origin", params.origin);
  if (params?.customer) queryParams.append("customer", params.customer);
  if (params?.product) queryParams.append("product", params.product);
  if (params?.vendor) queryParams.append("vendor", params.vendor);
  if (params?.destination) queryParams.append("destination", params.destination);
  if (params?.paymentType) queryParams.append("paymentType", params.paymentType);
  if (params?.zeroContract !== undefined) {
    queryParams.append("zeroContract", String(params.zeroContract));
  }
}

export const rateService = {
  async getRateMasters(params?: RateMasterListQueryParams): Promise<RateMasterListResponse> {
    const queryParams = new URLSearchParams();
    appendRateMasterListFilters(queryParams, params, { includePagination: true });

    const response = await apiFetch(`${API_URL}/rate-master?${queryParams.toString()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
    });
    if (!response.ok) throw new Error("Failed to fetch rate masters");
    return response.json();
  },

  async getRateMasterById(id: number): Promise<RateMasterSingleResponse> {
    const response = await apiFetch(`${API_URL}/rate-master/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
    });
    if (!response.ok) throw new Error("Failed to fetch rate master");
    return response.json();
  },

  async createRateMaster(data: CreateRateMasterPayload): Promise<RateMasterSingleResponse> {
    const response = await apiFetch(`${API_URL}/rate-master`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Failed to create rate master");
    }
    return response.json();
  },

  async updateRateMaster(id: number, data: UpdateRateMasterPayload): Promise<RateMasterSingleResponse> {
    const response = await apiFetch(`${API_URL}/rate-master/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Failed to update rate master");
    }
    return response.json();
  },

  async deleteRateMaster(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiFetch(`${API_URL}/rate-master/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Failed to delete rate master");
    }
    return response.json();
  },

  /** Bruno: `GET /rate-master/export` — same filter query params as list (no pagination); CSV filename from `Content-Disposition`. */
  async exportRateMasters(params?: RateMasterListQueryParams): Promise<{ blob: Blob; filename: string }> {
    const queryParams = new URLSearchParams();
    appendRateMasterListFilters(queryParams, params, { includePagination: false });

    const response = await apiFetch(`${API_URL}/rate-master/export?${queryParams.toString()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
    });
    if (!response.ok) {
      let message = "Failed to export rate masters";
      try {
        const err = await response.json();
        if (err?.message) message = err.message;
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }

    const cd = response.headers.get("content-disposition");
    let filename = "rate-masters.csv";
    const match = cd?.match(/filename="?([^";\n]+)"?/i);
    if (match?.[1]) filename = match[1].trim();

    const blob = await response.blob();
    return { blob, filename };
  },

  async calculateRate(payload: CalculateRatePayload): Promise<ApiEnvelope<unknown>> {
    const response = await apiFetch(`${API_URL}/rate-master/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Failed to calculate rate");
    }
    return response.json();
  },

  /** Bruno: Rate - Preview → POST /rate/preview */
  async previewRate(payload: RatePreviewPayload): Promise<ApiEnvelope<unknown>> {
    const response = await apiFetch(`${API_URL}/rate/preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Failed to preview rate");
    }
    return response.json();
  },
};
