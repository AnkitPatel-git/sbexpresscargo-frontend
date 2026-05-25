import { apiFetch } from '@/lib/api-fetch';
import type {
    PodBulkProofUploadResponse,
    PodProofUploadResult,
    PodUploadResponse,
    PodViewResponse,
} from '@/types/transactions/pod';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

function parseFilename(response: Response, fallback: string): string {
    const cd = response.headers.get('content-disposition');
    const match = cd?.match(/filename="?([^";\n]+)"?/i);
    return match?.[1]?.trim() || fallback;
}

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
    private readonly baseUrl = `${API_URL}/transaction/pod`;

    async viewPod(awbNos: string[]): Promise<PodViewResponse> {
        // Changed to getAuthHeaders(false) because we are sending JSON, not FormData
        const response = await apiFetch(`${this.baseUrl}/view`, {
            method: 'POST',
            headers: getAuthHeaders(false),
            body: JSON.stringify({ awbNos }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch POD data');
        }
        return response.json();
    }

    async uploadExcel(file: File): Promise<PodUploadResponse> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiFetch(`${this.baseUrl}/upload`, {
            method: 'POST',
            headers: getAuthHeaders(true),
            body: formData,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to upload POD Excel file');
        }
        return response.json();
    }

    async downloadBlankPdf(
        awbNo: string,
        regenerate = false,
    ): Promise<{ blob: Blob; filename: string }> {
        const encoded = encodeURIComponent(awbNo.trim());
        const q = regenerate ? '?regenerate=true' : '';
        const response = await apiFetch(`${this.baseUrl}/blank-form/${encoded}${q}`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error((err as { message?: string }).message || 'Failed to download POD form');
        }
        return {
            blob: await response.blob(),
            filename: parseFilename(response, `POD-${awbNo.trim()}.pdf`),
        };
    }

    async uploadProofByAwb(
        awbNo: string,
        file: File,
        options?: { remark?: string; markDelivered?: boolean },
    ): Promise<{ success: boolean; message: string; data: PodProofUploadResult }> {
        const formData = new FormData();
        formData.append('file', file);
        if (options?.remark) formData.append('remark', options.remark);
        if (options?.markDelivered === false) {
            formData.append('markDelivered', 'false');
        }
        const encoded = encodeURIComponent(awbNo.trim());
        const response = await apiFetch(`${this.baseUrl}/upload-proof/${encoded}`, {
            method: 'POST',
            headers: getAuthHeaders(true),
            body: formData,
        });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error((json as { message?: string }).message || 'Failed to upload POD');
        }
        return json as { success: boolean; message: string; data: PodProofUploadResult };
    }

    async bulkUploadProofs(
        files: File[],
        options?: { remark?: string; markDelivered?: boolean },
    ): Promise<PodBulkProofUploadResponse> {
        const formData = new FormData();
        for (const file of files) {
            formData.append('files', file);
        }
        if (options?.remark) formData.append('remark', options.remark);
        if (options?.markDelivered === false) {
            formData.append('markDelivered', 'false');
        }
        const response = await apiFetch(`${this.baseUrl}/bulk-upload-proofs`, {
            method: 'POST',
            headers: getAuthHeaders(true),
            body: formData,
        });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error((json as { message?: string }).message || 'Failed to upload POD files');
        }
        return json as PodBulkProofUploadResponse;
    }

    async downloadBulkBlankZip(awbNos: string[]): Promise<{ blob: Blob; filename: string }> {
        const response = await apiFetch(`${this.baseUrl}/bulk-blank-forms`, {
            method: 'POST',
            headers: getAuthHeaders(false),
            body: JSON.stringify({ awbNos }),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error((err as { message?: string }).message || 'Failed to download POD forms ZIP');
        }
        return {
            blob: await response.blob(),
            filename: parseFilename(response, 'pod-blank-forms.zip'),
        };
    }

}

export const podService = new PodService();
