import { API_BASE_URL, bearerHeaders } from "@/lib/api-base";
import { apiFetch } from "@/lib/api-fetch";

/** Error CSV is available whenever at least one row failed. */
export function canDownloadBulkUploadErrorsCsv(failedCount: number): boolean {
  return failedCount > 0;
}

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const json = (await response.json()) as { message?: string };
    return json?.message || fallback;
  } catch {
    return fallback;
  }
}

export const bulkUploadLogService = {
  async downloadErrorRowsCsv(logId: number): Promise<{ blob: Blob; filename: string }> {
    const response = await apiFetch(
      `${API_BASE_URL}/utilities/bulk-upload-logs/${logId}/error-rows.csv`,
      { headers: bearerHeaders(false) },
    );
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to download error CSV"));
    }
    const cd = response.headers.get("content-disposition");
    let filename = `bulk-upload-${logId}-errors.csv`;
    const match = cd?.match(/filename="?([^";\n]+)"?/i);
    if (match?.[1]) filename = match[1].trim();
    return { blob: await response.blob(), filename };
  },
};
