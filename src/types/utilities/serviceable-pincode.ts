/** Serviceable Pincode — Bruno `docs/bruno/master/serviceable-pincode/*` (path `/utilities/serviceable-pincodes`). */

export interface ServiceablePincodeZone {
    id: number;
    code: string;
    name: string;
}

export interface ServiceablePincodeProductRef {
    id: number;
    productCode: string;
    productName: string;
}

export interface ServiceablePincode {
    id: number;
    countryId: number;
    stateId: number;
    pinCode: string;
    cityName: string;
    areaName: string;
    serviceable: boolean;
    oda?: boolean;
    edl?: boolean;
    productId?: number | null;
    odaEdlDistanceKm?: number | string | null;
    tatWorkingDays?: number | null;
    embargo?: boolean | null;
    product?: ServiceablePincodeProductRef | null;
    zoneIds?: number[];
    country?: {
        id: number;
        code: string;
        name: string;
    } | null;
    state?: {
        id: number;
        stateName: string;
    } | null;
    zones?: ServiceablePincodeZone[];
    createdAt?: string;
    updatedAt?: string;
    createdById?: number | null;
    updatedById?: number | null;
    deletedAt?: string | null;
    deletedById?: number | null;
}

export interface ServiceablePincodeFormData {
    countryId: number;
    countryCode: string;
    stateId: number;
    zoneIds: number[];
    pinCode: string;
    cityName: string;
    areaName: string;
    serviceable: boolean;
    edl: boolean;
    productId?: number | null;
    odaEdlDistanceKm?: number | null;
    tatWorkingDays?: number | null;
    embargo?: boolean | null;
}

export interface ServiceablePincodeListResponse {
    success: boolean;
    message?: string;
    data: ServiceablePincode[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ServiceablePincodeSingleResponse {
    success: boolean;
    message?: string;
    data: ServiceablePincode;
}
