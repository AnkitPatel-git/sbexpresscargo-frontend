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

export interface InvoicePreviewAwbLine {
  shipmentId: number;
  awbNo?: string;
  bookDate?: string | null;
  createdAt: string;
}

export interface InvoicePreviewResult {
  customerId: number | null;
  serviceCenterId: number | null;
  fromDate: string;
  toDate: string;
  productType: string | null;
  registerType: string | null;
  awbCount: number;
  totalAmount: number;
  fuelAmount: number;
  igst: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  awbLines?: InvoicePreviewAwbLine[];
}

export interface InvoiceGenerateResult {
  createdInvoiceId: number | null;
  invoiceNo?: string;
  shipmentCount: number;
  totals: {
    baseAmount: number;
    fuelAmount: number;
    igst: number;
    cgst: number;
    sgst: number;
    grandTotal: number;
    awbCount: number;
  };
}

/** Tax-invoice PDF layout (must match backend InvoicePdfFormat). */
export type InvoicePdfFormat = "CUSTOMER_1" | "CUSTOMER_2";

export const INVOICE_PDF_FORMAT_OPTIONS: Array<{
  value: InvoicePdfFormat;
  label: string;
}> = [
  { value: "CUSTOMER_1", label: "Customer 1 Tax Invoice" },
  { value: "CUSTOMER_2", label: "Customer 2 Tax Invoice" },
];

/** POST /document/invoice/send-email (Bruno: Send Invoice Email) */
export interface InvoiceSendEmailPayload {
  fromDate?: string;
  toDate?: string;
  serviceCenterId?: number;
  productType?: string;
  invoiceFormat?: InvoicePdfFormat | string;
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

