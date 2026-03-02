import { LocalBranchListResponse, LocalBranchSingleResponse, LocalBranchFormData } from '@/types/masters/local-branch';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const localBranchService = {
    async getLocalBranches(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<LocalBranchListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const response = await fetch(`${API_URL}/local-branch-master?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch local branches');
        }

        return response.json();
    },

    async getLocalBranchById(id: number): Promise<LocalBranchSingleResponse> {
        const response = await fetch(`${API_URL}/local-branch-master/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch local branch');
        }

        return response.json();
    },

    async createLocalBranch(data: LocalBranchFormData): Promise<LocalBranchSingleResponse> {
        const response = await fetch(`${API_URL}/local-branch-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create local branch');
        }

        return response.json();
    },

    async updateLocalBranch(id: number, data: Partial<LocalBranchFormData>): Promise<LocalBranchSingleResponse> {
        const response = await fetch(`${API_URL}/local-branch-master/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update local branch');
        }

        return response.json();
    },

    async deleteLocalBranch(id: number): Promise<{ success: boolean; message: string }> {
        const response = await fetch(`${API_URL}/local-branch-master/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete local branch');
        }

        return response.json();
    },
};
