/** Charge Master — API `/charge-master`. */

export type ChargeCalculationBase =
  | "CHARGE_WEIGHT"
  | "FLAT"
  | "ACTUAL_WEIGHT"
  | "FREIGHT"
  | "SHIPMENT_VALUE"
  | string;

export type ChargeStateApplicationMode =
  | "ALL"
  | "INWARD_DELIVERY_STATE"
  | "OUTWARD_PICKUP_STATE"
  | "EITHER_STATE_ONCE"
  | string;

export type ChargeCityApplicationMode =
  | "ALL"
  | "INWARD_DELIVERY_CITY"
  | "OUTWARD_PICKUP_CITY"
  | "EITHER_CITY_ONCE"
  | string;

export interface ChargeApplicableStateRow {
  chargeId: number;
  stateId: number;
  state?: { id: number; stateName: string } | null;
}

export interface ChargeApplicableCityRow {
  chargeId: number;
  cityId: number;
  city?: {
    id: number;
    cityName: string;
    state?: { id: number; stateName: string } | null;
  } | null;
}

export interface Charge {
  id: number;
  version?: number;
  code: string;
  name: string;
  calculationBase: ChargeCalculationBase;
  sequence: number;
  stateApplicationMode: ChargeStateApplicationMode;
  cityApplicationMode: ChargeCityApplicationMode;
  applicableStates?: ChargeApplicableStateRow[];
  applicableCities?: ChargeApplicableCityRow[];
  createdAt?: string;
  updatedAt?: string;
  createdById?: number | null;
  updatedById?: number | null;
  deletedAt?: string | null;
  deletedById?: number | null;
}

export interface ChargeFormData {
  code?: string;
  name: string;
  sequence: number;
  stateApplicationMode: ChargeStateApplicationMode;
  cityApplicationMode: ChargeCityApplicationMode;
  stateIds: number[];
  cityIds: number[];
}

export interface ChargeListResponse {
  success: boolean;
  message?: string;
  data: Charge[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ChargeSingleResponse {
  success: boolean;
  message?: string;
  data: Charge;
}

export interface ChargeByProductRow {
  id: number;
  code: string;
  name: string;
}

export interface ChargeByProductResponse {
  success: boolean;
  message?: string;
  data: ChargeByProductRow[];
}
