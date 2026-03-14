import { apiFetch } from '@/lib/api-fetch';
import { FuelSetupFormData, FuelSetupListResponse, FuelSetupSingleResponse } from '@/types/tax-charges/fuel-setup';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const fuelSetupService = {
    async getFuelSetups(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<FuelSetupListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const response = await apiFetch(`${API_URL}/tax-charges/fuel-setup?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch fuel setups');
        }

        return response.json();
    },

    async getFuelSetupById(id: number): Promise<FuelSetupSingleResponse> {
        const response = await apiFetch(`${API_URL}/tax-charges/fuel-setup/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch fuel setup details');
        }

        return response.json();
    },

    async createFuelSetup(data: FuelSetupFormData): Promise<FuelSetupSingleResponse> {
        const response = await apiFetch(`${API_URL}/tax-charges/fuel-setup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create fuel setup');
        }

        return response.json();
    },

    async updateFuelSetup(id: number, data: Partial<FuelSetupFormData>): Promise<FuelSetupSingleResponse> {
        const response = await apiFetch(`${API_URL}/tax-charges/fuel-setup/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update fuel setup');
        }

        return response.json();
    },

    async deleteFuelSetup(id: number): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${API_URL}/tax-charges/fuel-setup/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete fuel setup');
        }

        return response.json();
    },
};
