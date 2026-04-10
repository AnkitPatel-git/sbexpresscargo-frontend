export interface Zone {
    id: number;
    version?: number;
    name: string;
    code: string;
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
    countryId: number;
    zoneType: 'DOMESTIC' | 'VENDOR';
}

export interface ZoneImportItem {
    name: string;
    code?: string;
    countryId: number;
    zoneType?: 'DOMESTIC' | 'VENDOR';
}

export interface ZoneListResponse {
    success: boolean;
    message?: string;
    data: Zone[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ZoneSingleResponse {
    success: boolean;
    message: string;
    data: Zone;
}

export interface ZoneImportResponse {
    success: boolean;
    message: string;
    data: { created: number; updated: number };
}
