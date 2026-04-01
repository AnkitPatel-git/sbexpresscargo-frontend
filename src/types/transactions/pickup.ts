import * as z from 'zod';

export const pickupSchema = z.object({
    idempotencyKey: z.string().optional(),
    customerId: z.number().min(1, "Customer is required"),
    serviceCenterId: z.number().min(1, "Service Center is required"),
    pickupType: z.enum(['INTERNAL', 'EXTERNAL']).default('INTERNAL'),
    bookingNo: z.string().optional(),
    carrierId: z.number().optional(),
    fieldExecutiveId: z.number().optional(),
    salesExecutiveId: z.number().optional(),
    pickupAt: z.string().optional(), // ISO string
    pickupWindowStart: z.string().optional(), // ISO string
    pickupWindowEnd: z.string().optional(), // ISO string
    origin: z.string().optional(),
    mobile: z.string().min(10, "Mobile must be at least 10 characters"),
    shipperName: z.string().min(3, "Shipper Name is required"),
    contact: z.string().optional(),
    address1: z.string().min(5, "Address1 is required"),
    address2: z.string().optional(),
    zipCode: z.string().min(6, "Zip Code is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(1, "State is required"),
    payOption: z.string().min(1, "Pay Option is required"),
    consigneeId: z.number().optional(),
    consigneeName: z.string().optional(),
    consigneeDetails: z.string().optional(),
    vehicle: z.string().optional(),
    vehicleReq: z.string().optional(),
    area: z.string().optional(),
    specialInstructions: z.string().optional(),
    reason: z.string().optional(),
    pickupReady: z.boolean().default(true),
    pickupTime: z.string().optional(), // HH:mm format for the form
});

export type PickupFormValues = z.infer<typeof pickupSchema>;

export interface Pickup {
    id: number;
    idempotencyKey?: string;
    bookingNo?: string;
    customerId: number;
    serviceCenterId: number;
    pickupType: 'INTERNAL' | 'EXTERNAL';
    status: string;
    executionStatus: string;
    version: number;
    pickupAt?: string;
    pickupWindowStart?: string;
    pickupWindowEnd?: string;
    priority?: number;
    origin?: string;
    mobile: string;
    shipperName: string;
    contact?: string;
    address1: string;
    address2?: string;
    pinCode: string; // Map zipCode to pinCode in response
    city: string;
    state: string;
    payOption: string;
    consigneeId?: number;
    consigneeName?: string;
    consigneeDetails?: string;
    vehicle?: string;
    vehicleReq?: string;
    area?: string;
    fieldExecutiveId?: number;
    salesExecutiveId?: number;
    specialInstructions?: string;
    reason?: string;
    pickupReady: boolean;
    createdAt: string;
    updatedAt: string;
    createdById: number;
    updatedById?: number;
}

export interface PickupListResponse {
    success: boolean;
    data: Pickup[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface PickupSingleResponse {
    success: boolean;
    data: Pickup;
}
