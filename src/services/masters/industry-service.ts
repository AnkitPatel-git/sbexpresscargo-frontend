import { IndustryListResponse, IndustrySingleResponse, IndustryFormData } from '@/types/masters/industry';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const industryService = {
    async getIndustries(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<IndustryListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const response = await fetch(`${API_URL}/industry-master?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch industries');
        }

        return response.json();
    },

    async getIndustryById(id: number): Promise<IndustrySingleResponse> {
        const response = await fetch(`${API_URL}/industry-master/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch industry');
        }

        return response.json();
    },

    async createIndustry(data: IndustryFormData): Promise<IndustrySingleResponse> {
        const response = await fetch(`${API_URL}/industry-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create industry');
        }

        return response.json();
    },

    async updateIndustry(id: number, data: Partial<IndustryFormData>): Promise<IndustrySingleResponse> {
        const response = await fetch(`${API_URL}/industry-master/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update industry');
        }

        return response.json();
    },

    async deleteIndustry(id: number): Promise<{ success: boolean; message: string }> {
        const response = await fetch(`${API_URL}/industry-master/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete industry');
        }

        return response.json();
    },
};
