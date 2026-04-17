import { apiFetch } from '@/lib/api-fetch';
import {
    VendorConfigFormData,
    VendorConfigListResponse,
    VendorConfigSingleResponse,
} from '@/types/masters/vendor-config';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

type VendorConfigListParams = {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    vendorId?: number;
    customerId?: number;
    serviceMapId?: number;
    environment?: string;
    isActive?: boolean;
};

export const vendorConfigService = {
    async getVendorConfigs(params?: VendorConfigListParams): Promise<VendorConfigListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', String(params.page));
        if (params?.limit) queryParams.append('limit', String(params.limit));
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'updatedAt');
        queryParams.append('sortOrder', params?.sortOrder ?? 'desc');
        if (params?.vendorId != null) queryParams.append('vendorId', String(params.vendorId));
        if (params?.customerId != null) queryParams.append('customerId', String(params.customerId));
        if (params?.serviceMapId != null) queryParams.append('serviceMapId', String(params.serviceMapId));
        if (params?.environment) queryParams.append('environment', params.environment);
        if (params?.isActive != null) queryParams.append('isActive', String(params.isActive));

        const response = await apiFetch(`${API_URL}/vendor-config-master?${queryParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => null);
            throw new Error(error?.message || 'Failed to fetch vendor configs');
        }

        return response.json();
    },

    async getVendorConfigById(id: number): Promise<VendorConfigSingleResponse> {
        const response = await apiFetch(`${API_URL}/vendor-config-master/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => null);
            throw new Error(error?.message || 'Failed to fetch vendor config');
        }

        return response.json();
    },

    async createVendorConfig(data: VendorConfigFormData): Promise<VendorConfigSingleResponse> {
        const response = await apiFetch(`${API_URL}/vendor-config-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => null);
            throw new Error(error?.message || 'Failed to create vendor config');
        }

        return response.json();
    },

    async updateVendorConfig(id: number, data: VendorConfigFormData): Promise<VendorConfigSingleResponse> {
        const response = await apiFetch(`${API_URL}/vendor-config-master/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => null);
            throw new Error(error?.message || 'Failed to update vendor config');
        }

        return response.json();
    },

    async deleteVendorConfig(id: number): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${API_URL}/vendor-config-master/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => null);
            throw new Error(error?.message || 'Failed to delete vendor config');
        }

        return response.json();
    },
};
