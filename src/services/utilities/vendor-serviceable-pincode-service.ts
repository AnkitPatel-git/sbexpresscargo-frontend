import { API_BASE_URL, bearerHeaders } from '@/lib/api-base';
import { apiFetch } from '@/lib/api-fetch';
import {
    VendorServiceablePincodeFormData,
    VendorServiceablePincodeListResponse,
    VendorServiceablePincodeSingleResponse,
} from '@/types/utilities/vendor-serviceable-pincode';

async function readErrorMessage(response: Response, fallback: string) {
    try {
        const errorData = await response.json();
        return errorData.message || fallback;
    } catch {
        return fallback;
    }
}

export const vendorServiceablePincodeService = {
    async getVendorServiceablePincodes(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        vendorId?: number;
        vendorCode?: string;
        pinCode?: string;
        zoneId?: number;
    }): Promise<VendorServiceablePincodeListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page !== undefined) queryParams.append('page', params.page.toString());
        if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'id');
        queryParams.append('sortOrder', params?.sortOrder ?? 'desc');
        if (params?.vendorId !== undefined) queryParams.append('vendorId', params.vendorId.toString());
        if (params?.vendorCode) queryParams.append('vendorCode', params.vendorCode);
        if (params?.pinCode) queryParams.append('pinCode', params.pinCode);
        if (params?.zoneId !== undefined) queryParams.append('zoneId', params.zoneId.toString());

        const response = await apiFetch(
            `${API_BASE_URL}/utilities/vendor-serviceable-pincodes?${queryParams.toString()}`,
            { headers: bearerHeaders(false) },
        );

        if (!response.ok) {
            throw new Error(await readErrorMessage(response, 'Failed to fetch vendor serviceable pincodes'));
        }

        return response.json();
    },

    async getVendorServiceablePincodeById(id: number): Promise<VendorServiceablePincodeSingleResponse> {
        const response = await apiFetch(`${API_BASE_URL}/utilities/vendor-serviceable-pincodes/${id}`, {
            headers: bearerHeaders(false),
        });

        if (!response.ok) {
            throw new Error(await readErrorMessage(response, 'Failed to fetch vendor serviceable pincode details'));
        }

        return response.json();
    },

    async createVendorServiceablePincode(
        data: VendorServiceablePincodeFormData,
    ): Promise<VendorServiceablePincodeSingleResponse> {
        const response = await apiFetch(`${API_BASE_URL}/utilities/vendor-serviceable-pincodes`, {
            method: 'POST',
            headers: bearerHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(await readErrorMessage(response, 'Failed to create vendor serviceable pincode'));
        }

        return response.json();
    },

    async updateVendorServiceablePincode(
        id: number,
        data: VendorServiceablePincodeFormData,
    ): Promise<VendorServiceablePincodeSingleResponse> {
        const response = await apiFetch(`${API_BASE_URL}/utilities/vendor-serviceable-pincodes/${id}`, {
            method: 'PUT',
            headers: bearerHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(await readErrorMessage(response, 'Failed to update vendor serviceable pincode'));
        }

        return response.json();
    },

    async deleteVendorServiceablePincode(id: number): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${API_BASE_URL}/utilities/vendor-serviceable-pincodes/${id}`, {
            method: 'DELETE',
            headers: bearerHeaders(false),
        });

        if (!response.ok) {
            throw new Error(await readErrorMessage(response, 'Failed to delete vendor serviceable pincode'));
        }

        return response.json();
    },

    async exportVendorServiceablePincodes(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        vendorId?: number;
        vendorCode?: string;
        pinCode?: string;
        zoneId?: number;
    }): Promise<{ blob: Blob; filename: string }> {
        const queryParams = new URLSearchParams();
        if (params?.page !== undefined) queryParams.append('page', params.page.toString());
        if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'id');
        queryParams.append('sortOrder', params?.sortOrder ?? 'desc');
        if (params?.vendorId !== undefined) queryParams.append('vendorId', params.vendorId.toString());
        if (params?.vendorCode) queryParams.append('vendorCode', params.vendorCode);
        if (params?.pinCode) queryParams.append('pinCode', params.pinCode);
        if (params?.zoneId !== undefined) queryParams.append('zoneId', params.zoneId.toString());

        const response = await apiFetch(
            `${API_BASE_URL}/utilities/vendor-serviceable-pincodes/export?${queryParams.toString()}`,
            { headers: bearerHeaders(false) },
        );

        if (!response.ok) {
            throw new Error(await readErrorMessage(response, 'Failed to export vendor serviceable pincodes'));
        }

        const cd = response.headers.get('content-disposition');
        let filename = 'vendor-serviceable-pincodes.csv';
        const match = cd?.match(/filename="?([^";\n]+)"?/i);
        if (match?.[1]) filename = match[1].trim();

        const blob = await response.blob();
        return { blob, filename };
    },

    async downloadImportTemplate(): Promise<{ blob: Blob; filename: string }> {
        const response = await apiFetch(
            `${API_BASE_URL}/utilities/vendor-serviceable-pincodes/import/template`,
            { headers: bearerHeaders(false) },
        );
        if (!response.ok) {
            throw new Error(await readErrorMessage(response, 'Failed to download import template'));
        }
        const cd = response.headers.get('content-disposition');
        let filename = 'vendor-serviceable-pincodes-import-template.xlsx';
        const match = cd?.match(/filename="?([^";\n]+)"?/i);
        if (match?.[1]) filename = match[1].trim();
        const blob = await response.blob();
        return { blob, filename };
    },

    async importVendorServiceablePincodesFromExcel(file: File): Promise<{
        created: number;
        updated: number;
        failed: number;
        failures: Array<{ row: number; message: string }>;
        successes: Array<{ row: number; pinCode: string; vendorCode?: string; action?: 'created' | 'updated' }>;
        bulkUploadLogId?: number;
    }> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiFetch(`${API_BASE_URL}/utilities/vendor-serviceable-pincodes/import`, {
            method: 'POST',
            headers: bearerHeaders(false),
            body: formData,
        });
        const json = (await response.json().catch(() => ({}))) as {
            success?: boolean;
            data?: {
                created: number;
                updated: number;
                failed: number;
                failures: Array<{ row: number; message: string }>;
                successes: Array<{ row: number; pinCode: string; vendorCode?: string; action?: 'created' | 'updated' }>;
                bulkUploadLogId?: number;
            };
            message?: string;
        };
        if (!response.ok) {
            throw new Error(json.message || (await readErrorMessage(response, 'Import failed')));
        }
        if (!json.success || json.data == null) {
            throw new Error('Invalid import response');
        }
        return {
            ...json.data,
            updated: json.data.updated ?? 0,
        };
    },
};
