/** Vendor Serviceable Pincode — `/utilities/vendor-serviceable-pincodes`. */

export interface VendorServiceablePincodeZone {
    id: number;
    code: string;
    name: string;
    zoneType?: string | null;
}

export interface VendorServiceablePincodeVendor {
    id: number;
    vendorCode: string;
    vendorName: string;
}

export interface VendorServiceablePincodeMasterPin {
    id: number;
    pinCode: string;
    cityName: string;
    areaName?: string | null;
    countryId?: number;
    stateId?: number;
    country?: {
        id: number;
        code: string;
        name: string;
    } | null;
    state?: {
        id: number;
        stateName: string;
    } | null;
}

export interface VendorServiceablePincode {
    id: number;
    vendorId: number;
    serviceablePincodeId: number;
    zoneId: number;
    serviceable: boolean;
    edl: boolean;
    odaEdlDistanceKm?: number | string | null;
    pinCode?: string | null;
    cityName?: string | null;
    areaName?: string | null;
    vendor?: VendorServiceablePincodeVendor | null;
    serviceablePincode?: VendorServiceablePincodeMasterPin | null;
    zone?: VendorServiceablePincodeZone | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface VendorServiceablePincodeFormData {
    vendorId: number;
    serviceablePincodeId: number;
    zoneId: number;
    serviceable: boolean;
    edl: boolean;
    odaEdlDistanceKm?: number | null;
}

export interface VendorServiceablePincodeListResponse {
    success: boolean;
    message?: string;
    data: VendorServiceablePincode[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface VendorServiceablePincodeSingleResponse {
    success: boolean;
    message?: string;
    data: VendorServiceablePincode;
}
