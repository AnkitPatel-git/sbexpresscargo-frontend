export type DpBatchMode = "AIR" | "SURFACE";

export interface DpBatchReportRow {
  srNo: number;
  awbNo: string | null;
  org: string | null;
  pinCode: string | null;
  pcs: number;
  wgt: number | null;
  content: string | null;
}

export interface DpBatchReportResponse {
  success: boolean;
  data: DpBatchReportRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DpBatchReportQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  awbNo?: string;
  bookDateFrom?: string;
  bookDateTo?: string;
  customerId?: number;
  serviceCenterId?: number;
  productId?: number;
  mode?: DpBatchMode;
}
