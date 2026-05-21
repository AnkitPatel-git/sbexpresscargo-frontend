import { apiFetch } from '@/lib/api-fetch';
import { CityListResponse, CitySingleResponse, CityFormData } from '@/types/masters/city';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const cityService = {
    async getCities(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        countryId?: number;
        stateId?: number;
        cityName?: string;
    }): Promise<CityListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
        if (params?.countryId) queryParams.append('countryId', params.countryId.toString());
        if (params?.stateId) queryParams.append('stateId', params.stateId.toString());
        if (params?.cityName) queryParams.append('cityName', params.cityName);

        const response = await apiFetch(`${API_URL}/city-master?${queryParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch cities');
        }

        return response.json();
    },

    async getCityById(id: number): Promise<CitySingleResponse> {
        const response = await apiFetch(`${API_URL}/city-master/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch city');
        }

        return response.json();
    },

    async createCity(data: CityFormData): Promise<CitySingleResponse> {
        const response = await apiFetch(`${API_URL}/city-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create city');
        }

        return response.json();
    },

    async updateCity(id: number, data: Partial<CityFormData>): Promise<CitySingleResponse> {
        const response = await apiFetch(`${API_URL}/city-master/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update city');
        }

        return response.json();
    },

    async deleteCity(id: number): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${API_URL}/city-master/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete city');
        }

        return response.json();
    },
};
