import * as z from "zod";

import { optionalMasterCode } from "@/lib/master-code-schema";
import {
  type ProductWeightUnit,
} from "@/lib/product-weight";
import {
  SHIPMENT_COD_TOPAY_AMOUNT_LABEL,
  SHIPMENT_COD_TOPAY_LABEL,
} from "@/lib/shipment-payment-label";

/** E-waybill is mandatory when invoice value exceeds this amount (Indian GST rules). */
export const EWAYBILL_MANDATORY_INVOICE_THRESHOLD = 50_000;

export const SHIPMENT_TOTAL_VALUE_DECIMAL_PLACES = 2;
export const SHIPMENT_ACTUAL_WEIGHT_DECIMAL_PLACES = 2;

export function roundShipmentTotalValue(
  value: number | undefined | null,
): number | undefined {
  if (value == null || !Number.isFinite(value)) return undefined;
  const factor = 10 ** SHIPMENT_TOTAL_VALUE_DECIMAL_PLACES;
  return Math.round(value * factor) / factor;
}

export function hasAtMostShipmentTotalValueDecimals(value: number): boolean {
  if (!Number.isFinite(value)) return false;
  const factor = 10 ** SHIPMENT_TOTAL_VALUE_DECIMAL_PLACES;
  return Math.round(value * factor) / factor === value;
}

export function roundActualWeight(
  value: number | undefined | null,
): number | undefined {
  if (value == null || !Number.isFinite(value)) return undefined;
  const factor = 10 ** SHIPMENT_ACTUAL_WEIGHT_DECIMAL_PLACES;
  return Math.round(value * factor) / factor;
}

export function hasAtMostActualWeightDecimals(value: number): boolean {
  if (!Number.isFinite(value)) return false;
  const factor = 10 ** SHIPMENT_ACTUAL_WEIGHT_DECIMAL_PLACES;
  return Math.round(value * factor) / factor === value;
}

export function getEwaybillRequiredMessage(
  shipmentTotalValue: number | undefined | null,
  shipmentValue: number | undefined | null,
  ewaybillNumber: string | undefined | null,
): string | null {
  const invoiceValue = Number(shipmentTotalValue ?? shipmentValue);
  if (
    !Number.isFinite(invoiceValue) ||
    invoiceValue <= EWAYBILL_MANDATORY_INVOICE_THRESHOLD
  ) {
    return null;
  }
  const ewaybill =
    typeof ewaybillNumber === "string" ? ewaybillNumber.trim() : "";
  if (!ewaybill) {
    return `E-waybill is required when invoice value exceeds ${EWAYBILL_MANDATORY_INVOICE_THRESHOLD.toLocaleString("en-IN")}`;
  }
  return null;
}

export const pieceItemSchema = z.object({
  contentId: z.number().int().positive("Content is required"),
  quantity: z.number().int().optional(),
  measureValue: z.number().int().optional(),
  measureUnit: z.string().optional(),
  totalValue: z.number().int().optional(),
});

export const pieceRowSchema = z.object({
  pieces: z.number().int().min(1, "Pieces must be at least 1"),
  length: z.number().int().optional(),
  breadth: z.number().int().optional(),
  height: z.number().int().optional(),
  division: z.number().int().optional(),
  volumetricWeight: z.number().positive().optional(),
  items: z.array(pieceItemSchema).optional(),
});

export const shipmentChargeSchema = z.object({
  chargeId: z.number().min(1, "Charge is required"),
  description: z.string().optional(),
  rate: z.number().int().optional(),
  amount: z.number().int().optional(),
  fuelApply: z.boolean().default(false),
  fuelAmount: z.number().int().optional(),
  taxApply: z.boolean().default(false),
  taxOnFuel: z.boolean().default(false),
  igst: z.number().int().optional(),
  cgst: z.number().int().optional(),
  sgst: z.number().int().optional(),
  total: z.number().int().optional(),
  chargeType: z.string().optional(),
});

