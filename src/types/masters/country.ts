/** Country Master — Bruno `docs/bruno/Masters/Country Master/*`. */

export interface Country {
    id: number;
    code: string;
    name: string;
    weightUnit: 'KGS' | 'LBS' | string;
    currency?: string | null;
    isdCode?: string | null;
    /** List rows may omit audit fields (Bruno list example). */
    createdAt?: string;
    updatedAt?: string;
    createdById?: number | null;
    updatedById?: number | null;
    deletedAt?: string | null;
    deletedById?: number | null;
}

/** Bruno Create: mandatory `code`, `name`, `weightUnit`; optional `currency`, `isdCode`. */
export interface CountryFormData {
    code: string;
    name: string;
    weightUnit: string;
    currency?: string;
    isdCode?: string;
}

export interface CountryListResponse {
    success: boolean;
    message?: string;
    data: Country[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface CountrySingleResponse {
    success: boolean;
    message?: string;
    data: Country;
}
