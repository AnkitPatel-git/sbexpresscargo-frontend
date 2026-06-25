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
