export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InvoiceRecord {
  id: number;
  invoiceNo?: string;
  customerName?: string;
  fromDate?: string;
  toDate?: string;
  grandTotal?: number;
  status?: string;
  locked?: boolean;
  [key: string]: unknown;
}

export interface InvoiceListResponse {
  success: boolean;
  message?: string;
  data: InvoiceRecord[];
  meta?: PaginatedMeta;
}

export interface InvoiceGenerationPayload {
  year: string;
  fromDate: string;
  toDate: string;
  productType?: string;
  serviceCenterId?: number;
  billingType?: string;
  registerType?: string;
  customerId?: number;
  showAwb?: boolean;
}
