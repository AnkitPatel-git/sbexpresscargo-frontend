import * as z from "zod";

import { optionalMasterCode } from "@/lib/master-code-schema";

export const pieceItemSchema = z.object({
  contentId: z.number().int().positive("Content is required"),
  quantity: z.number().optional(),
  measureValue: z.number().optional(),
  measureUnit: z.string().optional(),
  totalValue: z.number().optional(),
  invoiceDate: z.string().optional(),
  invoiceNumber: z.string().optional(),
});

export const pieceRowSchema = z.object({
  actualWeight: z.number().min(0, "Weight must be positive"),
  pieces: z.number().min(1, "Pieces must be at least 1"),
  length: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  division: z.number().optional(),
  volumetricWeight: z.number().optional(),
  chargeWeight: z.number().optional(),
  items: z.array(pieceItemSchema).optional(),
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
  ewaybillNumber: z.string().optional(),
  bookDate: z.string().min(1, "Book Date is required"),
  bookTime: z.string().optional(),
  referenceNo: z.string().optional(),
  customerId: z.number().optional(),
  clientId: z.number().optional(),
  shipperId: z.number().optional(),
  consigneeId: z.number().optional(),
  shipper: z
    .object({
      shipperCode: optionalMasterCode(2).optional(),
      shipperName: z.string().optional(),
      pinCodeId: z.number().optional(),
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
      telephone: z.string().optional(),
      fax: z.string().optional(),
      mobile: z.string().optional(),
      email: z.string().optional(),
      iecNo: z.string().optional(),
      gstNo: z.string().optional(),
      aadhaarNo: z.string().optional(),
      panNo: z.string().optional(),
      serviceCenter: z.string().optional(),
      bankAccount: z.string().optional(),
      bankIfsc: z.string().optional(),
      firmType: z.enum(["GOV", "NON_GOV"]).optional(),
      nfei: z.string().optional(),
      lutNumber: z.string().optional(),
      lutIssueDate: z.string().optional(),
      lutTillDate: z.string().optional(),
    })
    .optional(),
  consignee: z
    .object({
      code: optionalMasterCode(2).optional(),
      name: z.string().optional(),
      pinCodeId: z.number().optional(),
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
      telephone: z.string().optional(),
      fax: z.string().optional(),
      mobile: z.string().optional(),
      email: z.string().optional(),
      serviceCenterCode: z.string().optional(),
      serviceCenterId: z.number().optional(),
      eori: z.string().optional(),
      vat: z.string().optional(),
    })
    .optional(),
  origin: z.string().optional(),
  originCode: z.string().optional(),
  destination: z.string().optional(),
  destinationCode: z.string().optional(),
  productId: z.number().optional(),
  fromZoneId: z.number().optional(),
  toZoneId: z.number().optional(),
  shipmentTotalValue: z.number().optional(),
  shipmentValue: z.number().optional(),
  reversePickup: z.boolean().default(false),
  appointmentDelivery: z.boolean().default(false),
  floorDelivery: z.boolean().default(false),
  floorCount: z.number().optional(),
  pieces: z.number().optional(),
  actualWeight: z.number().optional(),
  volumetricWeight: z.number().optional(),
  chargeWeight: z.number().optional(),
  km: z.number().optional(),
  isEdl: z.boolean().default(false),
  odaEdlDistanceKm: z.number().optional(),
  commercial: z.boolean().default(false),
  paymentType: z.string().optional(),
  currency: z.string().optional(),
  instruction: z.string().optional(),
  serviceCenterId: z.number().optional(),
  serviceMapId: z.number().optional(),
  vendorId: z.number().optional(),
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
  medicalCharges: z.number().optional(),
  manifestNo: z.string().optional(),
  manifestDate: z.string().optional(),
  invoiceNo: z.string().optional(),
  debitNoteNo: z.string().optional(),
  creditNoteNo: z.string().optional(),
  flightNo: z.string().optional(),
  isCod: z.boolean().default(false),
  codAmount: z.number().optional(),
  piecesRows: z.array(pieceRowSchema).optional(),
  charges: z.array(shipmentChargeSchema).optional(),
}).superRefine((values, ctx) => {
  if (!values.piecesRows || values.piecesRows.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["piecesRows"],
      message: "At least one piece is required",
    })
  }

  values.piecesRows?.forEach((row, rowIndex) => {
    if (!row.items || row.items.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["piecesRows", rowIndex, "items"],
        message: "At least one item is required",
      })
    }
  })

  const requireFields = (
    block: Record<string, unknown> | undefined,
    blockName: "shipper" | "consignee",
    fields: Array<[string, string]>,
    masterId: number | undefined
  ) => {
    if (masterId && masterId > 0) return;
    fields.forEach(([key, label]) => {
      const value = block?.[key]
      if (typeof value !== "string" || !value.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [blockName, key],
          message: `${label} is required`,
        })
      }
    })
  }

  requireFields(values.shipper, "shipper", [
    ["shipperName", "Company Name"],
    ["contactPerson", "Contact Person Name"],
    ["mobile", "Mobile No."],
    ["telephone", "Telephone"],
    ["email", "E-Mail"],
    ["address1", "Address"],
    ["pinCode", "Pincode"],
  ], values.shipperId)

  requireFields(values.consignee, "consignee", [
    ["name", "Company Name"],
    ["contactPerson", "Contact Person Name"],
    ["mobile", "Mobile No."],
    ["telephone", "Telephone"],
    ["email", "E-Mail"],
    ["address1", "Address"],
    ["pinCode", "Pincode"],
  ], values.consigneeId)

  if (!values.fromZoneId || values.fromZoneId <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["fromZoneId"],
      message: "From Zone is required",
    })
  }

  if (!values.toZoneId || values.toZoneId <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["toZoneId"],
      message: "To Zone is required",
    })
  }
});

