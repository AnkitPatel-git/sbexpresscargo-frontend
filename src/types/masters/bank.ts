export type BankStatus = 'ACTIVE' | 'INACTIVE';

/** Bank Master — Bruno `docs/bruno/Masters/Bank Master/*`. */
export interface Bank {
    id: number;
    bankCode: string;
    bankName: string;
    status: BankStatus;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface BankFormData {
    bankCode: string;
    bankName: string;
    status: BankStatus;
}

export interface BankListResponse {
    success: boolean;
    message?: string;
    data: Bank[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface BankSingleResponse {
    success: boolean;
    message?: string;
    data: Bank;
}
