/** Service Center Master — Bruno `docs/bruno/Masters/Service Center Master/*`. */

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
    pinCodeId: number | null;
    countryId: number | null;
    stateId: number | null;
    companyLogo: string | null;
    signatoryLogo: string | null;
    /** Present when API returns full record (Bruno create / docs) */
    gstNo?: string | null;
    gstTelephone?: string | null;
    panNo?: string | null;
    terms?: string[] | null;
    bankId?: number | null;
    accountNo?: string | null;
    accountName?: string | null;
    bankAddress?: string | null;
    ifsc?: string | null;
    micr?: string | null;
    lastInvoicePrefix?: string | null;
    lastInvoiceNo?: number | null;
    lastInvoiceSuffix?: string | null;
    freeFormPrefix?: string | null;
    lastFreeFormInvoiceNo?: number | null;
    freeFormSuffix?: string | null;
    debitNotePrefix?: string | null;
    debitNoteLastInvoiceNo?: number | null;
    debitNoteSuffix?: string | null;
    creditNotePrefix?: string | null;
    creditNoteLastInvoiceNo?: number | null;
    creditNoteSuffix?: string | null;
    rcpLastNo?: number | null;
    version: number;
    localBranchId: number | null;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

/** Bruno create/update: pinCodeId as string pin or id; bankId as string in examples */
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
    gstNo?: string | null;
    gstTelephone?: string | null;
    panNo?: string | null;
    icnNo?: string | null;
    stNo?: string | null;
    pinCodeId?: string | number | null;
    companyLogo?: string | null;
    signatoryLogo?: string | null;
    terms?: string[] | null;
    bankId?: string | number | null;
    accountNo?: string | null;
    accountName?: string | null;
    bankAddress?: string | null;
    ifsc?: string | null;
    micr?: string | null;
    lastInvoicePrefix?: string | null;
    lastInvoiceNo?: number | null;
    lastInvoiceSuffix?: string | null;
    freeFormPrefix?: string | null;
    lastFreeFormInvoiceNo?: number | null;
    freeFormSuffix?: string | null;
    debitNotePrefix?: string | null;
    debitNoteLastInvoiceNo?: number | null;
    debitNoteSuffix?: string | null;
    creditNotePrefix?: string | null;
    creditNoteLastInvoiceNo?: number | null;
    creditNoteSuffix?: string | null;
    rcpLastNo?: number | null;
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
