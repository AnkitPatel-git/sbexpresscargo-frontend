export interface ClientRate {
    id: number;
    fromDate: string;
    customer: string;
    origin: string;
    vendor: string;
    product: string;
    zone: string;
    country: string;
    destination: string;
    service: string;
    contractNo: string;
    rateValue: string | number;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface ClientRateFormData {
    fromDate: string;
    customer: string;
    origin: string;
    vendor: string;
    product: string;
    zone: string;
    country: string;
    destination: string;
    service: string;
    contractNo: string;
    rateValue: number;
}

export interface ClientRateListResponse {
    success: boolean;
    message: string;
    data: ClientRate[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ClientRateSingleResponse {
    success: boolean;
    message: string;
    data: ClientRate;
}
