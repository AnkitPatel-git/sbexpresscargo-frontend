/** Consignee Master — Bruno `docs/bruno/Masters/Consignee Master/*`. */

/** Nested pincode on GET-by-id */
export interface ConsigneeServiceablePincode {
    id: number;
    pinCode: string;
    cityName: string;
}

/** Bruno list example includes joined `area` */
export interface ConsigneeAreaRef {
    id: number;
    areaName: string;
}

export interface Consignee {
    id: number;
    areaId: number | null;
    area?: ConsigneeAreaRef | null;
    code: string;
    name: string;
    destination: string | null;
    contactPerson: string | null;
    address1: string | null;
    address2: string | null;
    pinCodeId: number | null;
    countryId: number | null;
    stateId: number | null;
    telephone: string | null;
    fax: string | null;
    email: string | null;
    mobile: string | null;
    serviceCenterId: number | null;
    serviceCenter?: {
        id: number;
        code: string;
        name: string;
    };
    industry: string | null;
    eori: string | null;
    vat: string | null;
    /** List / legacy denormalized fields */
    city?: string | null;
    state?: string | null;
    pinCode?: string | null;
    serviceablePincode?: ConsigneeServiceablePincode | null;
    /** Present on full GET / create response; list rows may omit */
    createdAt?: string;
    updatedAt?: string;
    createdById?: number | null;
    updatedById?: number | null;
    deletedAt?: string | null;
    deletedById?: number | null;
}

export interface ConsigneeFormData {
    code?: string;
    name: string;
    destination?: string;
    contactPerson?: string;
    address1?: string;
    address2?: string;
    /** Bruno: string pin or id */
    pinCodeId?: string | number;
    areaId?: number;
    city?: string;
    state?: string;
    industry?: string;
    telephone?: string;
    fax?: string;
    email?: string;
    mobile?: string;
    serviceCenterCode?: string;
    serviceCenterId?: number;
    eori?: string;
    vat?: string;
}

export interface ConsigneeListResponse {
    success: boolean;
    message?: string;
    data: Consignee[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ConsigneeSingleResponse {
    success: boolean;
    message?: string;
    data: Consignee;
}
