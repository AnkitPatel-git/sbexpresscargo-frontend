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
    serviceCenterCode?: string;
    serviceCenterId?: number;
    serviceCenter?: {
        id: number;
        code: string;
        name: string;
    };
    telephone: string | null;
    fax?: string | null;
    website?: string | null;
    email: string;
    panNo?: string;
    serviceTaxNo?: string;
    billingState?: string;
    stateCode?: string;
    gstNo: string;
    serviceRegistrationNo?: string;
    companyLogo?: string | null;
    signatoryLogo?: string | null;
    terms?: string[];
    bankId: number | null;
    accountNo?: string;
    accountName?: string;
    bankAddress?: string;
    ifsc?: string;
    micr?: string;
    lastInvoiceNo?: number;
    invoicePrefix?: string;
    invoiceSuffix?: string;
    lastFreeFormInvoiceNo?: number;
    freeFormPrefix?: string;
    freeFormSuffix?: string;
    debitNotePrefix?: string;
    debitNoteLastInvoiceNo?: number;
    debitNoteSuffix?: string;
    creditNotePrefix?: string;
    creditNoteLastInvoiceNo?: number;
    creditNoteSuffix?: string;
    rcpLastNo?: number;
    status?: 'ACTIVE' | 'INACTIVE' | string;
    /** Optional denormalized from joins / legacy list */
    city?: string;
    state?: string;
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
    pinCodeId?: string | number;
    city?: string;
    state?: string;
    serviceCenterId: number;
    serviceCenterCode?: string | null | undefined;
    telephone: string;
    fax?: string | null | undefined;
    website?: string | null | undefined;
    email: string;
    panNo?: string | null | undefined;
    serviceTaxNo?: string | null | undefined;
    billingState?: string | null | undefined;
    stateCode?: string | null | undefined;
    gstNo: string;
    serviceRegistrationNo?: string | null | undefined;
    companyLogo?: string | null | undefined;
    signatoryLogo?: string | null | undefined;
    terms?: string[] | null | undefined;
    bankId?: number | null | undefined;
    accountNo?: string | null | undefined;
    accountName?: string | null | undefined;
    bankAddress?: string | null | undefined;
    ifsc?: string | null | undefined;
    micr?: string | null | undefined;
    lastInvoiceNo?: number | null | undefined;
    invoicePrefix?: string | null | undefined;
    invoiceSuffix?: string | null | undefined;
    lastFreeFormInvoiceNo?: number | null | undefined;
    freeFormPrefix?: string | null | undefined;
    freeFormSuffix?: string | null | undefined;
    debitNotePrefix?: string | null | undefined;
    debitNoteLastInvoiceNo?: number | null | undefined;
    debitNoteSuffix?: string | null | undefined;
    creditNotePrefix?: string | null | undefined;
    creditNoteLastInvoiceNo?: number | null | undefined;
    creditNoteSuffix?: string | null | undefined;
    rcpLastNo?: number | null | undefined;
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
