export interface ClientRate {
    id: number;
    fromDate: string;
    customerId: number;
    customer?: {
        id: number;
        code: string;
        name: string;
    };
    origin: string;
    vendorId: number;
    vendor?: {
        id: number;
        vendorCode: string;
        vendorName: string;
    };
    productId: number;
    product?: {
        id: number;
        productCode: string;
        productName: string;
    };
    zoneId: number;
    zone?: {
        id: number;
        zoneCode: string;
        zoneName: string;
    };
    countryId: number;
    country?: {
        id: number;
        code: string;
        name: string;
    };
    destination: string;
    service: 'AIR' | 'SURFACE' | 'EXPRESS' | 'STANDARD' | string;
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
    customerCode: string;
    origin: string;
    vendorCode: string;
    productCode: string;
    zoneCode: string;
    countryCode: string;
    destination: string;
    service: 'AIR' | 'SURFACE' | 'EXPRESS' | 'STANDARD';
    contractNo: string;
    rateValue: number;
}

export interface ClientRateListResponse {
    success: boolean;
    message: string;
    data: ClientRate[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ClientRateSingleResponse {
    success: boolean;
    message: string;
    data: ClientRate;
}
