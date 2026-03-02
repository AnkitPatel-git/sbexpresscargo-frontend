export interface LocalBranch {
    id: number;
    branchCode: string;
    companyName: string;
    name: string;
    address1: string;
    address2: string | null;
    pinCode: string;
    city: string;
    state: string;
    telephone1: string;
    telephone2: string | null;
    email: string;
    gstNo: string;
    status?: string;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface LocalBranchFormData {
    branchCode: string;
    companyName: string;
    name: string;
    address1: string;
    address2?: string | null;
    pinCode: string;
    city: string;
    state: string;
    telephone1: string;
    email: string;
    gstNo: string;
}

export interface LocalBranchListResponse {
    success: boolean;
    message: string;
    data: LocalBranch[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface LocalBranchSingleResponse {
    success: boolean;
    message: string;
    data: LocalBranch;
}
