export type DimensionMisReportColumnKey = string;

export type DimensionMisReportRow = Record<
  DimensionMisReportColumnKey,
  string | number | null
>;

export interface DimensionMisReportResponse {
  success: boolean;
  data: DimensionMisReportRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  columns: DimensionMisReportColumnKey[];
  headers: Record<DimensionMisReportColumnKey, string>;
}

export interface DimensionMisReportQueryParams {
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
