export type VendorBillingMisReportColumnKey = string;

export type VendorBillingMisReportRow = Record<
  VendorBillingMisReportColumnKey,
  string | number | null
>;

export interface VendorBillingMisReportResponse {
  success: boolean;
  data: VendorBillingMisReportRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  columns: VendorBillingMisReportColumnKey[];
  headers: Record<VendorBillingMisReportColumnKey, string>;
}

export interface VendorBillingMisChargeRecalcJobStatus {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt: string;
  updatedAt: string;
  finishedAt?: string;
  total: number;
  processed: number;
  recalculated: number;
  skippedNoRate: number;
  skippedNoForwarding: number;
  failed: Array<{
    shipmentId: number;
    error: string;
  }>;
  lastShipmentId?: number;
  error?: string;
}

export interface VendorBillingMisReportQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  awbNo?: string;
  forwardingAwb?: string;
  ewaybillNumber?: string;
  bookDateFrom?: string;
  bookDateTo?: string;
  forwardingDateFrom?: string;
  forwardingDateTo?: string;
  vendorId?: number;
  customerId?: number;
  shipperId?: number;
  serviceCenterId?: number;
  productId?: number;
  fromZoneId?: number;
  toZoneId?: number;
  currentStatus?: string;
}
