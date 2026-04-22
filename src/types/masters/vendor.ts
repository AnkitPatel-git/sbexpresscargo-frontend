export interface VendorBankRef {
    id: number;
    bankCode?: string;
    bankName: string;
    status?: 'ACTIVE' | 'INACTIVE' | string;
}

export interface Vendor {
    id: number;
    vendorCode: string;
    vendorName: string;
    version?: number;
    contactPerson: string;
    address1: string;
    address2: string | null;
    pinCodeId: number | null;
    countryId: number | null;
    stateId: number | null;
    zoneId: number | null;
    bankId: number | null;
    bankAccount: string | null;
    bankIfsc: string | null;
    telephone: string;
    email: string;
    mobile: string;
    website: string | null;
    gstNo: string | null;
    currency: string | null;
    origin: string | null;
    vendorZip: string | null;
    status: 'ACTIVE' | 'INACTIVE';
    global: boolean;
    volumetricRound: number | null;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
    bank?: VendorBankRef | null;
}

export interface VendorFormData {
    vendorCode?: string;
    vendorName: string;
    contactPerson: string;
    address1: string;
    address2?: string;
    pinCodeId?: string | number;
    bankId?: number;
    bankAccount?: string;
    bankIfsc?: string;
    telephone: string;
    email: string;
    mobile: string;
    website?: string;
    gstNo?: string;
    currency?: string;
    origin?: string;
    vendorZip?: string;
    status: 'ACTIVE' | 'INACTIVE';
    global?: boolean;
    volumetricRound?: number;
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
