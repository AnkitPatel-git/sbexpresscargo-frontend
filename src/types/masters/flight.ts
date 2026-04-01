export interface Flight {
    id: number;
    flightCode: string;
    flightName: string;
    flightType: string;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface FlightFormData {
    flightCode: string;
    flightName: string;
    flightType: string;
}

export interface FlightListResponse {
    success: boolean;
    message?: string;
    data: Flight[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface FlightSingleResponse {
    success: boolean;
    message: string;
    data: Flight;
}
