/** Service Map Master — Bruno `docs/bruno/Masters/Service Map Master/*`. */

export type ServiceMapStatus = 'ACTIVE' | 'INACTIVE';
export type ServiceTypeEnums = 'AIR' | 'SURFACE' | 'EXPRESS';

export interface ServiceMap {
    id: number;
    vendorId: number;
    serviceType: ServiceTypeEnums;
    minWeight: string | number;
    maxWeight: string | number;
    status: ServiceMapStatus;
    vendorLink: string | null;
    isSinglePiece: boolean;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
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
