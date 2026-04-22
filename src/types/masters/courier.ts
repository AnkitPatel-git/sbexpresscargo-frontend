/** Courier Master — Bruno `docs/bruno/Masters/Courier Master/*`. */

export interface CourierUserRef {
    id: number;
    username: string;
    mobile?: string | null;
    email?: string | null;
}

export interface Courier {
    id: number;
    code: string;
    userId: number;
    inActive: boolean;
    pickupCharge: string | number;
    deliveryCharge: string | number;
    serviceCenterId: number | null;
    user?: CourierUserRef | null;
    serviceCenter?: {
        id: number;
        code: string;
        name: string;
        subName?: string | null;
    } | null;
    createdAt?: string;
    updatedAt?: string;
    createdById?: number | null;
    updatedById?: number | null;
    deletedAt?: string | null;
    deletedById?: number | null;
}

/** POST body — Bruno: mandatory `userId`; optional `code`, `serviceCenterId`, charges, `inActive`. */
export interface CourierFormData {
    code?: string;
    userId: number;
    serviceCenterId?: number | null;
    pickupCharge?: number;
    deliveryCharge?: number;
    inActive?: boolean;
}

export interface CourierListResponse {
    success: boolean;
    message?: string;
    data: Courier[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface CourierSingleResponse {
    success: boolean;
    message?: string;
    data: Courier;
}
