import { apiFetch } from '@/lib/api-fetch';
import { CustomerListResponse, CustomerSingleResponse, CustomerFormData } from '@/types/masters/customer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const customerService = {
    async getCustomers(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<CustomerListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

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
            const error = await response.json();
            throw new Error(error.message || 'Failed to update customer');
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
        if (params?.search) queryParams.append('search', params.search);
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
        return response.json();
    },

    async addCustomerKycDocument(
        customerId: number,
        body: {
            docType: string;
            documentNumber?: string;
            fileUrl?: string;
            expiryDate?: string;
            verified?: boolean;
        },
    ) {
        const response = await apiFetch(`${API_URL}/customer-master/${customerId}/kyc-documents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to add KYC document');
        }
        return response.json();
    },

    async updateCustomerKycDocument(
        customerId: number,
        docId: number | string,
        body: Partial<{ docType: string; documentNumber: string; fileUrl: string; expiryDate: string; verified: boolean }>,
    ) {
        const response = await apiFetch(`${API_URL}/customer-master/${customerId}/kyc-documents/${docId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update KYC document');
        }
        return response.json();
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
};
