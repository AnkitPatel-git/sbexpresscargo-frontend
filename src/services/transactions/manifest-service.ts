import { apiFetch } from '@/lib/api-fetch';
import { ManifestListResponse, ManifestSingleResponse, ManifestFormValues } from '@/types/transactions/manifest';

const getAuthHeaders = (isFormData = false) => {
    const headers: Record<string, string> = {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    };
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};

class ManifestService {
    private readonly baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/transaction/manifest`;

    async getManifests(page: number, limit: number, search: string = ''): Promise<ManifestListResponse> {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            sortBy: 'manifestNo',
            sortOrder: 'desc',
        });

        if (search) {
            queryParams.append('search', search);
        }

        const response = await apiFetch(`${this.baseUrl}?${queryParams.toString()}`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error('Failed to fetch manifests');
        }
        return response.json();
    }

    async getManifestById(id: number): Promise<ManifestSingleResponse> {
        const response = await apiFetch(`${this.baseUrl}/${id}`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error('Failed to fetch manifest');
        }
        return response.json();
    }

    async createManifest(data: ManifestFormValues): Promise<ManifestSingleResponse> {
        const response = await apiFetch(this.baseUrl, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to create manifest');
        }
        return response.json();
    }

    async updateManifest(id: number, data: Partial<ManifestFormValues> & { version?: number }): Promise<ManifestSingleResponse> {
        if (!data.version) {
            throw new Error('Manifest version is required for update');
        }
        const response = await apiFetch(`${this.baseUrl}/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to update manifest');
        }
        return response.json();
    }

    async deleteManifest(id: number): Promise<void> {
        const response = await apiFetch(`${this.baseUrl}/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            throw new Error('Failed to delete manifest');
        }
    }
}

export const manifestService = new ManifestService();
