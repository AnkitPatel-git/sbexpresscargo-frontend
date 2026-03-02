import { ConsigneeListResponse, ConsigneeSingleResponse, ConsigneeFormData } from '@/types/masters/consignee';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const consigneeService = {
    async getConsignees(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<ConsigneeListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const response = await fetch(`${API_URL}/consignee-master?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch consignees');
        }

        return response.json();
    },

    async getConsigneeById(id: number): Promise<ConsigneeSingleResponse> {
        const response = await fetch(`${API_URL}/consignee-master/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch consignee');
        }

        return response.json();
    },

    async createConsignee(data: ConsigneeFormData): Promise<ConsigneeSingleResponse> {
        const response = await fetch(`${API_URL}/consignee-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create consignee');
        }

        return response.json();
    },

    async updateConsignee(id: number, data: Partial<ConsigneeFormData>): Promise<ConsigneeSingleResponse> {
        const response = await fetch(`${API_URL}/consignee-master/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update consignee');
        }

        return response.json();
    },

    async deleteConsignee(id: number): Promise<{ success: boolean; message: string }> {
        const response = await fetch(`${API_URL}/consignee-master/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete consignee');
        }

        return response.json();
    },
};
