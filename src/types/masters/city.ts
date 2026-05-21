export interface City {
    id: number;
    countryId: number;
    stateId: number;
    cityName: string;
    country?: {
        id: number;
        code: string;
        name: string;
    } | null;
    state?: {
        id: number;
        stateName: string;
    } | null;
    createdAt?: string;
    updatedAt?: string;
    createdById?: number | null;
    updatedById?: number | null;
    deletedAt?: string | null;
    deletedById?: number | null;
}

export interface CityFormData {
    countryId: number;
    stateId: number;
    cityName: string;
}

export interface CityListResponse {
    success: boolean;
    message?: string;
    data: City[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface CitySingleResponse {
    success: boolean;
    message: string;
    data: City;
}
