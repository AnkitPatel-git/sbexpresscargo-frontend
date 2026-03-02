export interface Consignee {
    id: number;
    code: string;
    name: string;
    destination: string | null;
    contactPerson: string;
    address1: string;
    address2: string | null;
    pinCode: string;
    city: string;
    state: string;
    tel1: string;
    tel2: string | null;
    email: string;
    mobile: string;
    serviceCenter: string | null;
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
    contactPerson: string;
    address1: string;
    address2?: string;
    pinCode: string;
    city: string;
    state: string;
    tel1: string;
    tel2?: string;
    email: string;
    mobile: string;
    serviceCenter?: string;
}

export interface ConsigneeListResponse {
    success: boolean;
    message: string;
    data: Consignee[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ConsigneeSingleResponse {
    success: boolean;
    message: string;
    data: Consignee;
}
