import { CountryListResponse, CountrySingleResponse, CountryFormData } from '@/types/masters/country';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const countryService = {
    async getCountries(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<CountryListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const response = await fetch(`${API_URL}/country-master?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch countries');
        }

        return response.json();
    },

    async getCountryById(id: number): Promise<CountrySingleResponse> {
        const response = await fetch(`${API_URL}/country-master/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch country');
        }

        return response.json();
    },

    async createCountry(data: CountryFormData): Promise<CountrySingleResponse> {
        const response = await fetch(`${API_URL}/country-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create country');
        }

        return response.json();
    },

    async updateCountry(id: number, data: Partial<CountryFormData>): Promise<CountrySingleResponse> {
        const response = await fetch(`${API_URL}/country-master/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update country');
        }

        return response.json();
    },

    async deleteCountry(id: number): Promise<{ success: boolean; message: string }> {
        const response = await fetch(`${API_URL}/country-master/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete country');
        }

        return response.json();
    },
};
