export interface VendorBankRef {
    id: number;
    bankCode?: string;
    bankName: string;
    status?: 'ACTIVE' | 'INACTIVE' | string;
}

export interface VendorServiceablePincodeRef {
    id: number;
    pinCode: string;
    cityName: string;
    areaName?: string;
    serviceable?: boolean;
    oda?: boolean;
}

export interface Vendor {
    id: number;
    vendorCode: string;
    vendorName: string;
    version?: number;
    contactPerson: string;
    address1: string | null;
    address2: string | null;
    pinCodeId: number | null;
    countryId: number | null;
    stateId: number | null;
    zoneId: number | null;
    bankId: number | null;
    bankAccount: string | null;
    bankIfsc: string | null;
    telephone: string | null;
    email: string;
    mobile: string;
    website: string | null;
    gstNo: string | null;
    vendorZip: string | null;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
    bank?: VendorBankRef | null;
    serviceablePincode?: VendorServiceablePincodeRef | null;
}

export interface VendorFormData {
    vendorCode?: string;
    vendorName: string;
    contactPerson: string;
    address1?: string;
    address2?: string;
    pinCodeId?: string;
    bankId?: number | null;
    bankAccount?: string | null;
    bankIfsc?: string | null;
    telephone?: string;
    email: string;
    mobile: string;
    website?: string;
    gstNo?: string;
    vendorZip?: string;
    status: 'ACTIVE' | 'INACTIVE';
    version?: number;
}

export interface VendorListResponse {
    success: boolean;
    message: string;
    data: Vendor[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface VendorSingleResponse {
    success: boolean;
    message: string;
    data: Vendor;
}

export interface VendorProductRef {
    id: number;
    productCode: string;
    productName: string;
}

export interface VendorFuelSurcharge {
    id: number;
    vendorId: number;
    productId: number | null;
    fuelChargeType: string;
    fromDate: string;
    toDate: string;
    fuelSurcharge: number | string | { s?: number; e?: number; d?: number[] };
    product?: VendorProductRef | null;
}

export interface VendorFuelSurchargeFormData {
    productId?: number;
    fuelChargeType: string;
    fromDate: string;
    toDate: string;
    fuelSurcharge?: number;
}

export interface VendorIdcSurcharge {
    id: number;
    vendorId: number;
    productId: number | null;
    idcChargeType: string;
    fromDate: string;
    toDate: string;
    idcSurcharge: number | string | { s?: number; e?: number; d?: number[] };
    product?: VendorProductRef | null;
}

export interface VendorIdcSurchargeFormData {
    productId?: number;
    idcChargeType: string;
    fromDate: string;
    toDate: string;
    idcSurcharge?: number;
}

export interface VendorCafSurcharge {
    id: number;
    vendorId: number;
    productId: number | null;
    cafChargeType: string;
    fromDate: string;
    toDate: string;
    cafSurcharge: number | string | { s?: number; e?: number; d?: number[] };
    product?: VendorProductRef | null;
}

export interface VendorCafSurchargeFormData {
    productId?: number;
    cafChargeType: string;
    fromDate: string;
    toDate: string;
    cafSurcharge?: number;
}

export interface VendorVolumetric {
    id: number;
    vendorId: number;
    productId: number;
    cft: number | string | { s?: number; e?: number; d?: number[] };
    product?: VendorProductRef | null;
}

export interface VendorVolumetricFormData {
    productId: number;
    cft?: number;
}

export interface VendorChildListResponse<T> {
    success: boolean;
    message?: string;
    data: T[];
}

export interface VendorChildSingleResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}
