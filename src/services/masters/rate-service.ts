import { apiFetch } from "@/lib/api-fetch";
import type {
  CreateRateMasterPayload,
  RateChildListResponse,
  RateChildSingleResponse,
  RateCharge,
  RateChargePayload,
  RateCondition,
  RateConditionPayload,
  RateDistanceSlab,
  RateDistanceSlabPayload,
  RateMasterListResponse,
  RateMasterSingleResponse,
  RateZoneRate,
  RateZoneRatePayload,
  UpdateRateMasterPayload,
} from "@/types/masters/rate";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export type RateMasterListQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  updateType?: string;
  fromDate?: string;
  toDate?: string;
  paymentType?: string;
  zeroContract?: boolean;
};

function authHeaders(includeJson = false) {
  return {
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  };
}

function appendRateMasterListFilters(queryParams: URLSearchParams, params?: RateMasterListQueryParams, includePagination = true) {
  if (includePagination) {
    if (params?.page !== undefined) queryParams.append("page", String(params.page));
    if (params?.limit !== undefined) queryParams.append("limit", String(params.limit));
  }
  queryParams.append("search", params?.search ?? "");
  queryParams.append("sortBy", params?.sortBy ?? "fromDate");
  queryParams.append("sortOrder", params?.sortOrder ?? "desc");
  if (params?.updateType) queryParams.append("updateType", params.updateType);
  if (params?.fromDate) queryParams.append("fromDate", params.fromDate);
  if (params?.toDate) queryParams.append("toDate", params.toDate);
  if (params?.paymentType) queryParams.append("paymentType", params.paymentType);
  if (typeof params?.zeroContract === "boolean") queryParams.append("zeroContract", String(params.zeroContract));
}

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const err = await response.json();
    return err?.message || fallback;
  } catch {
    return fallback;
  }
}

async function requestJson<T>(url: string, init?: RequestInit, fallbackError = "Request failed"): Promise<T> {
  const response = await apiFetch(url, init);
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, fallbackError));
  }
  return response.json() as Promise<T>;
}

function parseFilename(response: Response, fallback: string) {
  const cd = response.headers.get("content-disposition");
  const match = cd?.match(/filename="?([^";\n]+)"?/i);
  return match?.[1]?.trim() || fallback;
}

