import { apiFetch } from '@/lib/api-fetch';
import { ServiceablePincodeFormData, ServiceablePincodeListResponse, ServiceablePincodeSingleResponse } from '@/types/utilities/serviceable-pincode';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const serviceablePincodeService = {
    async getServiceablePincodes(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<ServiceablePincodeListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'pinCode');
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc');

        const response = await apiFetch(`${API_URL}/utilities/serviceable-pincodes?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch serviceable pincodes');
        }

        return response.json();
    },

    async getServiceablePincodeById(id: number): Promise<ServiceablePincodeSingleResponse> {
        const response = await apiFetch(`${API_URL}/utilities/serviceable-pincodes/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch serviceable pincode details');
        }

        return response.json();
    },

    async createServiceablePincode(data: ServiceablePincodeFormData): Promise<ServiceablePincodeSingleResponse> {
        const response = await apiFetch(`${API_URL}/utilities/serviceable-pincodes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create serviceable pincode');
        }

        return response.json();
    },

    async updateServiceablePincode(id: number, data: Partial<ServiceablePincodeFormData>): Promise<ServiceablePincodeSingleResponse> {
        const response = await apiFetch(`${API_URL}/utilities/serviceable-pincodes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update serviceable pincode');
        }

        return response.json();
    },

    async deleteServiceablePincode(id: number): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${API_URL}/utilities/serviceable-pincodes/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete serviceable pincode');
        }

        return response.json();
    },

    /** Bruno: `GET /utilities/serviceable-pincodes/export` — CSV; optional list-style query params. */
    async exportServiceablePincodes(params?: {
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{ blob: Blob; filename: string }> {
        const queryParams = new URLSearchParams();
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'pinCode');
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc');

        const response = await apiFetch(`${API_URL}/utilities/serviceable-pincodes/export?${queryParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to export serviceable pincodes');
        }

        const cd = response.headers.get('content-disposition');
        let filename = 'serviceable-pincodes.csv';
        const match = cd?.match(/filename="?([^";\n]+)"?/i);
        if (match?.[1]) filename = match[1].trim();

        const blob = await response.blob();
        return { blob, filename };
    },
};
