export type FuelServiceType = 'AIR' | 'SURFACE' | 'EXPRESS' | 'STANDARD';

export interface FuelSetup {
    id: number;
    version: number;
    entryCode: number;
    customerId: number | null;
    vendorId: number | null;
    productId: number | null;
    customer: string;
    vendor: string;
    product: string;
    destination: string;
    service: FuelServiceType;
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
    service: FuelServiceType;
    fromDate: string;
    toDate: string;
    percentage: number;
}

export interface FuelSetupListResponse {
    success: boolean;
    message: string;
    data: FuelSetup[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface FuelSetupSingleResponse {
    success: boolean;
    message: string;
    data: FuelSetup;
}
