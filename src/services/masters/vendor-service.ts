import { apiFetch } from '@/lib/api-fetch';
import { VendorListResponse, VendorSingleResponse, VendorFormData } from '@/types/masters/vendor';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const vendorService = {
    async getVendors(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<VendorListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const response = await apiFetch(`${API_URL}/vendor-master?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch vendors');
        }

        return response.json();
    },

    async getVendorById(id: number): Promise<VendorSingleResponse> {
        const response = await apiFetch(`${API_URL}/vendor-master/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch vendor');
        }

        return response.json();
    },

    async createVendor(data: VendorFormData): Promise<VendorSingleResponse> {
        const response = await apiFetch(`${API_URL}/vendor-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create vendor');
        }

        return response.json();
    },

    async updateVendor(id: number, data: Partial<VendorFormData>): Promise<VendorSingleResponse> {
        const response = await apiFetch(`${API_URL}/vendor-master/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update vendor');
        }

        return response.json();
    },

    async deleteVendor(id: number): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${API_URL}/vendor-master/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete vendor');
        }

        return response.json();
    },
};
