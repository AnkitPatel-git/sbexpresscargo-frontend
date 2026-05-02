import { apiFetch } from "@/lib/api-fetch";
import type {
  ChargeByProductResponse,
  ChargeFormData,
  ChargeListResponse,
  ChargeSingleResponse,
} from "@/types/masters/charge";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export type ChargeListQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  code?: string;
  name?: string;
};

function authHeaders(includeJson = false) {
  return {
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  };
}

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const err = await response.json();
    return err?.message || fallback;
  } catch {
    return fallback;
  }
}

function parseFilename(response: Response, fallback: string) {
  const cd = response.headers.get("content-disposition");
  const match = cd?.match(/filename="?([^";\n]+)"?/i);
  return match?.[1]?.trim() || fallback;
}

function appendChargeListQuery(queryParams: URLSearchParams, params?: ChargeListQueryParams, includePagination = true) {
  if (includePagination) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    queryParams.append("page", String(page));
    queryParams.append("limit", String(limit));
  }
  if (params?.search) queryParams.append("search", params.search);
  queryParams.append("sortBy", params?.sortBy ?? "code");
  queryParams.append("sortOrder", params?.sortOrder ?? "asc");
  if (params?.code) queryParams.append("code", params.code);
  if (params?.name) queryParams.append("name", params.name);
}

export const chargeService = {
  async getCharges(params?: ChargeListQueryParams): Promise<ChargeListResponse> {
    const queryParams = new URLSearchParams();
    appendChargeListQuery(queryParams, params, true);
    const response = await apiFetch(`${API_URL}/charge-master?${queryParams.toString()}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to fetch charges"));
    }
    return response.json();
  },

  async getChargesByProduct(productId: number): Promise<ChargeByProductResponse> {
    const response = await apiFetch(`${API_URL}/charge-master/by-product/${productId}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to fetch charges for product"));
    }
    return response.json();
  },

  async getChargeById(id: number): Promise<ChargeSingleResponse> {
    const response = await apiFetch(`${API_URL}/charge-master/${id}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to fetch charge"));
    }
    return response.json();
  },

  async createCharge(data: ChargeFormData): Promise<ChargeSingleResponse> {
    const response = await apiFetch(`${API_URL}/charge-master`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to create charge"));
    }
    return response.json();
  },

  async updateCharge(id: number, data: Partial<ChargeFormData> & { version: number }): Promise<ChargeSingleResponse> {
    const response = await apiFetch(`${API_URL}/charge-master/${id}`, {
      method: "PATCH",
      headers: authHeaders(true),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to update charge"));
    }
    return response.json();
  },

  async deleteCharge(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiFetch(`${API_URL}/charge-master/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to delete charge"));
    }
    return response.json();
  },

  async exportCharges(params?: ChargeListQueryParams): Promise<{ blob: Blob; filename: string }> {
    const queryParams = new URLSearchParams();
    appendChargeListQuery(queryParams, params, false);
    const response = await apiFetch(`${API_URL}/charge-master/export?${queryParams.toString()}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to export charges"));
    }
    return { blob: await response.blob(), filename: parseFilename(response, "charges.csv") };
  },
};
