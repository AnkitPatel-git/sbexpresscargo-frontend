export type AirSurfaceBatchMode = "AIR" | "SURFACE";

export interface AirSurfaceBatchReportRow {
  srNo: number;
  awbNo: string | null;
  org: string | null;
  consignee: string | null;
  pinCode: string | null;
  productType: string | null;
  pcs: number;
  wgt: number | null;
  content: string | null;
}

export interface AirSurfaceBatchReportResponse {
  success: boolean;
  data: AirSurfaceBatchReportRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AirSurfaceBatchReportQueryParams {
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
  mode?: AirSurfaceBatchMode;
}
