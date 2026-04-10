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

/** POST /document/invoice/send-email (Bruno: Send Invoice Email) */
export interface InvoiceSendEmailPayload {
  fromDate?: string;
  toDate?: string;
  serviceCenterId?: number;
  productType?: string;
  invoiceFormat?: string;
  customerId?: number;
  invoiceStatus?: string;
  year?: string;
  invoiceMessage?: string;
  pendingEmailOnly?: boolean;
  senderSmtp?: string;
  smtpPort?: number;
  senderUserId?: string;
  password?: string;
  senderEmailId?: string;
  additionalCc?: string;
  invalidEmailFallbackTo?: string;
  sendInvoiceEmail?: boolean;
  sendInvoiceAckEmail?: boolean;
  ssl?: boolean;
  emailDocument?: string;
}