export const rateService = {
  async getRateMasters(params?: RateMasterListQueryParams): Promise<RateMasterListResponse> {
    const queryParams = new URLSearchParams();
    appendRateMasterListFilters(queryParams, params, true);
    return requestJson(`${API_URL}/rate-master?${queryParams.toString()}`, { headers: authHeaders() }, "Failed to fetch rate masters");
  },

  async getRateMasterById(id: number): Promise<RateMasterSingleResponse> {
    return requestJson(`${API_URL}/rate-master/${id}`, { headers: authHeaders() }, "Failed to fetch rate master");
  },

  async createRateMaster(data: CreateRateMasterPayload): Promise<RateMasterSingleResponse> {
    return requestJson(
      `${API_URL}/rate-master`,
      {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(data),
      },
      "Failed to create rate master",
    );
  },

  async updateRateMaster(id: number, data: UpdateRateMasterPayload): Promise<RateMasterSingleResponse> {
    return requestJson(
      `${API_URL}/rate-master/${id}`,
      {
        method: "PATCH",
        headers: authHeaders(true),
        body: JSON.stringify(data),
      },
      "Failed to update rate master",
    );
  },

  async deleteRateMaster(id: number): Promise<{ success: boolean; message: string }> {
    return requestJson(`${API_URL}/rate-master/${id}`, { method: "DELETE", headers: authHeaders() }, "Failed to delete rate master");
  },

  async exportRateMasters(params?: RateMasterListQueryParams): Promise<{ blob: Blob; filename: string }> {
    const queryParams = new URLSearchParams();
    appendRateMasterListFilters(queryParams, params, false);
    const response = await apiFetch(`${API_URL}/rate-master/export?${queryParams.toString()}`, { headers: authHeaders() });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to export rate masters"));
    }
    return { blob: await response.blob(), filename: parseFilename(response, "rate-masters.csv") };
  },

  async getZoneRates(rateMasterId: number): Promise<RateChildListResponse<RateZoneRate>> {
    return requestJson(`${API_URL}/rate-master/${rateMasterId}/zone-rates`, { headers: authHeaders() }, "Failed to fetch zone rates");
  },

  async getZoneRateById(rateMasterId: number, id: number): Promise<RateChildSingleResponse<RateZoneRate>> {
    return requestJson(`${API_URL}/rate-master/${rateMasterId}/zone-rates/${id}`, { headers: authHeaders() }, "Failed to fetch zone rate");
  },

  async createZoneRate(rateMasterId: number, data: RateZoneRatePayload): Promise<RateChildSingleResponse<RateZoneRate>> {
    return requestJson(
      `${API_URL}/rate-master/${rateMasterId}/zone-rates`,
      {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(data),
      },
      "Failed to create zone rate",
    );
  },

  async updateZoneRate(rateMasterId: number, id: number, data: RateZoneRatePayload): Promise<RateChildSingleResponse<RateZoneRate>> {
    return requestJson(
      `${API_URL}/rate-master/${rateMasterId}/zone-rates/${id}`,
      {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify(data),
      },
      "Failed to update zone rate",
    );
  },

  async deleteZoneRate(rateMasterId: number, id: number): Promise<{ success: boolean; message: string }> {
    return requestJson(`${API_URL}/rate-master/${rateMasterId}/zone-rates/${id}`, { method: "DELETE", headers: authHeaders() }, "Failed to delete zone rate");
  },

  async getDistanceSlabs(rateMasterId: number): Promise<RateChildListResponse<RateDistanceSlab>> {
    return requestJson(`${API_URL}/rate-master/${rateMasterId}/distance-slabs`, { headers: authHeaders() }, "Failed to fetch distance slabs");
  },

  async getDistanceSlabById(rateMasterId: number, id: number): Promise<RateChildSingleResponse<RateDistanceSlab>> {
    return requestJson(`${API_URL}/rate-master/${rateMasterId}/distance-slabs/${id}`, { headers: authHeaders() }, "Failed to fetch distance slab");
  },

  async createDistanceSlab(rateMasterId: number, data: RateDistanceSlabPayload): Promise<RateChildSingleResponse<RateDistanceSlab>> {
    return requestJson(
      `${API_URL}/rate-master/${rateMasterId}/distance-slabs`,
      {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(data),
      },
      "Failed to create distance slab",
    );
  },

  async updateDistanceSlab(rateMasterId: number, id: number, data: RateDistanceSlabPayload): Promise<RateChildSingleResponse<RateDistanceSlab>> {
    return requestJson(
      `${API_URL}/rate-master/${rateMasterId}/distance-slabs/${id}`,
      {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify(data),
      },
      "Failed to update distance slab",
    );
  },

  async deleteDistanceSlab(rateMasterId: number, id: number): Promise<{ success: boolean; message: string }> {
    return requestJson(`${API_URL}/rate-master/${rateMasterId}/distance-slabs/${id}`, { method: "DELETE", headers: authHeaders() }, "Failed to delete distance slab");
  },

  async getRateCharges(rateMasterId: number): Promise<RateChildListResponse<RateCharge>> {
    return requestJson(`${API_URL}/rate-master/${rateMasterId}/rate-charges`, { headers: authHeaders() }, "Failed to fetch rate charges");
  },

  async getRateChargeById(rateMasterId: number, id: number): Promise<RateChildSingleResponse<RateCharge>> {
    return requestJson(`${API_URL}/rate-master/${rateMasterId}/rate-charges/${id}`, { headers: authHeaders() }, "Failed to fetch rate charge");
  },

  async createRateCharge(rateMasterId: number, data: RateChargePayload): Promise<RateChildSingleResponse<RateCharge>> {
    return requestJson(
      `${API_URL}/rate-master/${rateMasterId}/rate-charges`,
      {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(data),
      },
      "Failed to create rate charge",
    );
  },

  async updateRateCharge(rateMasterId: number, id: number, data: RateChargePayload): Promise<RateChildSingleResponse<RateCharge>> {
    return requestJson(
      `${API_URL}/rate-master/${rateMasterId}/rate-charges/${id}`,
      {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify(data),
      },
      "Failed to update rate charge",
    );
  },

  async deleteRateCharge(rateMasterId: number, id: number): Promise<{ success: boolean; message: string }> {
    return requestJson(`${API_URL}/rate-master/${rateMasterId}/rate-charges/${id}`, { method: "DELETE", headers: authHeaders() }, "Failed to delete rate charge");
  },

  async getRateConditions(rateMasterId: number): Promise<RateChildListResponse<RateCondition>> {
    return requestJson(`${API_URL}/rate-master/${rateMasterId}/rate-conditions`, { headers: authHeaders() }, "Failed to fetch rate conditions");
  },

  async getRateConditionById(rateMasterId: number, id: number): Promise<RateChildSingleResponse<RateCondition>> {
    return requestJson(`${API_URL}/rate-master/${rateMasterId}/rate-conditions/${id}`, { headers: authHeaders() }, "Failed to fetch rate condition");
  },

  async createRateCondition(rateMasterId: number, data: RateConditionPayload): Promise<RateChildSingleResponse<RateCondition>> {
    return requestJson(
      `${API_URL}/rate-master/${rateMasterId}/rate-conditions`,
      {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(data),
      },
      "Failed to create rate condition",
    );
  },

  async updateRateCondition(rateMasterId: number, id: number, data: RateConditionPayload): Promise<RateChildSingleResponse<RateCondition>> {
    return requestJson(
      `${API_URL}/rate-master/${rateMasterId}/rate-conditions/${id}`,
      {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify(data),
      },
      "Failed to update rate condition",
    );
  },

  async deleteRateCondition(rateMasterId: number, id: number): Promise<{ success: boolean; message: string }> {
    return requestJson(`${API_URL}/rate-master/${rateMasterId}/rate-conditions/${id}`, { method: "DELETE", headers: authHeaders() }, "Failed to delete rate condition");
  },
};
