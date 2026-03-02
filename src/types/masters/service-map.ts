export interface ServiceMap {
    id: number;
    vendor: string;
    serviceType: string;
    billingVendor: string;
    minWeight: string | number;
    maxWeight: string | number;
    status: 'Active' | 'Inactive' | string;
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
    vendor: string;
    serviceType: string;
    billingVendor: string;
    minWeight: number;
    maxWeight: number;
    status: string;
    vendorLink?: string;
    isSinglePiece: boolean;
}

export interface ServiceMapListResponse {
    success: boolean;
    message: string;
    data: ServiceMap[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ServiceMapSingleResponse {
    success: boolean;
    message: string;
    data: ServiceMap;
}
