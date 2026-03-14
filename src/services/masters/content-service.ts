import { apiFetch } from '@/lib/api-fetch';
import { ContentListResponse, ContentSingleResponse, ContentFormData } from '@/types/masters/content';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const contentService = {
    async getContents(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<ContentListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const response = await apiFetch(`${API_URL}/content-master?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch contents');
        }

        return response.json();
    },

    async getContentById(id: number): Promise<ContentSingleResponse> {
        const response = await apiFetch(`${API_URL}/content-master/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch content');
        }

        return response.json();
    },

    async createContent(data: ContentFormData): Promise<ContentSingleResponse> {
        const response = await apiFetch(`${API_URL}/content-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create content');
        }

        return response.json();
    },

    async updateContent(id: number, data: Partial<ContentFormData>): Promise<ContentSingleResponse> {
        const response = await apiFetch(`${API_URL}/content-master/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update content');
        }

        return response.json();
    },

    async deleteContent(id: number): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${API_URL}/content-master/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete content');
        }

        return response.json();
    },
};
