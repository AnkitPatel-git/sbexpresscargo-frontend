export interface CustomerGroup {
    id: number;
    code: string;
    name: string;
    version: number;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface CustomerGroupListResponse {
    success: boolean;
    message?: string;
    data: CustomerGroup[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface CustomerGroupFormData {
    code: string;
    name: string;
    status: 'ACTIVE' | 'INACTIVE';
    version?: number;
}

export interface CustomerGroupSingleResponse {
    success: boolean;
    message?: string;
    data: CustomerGroup;
}
