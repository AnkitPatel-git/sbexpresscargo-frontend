import { StateListResponse, StateSingleResponse, StateFormData } from '@/types/masters/state';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const stateService = {
    async getStates(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<StateListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const response = await fetch(`${API_URL}/state-master?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch states');
        }

        return response.json();
    },

    async getStateById(id: number): Promise<StateSingleResponse> {
        const response = await fetch(`${API_URL}/state-master/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch state');
        }

        return response.json();
    },

    async createState(data: StateFormData): Promise<StateSingleResponse> {
        const response = await fetch(`${API_URL}/state-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create state');
        }

        return response.json();
    },

    async updateState(id: number, data: Partial<StateFormData>): Promise<StateSingleResponse> {
        const response = await fetch(`${API_URL}/state-master/${id}`, {
            method: 'PUT', // Fixed to PUT as per standard API pattern observed in country/product
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update state');
        }

        return response.json();
    },

    async deleteState(id: number): Promise<{ success: boolean; message: string }> {
        const response = await fetch(`${API_URL}/state-master/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete state');
        }

        return response.json();
    },
};
