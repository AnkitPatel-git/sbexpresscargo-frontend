export interface Zone {
    id: number;
    name: string;
    code: string;
    country: string;
    countryId: number | null;
    zoneType: 'DOMESTIC' | 'VENDOR';
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface ZoneFormData {
    name: string;
    code: string;
    country: string;
    zoneType: 'DOMESTIC' | 'VENDOR';
}

export interface ZoneListResponse {
    success: boolean;
    message?: string;
    data: Zone[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ZoneSingleResponse {
    success: boolean;
    message: string;
    data: Zone;
}
