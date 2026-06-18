export type PartwiseSalesSummaryMonths = {
  currentMonth: string;
  lastMonth: string;
  lastLastMonth: string;
};

export type PartwiseSalesSummaryRow = {
  customerId: number;
  clientName: string;
  groupName: string | null;
  currentMonthTotal: number;
  currentMonthChargeWeight: number;
  lastMonthTotal: number;
  lastMonthChargeWeight: number;
  lastLastMonthTotal: number;
  lastLastMonthChargeWeight: number;
};

export interface PartwiseSalesSummaryResponse {
  success: boolean;
  data: PartwiseSalesSummaryRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  months: PartwiseSalesSummaryMonths;
}

export interface PartwiseSalesSummaryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  asOf?: string;
  customerGroupId?: number;
}
