import { apiFetch } from '@/lib/api-fetch';
import { UndeliveredScanListResponse, UndeliveredScanSingleResponse, UndeliveredScanFormValues } from '@/types/transactions/undelivered-scan';

class UndeliveredScanService {
    private readonly baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/transaction/undelivered-scan`;

    async getUndeliveredScans(page: number, limit: number, search: string = ''): Promise<UndeliveredScanListResponse> {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            sortBy: 'scanAt',
            sortOrder: 'desc',
        });

        if (search) {
            queryParams.append('search', search);
        }

        const response = await apiFetch(`${this.baseUrl}?${queryParams.toString()}`);
        if (!response.ok) {
            throw new Error('Failed to fetch undelivered scans');
        }
        return response.json();
    }

    async getUndeliveredScanById(id: number): Promise<UndeliveredScanSingleResponse> {
        const response = await apiFetch(`${this.baseUrl}/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch undelivered scan');
        }
        return response.json();
    }

    async createUndeliveredScan(data: UndeliveredScanFormValues): Promise<UndeliveredScanSingleResponse> {
        const response = await apiFetch(this.baseUrl, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to create undelivered scan');
        }
        return response.json();
    }

    async updateUndeliveredScan(id: number, data: Partial<UndeliveredScanFormValues>): Promise<UndeliveredScanSingleResponse> {
        const response = await apiFetch(`${this.baseUrl}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to update undelivered scan');
        }
        return response.json();
    }

    async deleteUndeliveredScan(id: number): Promise<void> {
        const response = await apiFetch(`${this.baseUrl}/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete undelivered scan');
        }
    }
}

export const undeliveredScanService = new UndeliveredScanService();
