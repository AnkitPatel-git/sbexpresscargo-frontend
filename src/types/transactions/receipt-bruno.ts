/**
 * Request shapes from docs/bruno/Transaction/Receipt/*.yml
 * Use when building create/update payloads so they match the API contract.
 */
export interface ReceiptLineBruno {
  receiptNo: string;
  receiptDate: string;
  amount: number;
  receiptType: string;
  referenceNo?: string;
  bankId?: number;
}

export interface ReceiptCreateBodyBruno {
  shipmentId: number;
  amount: number;
  totalRcp: number;
  balance: number;
  lines: ReceiptLineBruno[];
}
