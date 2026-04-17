import { apiFetch } from '@/lib/api-fetch';
import { VendorFormData, VendorListResponse, VendorSingleResponse } from '@/types/masters/vendor';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const vendorService = {
    async getVendors(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        vendorCode?: string;
        vendorName?: string;
        address?: string;
        telephone?: string;
    }): Promise<VendorListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'vendorCode');
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc');
        if (params?.vendorCode) queryParams.append('vendorCode', params.vendorCode);
        if (params?.vendorName) queryParams.append('vendorName', params.vendorName);
        if (params?.address) queryParams.append('address', params.address);
        if (params?.telephone) queryParams.append('telephone', params.telephone);

        const response = await apiFetch(`${API_URL}/vendor-master?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch vendors');
        }

        return response.json();
    },

    async getVendorById(id: number): Promise<VendorSingleResponse> {
        const response = await apiFetch(`${API_URL}/vendor-master/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch vendor');
        }

        return response.json();
    },

    async createVendor(data: VendorFormData): Promise<VendorSingleResponse> {
        const response = await apiFetch(`${API_URL}/vendor-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create vendor');
        }

        return response.json();
    },

    async updateVendor(id: number, data: Partial<VendorFormData>): Promise<VendorSingleResponse> {
        const response = await apiFetch(`${API_URL}/vendor-master/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update vendor');
        }

        return response.json();
    },

    async exportVendors(params?: {
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        vendorCode?: string;
        vendorName?: string;
        address?: string;
        telephone?: string;
    }): Promise<{ blob: Blob; filename: string }> {
        const queryParams = new URLSearchParams();
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'vendorCode');
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc');
        if (params?.vendorCode) queryParams.append('vendorCode', params.vendorCode);
        if (params?.vendorName) queryParams.append('vendorName', params.vendorName);
        if (params?.address) queryParams.append('address', params.address);
        if (params?.telephone) queryParams.append('telephone', params.telephone);

        const response = await apiFetch(`${API_URL}/vendor-master/export?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to export vendors');
        }

        const cd = response.headers.get('content-disposition');
        let filename = 'vendors.csv';
        const match = cd?.match(/filename="?([^";\n]+)"?/i);
        if (match?.[1]) filename = match[1].trim();

        return { blob: await response.blob(), filename };
    },

    async deleteVendor(id: number): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${API_URL}/vendor-master/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete vendor');
        }

        return response.json();
    },
};
