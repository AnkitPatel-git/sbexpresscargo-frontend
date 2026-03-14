import { apiFetch } from '@/lib/api-fetch';
import { ServiceMapListResponse, ServiceMapSingleResponse, ServiceMapFormData } from '@/types/masters/service-map';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const serviceMapService = {
    async getServiceMaps(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<ServiceMapListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const response = await apiFetch(`${API_URL}/service-map-master?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch service maps');
        }

        return response.json();
    },

    async getServiceMapById(id: number): Promise<ServiceMapSingleResponse> {
        const response = await apiFetch(`${API_URL}/service-map-master/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch service map');
        }

        return response.json();
    },

    async createServiceMap(data: ServiceMapFormData): Promise<ServiceMapSingleResponse> {
        const response = await apiFetch(`${API_URL}/service-map-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create service map');
        }

        return response.json();
    },

    async updateServiceMap(id: number, data: Partial<ServiceMapFormData>): Promise<ServiceMapSingleResponse> {
        const response = await apiFetch(`${API_URL}/service-map-master/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update service map');
        }

        return response.json();
    },

    async deleteServiceMap(id: number): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${API_URL}/service-map-master/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete service map');
        }

        return response.json();
    },
};
