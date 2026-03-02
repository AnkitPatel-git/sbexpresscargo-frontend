export interface ServiceablePincode {
    id: number;
    pinCode: string;
    pinCodeName: string;
    serviceCenter: string;
    destination: string;
    serviceable: boolean;
    oda: boolean;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface ServiceablePincodeFormData {
    pinCode: string;
    pinCodeName: string;
    serviceCenter: string;
    destination: string;
    serviceable: boolean;
    oda: boolean;
}

export interface ServiceablePincodeListResponse {
    success: boolean;
    message: string;
    data: ServiceablePincode[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ServiceablePincodeSingleResponse {
    success: boolean;
    message: string;
    data: ServiceablePincode;
}
