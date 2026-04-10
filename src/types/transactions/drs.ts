import { z } from "zod";

export const drsItemSchema = z.object({
    id: z.number().optional(),
    awbNo: z.string().min(1, "AWB No is required"),
    shipmentId: z.number().optional(),
});

export const drsFormSchema = z.object({
    drsNo: z.string().min(1, "DRS No is required"),
    drsDate: z.string().min(1, "DRS Date is required"),
    drsTime: z.string().optional(),
    courierId: z.number().optional(),
    areaId: z.number().optional(),
    serviceCenterId: z.number().optional(),
    remark: z.string().optional(),
    items: z.array(drsItemSchema).min(1, "At least one item is required"),
});

export type DrsItem = z.infer<typeof drsItemSchema>;
export type DrsFormValues = z.infer<typeof drsFormSchema>;

export interface Drs {
    id: number;
    drsNo: string;
    drsDate: string;
    drsTime?: string;
    serviceCenterId?: number;
    serviceCenter?: any;
    courierId?: number;
    courier?: any;
    areaId?: number;
    area?: any;
    remark?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    createdById: number;
    updatedById?: number | null;
    items?: DrsItem[];
}

export interface DrsListResponse {
    success: boolean;
    message: string;
    data: Drs[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface DrsSingleResponse {
    success: boolean;
    message: string;
    data: Drs;
}
