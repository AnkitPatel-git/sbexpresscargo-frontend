import { API_BASE_URL, bearerHeaders } from '@/lib/api-base';
import { apiFetch } from '@/lib/api-fetch';
import { ServiceablePincodeFormData, ServiceablePincodeListResponse, ServiceablePincodeSingleResponse } from '@/types/utilities/serviceable-pincode';

async function readErrorMessage(response: Response, fallback: string) {
    try {
        const errorData = await response.json();
        return errorData.message || fallback;
    } catch {
        return fallback;
    }
}

export const serviceablePincodeService = {
    async getServiceablePincodes(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        countryId?: number;
        countryCode?: string;
        stateId?: number;
        pinCode?: string;
        cityName?: string;
        areaName?: string;
    }): Promise<ServiceablePincodeListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page !== undefined) queryParams.append('page', params.page.toString());
        if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'pinCode');
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc');
        if (params?.countryId !== undefined) queryParams.append('countryId', params.countryId.toString());
        if (params?.countryCode) queryParams.append('countryCode', params.countryCode);
        if (params?.stateId !== undefined) queryParams.append('stateId', params.stateId.toString());
        if (params?.pinCode) queryParams.append('pinCode', params.pinCode);
        if (params?.cityName) queryParams.append('cityName', params.cityName);
        if (params?.areaName) queryParams.append('areaName', params.areaName);

        const response = await apiFetch(`${API_BASE_URL}/utilities/serviceable-pincodes?${queryParams.toString()}`, {
            headers: bearerHeaders(false),
        });

        if (!response.ok) {
            throw new Error(await readErrorMessage(response, 'Failed to fetch serviceable pincodes'));
        }

        return response.json();
    },

    async getServiceablePincodeById(id: number): Promise<ServiceablePincodeSingleResponse> {
        const response = await apiFetch(`${API_BASE_URL}/utilities/serviceable-pincodes/${id}`, {
            headers: bearerHeaders(false),
        });

        if (!response.ok) {
            throw new Error(await readErrorMessage(response, 'Failed to fetch serviceable pincode details'));
        }

        return response.json();
    },

    async createServiceablePincode(data: ServiceablePincodeFormData): Promise<ServiceablePincodeSingleResponse> {
        const response = await apiFetch(`${API_BASE_URL}/utilities/serviceable-pincodes`, {
            method: 'POST',
            headers: bearerHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(await readErrorMessage(response, 'Failed to create serviceable pincode'));
        }

        return response.json();
    },

    async updateServiceablePincode(id: number, data: ServiceablePincodeFormData): Promise<ServiceablePincodeSingleResponse> {
        const response = await apiFetch(`${API_BASE_URL}/utilities/serviceable-pincodes/${id}`, {
            method: 'PUT',
            headers: bearerHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(await readErrorMessage(response, 'Failed to update serviceable pincode'));
        }

        return response.json();
    },

    async deleteServiceablePincode(id: number): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${API_BASE_URL}/utilities/serviceable-pincodes/${id}`, {
            method: 'DELETE',
            headers: bearerHeaders(false),
        });

        if (!response.ok) {
            throw new Error(await readErrorMessage(response, 'Failed to delete serviceable pincode'));
        }

        return response.json();
    },

    async exportServiceablePincodes(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        countryId?: number;
        countryCode?: string;
        stateId?: number;
        pinCode?: string;
        cityName?: string;
        areaName?: string;
    }): Promise<{ blob: Blob; filename: string }> {
        const queryParams = new URLSearchParams();
        if (params?.page !== undefined) queryParams.append('page', params.page.toString());
        if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'pinCode');
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc');
        if (params?.countryId !== undefined) queryParams.append('countryId', params.countryId.toString());
        if (params?.countryCode) queryParams.append('countryCode', params.countryCode);
        if (params?.stateId !== undefined) queryParams.append('stateId', params.stateId.toString());
        if (params?.pinCode) queryParams.append('pinCode', params.pinCode);
        if (params?.cityName) queryParams.append('cityName', params.cityName);
        if (params?.areaName) queryParams.append('areaName', params.areaName);

        const response = await apiFetch(`${API_BASE_URL}/utilities/serviceable-pincodes/export?${queryParams.toString()}`, {
            headers: bearerHeaders(false),
        });

        if (!response.ok) {
            throw new Error(await readErrorMessage(response, 'Failed to export serviceable pincodes'));
        }

        const cd = response.headers.get('content-disposition');
        let filename = 'serviceable-pincodes.csv';
        const match = cd?.match(/filename="?([^";\n]+)"?/i);
        if (match?.[1]) filename = match[1].trim();

        const blob = await response.blob();
        return { blob, filename };
    },
};
