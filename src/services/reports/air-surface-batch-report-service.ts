import { apiFetch } from "@/lib/api-fetch";
import type {
  AirSurfaceBatchMode,
  AirSurfaceBatchReportQueryParams,
  AirSurfaceBatchReportResponse,
} from "@/types/reports/air-surface-batch-report";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

function authHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  };
}

function appendParams(queryParams: URLSearchParams, params?: AirSurfaceBatchReportQueryParams) {
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 20));
  queryParams.append("sortBy", params?.sortBy ?? "awbNo");
  queryParams.append("sortOrder", params?.sortOrder ?? "asc");
  queryParams.append("search", params?.search ?? "");

  if (params?.awbNo) queryParams.append("awbNo", params.awbNo);
  if (params?.bookDateFrom) queryParams.append("bookDateFrom", params.bookDateFrom);
  if (params?.bookDateTo) queryParams.append("bookDateTo", params.bookDateTo);
  if (params?.customerId) queryParams.append("customerId", String(params.customerId));
  if (params?.serviceCenterId) queryParams.append("serviceCenterId", String(params.serviceCenterId));
  if (params?.productId) queryParams.append("productId", String(params.productId));
  if (params?.mode) queryParams.append("mode", params.mode);
}

function parseFilename(response: Response, fallback: string) {
  const disposition = response.headers.get("Content-Disposition");
  if (!disposition) return fallback;
  const match = /filename="?([^"]+)"?/i.exec(disposition);
  return match?.[1]?.trim() || fallback;
}

async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    const message = body.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string" && message.trim()) return message;
  } catch {
    // ignore
  }
  return fallback;
}

export const airSurfaceBatchReportService = {
  async getAirSurfaceBatchReport(
    params?: AirSurfaceBatchReportQueryParams,
  ): Promise<AirSurfaceBatchReportResponse> {
    const queryParams = new URLSearchParams();
    appendParams(queryParams, params);
    const response = await apiFetch(`${API_URL}/report/air-surface-batch?${queryParams.toString()}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to fetch Air/Surface Batch report"));
    }
    return response.json();
  },

  async exportAirSurfaceBatchReportXlsx(
    params?: AirSurfaceBatchReportQueryParams,
  ): Promise<{ blob: Blob; filename: string }> {
    const queryParams = new URLSearchParams();
    appendParams(queryParams, params);
    const response = await apiFetch(
      `${API_URL}/report/air-surface-batch/export?${queryParams.toString()}`,
      { headers: authHeaders() },
    );
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to export Air/Surface Batch report"));
    }
    return {
      blob: await response.blob(),
      filename: parseFilename(response, "air-surface-mode-manifest.xlsx"),
    };
  },
};

export type { AirSurfaceBatchMode };
