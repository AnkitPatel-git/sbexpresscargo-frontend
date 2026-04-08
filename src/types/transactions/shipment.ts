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
    version: z.number().int().positive().optional(),
    awbNo: z.string().optional(),
    bookDate: z.string().min(1, "Book Date is required"),
    bookTime: z.string().optional(),
    referenceNo: z.string().optional(),
    customerId: z.number().optional(),
    clientId: z.number().optional(),
    shipperId: z.number().optional(),
    consigneeId: z.number().optional(),
    shipper: z.object({
        shipperCode: z.string().optional(),
        shipperName: z.string().optional(),
        shipperOrigin: z.string().optional(),
        contactPerson: z.string().optional(),
        address1: z.string().optional(),
        address2: z.string().optional(),
        pinCode: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        documentType: z.string().optional(),
        documentNo: z.string().optional(),
        industry: z.string().optional(),
        telephone1: z.string().optional(),
        telephone2: z.string().optional(),
        fax: z.string().optional(),
        mobile: z.string().optional(),
        email: z.string().optional(),
        iecNo: z.string().optional(),
        gstNo: z.string().optional(),
        aadhaarNo: z.string().optional(),
        panNo: z.string().optional(),
        serviceCenter: z.string().optional(),
        bankAdCode: z.string().optional(),
        bankAccount: z.string().optional(),
        bankIfsc: z.string().optional(),
        firmType: z.enum(["GOV", "NON_GOV"]).optional(),
        nfei: z.string().optional(),
        lutNumber: z.string().optional(),
        lutIssueDate: z.string().optional(),
        lutTillDate: z.string().optional(),
    }).optional(),
    consignee: z.object({
        code: z.string().optional(),
        name: z.string().optional(),
        destination: z.string().optional(),
        contactPerson: z.string().optional(),
        address1: z.string().optional(),
        address2: z.string().optional(),
        pinCode: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        documentType: z.string().optional(),
        documentNo: z.string().optional(),
        industry: z.string().optional(),
        tel1: z.string().optional(),
        tel2: z.string().optional(),
        fax: z.string().optional(),
        mobile: z.string().optional(),
        email: z.string().optional(),
        serviceCenterCode: z.string().optional(),
        serviceCenterId: z.number().optional(),
        eori: z.string().optional(),
        vat: z.string().optional(),
    }).optional(),
    origin: z.string().optional(),
    originCode: z.string().optional(),
    destination: z.string().optional(),
    destinationCode: z.string().optional(),
    productId: z.number().optional(),
    vendorId: z.number().optional(),
    serviceMapId: z.number().optional(),
    shipmentValue: z.number().optional(),
    currency: z.string().default('INR'),
    pieces: z.number().optional(),
    actualWeight: z.number().optional(),
    volumetricWeight: z.number().optional(),
    chargeWeight: z.number().optional(),
    km: z.number().optional(),
    commercial: z.boolean().default(false),
    paymentType: z.string().optional(),
    content: z.string().optional(),
    instruction: z.string().optional(),
    fieldExecutiveId: z.number().nullable().optional(),
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
    serviceCenterId: z.number().optional(),
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
    declaredWeight?: string | number | null;
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
    customer?: {
        id: number;
        code?: string;
        name?: string;
    };
    shipper?: {
        id: number;
        shipperName?: string;
        name?: string;
    };
    consignee?: {
        id: number;
        consigneeName?: string;
        name?: string;
    };
    vendor?: {
        id: number;
        vendorCode?: string;
        vendorName?: string;
        name?: string;
    };
    product?: {
        id: number;
        productCode?: string;
        productName?: string;
        name?: string;
    };
    forwardings?: Array<{
        id?: number;
        deliveryAwb?: string;
        forwardingAwb?: string;
        deliveryVendor?: {
            id: number;
            vendorName?: string;
            name?: string;
        };
        deliveryVendorId?: number;
        deliveryServiceMapId?: number;
        totalAmount?: string | number | null;
    }>;
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
