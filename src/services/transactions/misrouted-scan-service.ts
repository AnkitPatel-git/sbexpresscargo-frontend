import { apiFetch } from '@/lib/api-fetch';
import { MisroutedScanListResponse, MisroutedScanSingleResponse, MisroutedScanFormValues } from '@/types/transactions/misrouted-scan';

const getAuthHeaders = (isFormData = false) => {
    const headers: Record<string, string> = {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    };
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};

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

        const response = await apiFetch(`${this.baseUrl}?${queryParams.toString()}`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error('Failed to fetch misrouted scans');
        }
        return response.json();
    }

    async getMisroutedScanById(id: number): Promise<MisroutedScanSingleResponse> {
        const response = await apiFetch(`${this.baseUrl}/${id}`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error('Failed to fetch misrouted scan');
        }
        return response.json();
    }

    async createMisroutedScan(data: MisroutedScanFormValues): Promise<MisroutedScanSingleResponse> {
        const response = await apiFetch(this.baseUrl, {
            method: 'POST',
            headers: getAuthHeaders(false),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to create misrouted scan');
        }
        return response.json();
    }

    async updateMisroutedScan(id: number, data: Partial<MisroutedScanFormValues>): Promise<MisroutedScanSingleResponse> {
        // Strip ids from items as the API prohibits then in the update payload
        const updatedData = {
            ...data,
            items: data.items?.map(({ id, ...item }) => item)
        };
        const response = await apiFetch(`${this.baseUrl}/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(false),
            body: JSON.stringify(updatedData),
        });
        if (!response.ok) {
            throw new Error('Failed to update misrouted scan');
        }
        return response.json();
    }

    async deleteMisroutedScan(id: number): Promise<void> {
        const response = await apiFetch(`${this.baseUrl}/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(false),
        });
        if (!response.ok) {
            throw new Error('Failed to delete misrouted scan');
        }
    }

    async exportMisroutedScansCsv(search: string = ''): Promise<Blob> {
        const queryParams = new URLSearchParams();
        if (search) {
            queryParams.append('search', search);
        }

        const response = await apiFetch(`${this.baseUrl}/export/csv?${queryParams.toString()}`, { 
            headers: getAuthHeaders() 
        });
        if (!response.ok) {
            throw new Error('Failed to export misrouted scans');
        }
        return response.blob();
    }
}

export const misroutedScanService = new MisroutedScanService();
