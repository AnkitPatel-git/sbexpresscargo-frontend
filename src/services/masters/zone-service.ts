import { apiFetch } from '@/lib/api-fetch';
import { ZoneFormData, ZoneListResponse, ZoneSingleResponse } from '@/types/masters/zone';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const zoneService = {
    async getZones(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        exportType?: string;
        country?: string;
    }): Promise<ZoneListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
        if (params?.exportType) queryParams.append('exportType', params.exportType);
        if (params?.country) queryParams.append('country', params.country);

        const response = await apiFetch(`${API_URL}/rate-master/zones?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch zones');
        }

        return response.json();
    },

    async getZoneById(id: number): Promise<ZoneSingleResponse> {
        const response = await apiFetch(`${API_URL}/rate-master/zones/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch zone details');
        }

        return response.json();
    },

    async createZone(data: ZoneFormData): Promise<ZoneSingleResponse> {
        const response = await apiFetch(`${API_URL}/rate-master/zones`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create zone');
        }

        return response.json();
    },

    async updateZone(id: number, data: Partial<ZoneFormData>): Promise<ZoneSingleResponse> {
        const response = await apiFetch(`${API_URL}/rate-master/zones/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update zone');
        }

        return response.json();
    },

    async deleteZone(id: number): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${API_URL}/rate-master/zones/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete zone');
        }

        return response.json();
    },
};
