export interface Vendor {
    id: number;
    vendorName: string;
    vendorCode: string;
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
    website: string | null;
    gstNo: string | null;
    status: 'Active' | 'Inactive' | string;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface VendorFormData {
    vendorName: string;
    vendorCode: string;
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
    website?: string;
    gstNo?: string;
    status: string;
}

export interface VendorListResponse {
    success: boolean;
    message: string;
    data: Vendor[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface VendorSingleResponse {
    success: boolean;
    message: string;
    data: Vendor;
}
