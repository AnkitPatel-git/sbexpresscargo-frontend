import { apiFetch } from '@/lib/api-fetch';
import { BankListResponse, BankSingleResponse, BankFormData } from '@/types/masters/bank';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const bankService = {
    async getBanks(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<BankListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'bankCode');
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc');

        const response = await apiFetch(`${API_URL}/bank-master?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch banks');
        }

        return response.json();
    },

    async getBankById(id: number): Promise<BankSingleResponse> {
        const response = await apiFetch(`${API_URL}/bank-master/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch bank');
        }

        return response.json();
    },

    async createBank(data: BankFormData): Promise<BankSingleResponse> {
        const response = await apiFetch(`${API_URL}/bank-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create bank');
        }

        return response.json();
    },

    async updateBank(id: number, data: Partial<BankFormData>): Promise<BankSingleResponse> {
        const response = await apiFetch(`${API_URL}/bank-master/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update bank');
        }

        return response.json();
    },

    async deleteBank(id: number): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${API_URL}/bank-master/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete bank');
        }

        return response.json();
    },

    /** Bruno: `GET /bank-master/export` — CSV download; optional list-style query params. */
    async exportBanks(params?: {
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{ blob: Blob; filename: string }> {
        const queryParams = new URLSearchParams();
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'bankCode');
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc');

        const response = await apiFetch(`${API_URL}/bank-master/export?${queryParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to export banks');
        }

        const cd = response.headers.get('content-disposition');
        let filename = 'banks.csv';
        const match = cd?.match(/filename="?([^";\n]+)"?/i);
        if (match?.[1]) filename = match[1].trim();

        const blob = await response.blob();
        return { blob, filename };
    },
};
