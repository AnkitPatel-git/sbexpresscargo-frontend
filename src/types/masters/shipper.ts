/** Shipper Master — Bruno `docs/bruno/Masters/Shipper Master/*`. */

export interface ShipperServiceablePincode {
    id: number;
    pinCode: string;
    cityName: string;
}

export interface Shipper {
    id: number;
    areaId: number | null;
    shipperCode: string;
    shipperName: string;
    shipperOrigin: string | null;
    contactPerson: string | null;
    address1: string | null;
    address2: string | null;
    pinCodeId: number | null;
    countryId: number | null;
    stateId: number | null;
    zoneId: number | null;
    telephone: string | null;
    fax: string | null;
    email: string | null;
    mobile: string | null;
    industry: string | null;
    iecNo: string | null;
    gstNo: string | null;
    aadhaarNo: string | null;
    panNo: string | null;
    bankId: number | null;
    bankAccount: string | null;
    bankIfsc: string | null;
    firmType: 'GOV' | 'NON_GOV' | null;
    nfei: string | null;
    lutNumber: string | null;
    lutIssueDate: string | null;
    lutTillDate: string | null;
    /** Bruno optional string on create */
    serviceCenter?: string | null;
    /** List / legacy denormalized */
    city?: string | null;
    state?: string | null;
    pinCode?: string | null;
    serviceablePincode?: ShipperServiceablePincode | null;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface ShipperFormData {
    shipperCode: string;
    shipperName: string;
    shipperOrigin?: string;
    contactPerson?: string;
    address1?: string;
    address2?: string;
    pinCodeId?: string | number;
    areaId?: number;
    city?: string;
    state?: string;
    industry?: string;
    telephone?: string;
    fax?: string;
    email?: string;
    mobile?: string;
    iecNo?: string;
    gstNo?: string;
    aadhaarNo?: string;
    panNo?: string;
    serviceCenter?: string;
    bankId?: number;
    bankAccount?: string;
    bankIfsc?: string;
    firmType?: 'GOV' | 'NON_GOV';
    nfei?: string;
    lutNumber?: string;
    lutIssueDate?: string;
    lutTillDate?: string;
}

export interface ShipperListResponse {
    success: boolean;
    message?: string;
    data: Shipper[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ShipperSingleResponse {
    success: boolean;
    message?: string;
    data: Shipper;
}
