export const MIS_REPORT_COLUMNS = [
  "awbNo",
  "forwardingAwb",
  "ewaybillNumber",
  "bookDate",
  "customerName",
  "shipperName",
  "consigneeName",
  "paymentType",
  "currentStatus",
  "fromZone",
  "toZone",
  "serviceCenter",
  "productName",
  "declaredWeight",
  "chargeWeight",
  "shipmentTotalValue",
  "totalAmount",
  "createdAt",
] as const;

export type MisReportColumn = (typeof MIS_REPORT_COLUMNS)[number];

export type MisReportRow = Record<MisReportColumn, string | number | null>;

export interface MisReportResponse {
  success: boolean;
  data: MisReportRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  columns: MisReportColumn[];
  availableColumns: MisReportColumn[];
}

export interface MisReportQueryParams {
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
  shipperId?: number;
  serviceCenterId?: number;
  productId?: number;
  fromZoneId?: number;
  toZoneId?: number;
  currentStatus?: string;
  columns?: MisReportColumn[];
}
