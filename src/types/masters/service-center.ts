/** Service Center Master — Bruno `docs/bruno/Masters/Service Center Master/*`. */

export interface ServiceCenterCountryRef {
    id: number;
    code: string;
    name: string;
}

export interface ServiceCenterStateRef {
    id: number;
    stateName: string;
    stateCode?: string;
    countryId?: number;
}

export interface ServiceCenterPincodeRef {
    id: number;
    pinCode: string;
    cityName: string;
    areaName: string;
    serviceable: boolean;
    oda: boolean;
}

export interface ServiceCenter {
    id: number;
    code: string;
    name: string;
    subName: string | null;
    address1: string | null;
    address2: string | null;
    telephone: string | null;
    email: string | null;
    pinCodeId: number | null;
    countryId: number | null;
    stateId: number | null;
    gstNo?: string | null;
    panNo?: string | null;
    version: number;
    localBranchId: number | null;
    country?: ServiceCenterCountryRef | null;
    state?: ServiceCenterStateRef | null;
    serviceablePincode?: ServiceCenterPincodeRef | null;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

/** Bruno create/update body from `docs/bruno/master/service-center/*`. */
export interface ServiceCenterFormData {
    code: string;
    name: string;
    subName?: string | null;
    address1?: string | null;
    address2?: string | null;
    telephone?: string | null;
    email?: string | null;
    gstNo?: string | null;
    panNo?: string | null;
    pinCodeId: string;
    version?: number;
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
    message?: string;
    data: ServiceCenter;
}
