import { apiFetch } from '@/lib/api-fetch';
import { DrsListResponse, DrsSingleResponse, DrsFormValues } from '@/types/transactions/drs';

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
    private readonly baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/transaction/drs`;

    async getDrs(page: number, limit: number, search: string = ''): Promise<DrsListResponse> {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            sortBy: 'drsNo',
            sortOrder: 'desc',
        });

        if (search) {
            queryParams.append('search', search);
        }

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
            headers: getAuthHeaders(true),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to create DRS');
        }
        return response.json();
    }

    async updateDrs(id: number, data: Partial<DrsFormValues>): Promise<DrsSingleResponse> {
        const response = await apiFetch(`${this.baseUrl}/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(true),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to update DRS');
        }
        return response.json();
    }

    async deleteDrs(id: number): Promise<void> {
        const response = await apiFetch(`${this.baseUrl}/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(true),
        });
        if (!response.ok) {
            throw new Error('Failed to delete DRS');
        }
    }
}

export const drsService = new DrsService();
