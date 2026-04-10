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
        vendorId?: number;
    }): Promise<ServiceMapListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'vendor');
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc');
        if (params?.vendorId != null) queryParams.append('vendorId', String(params.vendorId));

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

    async getServiceMapsByVendor(vendorId: number): Promise<ServiceMapListResponse> {
        const response = await apiFetch(`${API_URL}/service-map-master/by-vendor/${vendorId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch service maps for vendor');
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

    /** Bruno: `GET /service-map-master/export` — CSV; optional list-style query params (e.g. `vendorId`). */
    async exportServiceMaps(params?: {
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        vendorId?: number;
    }): Promise<{ blob: Blob; filename: string }> {
        const queryParams = new URLSearchParams();
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'vendor');
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc');
        if (params?.vendorId != null) queryParams.append('vendorId', String(params.vendorId));

        const response = await apiFetch(`${API_URL}/service-map-master/export?${queryParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to export service maps');
        }

        const cd = response.headers.get('content-disposition');
        let filename = 'service-map.csv';
        const match = cd?.match(/filename="?([^";\n]+)"?/i);
        if (match?.[1]) filename = match[1].trim();

        const blob = await response.blob();
        return { blob, filename };
    },
};
