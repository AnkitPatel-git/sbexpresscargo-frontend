import { FlightListResponse, FlightSingleResponse, FlightFormData } from '@/types/masters/flight';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const flightService = {
    async getFlights(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<FlightListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const response = await fetch(`${API_URL}/flight-master?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch flights');
        }

        return response.json();
    },

    async getFlightById(id: number): Promise<FlightSingleResponse> {
        const response = await fetch(`${API_URL}/flight-master/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch flight');
        }

        return response.json();
    },

    async createFlight(data: FlightFormData): Promise<FlightSingleResponse> {
        const response = await fetch(`${API_URL}/flight-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create flight');
        }

        return response.json();
    },

    async updateFlight(id: number, data: Partial<FlightFormData>): Promise<FlightSingleResponse> {
        const response = await fetch(`${API_URL}/flight-master/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update flight');
        }

        return response.json();
    },

    async deleteFlight(id: number): Promise<{ success: boolean; message: string }> {
        const response = await fetch(`${API_URL}/flight-master/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete flight');
        }

        return response.json();
    },
};
