import { apiFetch } from '@/lib/api-fetch';
import {
    PartnerAppFormData,
    PartnerAppListResponse,
    PartnerAppSingleResponse,
} from '@/types/masters/partner-app';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

type ListParams = {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: string;
};

function authHeaders(): HeadersInit {
    return {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    };
}

export const partnerAppService = {
    async getPartnerApps(params?: ListParams): Promise<PartnerAppListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', String(params.page));
        if (params?.limit) queryParams.append('limit', String(params.limit));
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'updatedAt');
        queryParams.append('sortOrder', params?.sortOrder ?? 'desc');
        if (params?.status) queryParams.append('status', params.status);

        const response = await apiFetch(`${API_URL}/partner-app-master?${queryParams.toString()}`, {
            headers: authHeaders(),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => null);
            throw new Error(error?.message || 'Failed to fetch partner apps');
        }
        return response.json();
    },

    async getPartnerAppById(id: number): Promise<PartnerAppSingleResponse> {
        const response = await apiFetch(`${API_URL}/partner-app-master/${id}`, {
            headers: authHeaders(),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => null);
            throw new Error(error?.message || 'Failed to fetch partner app');
        }
        return response.json();
    },

    async createPartnerApp(data: PartnerAppFormData): Promise<PartnerAppSingleResponse> {
        const response = await apiFetch(`${API_URL}/partner-app-master`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => null);
            throw new Error(error?.message || 'Failed to create partner app');
        }
        return response.json();
    },

    async updatePartnerApp(id: number, data: PartnerAppFormData): Promise<PartnerAppSingleResponse> {
        const response = await apiFetch(`${API_URL}/partner-app-master/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => null);
            throw new Error(error?.message || 'Failed to update partner app');
        }
        return response.json();
    },

    async deletePartnerApp(id: number): Promise<{ success: boolean }> {
        const response = await apiFetch(`${API_URL}/partner-app-master/${id}`, {
            method: 'DELETE',
            headers: authHeaders(),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => null);
            throw new Error(error?.message || 'Failed to delete partner app');
        }
        return response.json();
    },

    async rotateSecret(id: number): Promise<PartnerAppSingleResponse> {
        const response = await apiFetch(`${API_URL}/partner-app-master/${id}/rotate-secret`, {
            method: 'POST',
            headers: authHeaders(),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => null);
            throw new Error(error?.message || 'Failed to rotate secret');
        }
        return response.json();
    },

    async getApiLogs(id: number, params?: { page?: number; limit?: number; success?: boolean }) {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', String(params.page));
        if (params?.limit) queryParams.append('limit', String(params.limit));
        if (params?.success != null) queryParams.append('success', String(params.success));
        const response = await apiFetch(
            `${API_URL}/partner-app-master/${id}/api-logs?${queryParams.toString()}`,
            { headers: authHeaders() },
        );
        if (!response.ok) {
            const error = await response.json().catch(() => null);
            throw new Error(error?.message || 'Failed to fetch API logs');
        }
        return response.json() as Promise<{ success: boolean; data: import('@/types/masters/partner-app').PartnerApiLog[]; meta: PartnerAppListResponse['meta'] }>;
    },

    async getPushLogs(id: number, params?: { page?: number; limit?: number; success?: boolean }) {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', String(params.page));
        if (params?.limit) queryParams.append('limit', String(params.limit));
        if (params?.success != null) queryParams.append('success', String(params.success));
        const response = await apiFetch(
            `${API_URL}/partner-app-master/${id}/push-logs?${queryParams.toString()}`,
            { headers: authHeaders() },
        );
        if (!response.ok) {
            const error = await response.json().catch(() => null);
            throw new Error(error?.message || 'Failed to fetch push logs');
        }
        return response.json() as Promise<{ success: boolean; data: import('@/types/masters/partner-app').PartnerPushLog[]; meta: PartnerAppListResponse['meta'] }>;
    },

    async replaceStatusMappings(
        id: number,
        mappings: Array<{
            internalStatus: string;
            scan: string;
            scanCode: string;
            scanType: string;
        }>,
    ): Promise<PartnerAppSingleResponse> {
        const response = await apiFetch(`${API_URL}/partner-app-master/${id}/status-mappings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({ mappings }),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => null);
            throw new Error(error?.message || 'Failed to save status mappings');
        }
        return response.json();
    },
};
