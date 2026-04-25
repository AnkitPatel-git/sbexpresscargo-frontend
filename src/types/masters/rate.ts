/** Rate Master — `docs/ratemaster.md`, `docs/bruno/billing/rate/*`. */

export type RateUpdateType = "AWB_ENTRY_RATE" | "VENDOR_RATE" | "TAX_FUEL" | "VENDOR_OBC_RATE" | string;

export type RateTypeValue = "ZONE_MATRIX" | "DISTANCE_MATRIX" | "FLAT" | string;

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

export type RouteWeightSlabPricingMode = "FLAT" | "PER_KG";

export interface RateWeightSlabPayload {
  minWeight: number;
  maxWeight: number;
  rate: number;
  /** Route / ODA weight slabs only; distance matrix weight rows omit this. */
  pricingMode?: RouteWeightSlabPricingMode;
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

/** Nested weights on route / ODA slabs (API may include ids). */
export interface RateRouteSlabWeight extends RateWeightSlabPayload {
  id?: number;
  routeRateSlabId?: number;
  odaRateSlabId?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface RateRouteSlabPayload {
  fromZoneId?: number;
  toZoneId?: number;
  minKm?: number;
  maxKm?: number;
  weightSlabs: RateWeightSlabPayload[];
}

export interface RateRouteRateSlab extends RateRouteSlabPayload {
  id: number;
  rateMasterId: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  weightSlabs: RateRouteSlabWeight[];
  fromZone?: RateZoneRef | null;
  toZone?: RateZoneRef | null;
}

export interface RateChargeSlabPayload {
  minValue: number;
  maxValue: number;
  rate: number;
  /** FLAT = total for the band; PER_KG = rate × basis (weight / distance when applicable). */
  pricingMode?: "FLAT" | "PER_KG";
}

export interface RateChargeSlab extends RateChargeSlabPayload {
  id: number;
  rateChargeId: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface RateChargeRef {
  id: number;
  code?: string;
  name?: string;
  calculationBase?: string;
}

export interface RateChargePayload {
  chargeId?: number;
  name?: string;
  calculationBase?: string;
  applyPerPiece?: boolean;
  value: number;
  isPercentage?: boolean;
  minValue?: number;
  maxValue?: number;
  sequence?: number;
  chargeSlabs?: RateChargeSlabPayload[];
}

export interface RateCharge extends RateChargePayload {
  id: number;
  rateMasterId: number;
  weightStep?: number | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  charge?: RateChargeRef | null;
  chargeSlabs: RateChargeSlab[];
}

export interface RateConditionPayload {
  chargeId: number;
  field: string;
  operator: string;
  value: number;
  chargeAmount: number;
  calculationBase?: string;
  isPercentage?: boolean;
}

export interface RateCondition extends RateConditionPayload {
  id: number;
  rateMasterId: number;
  /** Denormalized from server; use `charge?.name` when `charge` is present. */
  chargeName?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  charge?: RateChargeRef | null;
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

export interface RateMaster {
  id: number;
  version: number;
  updateType: RateUpdateType;
  rateType?: RateTypeValue | null;
  fromDate: string;
  toDate: string;
  customerId?: number | null;
  productId?: number | null;
  flatRate?: number | null;
  weightUnitStep?: number | null;
  createdAt?: string;
  updatedAt?: string;
  createdById?: number | null;
  updatedById?: number | null;
  deletedAt?: string | null;
  deletedById?: number | null;
  customer?: RateCustomerRef | null;
  product?: RateProductRef | null;
  zoneRates?: RateZoneRate[];
  distanceSlabs?: RateDistanceSlab[];
  routeRateSlabs?: RateRouteRateSlab[];
  odaRateSlabs?: RateRouteRateSlab[];
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

export interface RateMasterReviewHeader {
  id: number;
  version: number;
  updateType?: RateUpdateType;
  rateType?: RateTypeValue;
  fromDate?: string;
  toDate?: string;
  customerId?: number;
  productId?: number;
  flatRate?: number | null;
  weightUnitStep?: number | null;
}

export interface RateMasterReviewMeta {
  zones?: RateZoneRef[];
  conditionFields?: string[];
  conditionOperators?: string[];
  calculationBases?: string[];
}

export interface RateMasterReviewData {
  id: number;
  header: RateMasterReviewHeader;
  zoneMatrix: RateZoneRatePayload[];
  distanceWeightMatrix: RateDistanceSlabPayload[];
  routeWeightRules: RateRouteSlabPayload[];
  odaWeightRules: RateRouteSlabPayload[];
  conditionRows: RateConditionPayload[];
  meta?: RateMasterReviewMeta;
  notes?: Record<string, unknown>;
}

export interface RateMasterReviewResponse {
  success: boolean;
  message?: string;
  data: RateMasterReviewData;
}

export interface CreateRateMasterPayload {
  updateType: string;
  fromDate: string;
  toDate: string;
  customerId: number;
  productId: number;
  rateType?: string;
  flatRate?: number;
  weightUnitStep?: number;
  zoneRates?: RateZoneRatePayload[];
  distanceSlabs?: RateDistanceSlabPayload[];
  rateSlabs?: RateRouteSlabPayload[];
  odaRateSlabs?: RateRouteSlabPayload[];
  rateCharges?: RateChargePayload[];
  rateConditions?: RateConditionPayload[];
}

export type UpdateRateMasterPayload = Partial<CreateRateMasterPayload> & {
  version: number;
};

export interface UpdateRateMasterReviewPayload {
  header: Omit<RateMasterReviewHeader, "id">;
  zoneMatrix?: RateZoneRatePayload[];
  distanceWeightMatrix?: RateDistanceSlabPayload[];
  routeWeightRules?: RateRouteSlabPayload[];
  odaWeightRules?: RateRouteSlabPayload[];
  conditionRows?: RateConditionPayload[];
  notes?: Record<string, unknown>;
}

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
