import { apiFetch } from '@/lib/api-fetch';
import { VehicleListResponse, VehicleSingleResponse, VehicleFormData, Vehicle, VehicleDecimalValue } from '@/types/masters/vehicle';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

function parseDecimalValue(value: unknown): number | null {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    if (value && typeof value === 'object' && 'd' in (value as VehicleDecimalValue)) {
        const decimal = value as VehicleDecimalValue;
        const digits = Array.isArray(decimal.d) ? decimal.d.join('') : '';
        const exponent = typeof decimal.e === 'number' ? decimal.e : 0;
        const sign = decimal.s === -1 ? -1 : 1;
        const parsed = Number(`${sign < 0 ? '-' : ''}${digits}e${exponent}`);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function mapVehicle(vehicle: Omit<Vehicle, 'capacityKg'> & { capacityKg: unknown }): Vehicle {
    return {
        ...vehicle,
        capacityKg: parseDecimalValue(vehicle.capacityKg),
    };
}

export const vehicleService = {
    async getVehicles(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        vehicleNo?: string;
        vehicleType?: string;
        status?: string;
        driverUserId?: number;
    }): Promise<VehicleListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'vehicleNo');
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc');
        if (params?.vehicleNo) queryParams.append('vehicleNo', params.vehicleNo);
        if (params?.vehicleType) queryParams.append('vehicleType', params.vehicleType);
        if (params?.status) queryParams.append('status', params.status);
        if (params?.driverUserId) queryParams.append('driverUserId', params.driverUserId.toString());

        const response = await apiFetch(`${API_URL}/vehicle-master?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch vehicles');
        }

        const result = await response.json() as VehicleListResponse;
        return {
            ...result,
            data: result.data.map((vehicle) => mapVehicle(vehicle as Vehicle & { capacityKg: unknown })),
        };
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

        const result = await response.json() as VehicleSingleResponse;
        return {
            ...result,
            data: mapVehicle(result.data as Vehicle & { capacityKg: unknown }),
        };
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
