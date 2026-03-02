import { CourierListResponse, CourierSingleResponse, CourierFormData } from '@/types/masters/courier';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const courierService = {
    async getCouriers(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<CourierListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const response = await fetch(`${API_URL}/courier-master?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch couriers');
        }

        return response.json();
    },

    async getCourierById(id: number): Promise<CourierSingleResponse> {
        const response = await fetch(`${API_URL}/courier-master/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch courier');
        }

        return response.json();
    },

    async createCourier(data: CourierFormData): Promise<CourierSingleResponse> {
        const response = await fetch(`${API_URL}/courier-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create courier');
        }

        return response.json();
    },

    async updateCourier(id: number, data: Partial<CourierFormData>): Promise<CourierSingleResponse> {
        const response = await fetch(`${API_URL}/courier-master/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update courier');
        }

        return response.json();
    },

    async deleteCourier(id: number): Promise<{ success: boolean; message: string }> {
        const response = await fetch(`${API_URL}/courier-master/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete courier');
        }

        return response.json();
    },
};
