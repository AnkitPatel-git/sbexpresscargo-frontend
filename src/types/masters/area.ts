/** Joined pincode when API includes `serviceablePincode` / legacy `pinCode` (see Bruno list/get). */
export interface AreaPincodeSummary {
    id: number;
    pinCode: string;
    pinCodeName: string;
}

/**
 * Area Master — Bruno `docs/bruno/Masters/Area Master/*`.
 * Base response: id, areaName, pinCodeId, audit fields.
 */
export interface Area {
    id: number;
    areaName: string;
    pinCodeId: number | null;
    serviceablePincode?: AreaPincodeSummary | null;
    /** Some API builds nest under `pinCode` instead */
    pinCode?: AreaPincodeSummary | null;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

/** Bruno create/update body: mandatory `areaName`; `pinCodeId` number. */
export interface AreaFormData {
    areaName: string;
    pinCodeId: number;
}

export interface AreaListResponse {
    success: boolean;
    message?: string;
    data: Area[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface AreaSingleResponse {
    success: boolean;
    message: string;
    data: Area;
}
