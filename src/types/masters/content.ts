/** Content Master — Bruno `docs/bruno/Masters/Content Master/*`. */

/** Nested country on list/get (Bruno examples). */
export interface ContentCountryRef {
    id: number;
    code?: string;
    name: string;
    weightUnit?: string;
    currency?: string;
    isdCode?: string;
    createdAt?: string;
    updatedAt?: string;
    createdById?: number | null;
    updatedById?: number | null;
    deletedAt?: string | null;
    deletedById?: number | null;
}

/** Nested vendor when API includes it (shape may vary). */
export interface ContentVendorRef {
    id: number;
    vendorName?: string;
    name?: string;
    code?: string;
}

export interface Content {
    id: number;
    contentCode: string;
    contentName: string;
    hsnCode?: string | null;
    vendorId: number | null;
    countryId: number | null;
    /** Denormalized string or joined object from API */
    vendor?: string | ContentVendorRef | null;
    country?: string | ContentCountryRef | null;
    additionalField?: string | null;
    clearanceCethNo?: string | null;
    notificationSubType?: string | null;
    notificationSubType1?: string | null;
    notificationNo?: string | null;
    srNo?: string | null;
    igstNotification?: string | null;
    igstSrNo?: string | null;
    igstcNotification?: string | null;
    igstcSrNo?: string | null;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

/** Create/update body — Bruno: `contentCode` optional (backend may assign `CNT` + suffix). */
export interface ContentFormData {
    contentCode?: string;
    contentName: string;
    hsnCode?: string;
    vendorId?: number | null;
    countryId?: number | null;
    additionalField?: string;
    clearanceCethNo?: string;
    notificationSubType?: string;
    notificationSubType1?: string;
    notificationNo?: string;
    srNo?: string;
    igstNotification?: string;
    igstSrNo?: string;
    igstcNotification?: string;
    igstcSrNo?: string;
}

export interface ContentListResponse {
    success: boolean;
    message?: string;
    data: Content[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ContentSingleResponse {
    success: boolean;
    message?: string;
    data: Content;
}
