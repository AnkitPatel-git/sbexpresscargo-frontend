import { apiFetch } from '@/lib/api-fetch';
import { TaxSetupFormData, TaxSetupListResponse, TaxSetupSingleResponse } from '@/types/tax-charges/tax-setup';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const taxSetupService = {
    async getTaxSetups(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<TaxSetupListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const response = await apiFetch(`${API_URL}/tax-charges/tax-setup?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch tax setups');
        }

        return response.json();
    },

    async getTaxSetupById(id: number): Promise<TaxSetupSingleResponse> {
        const response = await apiFetch(`${API_URL}/tax-charges/tax-setup/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch tax setup details');
        }

        return response.json();
    },

    async createTaxSetup(data: TaxSetupFormData): Promise<TaxSetupSingleResponse> {
        const response = await apiFetch(`${API_URL}/tax-charges/tax-setup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create tax setup');
        }

        return response.json();
    },

    async updateTaxSetup(id: number, data: Partial<TaxSetupFormData>): Promise<TaxSetupSingleResponse> {
        const response = await apiFetch(`${API_URL}/tax-charges/tax-setup/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update tax setup');
        }

        return response.json();
    },

    async deleteTaxSetup(id: number): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${API_URL}/tax-charges/tax-setup/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete tax setup');
        }

        return response.json();
    },
};
