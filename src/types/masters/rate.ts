/** Rate Master — Bruno `docs/bruno/Masters/Rate Master/*` (+ `Rate - Preview` → `POST /rate/preview`). */

/** Aligns with Prisma `RateUpdateType` / Bruno CreateRateMasterDto */
export type RateUpdateType =
  | "AWB_ENTRY_RATE"
  | "VENDOR_RATE"
  | "TAX_FUEL"
  | "VENDOR_OBC_RATE";

export interface RateMaster {
  id: number;
  version: number;
  updateType: RateUpdateType | string;
  serviceType?: string | null;
  rateType?: string | null;
  fromDate: string;
  toDate: string;
  serviceCenterId?: number | null;
  customerId: number;
  productId?: number | null;
  vendorId?: number | null;
  zoneId?: number | null;
  origin?: string | null;
  destination?: string | null;
  paymentType?: string | null;
  zeroContract: boolean;
  flatRate?: string | number | null;
  createdAt?: string;
  updatedAt?: string;
  customer?: { id: number; customerCode?: string; customerName?: string };
  product?: { id: number; productCode?: string; productName?: string };
  vendor?: { id: number; code?: string; name?: string };
  serviceCenter?: { id: number; code?: string; name?: string };
}

export interface RateMasterListResponse {
  success: boolean;
  message?: string;
  data: RateMaster[];
  meta?: { total: number; page: number; limit: number; totalPages: number };
}

export interface RateMasterSingleResponse {
  success: boolean;
  message?: string;
  data: RateMaster;
}

/** POST /rate-master (Bruno: Rate Master - Create) */
export interface CreateRateMasterPayload {
  updateType: string;
  fromDate: string;
  toDate: string;
  customerId?: number;
  serviceType?: string;
  rateType?: string;
  zoneId?: number;
  serviceCenter?: string;
  serviceCenterId?: number;
  origin?: string;
  destination?: string;
  customer?: string;
  product?: string;
  productId?: number;
  vendor?: string;
  vendorId?: number;
  paymentType?: string;
  zeroContract?: boolean;
  flatRate?: number;
}

/** PATCH /rate-master/:id — requires version */
export type UpdateRateMasterPayload = Partial<CreateRateMasterPayload> & {
  version: number;
};

export interface RateDimensions {
  length: number;
  width: number;
  height: number;
}

/** POST /rate-master/calculate */
export interface CalculateRatePayload {
  customerId: number;
  serviceType: string;
  pickupPincode: string;
  deliveryPincode: string;
  weight: number;
  chargeableWeight: number;
  distanceKm?: number;
  shipmentValue?: number;
  dimensions?: RateDimensions;
  floor?: number;
  bookDate?: string;
}

/** POST /rate/preview (not under /rate-master) */
export type RatePreviewPayload = CalculateRatePayload;

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}
