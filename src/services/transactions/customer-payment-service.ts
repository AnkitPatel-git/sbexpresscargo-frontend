import { apiFetch } from '@/lib/api-fetch';
import { CustomerPaymentListResponse, CustomerPaymentSingleResponse, CustomerPaymentFormValues } from '@/types/transactions/customer-payment';

class CustomerPaymentService {
    private readonly baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/transaction/customer-payment`;

    async getCustomerPayments(page: number, limit: number, search: string = ''): Promise<CustomerPaymentListResponse> {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            sortBy: 'date',
            sortOrder: 'desc',
        });

        if (search) {
            queryParams.append('search', search);
        }

        const response = await apiFetch(`${this.baseUrl}?${queryParams.toString()}`);
        if (!response.ok) {
            throw new Error('Failed to fetch customer payments');
        }
        return response.json();
    }

    async getCustomerPaymentById(id: number): Promise<CustomerPaymentSingleResponse> {
        const response = await apiFetch(`${this.baseUrl}/${id}`);
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
        if (data.remark) formData.append('remark', data.remark);
        if (data.approved !== undefined) formData.append('approved', data.approved.toString());
        if (file) formData.append('file', file);

        const response = await apiFetch(this.baseUrl, {
            method: 'POST',
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
        if (data.remark) formData.append('remark', data.remark);
        if (data.approved !== undefined) formData.append('approved', data.approved.toString());
        if (file) formData.append('file', file);

        const response = await apiFetch(`${this.baseUrl}/${id}`, {
            method: 'PUT',
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
        });
        if (!response.ok) {
            throw new Error('Failed to delete customer payment');
        }
    }
}

export const customerPaymentService = new CustomerPaymentService();
