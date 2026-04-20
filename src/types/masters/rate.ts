/** Rate Master — Bruno `docs/bruno/billing/rate/*`. */

export type RateUpdateType = "AWB_ENTRY_RATE" | "VENDOR_RATE" | "TAX_FUEL" | "VENDOR_OBC_RATE" | string;

export interface RateZoneRef {
  id: number;
  code?: string;
  name?: string;
}

export interface RateZoneRatePayload {
  fromZoneId: number;
  toZoneId: number;
  rate: number;
}

export interface RateZoneRate extends RateZoneRatePayload {
  id: number;
  rateMasterId: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  fromZone?: RateZoneRef | null;
  toZone?: RateZoneRef | null;
}

export interface RateWeightSlabPayload {
  minWeight: number;
  maxWeight: number;
  rate: number;
}

export interface RateWeightSlab extends RateWeightSlabPayload {
  id: number;
  distanceSlabId: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface RateDistanceSlabPayload {
  minKm: number;
  maxKm: number;
  weightSlabs: RateWeightSlabPayload[];
}

export interface RateDistanceSlab extends RateDistanceSlabPayload {
  id: number;
  rateMasterId: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  weightSlabs: RateWeightSlab[];
}

export interface RateChargeSlabPayload {
  minValue: number;
  maxValue: number;
  rate: number;
}

export interface RateChargeSlab extends RateChargeSlabPayload {
  id: number;
  rateChargeId: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface RateChargePayload {
  name: string;
  calculationBase: string;
  value: number;
  isPercentage: boolean;
  minValue: number;
  maxValue: number;
  sequence: number;
  chargeSlabs?: RateChargeSlabPayload[];
}

export interface RateCharge extends RateChargePayload {
  id: number;
  rateMasterId: number;
  weightStep?: number | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  chargeSlabs: RateChargeSlab[];
}

export interface RateConditionPayload {
  field: string;
  operator: string;
  value: number;
  chargeName: string;
  chargeAmount: number;
  isPercentage: boolean;
}

export interface RateCondition extends RateConditionPayload {
  id: number;
  rateMasterId: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface RateCustomerRef {
  id: number;
  code?: string;
  name?: string;
}

export interface RateProductRef {
  id: number;
  productCode?: string;
  productName?: string;
}

export interface RateVendorRef {
  id: number;
  vendorCode?: string;
  vendorName?: string;
}

export interface RateServiceCenterRef {
  id: number;
  code?: string;
  name?: string;
  subName?: string | null;
}

export interface RateMaster {
  id: number;
  version: number;
  updateType: RateUpdateType;
  serviceType?: string | null;
  rateType?: string | null;
  fromDate: string;
  toDate: string;
  customerId?: number | null;
  productId?: number | null;
  vendorId?: number | null;
  serviceCenterId?: number | null;
  paymentType?: string | null;
  zeroContract: boolean;
  weightUnitStep?: number | null;
  createdAt?: string;
  updatedAt?: string;
  createdById?: number | null;
  updatedById?: number | null;
  deletedAt?: string | null;
  deletedById?: number | null;
  customer?: RateCustomerRef | null;
  product?: RateProductRef | null;
  vendor?: RateVendorRef | null;
  serviceCenter?: RateServiceCenterRef | null;
  zoneRates?: RateZoneRate[];
  distanceSlabs?: RateDistanceSlab[];
  rateCharges?: RateCharge[];
  rateConditions?: RateCondition[];
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

export interface CreateRateMasterPayload {
  updateType: string;
  fromDate: string;
  toDate: string;
  customerId: number;
  serviceType: string;
  rateType: string;
  productId: number;
  vendorId?: number;
  paymentType: string;
  zeroContract: boolean;
  zoneRates?: RateZoneRatePayload[];
  distanceSlabs?: RateDistanceSlabPayload[];
  rateCharges?: RateChargePayload[];
  rateConditions?: RateConditionPayload[];
}

export type UpdateRateMasterPayload = Partial<CreateRateMasterPayload> & {
  version: number;
};

export interface RateChildListResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
}

export interface RateChildSingleResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
