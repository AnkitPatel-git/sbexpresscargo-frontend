/** Customer Master — Bruno `docs/bruno/Masters/Customer Master/*`. */

/** Matches GET-by-id nested `serviceablePincode` */
export interface CustomerMasterPincode {
    id: number;
    countryId: number;
    stateId: number;
    pinCode: string;
    cityName: string;
    serviceable: boolean;
    oda: boolean;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface CustomerCountryRef {
    id: number;
    code: string;
    name: string;
    weightUnit: string;
    currency: string;
    isdCode: string;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface CustomerStateRef {
    id: number;
    stateName: string;
    countryId: number;
    gstAlias: string;
    unionTerritory: boolean;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface CustomerServiceCenterRef {
    id: number;
    code: string;
    name: string;
}

export interface Customer {
    id: number;
    code: string;
    name: string;
    version: number;
    contactPerson: string | null;
    address1: string | null;
    address2: string | null;
    pinCodeId: number | null;
    countryId: number | null;
    stateId: number | null;
    telephone: string | null;
    email: string | null;
    mobile: string | null;
    faxNo: string | null;
    billingState: string | null;
    serviceCenterId: number | null;
    startDate: string | null;
    status: 'ACTIVE' | 'INACTIVE';
    origin: string | null;
    gstNo: string | null;
    aadhaarNo: string | null;
    dobOnAadhaar: string | null;
    passportNo: string | null;
    panNo: string | null;
    tanNo: string | null;
    invoiceFormat: string | null;
    customerType: 'CUSTOMER' | 'VENDOR' | 'AGENT' | null;
    registerType: 'REGISTERED' | 'UNREGISTERED' | null;
    signatureFile: string | null;
    logoFile: string | null;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
    serviceablePincode?: CustomerMasterPincode | null;
    country?: CustomerCountryRef | null;
    stateMaster?: CustomerStateRef | null;
    serviceCenter?: CustomerServiceCenterRef | null;
    emails?: unknown[];
    contacts?: unknown[];
    kycDocuments?: unknown[];
    fuelSurcharges?: unknown[];
    otherCharges?: unknown[];
    volumetrics?: unknown[];
    /** Some list responses still denormalize city */
    city?: string | null;
    state?: string | null;
}

/** Bruno Customer Master – Create / Update body (subset; many optional) */
export interface CustomerFormData {
    code?: string;
    name: string;
    contactPerson?: string;
    address1?: string;
    address2?: string;
    pinCodeId?: string | number;
    telephone?: string;
    email?: string;
    city?: string;
    state?: string;
    mobile?: string;
    faxNo?: string;
    billingState?: string;
    /** Bruno create uses string code/name e.g. "VASAI" */
    serviceCenter?: string;
    serviceCenterId?: number;
    startDate?: string;
    serviceStartDate?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    origin?: string;
    gstNo?: string;
    aadhaarNo?: string;
    dobOnAadhaar?: string;
    passportNo?: string;
    panNo?: string;
    tanNo?: string;
    invoiceFormat?: string;
    customerType?: 'CUSTOMER' | 'VENDOR' | 'AGENT';
    registerType?: 'REGISTERED' | 'UNREGISTERED';
    signatureFile?: string;
    logoFile?: string;
    createDefaultShipper?: boolean;
    version?: number;
}

export interface CustomerListResponse {
    success: boolean;
    message?: string;
    data: Customer[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface CustomerSingleResponse {
    success: boolean;
    message?: string;
    data: Customer;
}
