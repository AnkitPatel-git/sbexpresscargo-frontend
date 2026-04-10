export type VendorIntegrationMode = 'B2B' | 'B2C' | 'API';
export type VendorConfigEnvironment = 'SANDBOX' | 'PRODUCTION';

export interface VendorConfigVendor {
    id: number;
    vendorCode: string;
    vendorName: string;
}

export interface VendorConfigCustomer {
    id: number;
    code: string;
    name: string;
}

export interface VendorConfig {
    id: number;
    vendorId: number;
    mode: VendorIntegrationMode;
    environment: VendorConfigEnvironment;
    customerId: number | null;
    apiKey: string | null;
    secretKey: string | null;
    baseUrl: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    deletedById: number | null;
    vendor: VendorConfigVendor;
    customer: VendorConfigCustomer | null;
}

export interface VendorConfigFormData {
    vendorId: number;
    mode: VendorIntegrationMode;
    environment: VendorConfigEnvironment;
    customerId?: number | null;
    apiKey?: string;
    secretKey?: string;
    baseUrl?: string;
    isActive: boolean;
}

export interface VendorConfigListResponse {
    success: boolean;
    data: VendorConfig[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface VendorConfigSingleResponse {
    success: boolean;
    data: VendorConfig;
}
