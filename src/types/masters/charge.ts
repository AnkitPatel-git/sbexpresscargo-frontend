/** Charge Master — `docs/bruno/billing/charge/*`. */

export type ChargeCalculationBase =
  | "CHARGE_WEIGHT"
  | "FLAT"
  | "ACTUAL_WEIGHT"
  | "FREIGHT"
  | "SHIPMENT_VALUE"
  | string;

export interface Charge {
  id: number;
  version?: number;
  code: string;
  name: string;
  calculationBase: ChargeCalculationBase;
  applyFuel: boolean;
  sequence: number;
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
  applyFuel: boolean;
  sequence: number;
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
