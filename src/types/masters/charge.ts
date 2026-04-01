export type ChargeCalculationBase = 'CHARGE_WEIGHT' | 'FLAT';
export type ChargeTypeEnums = 'FREIGHT' | 'AIRWAYBILL' | 'FUEL_SURCHARGE' | 'DOCUMENTATION' | 'OTHER';

export interface Charge {
    id: number;
    code: string;
    name: string;
    chargeType: ChargeTypeEnums | string | null;
    calculationBase: ChargeCalculationBase;
    chargeRate: string | number;
    applyFuel: boolean;
    applyTaxOnFuel: boolean;
    applyTax: boolean;
    hsnCode: string | null;
    sequence: number;
    multipleCharges: boolean;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface ChargeFormData {
    code: string;
    name: string;
    chargeType?: ChargeTypeEnums | string;
    calculationBase: ChargeCalculationBase;
    chargeRate: number;
    applyFuel: boolean;
    applyTaxOnFuel: boolean;
    applyTax: boolean;
    hsnCode?: string;
    sequence: number;
    multipleCharges: boolean;
}

export interface ChargeListResponse {
    success: boolean;
    message: string;
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
    message: string;
    data: Charge;
}
