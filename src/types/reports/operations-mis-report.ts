export type OperationsMisReportColumnKey = string;

export type OperationsMisReportRow = Record<
  OperationsMisReportColumnKey,
  string | number | null
>;

export interface OperationsMisReportResponse {
  success: boolean;
  data: OperationsMisReportRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  columns: OperationsMisReportColumnKey[];
  headers: Record<OperationsMisReportColumnKey, string>;
}

export interface OperationsMisReportQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  awbNo?: string;
  forwardingAwb?: string;
  ewaybillNumber?: string;
  referenceNo?: string;
  bookDateFrom?: string;
  bookDateTo?: string;
  vendorId?: number;
  customerId?: number;
  shipperId?: number;
  serviceCenterId?: number;
  productId?: number;
  fromZoneId?: number;
  toZoneId?: number;
  currentStatus?: string;
}
