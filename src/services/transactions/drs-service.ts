import { apiFetch } from '@/lib/api-fetch';
import { DrsListResponse, DrsSingleResponse, DrsFormValues } from '@/types/transactions/drs';

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

class DrsService {
    private readonly baseUrl = `${API_URL}/transaction/drs`;

    async getDrs(page: number, limit: number): Promise<DrsListResponse> {
        // Bruno: GET .../drs?page=1&limit=20
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        const response = await apiFetch(`${this.baseUrl}?${queryParams.toString()}`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error('Failed to fetch DRS list');
        }
        return response.json();
    }

    async getDrsById(id: number): Promise<DrsSingleResponse> {
        const response = await apiFetch(`${this.baseUrl}/${id}`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error('Failed to fetch DRS');
        }
        return response.json();
    }

    async createDrs(data: DrsFormValues): Promise<DrsSingleResponse> {
        const response = await apiFetch(`${this.baseUrl}/scan`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to create DRS');
        }
        return response.json();
    }

    async startDrs(id: number): Promise<unknown> {
        const response = await apiFetch(`${this.baseUrl}/${id}/start`, {
            method: 'POST',
            headers: getAuthHeaders(false),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error((err as { message?: string }).message || 'Failed to start DRS');
        }
        return response.json();
    }

    async completeDrs(body: unknown): Promise<unknown> {
        const response = await apiFetch(`${this.baseUrl}/complete`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error((err as { message?: string }).message || 'Failed to complete DRS');
        }
        return response.json();
    }

    async exportDrsCsv(): Promise<Blob> {
        const response = await apiFetch(`${this.baseUrl}/export`, {
            headers: getAuthHeaders(false),
        });
        if (!response.ok) throw new Error('Failed to export DRS');
        return response.blob();
    }

}

export const drsService = new DrsService();
