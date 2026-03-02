export interface Customer {
    id: number;
    code: string;
    name: string;
    contactPerson: string;
    address1: string;
    address2: string | null;
    pinCode: string;
    city: string;
    state: string;
    telNo1: string;
    email: string;
    mobile: string;
    status: 'Active' | 'Inactive' | string;
    customerType: string;
    registerType: string;
    gstNo: string;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface CustomerFormData {
    code: string;
    name: string;
    contactPerson: string;
    address1: string;
    pinCode: string;
    city: string;
    state: string;
    telNo1: string;
    email: string;
    mobile: string;
    status: string;
    customerType: string;
    registerType: string;
    gstNo: string;
}

export interface CustomerListResponse {
    success: boolean;
    message: string;
    data: Customer[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CustomerSingleResponse {
    success: boolean;
    message: string;
    data: Customer;
}
