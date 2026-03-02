export interface FuelSetup {
    id: number;
    entryCode: number;
    customer: string;
    vendor: string;
    product: string;
    destination: string;
    service: string;
    fromDate: string;
    toDate: string;
    percentage: string | number;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface FuelSetupFormData {
    entryCode: number;
    customer: string;
    vendor: string;
    product: string;
    destination: string;
    service: string;
    fromDate: string;
    toDate: string;
    percentage: number;
}

export interface FuelSetupListResponse {
    success: boolean;
    message: string;
    data: FuelSetup[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface FuelSetupSingleResponse {
    success: boolean;
    message: string;
    data: FuelSetup;
}
