export type AllocationMisReportColumnKey =
  | "srNo"
  | "customerName"
  | "allocationDate"
  | "awbFrom"
  | "awbTo"
  | "totalAssigned"
  | "used"
  | "cancelled"
  | "available"
  | "status"
  | "remarks";

export type AllocationMisReportRow = Record<
  AllocationMisReportColumnKey,
  string | number | null
>;

export interface AllocationMisReportResponse {
  success: boolean;
  data: AllocationMisReportRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  columns: AllocationMisReportColumnKey[];
  headers: Record<string, string>;
}

export interface AllocationMisReportQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  customerId?: number;
  allocationDateFrom?: string;
  allocationDateTo?: string;
}
