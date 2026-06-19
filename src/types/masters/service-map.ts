/** Service Map Master — Bruno `docs/bruno/master/service-map/*`. */

export type ServiceMapStatus = 'ACTIVE' | 'INACTIVE';
export type ServiceMapWeightUnit = 'G' | 'KG';

export interface ServiceMapVendorRef {
    id: number;
    vendorCode: string;
    vendorName: string;
}

export interface ServiceMap {
    id: number;
    vendorId: number;
    serviceType: string;
    weightUnit: ServiceMapWeightUnit;
    status: ServiceMapStatus;
    vendorLink: string | null;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
    vendor?: ServiceMapVendorRef | null;
}

export interface ServiceMapFormData {
    vendorId: number;
    serviceType: string;
    weightUnit: ServiceMapWeightUnit;
    status: ServiceMapStatus;
    vendorLink?: string;
}

export interface ServiceMapListResponse {
    success: boolean;
    message?: string;
    data: ServiceMap[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ServiceMapSingleResponse {
    success: boolean;
    message?: string;
    data: ServiceMap;
}
