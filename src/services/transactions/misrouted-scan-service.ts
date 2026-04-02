import { apiFetch } from '@/lib/api-fetch';
import { MisroutedScanListResponse, MisroutedScanSingleResponse, MisroutedScanFormValues } from '@/types/transactions/misrouted-scan';

class MisroutedScanService {
    private readonly baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/transaction/misrouted-scan`;

    async getMisroutedScans(page: number, limit: number, search: string = ''): Promise<MisroutedScanListResponse> {
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
            throw new Error('Failed to fetch misrouted scans');
        }
        return response.json();
    }

    async getMisroutedScanById(id: number): Promise<MisroutedScanSingleResponse> {
        const response = await apiFetch(`${this.baseUrl}/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch misrouted scan');
        }
        return response.json();
    }

    async createMisroutedScan(data: MisroutedScanFormValues): Promise<MisroutedScanSingleResponse> {
        const response = await apiFetch(this.baseUrl, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to create misrouted scan');
        }
        return response.json();
    }

    async updateMisroutedScan(id: number, data: Partial<MisroutedScanFormValues>): Promise<MisroutedScanSingleResponse> {
        const response = await apiFetch(`${this.baseUrl}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to update misrouted scan');
        }
        return response.json();
    }

    async deleteMisroutedScan(id: number): Promise<void> {
        const response = await apiFetch(`${this.baseUrl}/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete misrouted scan');
        }
    }
}

export const misroutedScanService = new MisroutedScanService();
