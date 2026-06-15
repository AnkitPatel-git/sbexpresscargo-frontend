import { apiFetch } from "@/lib/api-fetch";
import type {
  PartwiseSalesSummaryQueryParams,
  PartwiseSalesSummaryResponse,
} from "@/types/reports/partwise-sales-summary";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

function authHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  };
}

function parseFilename(response: Response, fallback: string) {
  const cd = response.headers.get("content-disposition");
  const match = cd?.match(/filename="?([^";\n]+)"?/i);
  return match?.[1]?.trim() || fallback;
}

function appendParams(
  queryParams: URLSearchParams,
  params?: PartwiseSalesSummaryQueryParams,
) {
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 20));
  queryParams.append("sortBy", params?.sortBy ?? "clientName");
  queryParams.append("sortOrder", params?.sortOrder ?? "asc");
  if (params?.search) queryParams.append("search", params.search);
  if (params?.asOf) queryParams.append("asOf", params.asOf);
  if (params?.customerGroupId) {
    queryParams.append("customerGroupId", String(params.customerGroupId));
  }
}

async function readError(response: Response, fallback: string) {
  try {
    const err = await response.json();
    return err?.message || fallback;
  } catch {
    return fallback;
  }
}

export const partwiseSalesSummaryService = {
  async getReport(
    params?: PartwiseSalesSummaryQueryParams,
  ): Promise<PartwiseSalesSummaryResponse> {
    const queryParams = new URLSearchParams();
    appendParams(queryParams, params);
    const response = await apiFetch(
      `${API_URL}/report/partwise-sales-summary?${queryParams.toString()}`,
      { headers: authHeaders() },
    );
    if (!response.ok) {
      throw new Error(
        await readError(response, "Failed to fetch Partwise Sales Summary"),
      );
    }
    return response.json();
  },

  async exportCsv(
    params?: PartwiseSalesSummaryQueryParams,
  ): Promise<{ blob: Blob; filename: string }> {
    const queryParams = new URLSearchParams();
    appendParams(queryParams, params);
    const response = await apiFetch(
      `${API_URL}/report/partwise-sales-summary/export?${queryParams.toString()}`,
      { headers: authHeaders() },
    );
    if (!response.ok) {
      throw new Error(
        await readError(response, "Failed to export Partwise Sales Summary"),
      );
    }
    return {
      blob: await response.blob(),
      filename: parseFilename(response, "partwise-sales-summary.csv"),
    };
  },
};
