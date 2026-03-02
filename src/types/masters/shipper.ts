export interface Shipper {
    id: number;
    shipperCode: string;
    shipperName: string;
    shipperOrigin: string | null;
    contactPerson: string;
    address1: string;
    address2: string | null;
    pinCode: string;
    city: string;
    state: string;
    telephone1: string;
    telephone2: string | null;
    email: string;
    mobile: string;
    gstNo: string | null;
    serviceCenter: string | null;
    industry: string | null;
    fax: string | null;
    iecNo: string | null;
    aadhaarNo: string | null;
    panNo: string | null;
    bankAdCode: string | null;
    bankAccount: string | null;
    bankIfsc: string | null;
    firmType: string | null;
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
    contactPerson: string;
    address1: string;
    address2?: string;
    pinCode: string;
    city: string;
    state: string;
    telephone1: string;
    telephone2?: string;
    email: string;
    mobile: string;
    gstNo?: string;
    serviceCenter?: string;
}

export interface ShipperListResponse {
    success: boolean;
    message: string;
    data: Shipper[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ShipperSingleResponse {
    success: boolean;
    message: string;
    data: Shipper;
}
