export interface TaxSetup {
    id: number;
    customer: string;
    product: string;
    fromDate: string;
    toDate: string;
    igst: string | number;
    cgst: string | number;
    sgst: string | number;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface TaxSetupFormData {
    customer: string;
    product: string;
    fromDate: string;
    toDate: string;
    igst: number;
    cgst: number;
    sgst: number;
}

export interface TaxSetupListResponse {
    success: boolean;
    message: string;
    data: TaxSetup[];
    meta?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface TaxSetupSingleResponse {
    success: boolean;
    message: string;
    data: TaxSetup;
}
