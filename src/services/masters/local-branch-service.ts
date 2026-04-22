import { apiFetch } from '@/lib/api-fetch';
import { LocalBranchListResponse, LocalBranchSingleResponse, LocalBranchFormData } from '@/types/masters/local-branch';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const localBranchService = {
    async getLocalBranches(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        branchCode?: string;
        companyName?: string;
        name?: string;
        serviceCenterId?: number;
    }): Promise<LocalBranchListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'branchCode');
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc');
        if (params?.branchCode) queryParams.append('branchCode', params.branchCode);
        if (params?.companyName) queryParams.append('companyName', params.companyName);
        if (params?.name) queryParams.append('name', params.name);
        if (params?.serviceCenterId) queryParams.append('serviceCenterId', params.serviceCenterId.toString());

        const response = await apiFetch(`${API_URL}/local-branch-master?${queryParams.toString()}`, {
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
        const response = await apiFetch(`${API_URL}/local-branch-master/${id}`, {
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
        const response = await apiFetch(`${API_URL}/local-branch-master`, {
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
        const response = await apiFetch(`${API_URL}/local-branch-master/${id}`, {
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
        const response = await apiFetch(`${API_URL}/local-branch-master/${id}`, {
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

    /** Bruno: `GET /local-branch-master/export` — CSV; optional list-style query params. */
    async exportLocalBranches(params?: {
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        branchCode?: string;
        companyName?: string;
        name?: string;
        serviceCenterId?: number;
    }): Promise<{ blob: Blob; filename: string }> {
        const queryParams = new URLSearchParams();
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'branchCode');
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc');
        if (params?.branchCode) queryParams.append('branchCode', params.branchCode);
        if (params?.companyName) queryParams.append('companyName', params.companyName);
        if (params?.name) queryParams.append('name', params.name);
        if (params?.serviceCenterId) queryParams.append('serviceCenterId', params.serviceCenterId.toString());

        const response = await apiFetch(`${API_URL}/local-branch-master/export?${queryParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to export local branches');
        }

        const cd = response.headers.get('content-disposition');
        let filename = 'local-branches.csv';
        const match = cd?.match(/filename="?([^";\n]+)"?/i);
        if (match?.[1]) filename = match[1].trim();

        const blob = await response.blob();
        return { blob, filename };
    },
};
