import { apiFetch } from '@/lib/api-fetch';
import { TrackingListResponse, TrackingDetailResponse, MetricsResponse, ManualUpdatePayload, DeadLettersResponse, TrackingSummaryResponse, TrackingBulkManualImportResponse } from '@/types/transactions/tracking';

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

class TrackingService {
    private readonly baseUrl = `${API_URL}/transaction/tracking`;

    async searchTracking(params: {
        page: number;
        limit: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<TrackingListResponse> {
        const queryParams = new URLSearchParams({
            page: params.page.toString(),
            limit: params.limit.toString(),
            // Bruno: .../search?page=1&limit=20&search= (param present even when empty)
            search: params.search ?? '',
        });
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

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

    async downloadBulkManualTemplate(): Promise<Blob> {
        const response = await apiFetch(`${this.baseUrl}/bulk-manual/template`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            throw new Error('Failed to download bulk tracking template');
        }
        return response.blob();
    }

    async bulkManualFromExcel(file: File): Promise<TrackingBulkManualImportResponse> {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiFetch(`${this.baseUrl}/bulk-manual/excel`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error((err as { message?: string }).message || 'Bulk tracking upload failed');
        }
        return response.json();
    }

    async getDeadLetters(params?: {
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<DeadLettersResponse> {
        const queryParams = new URLSearchParams({
            limit: String(params?.limit ?? 100),
        });
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
        const response = await apiFetch(`${this.baseUrl}/dead-letters?${queryParams.toString()}`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error('Failed to fetch dead letters');
        }
        return response.json();
    }

    async retryFailedLogs(limit: number = 50): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${this.baseUrl}/retry-failed`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ limit }),
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

    /** Bruno: vendor webhook (often public; portal may still send Bearer). */
    async postVendorWebhook(body: unknown): Promise<unknown> {
        const response = await apiFetch(`${this.baseUrl}/webhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error((err as { message?: string }).message || 'Webhook request failed');
        }
        return response.json();
    }

    async postVendorWebhookBulk(body: unknown): Promise<unknown> {
        const response = await apiFetch(`${this.baseUrl}/webhook/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error((err as { message?: string }).message || 'Bulk webhook request failed');
        }
        return response.json();
    }
}

export const trackingService = new TrackingService();