export const shipmentBaseSchema = z.object({
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
      area: z.string().optional(),
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
      area: z.string().optional(),
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
  invoiceDate: z.string().optional().nullable(),
  invoiceNumber: z.string().optional(),
  reversePickup: z.boolean().default(false),
  appointmentDelivery: z.boolean().default(false),
  floorDelivery: z.boolean().default(false),
  floorCount: z.number().int().optional(),
  pieces: z.number().int().optional(),
  actualWeight: z.coerce.number().positive("Actual Weight is required"),
  volumetricWeight: z.coerce.number().positive("Total Vol. Weight is required"),
  chargeWeight: z.coerce.number().positive("Charge Weight is required"),
  isEdl: z.boolean().default(false),
  odaEdlDistanceKm: z.number().int().optional(),
  vendorPickup: z.boolean().default(false),
  paymentType: z.string().optional(),
  currency: z.string().optional(),
  instruction: z.string().optional(),
  serviceCenterId: z.number().optional(),
  serviceMapId: z.number().optional(),
  vendorId: z.number().optional(),
  cashReceiptNo: z.number().int().optional(),
  amountReceived: z.number().int().optional(),
  balanceAmount: z.number().int().optional(),
  cashReceiptDate: z.string().optional(),
  contractCharges: z.number().int().optional(),
  otherCharges: z.number().int().optional(),
  subTotal: z.number().int().optional(),
  totalFuel: z.number().int().optional(),
  igst: z.number().int().optional(),
  cgst: z.number().int().optional(),
  sgst: z.number().int().optional(),
  totalAmount: z.number().int().optional(),
  medicalCharges: z.number().int().optional(),
  manifestNo: z.string().optional(),
  manifestDate: z.string().optional(),
  invoiceNo: z.string().optional(),
  debitNoteNo: z.string().optional(),
  creditNoteNo: z.string().optional(),
  flightNo: z.string().optional(),
  isCod: z.boolean().default(false),
  codAmount: z.number().int().optional(),
  piecesRows: z.array(pieceRowSchema).optional(),
  charges: z.array(shipmentChargeSchema).optional(),
});

function appendShipmentValidation(
  weightUnit: ProductWeightUnit,
  values: z.infer<typeof shipmentBaseSchema>,
  ctx: z.RefinementCtx,
) {
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

  const totalPieceVolumetricWeight = Math.round(
    (values.piecesRows ?? []).reduce(
      (sum, row) => sum + (Number(row.volumetricWeight) || 0),
      0,
    ),
  )
  const enteredVolumetricWeight = Math.round(Number(values.volumetricWeight) || 0)
  if (enteredVolumetricWeight < totalPieceVolumetricWeight) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["volumetricWeight"],
      message: `Total Vol. Weight cannot be lower than piece volumetric total (${totalPieceVolumetricWeight})`,
    })
  }

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
    ["address1", "Address"],
    ["pinCode", "Pincode"],
  ], values.shipperId)

  requireFields(values.consignee, "consignee", [
    ["name", "Company Name"],
    ["contactPerson", "Contact Person Name"],
    ["address1", "Address"],
    ["pinCode", "Pincode"],
  ], values.consigneeId)

  if (!values.fromZoneId || values.fromZoneId <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["fromZoneId"],
      message: "Shipper pincode doesn't have zone",
    })
  }

  if (!values.toZoneId || values.toZoneId <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["toZoneId"],
      message: "Consignee pincode doesn't have zone",
    })
  }

  if (
    values.isEdl &&
    (!values.odaEdlDistanceKm || values.odaEdlDistanceKm <= 0)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["odaEdlDistanceKm"],
      message:
        "EDL distance (km) is required when ODA/EDL is checked — set it on the consignee pincode master or enter it here",
    })
  }

  if (values.floorDelivery && (!values.floorCount || values.floorCount <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["floorCount"],
      message: "Floor Count is required when Floor Delivery is checked",
    })
  }

  if (!values.serviceCenterId || values.serviceCenterId <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["serviceCenterId"],
      message: "Service Center is required",
    })
  }

  if (values.shipmentTotalValue == null || Number(values.shipmentTotalValue) < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["shipmentTotalValue"],
      message: "Invoice Value is required",
    })
  } else if (
    values.shipmentTotalValue != null &&
    !hasAtMostShipmentTotalValueDecimals(Number(values.shipmentTotalValue))
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["shipmentTotalValue"],
      message: `Invoice value can have at most ${SHIPMENT_TOTAL_VALUE_DECIMAL_PLACES} decimal places`,
    })
  }

  if (values.actualWeight == null || Number(values.actualWeight) <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["actualWeight"],
      message: "Actual Weight is required",
    })
  } else if (!hasAtMostActualWeightDecimals(Number(values.actualWeight))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["actualWeight"],
      message: `Actual weight can have at most ${SHIPMENT_ACTUAL_WEIGHT_DECIMAL_PLACES} decimal places`,
    })
  }

  if (values.isCod && (!values.codAmount || values.codAmount <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["codAmount"],
      message: `${SHIPMENT_COD_TOPAY_AMOUNT_LABEL} is required when ${SHIPMENT_COD_TOPAY_LABEL} is checked`,
    })
  }
}

