import { apiFetch } from '@/lib/api-fetch';
import { ExceptionListResponse, ExceptionSingleResponse, ExceptionFormData } from '@/types/masters/exception';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const exceptionService = {
    async getExceptions(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<ExceptionListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'code');
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc');

        const response = await apiFetch(`${API_URL}/exception-master?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch exceptions');
        }

        return response.json();
    },

    async getExceptionById(id: number): Promise<ExceptionSingleResponse> {
        const response = await apiFetch(`${API_URL}/exception-master/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch exception');
        }

        return response.json();
    },

    async createException(data: ExceptionFormData): Promise<ExceptionSingleResponse> {
        const response = await apiFetch(`${API_URL}/exception-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create exception');
        }

        return response.json();
    },

    async updateException(id: number, data: Partial<ExceptionFormData>): Promise<ExceptionSingleResponse> {
        const response = await apiFetch(`${API_URL}/exception-master/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update exception');
        }

        return response.json();
    },

    async deleteException(id: number): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${API_URL}/exception-master/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete exception');
        }

        return response.json();
    },

    /** Bruno: `GET /exception-master/export` — CSV; optional list-style query params. */
    async exportExceptions(params?: {
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{ blob: Blob; filename: string }> {
        const queryParams = new URLSearchParams();
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'code');
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc');

        const response = await apiFetch(`${API_URL}/exception-master/export?${queryParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to export exceptions');
        }

        const cd = response.headers.get('content-disposition');
        let filename = 'exceptions.csv';
        const match = cd?.match(/filename="?([^";\n]+)"?/i);
        if (match?.[1]) filename = match[1].trim();

        const blob = await response.blob();
        return { blob, filename };
    },
};
