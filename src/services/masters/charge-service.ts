import { ChargeListResponse, ChargeSingleResponse, ChargeFormData } from '@/types/masters/charge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const chargeService = {
    async getCharges(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<ChargeListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const response = await fetch(`${API_URL}/charge-master?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch charges');
        }

        return response.json();
    },

    async getChargeById(id: number): Promise<ChargeSingleResponse> {
        const response = await fetch(`${API_URL}/charge-master/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch charge');
        }

        return response.json();
    },

    async createCharge(data: ChargeFormData): Promise<ChargeSingleResponse> {
        const response = await fetch(`${API_URL}/charge-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create charge');
        }

        return response.json();
    },

    async updateCharge(id: number, data: Partial<ChargeFormData>): Promise<ChargeSingleResponse> {
        const response = await fetch(`${API_URL}/charge-master/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update charge');
        }

        return response.json();
    },

    async deleteCharge(id: number): Promise<{ success: boolean; message: string }> {
        const response = await fetch(`${API_URL}/charge-master/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete charge');
        }

        return response.json();
    },
};
