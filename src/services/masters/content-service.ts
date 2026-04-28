import { apiFetch } from '@/lib/api-fetch';
import { ContentListResponse, ContentSingleResponse, ContentFormData } from '@/types/masters/content';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

async function readError(response: Response, fallback: string): Promise<string> {
    const json = await response.clone().json().catch(() => null) as { message?: string } | null;
    return json?.message || fallback;
}

export const contentService = {
    async getContents(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<ContentListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'contentCode');
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc');

        const response = await apiFetch(`${API_URL}/content-master?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch contents');
        }

        return response.json();
    },

    async getContentById(id: number): Promise<ContentSingleResponse> {
        const response = await apiFetch(`${API_URL}/content-master/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch content');
        }

        return response.json();
    },

    async createContent(data: ContentFormData): Promise<ContentSingleResponse> {
        const response = await apiFetch(`${API_URL}/content-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create content');
        }

        return response.json();
    },

    async updateContent(id: number, data: Partial<ContentFormData>): Promise<ContentSingleResponse> {
        const response = await apiFetch(`${API_URL}/content-master/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update content');
        }

        return response.json();
    },

    async deleteContent(id: number): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${API_URL}/content-master/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete content');
        }

        return response.json();
    },

    /** Bruno: `GET /content-master/export` — CSV; optional list-style query params. */
    async exportContents(params?: {
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{ blob: Blob; filename: string }> {
        const queryParams = new URLSearchParams();
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'contentCode');
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc');

        const response = await apiFetch(`${API_URL}/content-master/export?${queryParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to export contents');
        }

        const cd = response.headers.get('content-disposition');
        let filename = 'contents.csv';
        const match = cd?.match(/filename="?([^";\n]+)"?/i);
        if (match?.[1]) filename = match[1].trim();

        const blob = await response.blob();
        return { blob, filename };
    },

    async downloadImportTemplate(): Promise<{ blob: Blob; filename: string }> {
        const response = await apiFetch(`${API_URL}/content-master/import/template`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error(await readError(response, 'Failed to download import template'));
        }

        const cd = response.headers.get('content-disposition');
        let filename = 'contents-import-template.xlsx';
        const match = cd?.match(/filename="?([^";\n]+)"?/i);
        if (match?.[1]) filename = match[1].trim();

        return { blob: await response.blob(), filename };
    },

    async importContentsFromExcel(file: File): Promise<{
        created: number;
        failed: number;
        failures: Array<{ row: number; message: string }>;
        successes: Array<{ row: number; contentCode: string }>;
    }> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiFetch(`${API_URL}/content-master/import`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: formData,
        });
        const json = (await response.json().catch(() => ({}))) as {
            success?: boolean;
            data?: {
                created: number;
                failed: number;
                failures: Array<{ row: number; message: string }>;
                successes: Array<{ row: number; contentCode: string }>;
            };
            message?: string;
        };

        if (!response.ok) {
            throw new Error(json.message || 'Import failed');
        }
        if (!json.success || json.data == null) {
            throw new Error('Invalid import response');
        }
        return json.data;
    },
};
