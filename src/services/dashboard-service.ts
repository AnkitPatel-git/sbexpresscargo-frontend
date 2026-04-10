import { apiFetch } from '@/lib/api-fetch';
import { OperationSummary, SalesSummary, ServiceCenterSalesSummary } from '@/types/dashboard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json'
});

class DashboardService {
    private readonly baseUrl = `${API_URL}/dashboard`;

    async getOperationSummary(params: { fromDate: string; toDate: string; serviceCenterId?: number }): Promise<{ success: boolean; data: OperationSummary }> {
        const queryParams = new URLSearchParams({
            fromDate: params.fromDate,
            toDate: params.toDate,
        });
        if (params.serviceCenterId) {
            queryParams.append('serviceCenterId', params.serviceCenterId.toString());
        }

        const response = await apiFetch(`${this.baseUrl}/operation?${queryParams.toString()}`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error('Failed to fetch operation summary');
        }
        return response.json();
    }

    async getSalesSummary(params: { fromDate: string; toDate: string; serviceCenterId?: number }): Promise<SalesSummary> {
        const queryParams = new URLSearchParams({
            fromDate: params.fromDate,
            toDate: params.toDate,
        });
        if (params.serviceCenterId) {
            queryParams.append('serviceCenterId', params.serviceCenterId.toString());
        }

        const response = await apiFetch(`${this.baseUrl}/sales?${queryParams.toString()}`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error('Failed to fetch sales summary');
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
            throw new Error('Failed to fetch sales by service centers');
        }
        return response.json();
    }
}

export const dashboardService = new DashboardService();
