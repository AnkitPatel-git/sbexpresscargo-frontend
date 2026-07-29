export type BillingMisReportColumnKey = string;

export type BillingMisReportRow = Record<
  BillingMisReportColumnKey,
  string | number | null
>;

export interface BillingMisReportResponse {
  success: boolean;
  data: BillingMisReportRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  columns: BillingMisReportColumnKey[];
  headers: Record<BillingMisReportColumnKey, string>;
}

export interface BillingMisChargeRecalcJobStatus {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt: string;
  updatedAt: string;
  finishedAt?: string;
  total: number;
  processed: number;
  recalculated: number;
  skippedInvoiced: number;
  failed: Array<{
    shipmentId: number;
    error: string;
  }>;
  lastShipmentId?: number;
  error?: string;
}

export interface BillingMisReportQueryParams {
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
  customerId?: number;
  customerGroupId?: number;
  shipperId?: number;
  serviceCenterId?: number;
  productId?: number;
  fromZoneId?: number;
  toZoneId?: number;
  currentStatus?: string;
}
