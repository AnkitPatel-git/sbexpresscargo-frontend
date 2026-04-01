export interface ServiceCenter {
    id: number;
    code: string;
    name: string;
    subName: string | null;
    address1: string | null;
    address2: string | null;
    address3: string | null;
    address4: string | null;
    destination: string | null;
    state: string | null;
    telephone: string | null;
    email: string | null;
    icnNo: string | null;
    stNo: string | null;
    pinCode: string | null;
    companyLogo: string | null;
    signatoryLogo: string | null;
    version: number;
    localBranchId: number | null;
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
    subName?: string | null;
    address1?: string | null;
    address2?: string | null;
    address3?: string | null;
    address4?: string | null;
    destination?: string | null;
    state?: string | null;
    telephone?: string | null;
    email?: string | null;
    icnNo?: string | null;
    stNo?: string | null;
    pinCode?: string | null;
    companyLogo?: string | null;
    signatoryLogo?: string | null;
}

export interface ServiceCenterListResponse {
    success: boolean;
    message?: string;
    data: ServiceCenter[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ServiceCenterSingleResponse {
    success: boolean;
    message: string;
    data: ServiceCenter;
}
