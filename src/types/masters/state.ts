import { Zone } from "@/types/masters/zone";

export interface State {
    id: number;
    stateCode: string;
    stateName: string;
    productType: string;
    zoneId: number;
    gstAlias: string;
    unionTerritory: boolean;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
    zone?: Zone;
}

export interface StateFormData {
    stateCode: string;
    stateName: string;
    productType: string;
    zoneId: number;
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
