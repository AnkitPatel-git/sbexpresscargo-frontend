import { apiFetch } from '@/lib/api-fetch';
import { ManifestListResponse, ManifestSingleResponse, ManifestFormValues } from '@/types/transactions/manifest';

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

class ManifestService {
    private readonly baseUrl = `${API_URL}/transaction/manifest`;

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
            method: 'PATCH',
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

    private readonly inscanUrl = `${API_URL}/transaction/manifest/inscan`;

    async listManifestInscans(page: number, limit: number): Promise<unknown> {
        const q = new URLSearchParams({ page: String(page), limit: String(limit) });
        const response = await apiFetch(`${this.inscanUrl}?${q}`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Failed to list manifest inscans');
        return response.json();
    }

    async getManifestInscanById(id: number): Promise<unknown> {
        const response = await apiFetch(`${this.inscanUrl}/${id}`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Failed to fetch manifest inscan');
        return response.json();
    }

    async createManifestInscan(body: unknown): Promise<unknown> {
        const response = await apiFetch(this.inscanUrl, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error('Failed to create manifest inscan');
        return response.json();
    }

    async updateManifestInscan(id: number, body: unknown): Promise<unknown> {
        const response = await apiFetch(`${this.inscanUrl}/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error('Failed to update manifest inscan');
        return response.json();
    }

    async deleteManifestInscan(id: number): Promise<void> {
        const response = await apiFetch(`${this.inscanUrl}/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete manifest inscan');
    }

    async getManifestViewAggregated(params?: {
        dateFrom?: string;
        dateTo?: string;
        origin?: string;
        destination?: string;
        vendor?: string;
        search?: string;
        searchBy?: string;
    }): Promise<unknown> {
        // Bruno: .../manifest/view?dateFrom=&dateTo=&origin=&destination=&vendor=&search=&searchBy=
        const q = new URLSearchParams({
            dateFrom: params?.dateFrom ?? '',
            dateTo: params?.dateTo ?? '',
            origin: params?.origin ?? '',
            destination: params?.destination ?? '',
            vendor: params?.vendor ?? '',
            search: params?.search ?? '',
            searchBy: params?.searchBy ?? '',
        });
        const response = await apiFetch(`${API_URL}/transaction/manifest/view?${q}`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch aggregated manifest view');
        return response.json();
    }

    async closeManifest(manifestId: number, body: { version: number }): Promise<unknown> {
        const response = await apiFetch(`${this.baseUrl}/${manifestId}/close`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error('Failed to close manifest');
        return response.json();
    }

    async addShipmentsToManifest(manifestId: number, body: unknown): Promise<unknown> {
        const response = await apiFetch(`${this.baseUrl}/${manifestId}/shipments`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error('Failed to add shipments to manifest');
        return response.json();
    }

    async removeShipmentFromManifest(manifestId: number, shipmentId: number): Promise<void> {
        const response = await apiFetch(`${this.baseUrl}/${manifestId}/shipments/${shipmentId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to remove shipment from manifest');
    }

    async addManifestProgress(manifestId: number, body: unknown): Promise<unknown> {
        const response = await apiFetch(`${this.baseUrl}/${manifestId}/progress`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error('Failed to add manifest progress');
        return response.json();
    }

    async deleteManifestProgress(manifestId: number, progressId: number): Promise<void> {
        const response = await apiFetch(`${this.baseUrl}/${manifestId}/progress/${progressId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete manifest progress');
    }

    async getAvailableAwbs(page: number, limit: number): Promise<unknown> {
        const q = new URLSearchParams({ page: String(page), limit: String(limit) });
        const response = await apiFetch(`${API_URL}/transaction/manifest/available-awbs?${q}`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch available AWBs');
        return response.json();
    }

    async getNextManifestNumber(serviceCenterId: number): Promise<unknown> {
        const q = new URLSearchParams({ serviceCenterId: String(serviceCenterId) });
        const response = await apiFetch(`${API_URL}/transaction/manifest/next-number?${q}`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch next manifest number');
        return response.json();
    }

    async getManifestPrintPayload(manifestId: number): Promise<unknown> {
        const response = await apiFetch(`${this.baseUrl}/${manifestId}/print`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch manifest print payload');
        return response.json();
    }

    async exportManifestItemsCsv(manifestId: number): Promise<Blob> {
        const response = await apiFetch(`${this.baseUrl}/${manifestId}/export`, {
            headers: getAuthHeaders(false),
        });
        if (!response.ok) throw new Error('Failed to export manifest items');
        return response.blob();
    }

    async exportManifestListCsv(): Promise<Blob> {
        const response = await apiFetch(`${API_URL}/transaction/manifest/export`, {
            headers: getAuthHeaders(false),
        });
        if (!response.ok) throw new Error('Failed to export manifest list');
        return response.blob();
    }
}

export const manifestService = new ManifestService();
