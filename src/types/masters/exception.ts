/** Exception Master — Bruno `docs/bruno/Masters/Exception Master/*`. */

export type ExceptionType = 'UNDELIVERED' | 'DELIVERED';

export interface ExceptionMaster {
    id: number;
    code: string;
    name: string;
    type: ExceptionType;
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
    type: ExceptionType;
    inscan: boolean;
    showOnMobileApps: boolean;
}

export interface ExceptionListResponse {
    success: boolean;
    message?: string;
    data: ExceptionMaster[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ExceptionSingleResponse {
    success: boolean;
    message?: string;
    data: ExceptionMaster;
}