export type ShipmentFormValues = z.infer<typeof shipmentSchema>;

export interface PieceItem extends z.infer<typeof pieceItemSchema> {
  id?: number;
  pieceId?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface PieceRow extends z.infer<typeof pieceRowSchema> {
  id?: number;
  shipmentId?: number;
  actualWeight: number;
  items?: PieceItem[];
  createdAt?: string;
  updatedAt?: string;
  createdById?: number | null;
  updatedById?: number | null;
  deletedAt?: string | null;
  deletedById?: number | null;
}

export interface ShipmentCharge extends z.infer<typeof shipmentChargeSchema> {
  id?: number;
  shipmentId?: number;
  createdAt?: string;
  updatedAt?: string;
  createdById?: number | null;
  updatedById?: number | null;
  deletedAt?: string | null;
  deletedById?: number | null;
}

export interface ShipmentStatus {
  id: number;
  shipmentId: number;
  status: string;
  sequence?: number;
  externalStatus?: string | null;
  normalizedStatus?: string | null;
  serviceCenterId?: number | null;
  userId?: number | null;
  remark?: string | null;
  receiverName?: string | null;
  podFilePath?: string | null;
  source?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdById?: number | null;
  updatedById?: number | null;
  deletedAt?: string | null;
  deletedById?: number | null;
}

export interface ShipmentForwarding {
  id?: number;
  shipmentId?: number;
  deliveryAwb?: string | null;
  forwardingAwb?: string | null;
  deliveryVendorId?: number | null;
  deliveryServiceMapId?: number | null;
  vendorWeight?: number | null;
  vendorAmount?: number | null;
  vendorInvoice?: string | null;
  contractCharges?: number | null;
  otherCharges?: number | null;
  subTotal?: number | null;
  totalFuel?: number | null;
  igst?: number | null;
  cgst?: number | null;
  sgst?: number | null;
  totalAmount?: number | null;
  charges?: ShipmentCharge[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface ShipmentKycDocument {
  id: number;
  shipmentId: number;
  type: string;
  entryType?: string | null;
  entryDate?: string | null;
  documentPath?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface Shipment {
  id: number;
  awbNo: string;
  ewaybillNumber?: string | null;
  bookDate: string;
  bookTime?: string;
  referenceNo?: string;
  customerId: number;
  shipperId?: number | null;
  consigneeId?: number | null;
  vendorId?: number | null;
  productId: number;
  declaredWeight?: string | number | null;
  chargeWeight?: number | string | null;
  paymentType: string;
  currentStatus: string;
  version: number;
  codAmount?: number | null;
  isCod: boolean;
  rateMasterId?: number | null;
  baseFreight?: number | null;
  totalAmount?: number | null;
  fromZoneId?: number | null;
  toZoneId?: number | null;
  reversePickup?: boolean;
  appointmentDelivery?: boolean;
  floorDelivery?: boolean;
  floorCount?: number | null;
  shipmentTotalValue?: number | null;
  origin?: string | null;
  destination?: string | null;
  pieces?: number | null;
  km?: number | null;
  isEdl?: boolean;
  /** @deprecated Ignored for new bookings; merged into `isEdl` when loading legacy data. */
  oda?: boolean;
  odaEdlDistanceKm?: number | string | null;
  commercial?: boolean;
  instruction?: string | null;
  serviceCenterId?: number | null;
  createdAt: string;
  updatedAt: string;
  createdById?: number | null;
  updatedById?: number | null;
  deletedAt?: string | null;
  deletedById?: number | null;
  piecesRows?: PieceRow[];
  charges?: ShipmentCharge[];
  statuses?: ShipmentStatus[];
  forwarding?: ShipmentForwarding | null;
  kycDocuments?: ShipmentKycDocument[];
  receipt?: unknown | null;
  packages?: unknown[] | null;
  trackingSummary?: unknown | null;
  comments?: unknown[] | null;
  customer?: {
    id: number;
    code?: string;
    name?: string;
  } | null;
  shipper?: {
    id: number;
    shipperCode?: string;
    shipperName?: string;
    name?: string;
  } | null;
  consignee?: {
    id: number;
    code?: string;
    name?: string;
    consigneeName?: string;
  } | null;
  vendor?: {
    id: number;
    vendorCode?: string;
    vendorName?: string;
    name?: string;
  } | null;
  product?: {
    id: number;
    productCode?: string;
    productName?: string;
    name?: string;
  } | null;
  createdBy?: {
    id: number;
    username?: string;
    email?: string;
    roleId?: number;
    mobile?: string | null;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
  } | null;
  updatedBy?: unknown | null;
  deletedBy?: unknown | null;
}

export interface ShipmentListResponse {
  success: boolean;
  message?: string;
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
  message?: string;
  data: Shipment;
}

export interface ShipmentListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  awbNo?: string;
  ewaybillNumber?: string;
  clientName?: string;
  origin?: string;
  destination?: string;
  bookDateFrom?: string;
  bookDateTo?: string;
  paymentType?: string;
}

export interface ShipmentFormPayload extends ShipmentFormValues {
  clientId?: number;
}

export interface ShipmentCalculateRow {
  type: "RATE_CHARGE" | "CONDITION" | string;
  name: string;
  amount: number;
  calculationBase?: string;
  isPercentage?: boolean;
  field?: string;
  operator?: string;
  value?: number;
}

export interface ShipmentCalculateResponse {
  rateMasterId?: number;
  fromZoneId?: number;
  toZoneId?: number;
  baseFreight?: number;
  baseFreightFuelApply?: boolean;
  totalAmount?: number;
  totalCharges?: number;
  rows: ShipmentCalculateRow[];
  route?: {
    pickupPincode?: string;
    deliveryPincode?: string;
    pickupZones?: Array<{ id: number; code?: string; name?: string; zoneType?: string }>;
    deliveryZones?: Array<{ id: number; code?: string; name?: string; zoneType?: string }>;
    fromZoneId?: number;
    toZoneId?: number;
  };
  breakdown?: {
    baseType?: string;
    baseComputation?: string;
    slabUsed?: unknown;
    chargesApplied?: Array<{ name: string; amount: number; calculationBase?: string; isPercentage?: boolean }>;
    conditionsApplied?: Array<{ name: string; amount: number; field?: string; operator?: string; value?: number }>;
  };
}

export interface ShipmentWeightRowPreview {
  pieces: number;
  actualWeight: number;
  volumetricWeight: number;
  chargeWeight: number;
  totalValue: number;
}

export interface ShipmentWeightPreviewResponse {
  cft: number;
  rows: ShipmentWeightRowPreview[];
  shipmentVolumetricWeight: number;
  shipmentChargeWeight: number;
  bookingTotalValue: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}
