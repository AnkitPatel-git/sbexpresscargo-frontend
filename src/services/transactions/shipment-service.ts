import { apiFetch } from "@/lib/api-fetch";
import type {
  ApiEnvelope,
  ForwardingOptionsData,
  ForwardingRatePreviewData,
  ShipmentCalculateResponse,
  ShipmentFormPayload,
  ShipmentListQueryParams,
  ShipmentListResponse,
  ShipmentSingleResponse,
  ShipmentWeightPreviewResponse,
  VendorChargeBreakdownData,
} from "@/types/transactions/shipment";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export type ShipmentBulkImportJobStatus = {
  bulkUploadLogId: number;
  status: "PROCESSING" | "COMPLETED" | "CANCELLED";
  totalRows: number;
  successCount: number;
  failureCount: number;
  created: number;
  updated: number;
  failed: number;
  failures: Array<{ row: number; message: string; awbNo?: string | null }>;
  successes: Array<{ row: number; awbNo: string }>;
  fatalError?: { message?: string } | null;
};

function authHeaders(includeJson = false) {
  return {
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  };
}

function appendListFilters(queryParams: URLSearchParams, params?: ShipmentListQueryParams) {
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 20));
  queryParams.append("sortBy", params?.sortBy ?? "id");
  queryParams.append("sortOrder", params?.sortOrder ?? "desc");
  queryParams.append("search", params?.search ?? "");
  if (params?.awbNo) queryParams.append("awbNo", params.awbNo);
  if (params?.ewaybillNumber) queryParams.append("ewaybillNumber", params.ewaybillNumber);
  if (params?.clientName) queryParams.append("clientName", params.clientName);
  if (params?.origin) queryParams.append("origin", params.origin);
  if (params?.destination) queryParams.append("destination", params.destination);
  if (params?.bookDateFrom) queryParams.append("bookDateFrom", params.bookDateFrom);
  if (params?.bookDateTo) queryParams.append("bookDateTo", params.bookDateTo);
  if (params?.paymentType) queryParams.append("paymentType", params.paymentType);
}

async function readError(response: Response, fallback: string) {
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
    throw new Error(await readError(response, fallbackError));
  }
  return response.json() as Promise<T>;
}

function parseFilename(response: Response, fallback: string) {
  const cd = response.headers.get("content-disposition");
  const match = cd?.match(/filename="?([^";\n]+)"?/i);
  return match?.[1]?.trim() || fallback;
}

