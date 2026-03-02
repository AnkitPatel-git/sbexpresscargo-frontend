export interface ServiceCenter {
    id: number;
    code: string;
    name: string;
    subName: string;
    address1: string;
    address2: string | null;
    destination: string;
    state: string;
    telephone: string;
    email: string;
    gstNo: string;
    pinCode: string;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface ServiceCenterFormData {
    code: string;
    name: string;
    subName: string;
    address1: string;
    destination: string;
    state: string;
    telephone: string;
    email: string;
    gstNo: string;
    pinCode: string;
}

export interface ServiceCenterListResponse {
    success: boolean;
    message: string;
    data: ServiceCenter[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ServiceCenterSingleResponse {
    success: boolean;
    message: string;
    data: ServiceCenter;
}
