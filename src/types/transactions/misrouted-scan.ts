import { z } from "zod";

export const misroutedScanItemSchema = z.object({
    id: z.number().optional(),
    awbNo: z.string().min(1, "AWB No is required"),
    shipmentId: z.number().optional(),
});

export const misroutedScanFormSchema = z.object({
    scanDate: z.string().min(1, "Scan Date is required"),
    scanTime: z.string().optional(),
    serviceCenterId: z.number().optional(),
    items: z.array(misroutedScanItemSchema).min(1, "At least one item is required"),
});

export type MisroutedScanItem = z.infer<typeof misroutedScanItemSchema>;
export type MisroutedScanFormValues = z.infer<typeof misroutedScanFormSchema>;

export interface MisroutedScan {
    id: number;
    eventType: string;
    scanAt: string;
    serviceCenterId?: number;
    createdAt: string;
    updatedAt: string;
    createdById: number;
    updatedById?: number | null;
    items?: MisroutedScanItem[];
}

export interface MisroutedScanListResponse {
    success: boolean;
    message: string;
    data: MisroutedScan[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface MisroutedScanSingleResponse {
    success: boolean;
    message: string;
    data: MisroutedScan;
}
