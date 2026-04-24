/** Local Branch Master — Bruno `docs/bruno/Masters/Local Branch Master/*`. */

export interface LocalBranch {
    id: number;
    branchCode: string;
    companyName: string;
    name: string;
    address1: string;
    address2: string | null;
    pinCodeId: number | null;
    countryId: number | null;
    stateId: number | null;
    serviceCenterId?: number;
    serviceCenter?: {
        id: number;
        code: string;
        name: string;
    };
    telephone: string | null;
    email: string;
    panNo?: string;
    gstNo: string | null;
    country?: {
        id: number;
        code: string;
        name: string;
    } | null;
    state?: {
        id: number;
        stateName: string;
        stateCode?: string;
    } | null;
    serviceablePincode?: {
        id: number;
        pinCode: string;
        cityName: string;
        areaName?: string;
        serviceable: boolean;
        oda: boolean;
    } | null;
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
    address2?: string | null | undefined;
    pinCodeId?: string;
    serviceCenterId: number;
    telephone?: string | null | undefined;
    email: string;
    panNo?: string | null | undefined;
    gstNo?: string | null | undefined;
}

export interface LocalBranchListResponse {
    success: boolean;
    message?: string;
    data: LocalBranch[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface LocalBranchSingleResponse {
    success: boolean;
    message?: string;
    data: LocalBranch;
}
