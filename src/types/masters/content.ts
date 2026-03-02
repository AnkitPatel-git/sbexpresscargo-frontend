export interface Content {
    id: number;
    contentCode: string;
    contentName: string;
    hsnCode: string;
    vendor: string | null;
    country: string | null;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface ContentFormData {
    contentCode: string;
    contentName: string;
    hsnCode: string;
    vendor: string;
    country: string;
}

export interface ContentListResponse {
    success: boolean;
    message: string;
    data: Content[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ContentSingleResponse {
    success: boolean;
    message: string;
    data: Content;
}
