export type PartnerAdapterCode = 'HAFLE' | 'GENERIC';
export type PartnerWebhookAuthType = 'NONE' | 'BEARER' | 'BASIC' | 'HEADER';
export type PartnerPaymentType = 'CASH' | 'CREDIT' | 'TO_PAY';
export type PartnerAppStatus = 'ACTIVE' | 'INACTIVE';

export interface PartnerAppCustomer {
    id: number;
    code: string;
    name: string;
}

export interface PartnerAppProduct {
    id: number;
    productCode: string;
    productName: string;
}

export interface PartnerWebhookConfig {
    id: number;
    webhookUrl: string;
    authType: PartnerWebhookAuthType;
    authValue: string | null;
    authHeaderName: string | null;
    isActive: boolean;
}

export interface PartnerStatusMapping {
    id: number;
    internalStatus: string;
    scan: string;
    scanCode: string;
    scanType: string;
}

export interface PartnerApp {
    id: number;
    code: string;
    name: string;
    adapterCode: PartnerAdapterCode;
    status: PartnerAppStatus;
    clientId: string;
    clientSecret?: string;
    tokenTtlSeconds: number;
    secretVersion: number;
    defaultProductId: number;
    defaultPaymentType: PartnerPaymentType;
    extraConfig?: Record<string, unknown> | null;
    customers: PartnerAppCustomer[];
    webhook: PartnerWebhookConfig | null;
    statusMappings: PartnerStatusMapping[];
    defaultProduct?: PartnerAppProduct | null;
    createdAt: string;
    updatedAt: string;
}

export interface PartnerAppFormData {
    code: string;
    name: string;
    adapterCode: PartnerAdapterCode;
    defaultProductId: number;
    defaultPaymentType: PartnerPaymentType;
    status: PartnerAppStatus;
    tokenTtlSeconds?: number;
    customerIds: number[];
    extraConfig?: Record<string, unknown>;
    webhook?: {
        webhookUrl: string;
        authType: PartnerWebhookAuthType;
        authValue?: string;
        authHeaderName?: string;
        isActive: boolean;
    } | null;
}

export interface PartnerAppListResponse {
    success: boolean;
    data: PartnerApp[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface PartnerAppSingleResponse {
    success: boolean;
    data: PartnerApp;
}

export interface PartnerApiLog {
    id: number;
    endpoint: string;
    httpStatus: number | null;
    customerCode: string | null;
    referenceNo: string | null;
    success: boolean;
    errorMessage: string | null;
    createdAt: string;
}

export interface PartnerPushLog {
    id: number;
    status: string;
    attempts: number;
    httpStatus: number | null;
    lastError: string | null;
    createdAt: string;
    shipment?: { id: number; awbNo: string; referenceNo: string | null } | null;
}
