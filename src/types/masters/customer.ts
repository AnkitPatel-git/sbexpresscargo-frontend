/** Customer Master — Bruno `docs/bruno/master/customer/*`. */

export interface CustomerMasterPincode {
    id: number;
    countryId: number;
    stateId: number;
    pinCode: string;
    cityName: string;
    areaName?: string;
    serviceable: boolean;
    oda: boolean;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface CustomerCountryRef {
    id: number;
    code: string;
    name: string;
    weightUnit?: string;
    currency?: string;
    isdCode?: string;
}

export interface CustomerStateRef {
    id: number;
    stateName: string;
    stateCode?: string;
    countryId?: number;
    gstAlias?: string;
    unionTerritory?: boolean;
}

export interface CustomerServiceCenterRef {
    id: number;
    code: string;
    name: string;
    subName?: string | null;
}

export interface CustomerBankRef {
    id: number;
    bankCode: string;
    bankName: string;
    status?: string;
}

export interface Customer {
    id: number;
    code: string;
    name: string;
    version: number;
    contactPerson: string | null;
    address1: string | null;
    address2: string | null;
    pinCodeId: number | null;
    countryId: number | null;
    stateId: number | null;
    bankId: number | null;
    bankAccount: string | null;
    bankIfsc: string | null;
    telephone: string | null;
    email: string | null;
    mobile: string | null;
    serviceCenterId: number | null;
    serviceStartDate: string | null;
    status: 'ACTIVE' | 'INACTIVE';
    origin: string | null;
    gstNo: string | null;
    aadhaarNo: string | null;
    dobOnAadhaar: string | null;
    panNo: string | null;
    invoiceFormat: string | null;
    customerType: 'INDIVIDUAL' | 'CORPORATE' | string | null;
    registerType: 'REGISTERED' | 'UNREGISTERED' | string | null;
    signatureFile: string | null;
    logoFile: string | null;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
    serviceablePincode?: CustomerMasterPincode | null;
    country?: CustomerCountryRef | null;
    state?: CustomerStateRef | null;
    serviceCenter?: CustomerServiceCenterRef | null;
    bank?: CustomerBankRef | null;
}

export interface CustomerFormData {
    code?: string;
    name: string;
    contactPerson?: string;
    address1?: string;
    address2?: string;
    pinCodeId?: number;
    serviceCenterId?: number;
    bankId?: number;
    bankAccount?: string;
    bankIfsc?: string;
    telephone?: string;
    email?: string;
    mobile?: string;
    serviceStartDate?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    origin?: string;
    gstNo?: string;
    aadhaarNo?: string;
    dobOnAadhaar?: string;
    panNo?: string;
    invoiceFormat?: string;
    customerType?: 'INDIVIDUAL' | 'CORPORATE' | string;
    registerType?: 'REGISTERED' | 'UNREGISTERED' | string;
    signatureFile?: string;
    logoFile?: string;
    createDefaultShipper?: boolean;
    version?: number;
}

export interface CustomerListResponse {
    success: boolean;
    message?: string;
    data: Customer[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface CustomerSingleResponse {
    success: boolean;
    message?: string;
    data: Customer;
}

export interface CustomerVendorRef {
    id: number;
    vendorCode: string;
    vendorName: string;
}

export interface CustomerProductRef {
    id: number;
    productCode: string;
    productName: string;
}

export interface CustomerFuelSurcharge {
    id: number;
    customerId: number;
    vendorId: number;
    productId: number;
    fuelChargeType: string;
    fromDate: string;
    toDate: string;
    fuelSurcharge: number | string | { s?: number; e?: number; d?: number[] };
    vendor?: CustomerVendorRef | null;
    product?: CustomerProductRef | null;
}

export interface CustomerFuelSurchargeFormData {
    vendorId: number;
    productId: number;
    fuelChargeType: string;
    fromDate: string;
    toDate: string;
    fuelSurcharge: number;
}

export interface CustomerOtherCharge {
    id: number;
    customerId: number;
    vendorId: number;
    productId: number;
    srNo: number;
    chargeType: string;
    fromDate: string;
    toDate: string;
    origin: string;
    destination: string;
    amount: number | string | { s?: number; e?: number; d?: number[] };
    minimumValue: number | string | { s?: number; e?: number; d?: number[] };
    vendor?: CustomerVendorRef | null;
    product?: CustomerProductRef | null;
}

export interface CustomerOtherChargeFormData {
    vendorId: number;
    productId: number;
    srNo: number;
    chargeType: string;
    fromDate: string;
    toDate: string;
    origin: string;
    destination: string;
    amount: number;
    minimumValue: number;
}

export interface CustomerVolumetric {
    id: number;
    customerId: number;
    vendorId: number;
    productId: number;
    cmDivide: number | string | { s?: number; e?: number; d?: number[] };
    inchDivide: number | string | { s?: number; e?: number; d?: number[] };
    cft: number | string | { s?: number; e?: number; d?: number[] };
    vendor?: CustomerVendorRef | null;
    product?: CustomerProductRef | null;
}

export interface CustomerVolumetricFormData {
    vendorId: number;
    productId: number;
    cmDivide: number;
    inchDivide: number;
    cft: number;
}

export interface CustomerKycDocument {
    id: number;
    customerId: number;
    docType: string;
    filePath: string;
    fileName: string;
    documentNumber?: string | null;
    expiryDate?: string | null;
    verified?: boolean;
}

export interface CustomerKycDocumentFormData {
    docType: string;
    filePath: string;
    fileName: string;
    documentNumber?: string;
    expiryDate?: string;
    verified?: boolean;
}

export interface CustomerChildListResponse<T> {
    success: boolean;
    message?: string;
    data: T[];
}

export interface CustomerChildSingleResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}