export const shipmentService = {
  async getShipments(params?: ShipmentListQueryParams): Promise<ShipmentListResponse> {
    const queryParams = new URLSearchParams();
    appendListFilters(queryParams, params);
    return requestJson(`${API_URL}/transaction/shipment?${queryParams.toString()}`, { headers: authHeaders() }, "Failed to fetch shipments");
  },

  async getShipmentById(id: number): Promise<ShipmentSingleResponse> {
    return requestJson(`${API_URL}/transaction/shipment/${id}`, { headers: authHeaders() }, "Failed to fetch shipment");
  },

  async findShipmentByAwb(awbNo: string): Promise<ShipmentListResponse["data"][number] | null> {
    const trimmed = awbNo.trim();
    if (!trimmed) return null;

    const response = await this.getShipments({
      awbNo: trimmed,
      search: trimmed,
      page: 1,
      limit: 10,
      sortBy: "id",
      sortOrder: "desc",
    });
    const rows = response.data ?? [];
    if (rows.length === 0) return null;

    const normalized = trimmed.toLowerCase();
    return (
      rows.find((row) => row.awbNo?.trim().toLowerCase() === normalized) ??
      rows.find((row) => row.awbNo?.trim().toLowerCase().includes(normalized)) ??
      rows[0]
    );
  },

  async createShipment(data: ShipmentFormPayload): Promise<ShipmentSingleResponse> {
    return requestJson(
      `${API_URL}/transaction/shipment`,
      {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(data),
      },
      "Failed to create shipment",
    );
  },

  async updateShipment(id: number, data: ShipmentFormPayload): Promise<ShipmentSingleResponse> {
    return requestJson(
      `${API_URL}/transaction/shipment/${id}`,
      {
        method: "PATCH",
        headers: authHeaders(true),
        body: JSON.stringify(data),
      },
      "Failed to update shipment",
    );
  },

  async deleteShipment(
    id: number,
    payload: { remark: string; requestedByUserId: number },
  ): Promise<ApiEnvelope<{ id: number; deleted: boolean }>> {
    return requestJson(
      `${API_URL}/transaction/shipment/${id}`,
      {
        method: "DELETE",
        headers: authHeaders(true),
        body: JSON.stringify(payload),
      },
      "Failed to delete shipment",
    );
  },

  async calculateCharges(data: ShipmentFormPayload): Promise<ApiEnvelope<ShipmentCalculateResponse>> {
    return requestJson(
      `${API_URL}/transaction/shipment/calculate-charges`,
      {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(data),
      },
      "Failed to calculate charges",
    );
  },

  async calculateWeight(data: {
    customerId: number;
    productId: number;
    bookDate?: string;
    shipperId?: number;
    consigneeId?: number;
    actualWeight?: number;
    volumetricWeight?: number;
    piecesRows: Array<{
      pieces?: number;
      length?: number;
      breadth?: number;
      height?: number;
      items?: Array<{ totalValue?: number }>;
    }>;
  }): Promise<ApiEnvelope<ShipmentWeightPreviewResponse>> {
    return requestJson(
      `${API_URL}/transaction/shipment/calculate-weight`,
      {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(data),
      },
      "Failed to calculate shipment weight",
    );
  },

  async downloadPiecesTemplate(): Promise<{ blob: Blob; filename: string }> {
    const response = await apiFetch(`${API_URL}/transaction/shipment/pieces-template`, { headers: authHeaders() });
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to download pieces template"));
    }
    return { blob: await response.blob(), filename: parseFilename(response, "shipment-pieces-template.csv") };
  },

  async downloadBulkImportTemplate(): Promise<{ blob: Blob; filename: string }> {
    const response = await apiFetch(`${API_URL}/transaction/shipment/bulk-import/template`, { headers: authHeaders() });
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to download bulk import template"));
    }
    return {
      blob: await response.blob(),
      filename: parseFilename(response, "shipment-bulk-import-template.xlsx"),
    };
  },

  async bulkImportFromExcel(
    file: File,
    options?: {
      updateExisting?: boolean;
      onProgress?: (progress: ShipmentBulkImportJobStatus) => void;
      pollIntervalMs?: number;
    },
  ): Promise<{
    created: number;
    updated: number;
    failed: number;
    failures: Array<{ row: number; message: string; awbNo?: string | null }>;
    successes: Array<{ row: number; awbNo: string }>;
    bulkUploadLogId?: number;
  }> {
    const formData = new FormData();
    formData.append("file", file);
    if (options?.updateExisting === false) {
      formData.append("updateExisting", "false");
    }
    const response = await apiFetch(`${API_URL}/transaction/shipment/bulk-import`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      body: formData,
    });
    const json = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      data?: {
        bulkUploadLogId: number;
        status: string;
        totalRows: number;
      };
      message?: string;
    };
    if (!response.ok) {
      throw new Error(json.message || "Bulk import failed");
    }
    if (!json.success || json.data?.bulkUploadLogId == null) {
      throw new Error("Invalid bulk import response");
    }

    const logId = json.data.bulkUploadLogId;
    const totalRows = json.data.totalRows;
    options?.onProgress?.({
      bulkUploadLogId: logId,
      status: "PROCESSING",
      totalRows,
      successCount: 0,
      failureCount: 0,
      created: 0,
      updated: 0,
      failed: 0,
      failures: [],
      successes: [],
    });

    const pollMs = options?.pollIntervalMs ?? 2000;
    const maxWaitMs = 30 * 60 * 1000;
    const startedAt = Date.now();

    while (true) {
      const statusResponse = await apiFetch(
        `${API_URL}/transaction/shipment/bulk-import/status/${logId}`,
        { headers: authHeaders() },
      );
      const statusJson = (await statusResponse.json().catch(() => ({}))) as {
        success?: boolean;
        data?: ShipmentBulkImportJobStatus;
        message?: string;
      };
      if (!statusResponse.ok || !statusJson.success || statusJson.data == null) {
        throw new Error(statusJson.message || "Failed to check bulk import status");
      }

      const job = statusJson.data;
      options?.onProgress?.(job);

      if (job.status === "COMPLETED") {
        return {
          created: job.created,
          updated: job.updated,
          failed: job.failed,
          failures: job.failures,
          successes: job.successes,
          bulkUploadLogId: job.bulkUploadLogId,
        };
      }
      if (job.status === "CANCELLED") {
        const fatal =
          job.fatalError && typeof job.fatalError.message === "string"
            ? job.fatalError.message
            : "Bulk import was cancelled";
        throw new Error(fatal);
      }
      if (Date.now() - startedAt > maxWaitMs) {
        throw new Error(
          "Bulk import is still running. Check bulk upload logs later for results.",
        );
      }
      await new Promise((resolve) => setTimeout(resolve, pollMs));
    }
  },

  async downloadBulkForwardingTemplate(): Promise<{ blob: Blob; filename: string }> {
    const response = await apiFetch(`${API_URL}/transaction/shipment/bulk-forwarding/template`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to download bulk forwarding template"));
    }
    return {
      blob: await response.blob(),
      filename: parseFilename(response, "shipment-bulk-forwarding-template.xlsx"),
    };
  },

  async bulkForwardingFromExcel(file: File): Promise<{
    updated: number;
    failed: number;
    failures: Array<{ row: number; message: string; awbNo?: string | null }>;
    successes: Array<{ row: number; awbNo: string }>;
    bulkUploadLogId?: number;
  }> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiFetch(`${API_URL}/transaction/shipment/bulk-forwarding`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      body: formData,
    });
    const json = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      data?: {
        updated: number;
        failed: number;
        failures: Array<{ row: number; message: string; awbNo?: string | null }>;
        successes: Array<{ row: number; awbNo: string }>;
        bulkUploadLogId?: number;
      };
      message?: string;
    };
    if (!response.ok) {
      throw new Error(json.message || "Bulk forwarding update failed");
    }
    if (!json.success || json.data == null) {
      throw new Error("Invalid bulk forwarding response");
    }
    return json.data;
  },

  async exportShipmentsCsv(params?: ShipmentListQueryParams): Promise<{ blob: Blob; filename: string }> {
    const queryParams = new URLSearchParams();
    appendListFilters(queryParams, params);
    const response = await apiFetch(`${API_URL}/transaction/shipment/export?${queryParams.toString()}`, { headers: authHeaders() });
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to export shipments"));
    }
    return { blob: await response.blob(), filename: parseFilename(response, "shipments.csv") };
  },

  async saveForwarding(
    shipmentId: number,
    data: {
      version: number;
      forwardingAwb: string;
      forwardingDate?: string | null;
      deliveryVendorId?: number | null;
      deliveryServiceMapId?: number | null;
      charges?: Array<{
        chargeId: number;
        description?: string;
        rate?: number;
        amount?: number;
        fuelApply?: boolean;
        fuelAmount?: number;
        taxApply?: boolean;
        taxOnFuel?: boolean;
        igst?: number;
        cgst?: number;
        sgst?: number;
        total?: number;
        chargeType?: string;
      }>;
    },
  ): Promise<ApiEnvelope<unknown>> {
    return requestJson(
      `${API_URL}/transaction/shipment/${shipmentId}/forwarding`,
      {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(data),
      },
      "Failed to save forwarding details",
    );
  },

  async upsertForwarding(
    shipmentId: number,
    data: {
      version: number;
      forwardingAwb: string;
      forwardingDate?: string | null;
      deliveryVendorId?: number | null;
      deliveryServiceMapId?: number | null;
    },
  ): Promise<ApiEnvelope<unknown>> {
    return shipmentService.saveForwarding(shipmentId, data);
  },

  async getForwardingRatePreview(
    shipmentId: number,
    vendorId: number,
  ): Promise<ApiEnvelope<ForwardingRatePreviewData>> {
    const query = new URLSearchParams({ vendorId: String(vendorId) });
    return requestJson(
      `${API_URL}/transaction/shipment/${shipmentId}/forwarding-rate-preview?${query.toString()}`,
      { headers: authHeaders() },
      "Failed to load forwarding rate preview",
    );
  },

  async getForwardingOptions(
    shipmentId: number,
  ): Promise<ApiEnvelope<ForwardingOptionsData>> {
    return requestJson(
      `${API_URL}/transaction/shipment/${shipmentId}/forwarding-options`,
      { headers: authHeaders() },
      "Failed to load forwarding options",
    );
  },

  async getVendorChargeBreakdown(
    shipmentId: number,
    vendorId: number,
    serviceMapId: number,
  ): Promise<ApiEnvelope<VendorChargeBreakdownData>> {
    const query = new URLSearchParams({
      vendorId: String(vendorId),
      serviceMapId: String(serviceMapId),
    });
    return requestJson(
      `${API_URL}/transaction/shipment/${shipmentId}/vendor-charge-breakdown?${query.toString()}`,
      { headers: authHeaders() },
      "Failed to load vendor charge breakdown",
    );
  },

  async uploadForwardingDocument(
    shipmentId: number,
    file: File,
  ): Promise<ApiEnvelope<{ documentName: string | null; documentPath: string | null }>> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiFetch(
      `${API_URL}/transaction/shipment/${shipmentId}/forwarding/document`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        body: formData,
      },
    );
    const json = (await response.json().catch(() => ({}))) as ApiEnvelope<{
      documentName: string | null;
      documentPath: string | null;
    }> & { message?: string };
    if (!response.ok || !json.success) {
      throw new Error(json.message || "Failed to upload forwarding document");
    }
    return json;
  },

  async downloadForwardingDocument(
    shipmentId: number,
  ): Promise<{ blob: Blob; filename: string }> {
    const response = await apiFetch(
      `${API_URL}/transaction/shipment/${shipmentId}/forwarding/document`,
      { headers: authHeaders() },
    );
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to download forwarding document"));
    }
    return {
      blob: await response.blob(),
      filename: parseFilename(response, `forwarding-${shipmentId}`),
    };
  },

  async uploadKyc(
    shipmentId: number,
    payload: {
      type: string;
      entryType?: string;
      entryDate?: string;
    },
  ): Promise<ApiEnvelope<unknown>> {
    return requestJson(
      `${API_URL}/transaction/shipment/${shipmentId}/kyc`,
      {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({
          type: payload.type,
          entryType: payload.entryType,
          entryDate: payload.entryDate,
        }),
      },
      "Failed to upload KYC",
    );
  },

  async addPod(
    shipmentId: number,
    data: { podFilePath: string; remark?: string },
  ): Promise<ApiEnvelope<unknown>> {
    return requestJson(
      `${API_URL}/transaction/shipment/${shipmentId}/pod`,
      {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(data),
      },
      "Failed to add POD",
    );
  },

  async downloadPodBlankForm(
    shipmentId: number,
    regenerate = false,
  ): Promise<{ blob: Blob; filename: string }> {
    const q = regenerate ? "?regenerate=true" : "";
    const response = await apiFetch(`${API_URL}/transaction/shipment/${shipmentId}/pod-form${q}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to download POD form"));
    }
    return {
      blob: await response.blob(),
      filename: parseFilename(response, `POD-${shipmentId}.pdf`),
    };
  },

  async downloadShippingLabel(
    awbNo: string,
    options?: { regenerate?: boolean },
  ): Promise<{ blob: Blob; filename: string }> {
    const encoded = encodeURIComponent(awbNo.trim());
    const q =
      options?.regenerate === true ? '?regenerate=true' : '';
    const response = await apiFetch(
      `${API_URL}/transaction/shipment/awb/${encoded}/shipping-label${q}`,
      { headers: authHeaders() },
    );
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to download shipping label"));
    }
    return {
      blob: await response.blob(),
      filename: parseFilename(response, `label-${awbNo}.pdf`),
    };
  },

  async downloadUploadedPodProof(
    shipmentId: number,
  ): Promise<{ blob: Blob; filename: string }> {
    const response = await apiFetch(`${API_URL}/transaction/shipment/${shipmentId}/pod-proof`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to download uploaded POD"));
    }
    return {
      blob: await response.blob(),
      filename: parseFilename(response, `POD-proof-${shipmentId}`),
    };
  },

  async uploadPodProof(
    shipmentId: number,
    file: File,
    options?: { remark?: string; markDelivered?: boolean },
  ): Promise<ApiEnvelope<{ filePath: string; shipmentStatus: unknown | null }>> {
    const formData = new FormData();
    formData.append("file", file);
    if (options?.remark) formData.append("remark", options.remark);
    if (options?.markDelivered === false) {
      formData.append("markDelivered", "false");
    }
    const response = await apiFetch(`${API_URL}/transaction/shipment/${shipmentId}/pod-upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      body: formData,
    });
    const json = (await response.json().catch(() => ({}))) as ApiEnvelope<{
      filePath: string;
      shipmentStatus: unknown | null;
    }> & { message?: string };
    if (!response.ok) {
      throw new Error(json.message || "Failed to upload POD");
    }
    if (!json.success || json.data == null) {
      throw new Error(json.message || "Invalid POD upload response");
    }
    return json;
  },

  async updateShipmentStatus(
    shipmentId: number,
    data: {
      status: string;
      version: number;
      reason?: string;
      location?: string;
      subStatus?: string;
      scannedAt?: string;
    },
  ): Promise<ApiEnvelope<unknown>> {
    return requestJson(
      `${API_URL}/transaction/shipment/${shipmentId}/status`,
      {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(data),
      },
      "Failed to update shipment status",
    );
  },
};
