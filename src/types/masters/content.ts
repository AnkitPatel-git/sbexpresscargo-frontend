export interface Content {
    id: number;
    contentCode: string;
    contentName: string;
    hsnCode: string;
    vendorId: number | null;
    countryId: number | null;
    vendor?: string | null;
    country?: string | null;
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

export interface ContentFormData {
    contentCode: string;
    contentName: string;
    hsnCode: string;
    vendor?: string;
    country?: string;
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
    message: string;
    data: Content;
}