export function createShipmentSchema(
  getWeightUnit: () => ProductWeightUnit = () => "KG",
) {
  return shipmentBaseSchema.superRefine((values, ctx) => {
    appendShipmentValidation(getWeightUnit(), values, ctx);
  });
}

export const shipmentSchema = createShipmentSchema();

export type ShipmentFormValues = z.infer<typeof shipmentSchema>;

export interface PieceItem extends z.infer<typeof pieceItemSchema> {
  id?: number;
  pieceId?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  content?: { contentName?: string | null } | null;
}

export interface PieceRow extends z.infer<typeof pieceRowSchema> {
  id?: number;
  shipmentId?: number;
  actualWeight?: number | null;
  chargeWeight?: number | null;
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
  forwardingDate?: string | null;
  documentName?: string | null;
  documentPath?: string | null;
  deliveryVendorId?: number | null;
  deliveryServiceMapId?: number | null;
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
  invoiceDate?: string | null;
  invoiceNumber?: string | null;
  /** Relative path under uploads for cached blank POD PDF (if generated). */
  podBlankPdfPath?: string | null;
  origin?: string | null;
  destination?: string | null;
  pieces?: number | null;
  isEdl?: boolean;
  /** @deprecated Ignored for new bookings; merged into `isEdl` when loading legacy data. */
  oda?: boolean;
  odaEdlDistanceKm?: number | string | null;
  vendorPickup?: boolean;
  vendorTotalVolWeight?: number | string | null;
  vendorTotalChargeableWeight?: number | string | null;
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
    gstNo?: string | null;
  } | null;
  shipper?: {
    id: number;
    shipperCode?: string;
    shipperName?: string;
    name?: string;
    contactPerson?: string | null;
    address1?: string | null;
    address2?: string | null;
    mobile?: string | null;
    telephone?: string | null;
    serviceablePincode?: {
      pinCode?: string | null;
      cityName?: string | null;
      areaName?: string | null;
      state?: { stateName?: string | null } | null;
    } | null;
    stateMaster?: { stateName?: string | null } | null;
    country?: { name?: string | null } | null;
  } | null;
  consignee?: {
    id: number;
    code?: string;
    name?: string;
    consigneeName?: string;
    contactPerson?: string | null;
    address1?: string | null;
    address2?: string | null;
    mobile?: string | null;
    telephone?: string | null;
    serviceablePincode?: {
      pinCode?: string | null;
      cityName?: string | null;
      areaName?: string | null;
      state?: { stateName?: string | null } | null;
    } | null;
    stateMaster?: { stateName?: string | null } | null;
    country?: { name?: string | null } | null;
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
    weightUnit?: 'G' | 'KG';
    name?: string;
  } | null;
  serviceCenter?: {
    id: number;
    code?: string;
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
  sequence?: number;
  chargeId?: number | null;
  chargeType?: string | null;
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
  chargeWeight?: number;
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
  volumetricWeight: number;
  totalValue: number;
}

export interface ShipmentWeightPreviewResponse {
  cft: number;
  rows: ShipmentWeightRowPreview[];
  shipmentVolumetricWeight: number;
  bookingTotalValue: number;
  chargeWeight?: number;
}

/** `GET /transaction/shipment/:id/forwarding-rate-preview?vendorId=` — live rate engine totals. */
export interface ForwardingRatePreviewData {
  customerQuote: {
    rateMasterId: number;
    totalAmount: number;
    baseFreight: number;
    charges?: Array<{ name: string; amount: number }>;
  };
  vendorQuote: {
    rateMasterId: number;
    totalAmount: number;
    baseFreight: number;
    charges?: Array<{ name: string; amount: number }>;
  };
  profit: number;
}

/** `GET /transaction/shipment/:id/forwarding-options` — vendor + service rows for forwarding selection. */
export interface ForwardingVendorOption {
  vendorId: number;
  vendorName: string;
  serviceMapId: number;
  serviceType: string | null;
  weightUnit?: 'G' | 'KG' | null;
  vendorTotalVolWeight?: number | null;
  vendorTotalChargeableWeight?: number | null;
  vendorTotalAmount: number | null;
  profit: number | null;
  rateAvailable: boolean;
}

export interface ForwardingOptionsData {
  customerTotalAmount: number | null;
  options: ForwardingVendorOption[];
  noVendorsAvailable?: boolean;
  message?: string | null;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}
