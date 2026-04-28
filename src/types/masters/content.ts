/** Content Master — Bruno `docs/bruno/Masters/Content Master/*`. */

export interface Content {
    id: number;
    contentCode: string;
    contentName: string;
    hsnCode?: string | null;
    additionalField?: string | null;
    clearanceCethNo?: string | null;
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
    hsnCode?: string | null;
    additionalField?: string;
    clearanceCethNo?: string;
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
