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

export type ChargePincodeApplicationMode =
  | "ALL"
  | "INWARD_DELIVERY_PINCODE"
  | "OUTWARD_PICKUP_PINCODE"
  | "EITHER_PINCODE_ONCE"
  | string;

export interface ChargeApplicableStateRow {
  chargeId: number;
  stateId: number;
}

export interface ChargeApplicablePincodeRow {
  chargeId: number;
  pinCodeId: number;
}

export interface Charge {
  id: number;
  version?: number;
  code: string;
  name: string;
  calculationBase: ChargeCalculationBase;
  sequence: number;
  stateApplicationMode: ChargeStateApplicationMode;
  pincodeApplicationMode: ChargePincodeApplicationMode;
  applicableStates?: ChargeApplicableStateRow[];
  applicablePincodes?: ChargeApplicablePincodeRow[];
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
  pincodeApplicationMode: ChargePincodeApplicationMode;
  stateIds: number[];
  pincodeIds: number[];
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
