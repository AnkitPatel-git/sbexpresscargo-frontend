/** Charge Master — Bruno `docs/bruno/Masters/Charge Master/*`. */

export type ChargeCalculationBase =
    | 'CHARGE_WEIGHT'
    | 'FLAT'
    | 'ACTUAL_WEIGHT'
    | 'FREIGHT'
    | 'SHIPMENT_VALUE';

/** Prisma `ChargeType` */
export type ChargeTypeEnums =
    | 'AIRWAYBILL'
    | 'FREIGHT'
    | 'FUEL'
    | 'OBC'
    | 'FLAT'
    | 'OTHER';

export interface Charge {
    id: number;
    /** Optimistic locking — Bruno update requires `version`. */
    version?: number;
    code: string;
    name: string;
    chargeType: ChargeTypeEnums | string | null;
    calculationBase: ChargeCalculationBase;
    chargeRate: string | number;
    applyFuel: boolean;
    applyTaxOnFuel: boolean;
    applyTax: boolean;
    sequence: number;
    multipleCharges: boolean;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

/** Create body — Bruno: `code` optional (backend may assign CHG+n). */
export interface ChargeFormData {
    code?: string;
    name: string;
    chargeType?: ChargeTypeEnums | string;
    calculationBase: ChargeCalculationBase;
    chargeRate: number;
    applyFuel: boolean;
    applyTaxOnFuel: boolean;
    applyTax: boolean;
    sequence: number;
    multipleCharges: boolean;
}

/** Bruno list/search — includes `meta`. */
export interface ChargeListResponse {
    success: boolean;
    message?: string;
    data: Charge[];
    meta: {
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

/** Bruno `GET /charge-master/by-product/:productId` — array only, no pagination meta. */
export interface ChargeByProductResponse {
    success: boolean;
    message?: string;
    data: Charge[];
}
