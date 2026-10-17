import { apiFetch } from '@/lib/api-fetch';
import { presentCustomerError } from '@/lib/customer-error-message';
import { OperationSummary, SalesSummary, ServiceCenterSalesSummary, TatSummary } from '@/types/dashboard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json'
});

async function throwDashboardError(response: Response, fallback: string): Promise<never> {
    let message = fallback;
    try {
        const body = (await response.json()) as { message?: unknown };
        if (typeof body.message === 'string' && body.message.trim()) {
            message = body.message;
        } else if (Array.isArray(body.message)) {
            message = body.message.map(String).join(', ');
        }
    } catch {
        // The status is still useful when the body is empty.
    }
    throw new Error(presentCustomerError(message, response.status));
}

class DashboardService {
    private readonly baseUrl = `${API_URL}/dashboard`;

    async getOperationSummary(params: { fromDate: string; toDate: string; serviceCenterId?: number; customerId?: number }): Promise<{ success: boolean; data: OperationSummary }> {
        const queryParams = new URLSearchParams({
            fromDate: params.fromDate,
            toDate: params.toDate,
        });
        if (params.serviceCenterId) {
            queryParams.append('serviceCenterId', params.serviceCenterId.toString());
        }
        if (params.customerId) {
            queryParams.append('customerId', params.customerId.toString());
        }

        const response = await apiFetch(`${this.baseUrl}/operation?${queryParams.toString()}`, { headers: getAuthHeaders() });
        if (!response.ok) {
            await throwDashboardError(response, 'Failed to fetch operation summary');
        }
        return response.json();
    }

    async getTatSummary(params: { fromDate: string; toDate: string; serviceCenterId?: number; customerId?: number }): Promise<{ success: boolean; data: TatSummary }> {
        const queryParams = new URLSearchParams({
            fromDate: params.fromDate,
            toDate: params.toDate,
        });
        if (params.serviceCenterId) {
            queryParams.append('serviceCenterId', params.serviceCenterId.toString());
        }
        if (params.customerId) {
            queryParams.append('customerId', params.customerId.toString());
        }

        const response = await apiFetch(`${this.baseUrl}/tat?${queryParams.toString()}`, { headers: getAuthHeaders() });
        if (!response.ok) {
            await throwDashboardError(response, 'Failed to fetch TAT summary');
        }
        return response.json();
    }

    async getSalesSummary(params: { fromDate: string; toDate: string; serviceCenterId?: number; customerId?: number }): Promise<SalesSummary> {
        const queryParams = new URLSearchParams({
            fromDate: params.fromDate,
            toDate: params.toDate,
        });
        if (params.serviceCenterId) {
            queryParams.append('serviceCenterId', params.serviceCenterId.toString());
        }
        if (params.customerId) {
            queryParams.append('customerId', params.customerId.toString());
        }

        const response = await apiFetch(`${this.baseUrl}/sales?${queryParams.toString()}`, { headers: getAuthHeaders() });
        if (!response.ok) {
            await throwDashboardError(response, 'Failed to fetch sales summary');
        }
        return response.json();
    }

    async getSalesByServiceCenters(params: { year: number; month?: number; customerId?: number; serviceCenterId?: number }): Promise<{ success: boolean; data: ServiceCenterSalesSummary }> {
        const queryParams = new URLSearchParams({
            year: params.year.toString(),
        });
        if (params.month) queryParams.append('month', params.month.toString());
        if (params.customerId) queryParams.append('customerId', params.customerId.toString());
        if (params.serviceCenterId) queryParams.append('serviceCenterId', params.serviceCenterId.toString());

        const response = await apiFetch(`${this.baseUrl}/sales/service-centers?${queryParams.toString()}`, { headers: getAuthHeaders() });
        if (!response.ok) {
            await throwDashboardError(response, 'Failed to fetch sales by service centers');
        }
        return response.json();
    }
}

export const dashboardService = new DashboardService();
