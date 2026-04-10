import { apiFetch } from '@/lib/api-fetch';
import { ServiceCenterListResponse, ServiceCenterSingleResponse, ServiceCenterFormData } from '@/types/masters/service-center';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const serviceCenterService = {
    async getServiceCenters(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<ServiceCenterListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'code');
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc');

        const response = await apiFetch(`${API_URL}/service-center-master?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch service centers');
        }

        return response.json();
    },

    async getServiceCenterById(id: number): Promise<ServiceCenterSingleResponse> {
        const response = await apiFetch(`${API_URL}/service-center-master/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch service center');
        }

        return response.json();
    },

    async createServiceCenter(data: ServiceCenterFormData): Promise<ServiceCenterSingleResponse> {
        const response = await apiFetch(`${API_URL}/service-center-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create service center');
        }

        return response.json();
    },

    async updateServiceCenter(id: number, data: Partial<ServiceCenterFormData>): Promise<ServiceCenterSingleResponse> {
        const response = await apiFetch(`${API_URL}/service-center-master/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update service center');
        }

        return response.json();
    },

    async deleteServiceCenter(id: number): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${API_URL}/service-center-master/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete service center');
        }

        return response.json();
    },

    /** Bruno: `GET /service-center-master/export` — CSV; optional list-style query params. */
    async exportServiceCenters(params?: {
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{ blob: Blob; filename: string }> {
        const queryParams = new URLSearchParams();
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'code');
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc');

        const response = await apiFetch(`${API_URL}/service-center-master/export?${queryParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to export service centers');
        }

        const cd = response.headers.get('content-disposition');
        let filename = 'service-centers.csv';
        const match = cd?.match(/filename="?([^";\n]+)"?/i);
        if (match?.[1]) filename = match[1].trim();

        const blob = await response.blob();
        return { blob, filename };
    },
};
