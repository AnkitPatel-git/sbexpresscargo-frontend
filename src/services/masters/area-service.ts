import { apiFetch } from '@/lib/api-fetch';
import { AreaListResponse, AreaSingleResponse, AreaFormData } from '@/types/masters/area';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const areaService = {
    async getAreas(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<AreaListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'areaName');
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc');

        const response = await apiFetch(`${API_URL}/area-master?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch areas');
        }

        return response.json();
    },

    async getAreaById(id: number): Promise<AreaSingleResponse> {
        const response = await apiFetch(`${API_URL}/area-master/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch area');
        }

        return response.json();
    },

    async createArea(data: AreaFormData): Promise<AreaSingleResponse> {
        const response = await apiFetch(`${API_URL}/area-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create area');
        }

        return response.json();
    },

    async updateArea(id: number, data: Partial<AreaFormData>): Promise<AreaSingleResponse> {
        const response = await apiFetch(`${API_URL}/area-master/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update area');
        }

        return response.json();
    },

    async deleteArea(id: number): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${API_URL}/area-master/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete area');
        }

        return response.json();
    },
};
