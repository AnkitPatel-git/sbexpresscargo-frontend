export interface Shipper {
    id: number;
    shipperCode: string;
    shipperName: string;
    shipperOrigin: string | null;
    contactPerson: string | null;
    address1: string | null;
    address2: string | null;
    pinCode: string | null;
    city: string | null;
    state: string | null;
    industry: string | null;
    telephone1: string | null;
    telephone2: string | null;
    fax: string | null;
    email: string | null;
    mobile: string | null;
    iecNo: string | null;
    gstNo: string | null;
    aadhaarNo: string | null;
    panNo: string | null;
    serviceCenterId: number | null;
    serviceCenter?: string | null; // Bruno shows string "Mumbai SC" in request
    bankAdCode: string | null;
    bankAccount: string | null;
    bankIfsc: string | null;
    firmType: 'GOV' | 'NON_GOV' | null;
    nfei: string | null;
    lutNumber: string | null;
    lutIssueDate: string | null;
    lutTillDate: string | null;
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
    pinCode?: string;
    city?: string;
    state?: string;
    industry?: string;
    telephone1?: string;
    telephone2?: string;
    fax?: string;
    email?: string;
    mobile?: string;
    iecNo?: string;
    gstNo?: string;
    aadhaarNo?: string;
    panNo?: string;
    serviceCenter?: string;
    bankAdCode?: string;
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
    message: string;
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
    message: string;
    data: Shipper;
}
