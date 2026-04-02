import { apiFetch } from '@/lib/api-fetch';
import { PodViewResponse } from '@/types/transactions/pod';

const getAuthHeaders = (isFormData = false) => {
    const headers: Record<string, string> = {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    };
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};

class PodService {
    private readonly baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/transaction/pod`;

    async viewPod(awbNos: string[]): Promise<PodViewResponse> {
        const response = await apiFetch(`${this.baseUrl}/view`, {
            method: 'POST',
            headers: getAuthHeaders(true),
            body: JSON.stringify({ awbNos }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch POD data');
        }
        return response.json();
    }

    async downloadTemplate(): Promise<Blob> {
        const response = await apiFetch(`${this.baseUrl}/template`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error('Failed to download POD template');
        }
        return response.blob();
    }

    async uploadExcel(file: File): Promise<any> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiFetch(`${this.baseUrl}/upload`, {
            method: 'POST',
            headers: getAuthHeaders(true),
            body: formData,
        });
        if (!response.ok) {
            throw new Error('Failed to upload POD Excel file');
        }
        return response.json();
    }
}

export const podService = new PodService();
