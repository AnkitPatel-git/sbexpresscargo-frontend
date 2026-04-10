import { apiFetch } from '@/lib/api-fetch';
import { VehicleListResponse, VehicleSingleResponse, VehicleFormData } from '@/types/masters/vehicle';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const vehicleService = {
    async getVehicles(params?: {
        page?: number;
        limit?: number;
        vehicleType?: string;
        status?: string;
    }): Promise<VehicleListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.vehicleType) queryParams.append('vehicleType', params.vehicleType);
        if (params?.status) queryParams.append('status', params.status);

        const response = await apiFetch(`${API_URL}/vehicle-master?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch vehicles');
        }

        return response.json();
    },

    async getVehicleById(id: number): Promise<VehicleSingleResponse> {
        const response = await apiFetch(`${API_URL}/vehicle-master/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch vehicle');
        }

        return response.json();
    },

    async createVehicle(data: VehicleFormData): Promise<VehicleSingleResponse> {
        const response = await apiFetch(`${API_URL}/vehicle-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create vehicle');
        }

        return response.json();
    },

    async updateVehicle(id: number, data: Partial<VehicleFormData>): Promise<VehicleSingleResponse> {
        const response = await apiFetch(`${API_URL}/vehicle-master/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update vehicle');
        }

        return response.json();
    },

    async deleteVehicle(id: number): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${API_URL}/vehicle-master/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete vehicle');
        }

        return response.json();
    },
};
