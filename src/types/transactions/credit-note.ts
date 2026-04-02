import { z } from "zod";

export const creditNoteItemSchema = z.object({
    id: z.number().optional(),
    awbNo: z.string().min(1, "AWB No is required"),
    destination: z.string().optional(),
    product: z.string().optional(),
    weight: z.number().optional(),
    pcs: z.number().optional(),
    remark: z.string().optional(),
    amount: z.number().optional(),
    igst: z.number().optional(),
    sgst: z.number().optional(),
    cgst: z.number().optional(),
    total: z.number().optional(),
});

export const creditNoteFormSchema = z.object({
    noteNo: z.string().min(1, "Note No is required"),
    creditNoteNo: z.number().optional(),
    cnDate: z.string().min(1, "Date is required"),
    customerId: z.number().min(1, "Customer is required"),
    invoiceRef: z.string().optional(),
    narration: z.string().optional(),
    gst: z.boolean().optional(),
    amount: z.number().optional(),
    igst: z.number().optional(),
    sgst: z.number().optional(),
    cgst: z.number().optional(),
    totalAmount: z.number().optional(),
    grandTotal: z.number().optional(),
    serviceCenter: z.string().optional(),
    serviceCenterId: z.number().optional(),
    items: z.array(creditNoteItemSchema).min(1, "At least one item is required"),
});

export type CreditNoteItem = z.infer<typeof creditNoteItemSchema>;
export type CreditNoteFormValues = z.infer<typeof creditNoteFormSchema>;

export interface CreditNote {
    id: number;
    noteNo: string;
    creditNoteNo?: number;
    cnDate: string;
    customerId: number;
    invoiceRef?: string;
    narration?: string;
    gst?: boolean;
    amount?: string;
    igst?: string;
    sgst?: string;
    cgst?: string;
    totalAmount?: string;
    grandTotal?: string;
    serviceCenterId?: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    createdById: number;
    updatedById?: number | null;
    items?: CreditNoteItem[];
    customer?: {
        id: number;
        name: string;
    };
}

export interface CreditNoteListResponse {
    success: boolean;
    message: string;
    data: CreditNote[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CreditNoteSingleResponse {
    success: boolean;
    message: string;
    data: CreditNote;
}
