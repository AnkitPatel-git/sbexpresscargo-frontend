export interface Consignee {
    id: number;
    code: string;
    name: string;
    destination: string | null;
    contactPerson: string | null;
    address1: string | null;
    address2: string | null;
    pinCode: string | null;
    city: string | null;
    state: string | null;
    tel1: string | null;
    tel2: string | null;
    email: string | null;
    mobile: string | null;
    serviceCenterId: number | null;
    serviceCenter?: {
        id: number;
        code: string;
        name: string;
    };
    industry: string | null;
    fax: string | null;
    eori: string | null;
    vat: string | null;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface ConsigneeFormData {
    code: string;
    name: string;
    destination?: string;
    contactPerson?: string;
    address1?: string;
    address2?: string;
    pinCode?: string;
    city?: string;
    state?: string;
    industry?: string;
    tel1?: string;
    tel2?: string;
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
    message: string;
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
    message: string;
    data: Consignee;
}
