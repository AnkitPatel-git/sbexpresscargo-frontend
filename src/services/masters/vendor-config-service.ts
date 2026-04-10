import { apiFetch } from '@/lib/api-fetch';
import { VendorConfigListResponse, VendorConfigSingleResponse, VendorConfigFormData } from '@/types/masters/vendor-config';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const vendorConfigService = {
    async getVendorConfigs(params?: {
        page?: number;
        limit?: number;
        vendorId?: number;
        search?: string;
    }): Promise<VendorConfigListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.vendorId) queryParams.append('vendorId', params.vendorId.toString());
        if (params?.search) queryParams.append('search', params.search);

        const response = await apiFetch(`${API_URL}/vendor-config-master?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch vendor configs');
        }

        return response.json();
    },

    async getVendorConfigById(id: number): Promise<VendorConfigSingleResponse> {
        const response = await apiFetch(`${API_URL}/vendor-config-master/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch vendor config');
        }

        return response.json();
    },

    async createVendorConfig(data: VendorConfigFormData): Promise<VendorConfigSingleResponse> {
        const response = await apiFetch(`${API_URL}/vendor-config-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create vendor config');
        }

        return response.json();
    },

    async updateVendorConfig(id: number, data: Partial<VendorConfigFormData>): Promise<VendorConfigSingleResponse> {
        const response = await apiFetch(`${API_URL}/vendor-config-master/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update vendor config');
        }

        return response.json();
    },

    async deleteVendorConfig(id: number): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${API_URL}/vendor-config-master/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete vendor config');
        }

        return response.json();
    },
};
