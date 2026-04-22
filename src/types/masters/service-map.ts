/** Service Map Master — Bruno `docs/bruno/master/service-map/*`. */

export type ServiceMapStatus = 'ACTIVE' | 'INACTIVE';
export type ServiceTypeEnums = 'AIR' | 'SURFACE' | 'EXPRESS';

export interface ServiceMapVendorRef {
    id: number;
    vendorCode: string;
    vendorName: string;
}

export interface ServiceMapDecimal {
    s?: number;
    e?: number;
    d?: number[];
}

export interface ServiceMap {
    id: number;
    vendorId: number;
    serviceType: ServiceTypeEnums;
    minWeight: string | number | ServiceMapDecimal;
    maxWeight: string | number | ServiceMapDecimal;
    status: ServiceMapStatus;
    vendorLink: string | null;
    isSinglePiece: boolean;
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
    serviceType: ServiceTypeEnums;
    minWeight: number;
    maxWeight: number;
    status: ServiceMapStatus;
    vendorLink?: string;
    isSinglePiece: boolean;
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
