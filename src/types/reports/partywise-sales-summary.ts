export type PartywiseSalesSummaryMonths = {
  currentMonth: string;
  lastMonth: string;
  lastLastMonth: string;
};

export type PartywiseSalesSummaryRow = {
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

export interface PartywiseSalesSummaryResponse {
  success: boolean;
  data: PartywiseSalesSummaryRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  months: PartywiseSalesSummaryMonths;
}

export interface PartywiseSalesSummaryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  asOf?: string;
  customerGroupId?: number;
}
