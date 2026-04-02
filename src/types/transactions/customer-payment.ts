import { z } from "zod";

export const customerPaymentFormSchema = z.object({
    date: z.string().min(1, "Date is required"),
    paidDate: z.string().min(1, "Paid Date is required"),
    amount: z.string().min(1, "Amount is required"),
    customerId: z.number().min(1, "Customer is required"),
    remark: z.string().optional(),
    approved: z.boolean().optional(),
});

export type CustomerPaymentFormValues = z.infer<typeof customerPaymentFormSchema>;

export interface CustomerPayment {
    id: number;
    date: string;
    paidDate: string;
    amount: string;
    remark?: string;
    customerId: number;
    approved: boolean;
    filePath?: string;
    fileName?: string;
    createdAt: string;
    updatedAt: string;
    createdById: number;
    updatedById?: number | null;
    customer?: {
        id: number;
        name: string;
    };
}

export interface CustomerPaymentListResponse {
    success: boolean;
    message: string;
    data: CustomerPayment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CustomerPaymentSingleResponse {
    success: boolean;
    message: string;
    data: CustomerPayment;
}
