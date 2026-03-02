export interface Bank {
    id: number;
    bankCode: string;
    bankName: string;
    status: 'ACTIVE' | 'INACTIVE' | string;
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
    status: string;
}

export interface BankListResponse {
    success: boolean;
    message: string;
    data: Bank[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface BankSingleResponse {
    success: boolean;
    message: string;
    data: Bank;
}
