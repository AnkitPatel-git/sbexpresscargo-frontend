import { z } from "zod";

export const undeliveredScanItemSchema = z.object({
    id: z.number().optional(),
    awbNo: z.string().min(1, "AWB No is required"),
    shipmentId: z.number().optional(),
});

export const undeliveredScanFormSchema = z.object({
    scanDate: z.string().min(1, "Scan Date is required"),
    scanTime: z.string().optional(),
    serviceCenter: z.string().optional(),
    serviceCenterId: z.number().optional(),
    items: z.array(undeliveredScanItemSchema).min(1, "At least one item is required"),
});

export type UndeliveredScanItem = z.infer<typeof undeliveredScanItemSchema>;
export type UndeliveredScanFormValues = z.infer<typeof undeliveredScanFormSchema>;

export interface UndeliveredScan {
    id: number;
    eventType: string;
    scanAt: string;
    serviceCenterId?: number;
    createdAt: string;
    updatedAt: string;
    createdById: number;
    updatedById?: number | null;
    items?: UndeliveredScanItem[];
}

export interface UndeliveredScanListResponse {
    success: boolean;
    message: string;
    data: UndeliveredScan[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface UndeliveredScanSingleResponse {
    success: boolean;
    message: string;
    data: UndeliveredScan;
}
