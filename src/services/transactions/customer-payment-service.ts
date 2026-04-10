import { apiFetch } from '@/lib/api-fetch';
import { CustomerPaymentListResponse, CustomerPaymentSingleResponse, CustomerPaymentFormValues } from '@/types/transactions/customer-payment';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const getAuthHeaders = (isFormData = false) => {
    const headers: Record<string, string> = {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    };
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};

class CustomerPaymentService {
    private readonly baseUrl = `${API_URL}/transaction/customer-payment`;

    async getCustomerPayments(page: number, limit: number, search: string = ''): Promise<CustomerPaymentListResponse> {
        // Bruno: GET .../customer-payment?page=1&limit=20
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });
        if (search) {
            queryParams.append('search', search);
        }

        const response = await apiFetch(`${this.baseUrl}?${queryParams.toString()}`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error('Failed to fetch customer payments');
        }
        return response.json();
    }

    async getCustomerPaymentById(id: number): Promise<CustomerPaymentSingleResponse> {
        const response = await apiFetch(`${this.baseUrl}/${id}`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error('Failed to fetch customer payment');
        }
        return response.json();
    }

    async createCustomerPayment(data: CustomerPaymentFormValues, file?: File): Promise<CustomerPaymentSingleResponse> {
        const formData = new FormData();
        formData.append('date', data.date);
        formData.append('paidDate', data.paidDate);
        formData.append('amount', data.amount);
        formData.append('customerId', data.customerId.toString());
        formData.append('invoiceNo', data.invoiceNo);
        if (data.remark) formData.append('remark', data.remark);
        if (data.approved !== undefined) formData.append('approved', data.approved.toString());
        if (file) formData.append('file', file);

        const response = await apiFetch(this.baseUrl, {
            method: 'POST',
            headers: getAuthHeaders(true),
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to create customer payment');
        }
        return response.json();
    }

    async updateCustomerPayment(id: number, data: CustomerPaymentFormValues, file?: File): Promise<CustomerPaymentSingleResponse> {
        const formData = new FormData();
        formData.append('date', data.date);
        formData.append('paidDate', data.paidDate);
        formData.append('amount', data.amount);
        formData.append('customerId', data.customerId.toString());
        formData.append('invoiceNo', data.invoiceNo);
        if (data.remark) formData.append('remark', data.remark);
        if (data.approved !== undefined) formData.append('approved', data.approved.toString());
        if (file) formData.append('file', file);

        const response = await apiFetch(`${this.baseUrl}/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(true),
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to update customer payment');
        }
        return response.json();
    }

    async deleteCustomerPayment(id: number): Promise<void> {
        const response = await apiFetch(`${this.baseUrl}/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(true),
        });
        if (!response.ok) {
            throw new Error('Failed to delete customer payment');
        }
    }

    async getCustomerPaymentFile(id: number): Promise<Blob> {
        const response = await apiFetch(`${this.baseUrl}/${id}/file`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error('Failed to fetch payment file');
        }
        return response.blob();
    }
}

export const customerPaymentService = new CustomerPaymentService();
