import { apiFetch } from '@/lib/api-fetch';
import { TrackingListResponse, TrackingDetailResponse, MetricsResponse, ManualUpdatePayload, DeadLettersResponse, TrackingSummaryResponse } from '@/types/transactions/tracking';

const getAuthHeaders = (isFormData = false) => {
    const headers: Record<string, string> = {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    };
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};

class TrackingService {
    private readonly baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/transaction/tracking`;

    async searchTracking(page: number, limit: number, search: string = ''): Promise<TrackingListResponse> {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (search) {
            queryParams.append('search', search);
        }

        const response = await apiFetch(`${this.baseUrl}/search?${queryParams.toString()}`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error('Failed to fetch tracking list');
        }
        return response.json();
    }

    async getTrackingByAwb(awbNo: string): Promise<TrackingDetailResponse> {
        const response = await apiFetch(`${this.baseUrl}/awb/${awbNo}`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error(`Failed to fetch tracking details for AWB: ${awbNo}`);
        }
        return response.json();
    }

    async getMetrics(): Promise<MetricsResponse> {
        const response = await apiFetch(`${this.baseUrl}/metrics`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error('Failed to fetch tracking metrics');
        }
        return response.json();
    }

    async manualUpdateStatus(data: ManualUpdatePayload): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${this.baseUrl}/manual`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update status manually');
        }
        return response.json();
    }

    async getDeadLetters(page: number = 1, limit: number = 20): Promise<DeadLettersResponse> {
        const response = await apiFetch(`${this.baseUrl}/dead-letters?page=${page}&limit=${limit}`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error('Failed to fetch dead letters');
        }
        return response.json();
    }

    async retryFailedLogs(ids: number[]): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${this.baseUrl}/logs/retry`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ ids }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to retry logs');
        }
        return response.json();
    }

    async getTrackingSummary(awbNo: string): Promise<TrackingSummaryResponse> {
        const response = await apiFetch(`${this.baseUrl}/awb/${awbNo}/summary`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error(`Failed to fetch tracking summary for AWB: ${awbNo}`);
        }
        return response.json();
    }

    async downloadHistoryCsv(awbNo: string): Promise<Blob> {
        const response = await apiFetch(`${this.baseUrl}/awb/${awbNo}/history?format=csv`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            throw new Error('Failed to export tracking history');
        }
        return response.blob();
    }
}

export const trackingService = new TrackingService();
