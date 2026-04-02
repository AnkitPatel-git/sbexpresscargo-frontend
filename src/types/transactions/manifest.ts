import { z } from "zod";

export const manifestItemSchema = z.object({
    id: z.number().optional(),
    bagNo: z.string().optional(),
    forwardingNo: z.string().optional(),
    awbNo: z.string().optional(),
    refNo: z.string().optional(),
    crnMhbsNo: z.string().optional(),
    pieces: z.number().optional(),
    chargeWeight: z.number().optional(),
    bookDate: z.string().optional(),
    origin: z.string().optional(),
    destination: z.string().optional(),
    code: z.string().optional(),
    customer: z.string().optional(),
    consignee: z.string().optional(),
    instruction: z.string().optional(),
});

export const manifestFormSchema = z.object({
    manifestNo: z.string().min(1, "Manifest No is required"),
    masterAwbNo: z.string().optional(),
    manifestDate: z.string().min(1, "Manifest Date is required"),
    manifestTime: z.string().optional(),
    location: z.string().optional(),
    serviceCenterId: z.number().optional(),
    connectStation: z.string().optional(),
    vendorId: z.number().optional(),
    productId: z.number().optional(),
    format: z.string().optional(),
    singleLine: z.boolean().optional(),
    pdfType: z.string().optional(),
    accountNo: z.string().optional(),
    department: z.string().optional(),
    shipmentIds: z.array(z.number()).min(1, "At least one shipment is required"),
    items: z.array(manifestItemSchema).optional(),
});

export type ManifestItem = z.infer<typeof manifestItemSchema>;
export type ManifestFormValues = z.infer<typeof manifestFormSchema>;

export interface Manifest {
    id: number;
    manifestNo: string;
    masterAwbNo?: string;
    manifestAt: string;
    status: string;
    version: number;
    location?: string;
    serviceCenterId?: number;
    connectStation?: string;
    vendorId?: number;
    productId?: number;
    format?: string;
    singleLine?: boolean;
    pdfType?: string;
    accountNo?: string;
    department?: string;
    createdAt: string;
    updatedAt: string;
    createdById: number;
    updatedById?: number | null;
    items?: ManifestItem[];
    progresses?: any[]; // To handle progress responses if needed later
}

export interface ManifestListResponse {
    success: boolean;
    message: string;
    data: Manifest[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ManifestSingleResponse {
    success: boolean;
    message: string;
    data: Manifest;
}
