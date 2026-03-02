export interface Area {
    id: number;
    areaName: string;
    serviceCenter: string;
    destination: string;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface AreaFormData {
    areaName: string;
    serviceCenter: string;
    destination: string;
}

export interface AreaListResponse {
    success: boolean;
    message: string;
    data: Area[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface AreaSingleResponse {
    success: boolean;
    message: string;
    data: Area;
}
