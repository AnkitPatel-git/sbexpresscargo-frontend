import { apiFetch } from '@/lib/api-fetch';
import { PickupListResponse, PickupSingleResponse, PickupFormValues } from '@/types/transactions/pickup';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const pickupService = {
    async getPickups(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<PickupListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const response = await apiFetch(`${API_URL}/transaction/pickup?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch pickups');
        }

        return response.json();
    },

    async getPickupById(id: number): Promise<PickupSingleResponse> {
        const response = await apiFetch(`${API_URL}/transaction/pickup/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch pickup');
        }

        return response.json();
    },

    async createPickup(data: PickupFormValues): Promise<PickupSingleResponse> {
        const response = await apiFetch(`${API_URL}/transaction/pickup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create pickup');
        }

        return response.json();
    },

    async updatePickup(id: number, data: Partial<PickupFormValues>): Promise<PickupSingleResponse> {
        const response = await apiFetch(`${API_URL}/transaction/pickup/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update pickup');
        }

        return response.json();
    },

    async deletePickup(id: number): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${API_URL}/transaction/pickup/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete pickup');
        }

        return response.json();
    },
};
