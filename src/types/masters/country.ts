export interface Country {
    id: number;
    code: string;
    name: string;
    weightUnit: string;
    currency: string;
    isdCode: string;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface CountryFormData {
    code: string;
    name: string;
    weightUnit: string;
    currency: string;
    isdCode: string;
}

export interface CountryListResponse {
    success: boolean;
    message: string;
    data: Country[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CountrySingleResponse {
    success: boolean;
    message: string;
    data: Country;
}
