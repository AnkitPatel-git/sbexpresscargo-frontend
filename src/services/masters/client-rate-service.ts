import { ClientRateListResponse, ClientRateSingleResponse, ClientRateFormData } from '@/types/masters/client-rate';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const clientRateService = {
    async getClientRates(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<ClientRateListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const response = await fetch(`${API_URL}/client-rate-master?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch client rates');
        }

        return response.json();
    },

    async getClientRateById(id: number): Promise<ClientRateSingleResponse> {
        const response = await fetch(`${API_URL}/client-rate-master/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch client rate');
        }

        return response.json();
    },

    async createClientRate(data: ClientRateFormData): Promise<ClientRateSingleResponse> {
        const response = await fetch(`${API_URL}/client-rate-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create client rate');
        }

        return response.json();
    },

    async updateClientRate(id: number, data: Partial<ClientRateFormData>): Promise<ClientRateSingleResponse> {
        const response = await fetch(`${API_URL}/client-rate-master/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update client rate');
        }

        return response.json();
    },

    async deleteClientRate(id: number): Promise<{ success: boolean; message: string }> {
        const response = await fetch(`${API_URL}/client-rate-master/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete client rate');
        }

        return response.json();
    },
};
