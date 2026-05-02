import { API_BASE_URL, bearerHeaders } from '@/lib/api-base';
import { apiFetch } from '@/lib/api-fetch';

async function readError(response: Response, fallback: string): Promise<string> {
    const json = await response.clone().json().catch(() => null) as { message?: string } | null;
    return json?.message || fallback;
}

export type MasterExcelImportSummary = {
    created: number;
    failed: number;
    failures: Array<{ row: number; message: string; error?: Record<string, unknown> }>;
    successes: Array<{ row: number; code: string }>;
    bulkUploadLogId?: number;
};

export const masterExcelImportService = {
    async downloadTemplate(master: string): Promise<{ blob: Blob; filename: string }> {
        const response = await apiFetch(`${API_BASE_URL}/master-excel/${master}/import/template`, {
            headers: bearerHeaders(false),
        });
        if (!response.ok) {
            throw new Error(await readError(response, 'Failed to download import template'));
        }

        const cd = response.headers.get('content-disposition');
        let filename = `${master}-import-template.xlsx`;
        const match = cd?.match(/filename="?([^";\n]+)"?/i);
        if (match?.[1]) filename = match[1].trim();
        return { blob: await response.blob(), filename };
    },

    async importFile(master: string, file: File): Promise<MasterExcelImportSummary> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiFetch(`${API_BASE_URL}/master-excel/${master}/import`, {
            method: 'POST',
            headers: bearerHeaders(false),
            body: formData,
        });
        const json = (await response.json().catch(() => ({}))) as {
            success?: boolean;
            data?: MasterExcelImportSummary;
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
