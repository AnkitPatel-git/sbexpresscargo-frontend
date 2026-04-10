export interface Vendor {
    id: number;
    vendorCode: string;
    vendorName: string;
    contactPerson: string;
    address1: string;
    address2: string | null;
    pinCodeId: number | null;
    countryId: number | null;
    stateId: number | null;
    zoneId: number | null;
    telephone: string;
    fax: string | null;
    email: string;
    mobile: string;
    website: string | null;
    gstNo: string | null;
    mode: string | null;
    fuelHead: string | null;
    currency: string | null;
    origin: string | null;
    vendorZip: string | null;
    status: 'ACTIVE' | 'INACTIVE';
    global: boolean;
    gstType: string | null;
    volumetricRound: number | null;
    version?: number;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface VendorFormData {
    vendorCode?: string;
    vendorName: string;
    contactPerson: string;
    address1: string;
    address2?: string;
    /** Bruno create accepts pin code string or numeric id string */
    pinCodeId?: string | number;
    telephone: string;
    fax?: string;
    email: string;
    mobile: string;
    website?: string;
    gstNo?: string;
    mode?: string;
    fuelHead?: string;
    currency?: string;
    origin?: string;
    vendorZip?: string;
    status: 'ACTIVE' | 'INACTIVE';
    global?: boolean;
    gstType?: string;
    volumetricRound?: number;
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
