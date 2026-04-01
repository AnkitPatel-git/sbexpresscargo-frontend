import * as z from 'zod';

export const pieceRowSchema = z.object({
    childAwbNo: z.string().optional(),
    actualWeightPerPc: z.number().min(0, "Weight must be positive"),
    pieces: z.number().min(1, "Pieces must be at least 1"),
    length: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    division: z.number().optional(),
    volumetricWeight: z.number().optional(),
    chargeWeight: z.number().optional(),
});

export const shipmentChargeSchema = z.object({
    chargeId: z.number().min(1, "Charge is required"),
    description: z.string().optional(),
    rate: z.number().optional(),
    amount: z.number().optional(),
    fuelApply: z.boolean().default(false),
    fuelAmount: z.number().optional(),
    taxApply: z.boolean().default(false),
    taxOnFuel: z.boolean().default(false),
    igst: z.number().optional(),
    cgst: z.number().optional(),
    sgst: z.number().optional(),
    total: z.number().optional(),
    chargeType: z.string().optional(),
});

export const shipmentSchema = z.object({
    awbNo: z.string().min(1, "AWB No is required"),
    bookDate: z.string().min(1, "Book Date is required"),
    bookTime: z.string().optional(),
    referenceNo: z.string().optional(),
    customerId: z.number().min(1, "Customer is required"),
    shipperId: z.number().optional(),
    consigneeId: z.number().optional(),
    origin: z.string().optional(),
    originCode: z.string().optional(),
    destination: z.string().optional(),
    destinationCode: z.string().optional(),
    productId: z.number().min(1, "Product is required"),
    vendorId: z.number().optional(),
    serviceMapId: z.number().optional(),
    shipmentValue: z.number().optional(),
    currency: z.string().default('INR'),
    pieces: z.number().min(1, "Pieces must be at least 1"),
    actualWeight: z.number().min(0, "Actual Weight must be positive"),
    volumetricWeight: z.number().optional(),
    chargeWeight: z.number().optional(),
    km: z.number().optional(),
    commercial: z.boolean().default(false),
    paymentType: z.string().min(1, "Payment Type is required"),
    content: z.string().optional(),
    instruction: z.string().optional(),
    fieldExecutiveId: z.number().optional(),
    cashReceiptNo: z.number().optional(),
    amountReceived: z.number().optional(),
    balanceAmount: z.number().optional(),
    cashReceiptDate: z.string().optional(),
    contractCharges: z.number().optional(),
    otherCharges: z.number().optional(),
    subTotal: z.number().optional(),
    totalFuel: z.number().optional(),
    igst: z.number().optional(),
    cgst: z.number().optional(),
    sgst: z.number().optional(),
    totalAmount: z.number().optional(),
    oda: z.boolean().default(false),
    medicalCharges: z.number().optional(),
    serviceCenterId: z.number().min(1, "Service Center is required"),
    manifestNo: z.string().optional(),
    manifestDate: z.string().optional(),
    invoiceNo: z.string().optional(),
    debitNoteNo: z.string().optional(),
    creditNoteNo: z.string().optional(),
    flightNo: z.string().optional(),
    podUserId: z.string().optional(),
    isCod: z.boolean().default(false),
    codAmount: z.number().optional(),
    piecesRows: z.array(pieceRowSchema).optional(),
    charges: z.array(shipmentChargeSchema).optional(),
});

export type ShipmentFormValues = z.infer<typeof shipmentSchema>;

export interface PieceRow extends z.infer<typeof pieceRowSchema> {
    id?: number;
    shipmentId?: number;
}

export interface ShipmentCharge extends z.infer<typeof shipmentChargeSchema> {
    id?: number;
    shipmentId?: number;
}

export interface Shipment {
    id: number;
    awbNo: string;
    bookDate: string;
    bookTime?: string;
    referenceNo?: string;
    customerId: number;
    shipperId?: number;
    consigneeId?: number;
    origin?: string;
    originCode?: string;
    destination?: string;
    destinationCode?: string;
    productId: number;
    vendorId?: number;
    serviceMapId?: number;
    shipmentValue?: number;
    currency: string;
    pieces: number;
    actualWeight: number;
    volumetricWeight?: number;
    chargeWeight?: number;
    km?: number;
    commercial: boolean;
    paymentType: string;
    content?: string;
    instruction?: string;
    fieldExecutiveId?: number;
    cashReceiptNo?: number;
    amountReceived?: number;
    balanceAmount?: number;
    cashReceiptDate?: string;
    contractCharges?: number;
    otherCharges?: number;
    subTotal?: number;
    totalFuel?: number;
    igst?: number;
    cgst?: number;
    sgst?: number;
    totalAmount?: number;
    oda: boolean;
    medicalCharges?: number;
    serviceCenterId: number;
    manifestNo?: string;
    manifestDate?: string;
    invoiceNo?: string;
    debitNoteNo?: string;
    creditNoteNo?: string;
    flightNo?: string;
    podUserId?: string;
    isCod: boolean;
    codAmount?: number;
    currentStatus: string;
    version: number;
    createdAt: string;
    updatedAt: string;
    createdById: number;
    updatedById?: number;
    piecesRows?: PieceRow[];
    charges?: ShipmentCharge[];
}

export interface ShipmentListResponse {
    success: boolean;
    data: Shipment[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ShipmentSingleResponse {
    success: boolean;
    data: Shipment;
}
