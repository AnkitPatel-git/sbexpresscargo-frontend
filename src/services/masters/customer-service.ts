import { apiFetch } from '@/lib/api-fetch';
import {
    CustomerListResponse,
    CustomerSingleResponse,
    CustomerFormData,
    CustomerChildListResponse,
    CustomerChildSingleResponse,
    CustomerFuelSurcharge,
    CustomerFuelSurchargeFormData,
    CustomerVolumetric,
    CustomerVolumetricFormData,
    CustomerKycDocument,
    CustomerKycDocumentFormData,
} from '@/types/masters/customer';

function normalizeApiBaseUrl(raw?: string) {
    const value = raw?.trim();
    if (!value) return '/api';
    if (/^https?:\/\//i.test(value)) return value.replace(/\/+$/, '');
    return `/${value.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

async function getErrorMessage(response: Response, fallback: string) {
    const contentType = response.headers.get('content-type') || '';
    try {
        if (contentType.includes('application/json')) {
            const error = await response.json();
            return error?.message || fallback;
        }
        const text = await response.text();
        if (text.includes('<!DOCTYPE html>')) {
            return `${fallback} (received HTML ${response.status}; check NEXT_PUBLIC_API_URL and API route path)`;
        }
        return text.trim() || fallback;
    } catch {
        return fallback;
    }
}

const API_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);

export const customerService = {
    async getCustomers(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        code?: string;
        name?: string;
        mobile?: string;
        serviceCenterId?: number;
        customerGroupId?: number;
        status?: string;
    }): Promise<CustomerListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'code');
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc');
        if (params?.code) queryParams.append('code', params.code);
        if (params?.name) queryParams.append('name', params.name);
        if (params?.mobile) queryParams.append('mobile', params.mobile);
        if (params?.serviceCenterId) queryParams.append('serviceCenterId', String(params.serviceCenterId));
        if (params?.customerGroupId != null) {
            queryParams.append('customerGroupId', String(params.customerGroupId));
        }
        if (params?.status) queryParams.append('status', params.status);

        const response = await apiFetch(`${API_URL}/customer-master?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch customers');
        }

        return response.json();
    },

    async getCustomerById(id: number): Promise<CustomerSingleResponse> {
        const response = await apiFetch(`${API_URL}/customer-master/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch customer');
        }

        return response.json();
    },

    async createCustomer(data: CustomerFormData): Promise<CustomerSingleResponse> {
        const response = await apiFetch(`${API_URL}/customer-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create customer');
        }

        return response.json();
    },

    async updateCustomer(id: number, data: Partial<CustomerFormData>): Promise<CustomerSingleResponse> {
        const response = await apiFetch(`${API_URL}/customer-master/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(response, 'Failed to update customer'));
        }

        return response.json();
    },

    async deleteCustomer(id: number): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${API_URL}/customer-master/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete customer');
        }

        return response.json();
    },

    async getKycCustomers(params?: { page?: number; limit?: number; search?: string }) {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        queryParams.append('search', params?.search ?? '');
        const response = await apiFetch(`${API_URL}/customer-master/kyc/customers?${queryParams.toString()}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
        });
        if (!response.ok) throw new Error('Failed to fetch KYC customers');
        return response.json();
    },

    async getCustomerKycDocuments(customerId: number) {
        const response = await apiFetch(`${API_URL}/customer-master/${customerId}/kyc-documents`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
        });
        if (!response.ok) throw new Error('Failed to fetch KYC documents');
        return response.json() as Promise<CustomerChildListResponse<CustomerKycDocument>>;
    },

    async addCustomerKycDocument(
        customerId: number,
        body: CustomerKycDocumentFormData,
        file?: File | null,
    ) {
        const fd = new FormData();
        fd.append('docType', body.docType);
        if (body.fileName?.trim()) {
            fd.append('fileName', body.fileName.trim());
        }
        if (body.documentNumber?.trim()) {
            fd.append('documentNumber', body.documentNumber.trim());
        }
        if (body.expiryDate?.trim()) {
            fd.append('expiryDate', body.expiryDate.trim());
        }
        if (body.verified !== undefined) {
            fd.append('verified', body.verified ? 'true' : 'false');
        }
        if (file) {
            fd.append('file', file);
        }
        const response = await apiFetch(`${API_URL}/customer-master/${customerId}/kyc-documents`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: fd,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to add KYC document');
        }
        return response.json() as Promise<CustomerChildSingleResponse<CustomerKycDocument>>;
    },

    async updateCustomerKycDocument(
        customerId: number,
        docId: number | string,
        body: Partial<CustomerKycDocumentFormData>,
        file?: File | null,
    ) {
        const fd = new FormData();
        if (body.docType) {
            fd.append('docType', body.docType);
        }
        if (body.fileName !== undefined) {
            fd.append('fileName', body.fileName?.trim() ?? '');
        }
        if (body.documentNumber !== undefined) {
            fd.append('documentNumber', body.documentNumber?.trim() ?? '');
        }
        if (body.expiryDate !== undefined) {
            fd.append('expiryDate', body.expiryDate?.trim() ?? '');
        }
        if (body.verified !== undefined) {
            fd.append('verified', body.verified ? 'true' : 'false');
        }
        if (file) {
            fd.append('file', file);
        }
        const response = await apiFetch(`${API_URL}/customer-master/${customerId}/kyc-documents/${docId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: fd,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update KYC document');
        }
        return response.json() as Promise<CustomerChildSingleResponse<CustomerKycDocument>>;
    },

    async deleteCustomerKycDocument(customerId: number, docId: number | string) {
        const response = await apiFetch(`${API_URL}/customer-master/${customerId}/kyc-documents/${docId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete KYC document');
        }
        return response.json();
    },

    async getCustomerFuelSurcharges(customerId: number) {
        const response = await apiFetch(`${API_URL}/customer-master/${customerId}/fuel-surcharges`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
        });
        if (!response.ok) throw new Error('Failed to fetch fuel surcharges');
        return response.json() as Promise<CustomerChildListResponse<CustomerFuelSurcharge>>;
    },

    async addCustomerFuelSurcharge(customerId: number, body: CustomerFuelSurchargeFormData) {
        const response = await apiFetch(`${API_URL}/customer-master/${customerId}/fuel-surcharges`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to add fuel surcharge');
        }
        return response.json() as Promise<CustomerChildSingleResponse<CustomerFuelSurcharge | CustomerFuelSurcharge[]>>;
    },

    async updateCustomerFuelSurcharge(customerId: number, surchargeId: number | string, body: CustomerFuelSurchargeFormData) {
        const response = await apiFetch(`${API_URL}/customer-master/${customerId}/fuel-surcharges/${surchargeId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            throw new Error(await getErrorMessage(response, 'Failed to update fuel surcharge'));
        }
        return response.json() as Promise<CustomerChildSingleResponse<CustomerFuelSurcharge>>;
    },

    async deleteCustomerFuelSurcharge(customerId: number, surchargeId: number | string) {
        const response = await apiFetch(`${API_URL}/customer-master/${customerId}/fuel-surcharges/${surchargeId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete fuel surcharge');
        }
        return response.json();
    },

    async getCustomerVolumetrics(customerId: number) {
        const response = await apiFetch(`${API_URL}/customer-master/${customerId}/volumetrics`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
        });
        if (!response.ok) throw new Error('Failed to fetch volumetrics');
        return response.json() as Promise<CustomerChildListResponse<CustomerVolumetric>>;
    },

    async addCustomerVolumetric(customerId: number, body: CustomerVolumetricFormData) {
        const response = await apiFetch(`${API_URL}/customer-master/${customerId}/volumetrics`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to add volumetric');
        }
        return response.json() as Promise<CustomerChildSingleResponse<CustomerVolumetric>>;
    },

    async updateCustomerVolumetric(customerId: number, volumetricId: number | string, body: CustomerVolumetricFormData) {
        const response = await apiFetch(`${API_URL}/customer-master/${customerId}/volumetrics/${volumetricId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            throw new Error(await getErrorMessage(response, 'Failed to update volumetric'));
        }
        return response.json() as Promise<CustomerChildSingleResponse<CustomerVolumetric>>;
    },

    async deleteCustomerVolumetric(customerId: number, volumetricId: number | string) {
        const response = await apiFetch(`${API_URL}/customer-master/${customerId}/volumetrics/${volumetricId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete volumetric');
        }
        return response.json();
    },

    /** Bruno: `GET /customer-master/export` — CSV; optional list-style query params. */
    async exportCustomers(params?: {
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        code?: string;
        name?: string;
        mobile?: string;
        serviceCenterId?: number;
        status?: string;
    }): Promise<{ blob: Blob; filename: string }> {
        const queryParams = new URLSearchParams();
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'code');
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc');
        if (params?.code) queryParams.append('code', params.code);
        if (params?.name) queryParams.append('name', params.name);
        if (params?.mobile) queryParams.append('mobile', params.mobile);
        if (params?.serviceCenterId) queryParams.append('serviceCenterId', String(params.serviceCenterId));
        if (params?.status) queryParams.append('status', params.status);

        const response = await apiFetch(`${API_URL}/customer-master/export?${queryParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to export customers');
        }

        const cd = response.headers.get('content-disposition');
        let filename = 'customers.csv';
        const match = cd?.match(/filename="?([^";\n]+)"?/i);
        if (match?.[1]) filename = match[1].trim();

        const blob = await response.blob();
        return { blob, filename };
    },
};
