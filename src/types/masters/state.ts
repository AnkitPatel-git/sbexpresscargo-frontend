export interface State {
    id: number;
    countryId: number;
    stateName: string;
    gstAlias: string;
    unionTerritory: boolean;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
    country?: { id: number; code: string; name: string } | null;
}

export interface StateFormData {
    countryId: number;
    stateName: string;
    gstAlias: string;
    unionTerritory: boolean;
}

export interface StateListResponse {
    success: boolean;
    message?: string;
    data: State[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface StateSingleResponse {
    success: boolean;
    message: string;
    data: State;
}
