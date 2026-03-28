export interface Courier {
    id: number;
    code: string;
    name: string;
    mobile: string;
    inActive: boolean;
    pickupCharge: string | number;
    deliveryCharge: string | number;
    serviceCenterId: number;
    serviceCenterCode?: string;
    serviceCenter?: {
        id: number;
        code: string;
        name: string;
    };
    destination: string;
    originCode: string | null;
    tldBatchNo: string | null;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface CourierFormData {
    code: string;
    name: string;
    mobile: string;
    inActive: boolean;
    pickupCharge: number;
    deliveryCharge: number;
    serviceCenterId: number;
    serviceCenterCode: string;
    destination: string;
    originCode?: string;
    tldBatchNo?: string;
}

export interface CourierListResponse {
    success: boolean;
    message: string;
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
    message: string;
    data: Courier;
}
