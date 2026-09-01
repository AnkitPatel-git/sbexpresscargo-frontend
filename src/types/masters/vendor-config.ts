export type VendorConfigEnvironment = 'SANDBOX' | 'PRODUCTION';

export type TrackingAdapterCode = 'DELHIVERY' | 'BLUEDART';

export interface VendorConfigVendor {
    id: number;
    vendorCode: string;
    vendorName: string;
}

export interface VendorConfigServiceMap {
    id: number;
    serviceType: string;
    vendorLink: string | null;
}

export interface VendorConfig {
    id: number;
    vendorId: number;
    serviceMapId: number;
    environment: VendorConfigEnvironment;
    apiKey: string | null;
    secretKey: string | null;
    baseUrl: string | null;
    extraConfig?: Record<string, unknown> | null;
    adapter?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    deletedById: number | null;
    vendor: VendorConfigVendor | null;
    serviceMap: VendorConfigServiceMap | null;
}

export interface VendorConfigFormData {
    vendorId: number;
    serviceMapId: number;
    environment: VendorConfigEnvironment;
    apiKey?: string;
    secretKey?: string;
    baseUrl?: string;
    extraConfig?: Record<string, unknown>;
    adapter?: string | null;
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
