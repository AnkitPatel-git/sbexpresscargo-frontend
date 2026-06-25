import { apiFetch } from "@/lib/api-fetch";
import type {
  VendorBillingMisReportQueryParams,
  VendorBillingMisReportResponse,
} from "@/types/reports/vendor-billing-mis-report";

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
  params?: VendorBillingMisReportQueryParams,
) {
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 20));
  queryParams.append("sortBy", params?.sortBy ?? "id");
  queryParams.append("sortOrder", params?.sortOrder ?? "desc");
  queryParams.append("search", params?.search ?? "");

  if (params?.awbNo) queryParams.append("awbNo", params.awbNo);
  if (params?.forwardingAwb) queryParams.append("forwardingAwb", params.forwardingAwb);
  if (params?.ewaybillNumber) queryParams.append("ewaybillNumber", params.ewaybillNumber);
  if (params?.bookDateFrom) queryParams.append("bookDateFrom", params.bookDateFrom);
  if (params?.bookDateTo) queryParams.append("bookDateTo", params.bookDateTo);
  if (params?.forwardingDateFrom) {
    queryParams.append("forwardingDateFrom", params.forwardingDateFrom);
  }
  if (params?.forwardingDateTo) {
    queryParams.append("forwardingDateTo", params.forwardingDateTo);
  }
  if (params?.vendorId) queryParams.append("vendorId", String(params.vendorId));
  if (params?.customerId) queryParams.append("customerId", String(params.customerId));
  if (params?.shipperId) queryParams.append("shipperId", String(params.shipperId));
  if (params?.serviceCenterId) {
    queryParams.append("serviceCenterId", String(params.serviceCenterId));
  }
  if (params?.productId) queryParams.append("productId", String(params.productId));
  if (params?.fromZoneId) queryParams.append("fromZoneId", String(params.fromZoneId));
  if (params?.toZoneId) queryParams.append("toZoneId", String(params.toZoneId));
  if (params?.currentStatus) queryParams.append("currentStatus", params.currentStatus);
}

async function readError(response: Response, fallback: string) {
  try {
    const err = await response.json();
    return err?.message || fallback;
  } catch {
    return fallback;
  }
}

export const vendorBillingMisReportService = {
  async getReport(
    params?: VendorBillingMisReportQueryParams,
  ): Promise<VendorBillingMisReportResponse> {
    const queryParams = new URLSearchParams();
    appendParams(queryParams, params);
    const response = await apiFetch(
      `${API_URL}/report/vendor-billing-mis?${queryParams.toString()}`,
      { headers: authHeaders() },
    );
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to fetch Vendor Billing MIS report"));
    }
    return response.json();
  },

  async exportXlsx(
    params?: VendorBillingMisReportQueryParams,
  ): Promise<{ blob: Blob; filename: string }> {
    const queryParams = new URLSearchParams();
    appendParams(queryParams, params);
    const response = await apiFetch(
      `${API_URL}/report/vendor-billing-mis/export?${queryParams.toString()}`,
      { headers: authHeaders() },
    );
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to export Vendor Billing MIS report"));
    }
    return {
      blob: await response.blob(),
      filename: parseFilename(response, "vendor-billing-mis-report.xlsx"),
    };
  },
};
