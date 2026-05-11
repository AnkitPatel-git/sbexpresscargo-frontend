/** Shipment receipt list row (`GET /transaction/receipt`). */
export interface ReceiptListItem {
  id: number;
  shipmentId: number;
  awbNo: string | null;
  amount: number | null;
  totalRcp: number | null;
  balance: number | null;
  lineCount: number;
  lineAmountTotal: number;
}

export interface ReceiptListResponse {
  success: boolean;
  message?: string;
  data: ReceiptListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReceiptLine {
  id: number;
  receiptId: number;
  shipmentId: number;
  receiptNo: string | null;
  receiptDate: string | null;
  amount: number | string | null;
  userId: number | null;
  receiptType: string | null;
  referenceNo: string | null;
  bankId: number | null;
  bank?: { id: number; bankName: string } | null;
}

export interface ReceiptDetail {
  id: number;
  shipmentId: number;
  amount: number | string | null;
  totalRcp: number | string | null;
  balance: number | string | null;
  createdAt?: string;
  updatedAt?: string;
  shipment?: { id: number; awbNo: string };
  lines: ReceiptLine[];
}

export interface ReceiptSingleResponse {
  success: boolean;
  message?: string;
  data: ReceiptDetail;
}

export interface ReceiptLinePayload {
  receiptNo?: string;
  receiptDate?: string;
  amount?: number;
  userId?: number;
  receiptType?: string;
  referenceNo?: string;
  bankId?: number;
}

export interface ReceiptCreatePayload {
  shipmentId: number;
  amount?: number;
  totalRcp?: number;
  balance?: number;
  lines?: ReceiptLinePayload[];
}

export type ReceiptUpdatePayload = Partial<ReceiptCreatePayload>;

export interface ReceiptListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  shipmentId?: number;
  receiptNo?: string;
  fromDate?: string;
  toDate?: string;
}
