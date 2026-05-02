import { apiFetch } from '@/lib/api-fetch';
import type {
    CustomerGroupFormData,
    CustomerGroupListResponse,
    CustomerGroupSingleResponse,
} from '@/types/masters/customer-group';

function normalizeApiBaseUrl(raw?: string) {
    const value = raw?.trim();
    if (!value) return '/api';
    if (/^https?:\/\//i.test(value)) return value.replace(/\/+$/, '');
    return `/${value.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

const API_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);

export const customerGroupService = {
    async getCustomerGroups(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        code?: string;
        name?: string;
        status?: string;
    }): Promise<CustomerGroupListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'code');
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc');
        if (params?.code) queryParams.append('code', params.code);
        if (params?.name) queryParams.append('name', params.name);
        if (params?.status) queryParams.append('status', params.status);

        const response = await apiFetch(`${API_URL}/customer-group-master?${queryParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch customer groups');
        }

        return response.json();
    },

    async getCustomerGroupById(id: number): Promise<CustomerGroupSingleResponse> {
        const response = await apiFetch(`${API_URL}/customer-group-master/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch customer group');
        }

        return response.json();
    },

    async createCustomerGroup(data: Omit<CustomerGroupFormData, 'version'>): Promise<CustomerGroupSingleResponse> {
        const response = await apiFetch(`${API_URL}/customer-group-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error((error as { message?: string }).message || 'Failed to create customer group');
        }

        return response.json();
    },

    async updateCustomerGroup(
        id: number,
        data: Omit<CustomerGroupFormData, 'version'> & { version: number },
    ): Promise<CustomerGroupSingleResponse> {
        const response = await apiFetch(`${API_URL}/customer-group-master/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error((error as { message?: string }).message || 'Failed to update customer group');
        }

        return response.json();
    },

    async deleteCustomerGroup(id: number): Promise<{ success: boolean; message?: string }> {
        const response = await apiFetch(`${API_URL}/customer-group-master/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error((error as { message?: string }).message || 'Failed to delete customer group');
        }

        return response.json();
    },
};
