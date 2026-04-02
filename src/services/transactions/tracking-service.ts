import { apiFetch } from '@/lib/api-fetch';
import { TrackingListResponse, TrackingDetailResponse } from '@/types/transactions/tracking';

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

        const response = await apiFetch(`${this.baseUrl}/search?${queryParams.toString()}`);
        if (!response.ok) {
            throw new Error('Failed to fetch tracking list');
        }
        return response.json();
    }

    async getTrackingByAwb(awbNo: string): Promise<TrackingDetailResponse> {
        const response = await apiFetch(`${this.baseUrl}/awb/${awbNo}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch tracking details for AWB: ${awbNo}`);
        }
        return response.json();
    }
}

export const trackingService = new TrackingService();
