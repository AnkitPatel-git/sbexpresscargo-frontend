export interface Area {
    id: number;
    areaName: string;
    serviceCenterId: number | null;
    serviceCenter?: string | { name: string; code: string }; // For display in table
    destination: string | null;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface AreaFormData {
    areaName: string;
    serviceCenterId: number;
    destination?: string;
}

export interface AreaListResponse {
    success: boolean;
    message: string;
    data: Area[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface AreaSingleResponse {
    success: boolean;
    message: string;
    data: Area;
}
