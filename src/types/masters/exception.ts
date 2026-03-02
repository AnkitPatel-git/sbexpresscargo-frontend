export interface ExceptionMaster {
    id: number;
    code: string;
    name: string;
    type: string;
    inscan: boolean;
    showOnMobileApps: boolean;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface ExceptionFormData {
    code: string;
    name: string;
    type: string;
    inscan: boolean;
    showOnMobileApps: boolean;
}

export interface ExceptionListResponse {
    success: boolean;
    message: string;
    data: ExceptionMaster[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ExceptionSingleResponse {
    success: boolean;
    message: string;
    data: ExceptionMaster;
}
