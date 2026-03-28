export interface Industry {
    id: number;
    industryCode: string;
    industryName: string;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface IndustryFormData {
    industryCode: string;
    industryName: string;
}

export interface IndustryListResponse {
    success: boolean;
    message?: string;
    data: Industry[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface IndustrySingleResponse {
    success: boolean;
    message: string;
    data: Industry;
}
