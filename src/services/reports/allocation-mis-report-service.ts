import { apiFetch } from "@/lib/api-fetch";
import type {
  AllocationMisReportQueryParams,
  AllocationMisReportResponse,
} from "@/types/reports/allocation-mis-report";

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
  params?: AllocationMisReportQueryParams,
) {
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 20));
  queryParams.append("sortBy", params?.sortBy ?? "customerName");
  queryParams.append("sortOrder", params?.sortOrder ?? "asc");
  queryParams.append("search", params?.search ?? "");
  if (params?.customerId) queryParams.append("customerId", String(params.customerId));
  if (params?.allocationDateFrom) {
    queryParams.append("allocationDateFrom", params.allocationDateFrom);
  }
  if (params?.allocationDateTo) {
    queryParams.append("allocationDateTo", params.allocationDateTo);
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

export const allocationMisReportService = {
  async getReport(
    params?: AllocationMisReportQueryParams,
  ): Promise<AllocationMisReportResponse> {
    const queryParams = new URLSearchParams();
    appendParams(queryParams, params);
    const response = await apiFetch(
      `${API_URL}/report/allocation-mis?${queryParams.toString()}`,
      { headers: authHeaders() },
    );
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to fetch Allocation MIS report"));
    }
    return response.json();
  },

  async exportXlsx(
    params?: AllocationMisReportQueryParams,
  ): Promise<{ blob: Blob; filename: string }> {
    const queryParams = new URLSearchParams();
    appendParams(queryParams, params);
    const response = await apiFetch(
      `${API_URL}/report/allocation-mis/export?${queryParams.toString()}`,
      { headers: authHeaders() },
    );
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to export Allocation MIS report"));
    }
    return {
      blob: await response.blob(),
      filename: parseFilename(response, "allocation-mis-report.xlsx"),
    };
  },
};
