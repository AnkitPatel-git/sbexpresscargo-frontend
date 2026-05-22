import { API_BASE_URL, bearerHeaders } from "@/lib/api-base";
import { apiFetch } from "@/lib/api-fetch";
import type {
  HolidayFormData,
  HolidayListResponse,
  HolidaySingleResponse,
} from "@/types/utilities/holiday";

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const err = await response.json();
    return err?.message || fallback;
  } catch {
    return fallback;
  }
}

export const holidayService = {
  async getHolidays(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    year?: number;
    fromDate?: string;
    toDate?: string;
    status?: string;
  }): Promise<HolidayListResponse> {
    const q = new URLSearchParams();
    if (params?.page != null) q.append("page", String(params.page));
    if (params?.limit != null) q.append("limit", String(params.limit));
    q.append("search", params?.search ?? "");
    q.append("sortBy", params?.sortBy ?? "holidayDate");
    q.append("sortOrder", params?.sortOrder ?? "asc");
    if (params?.year != null) q.append("year", String(params.year));
    if (params?.fromDate) q.append("fromDate", params.fromDate);
    if (params?.toDate) q.append("toDate", params.toDate);
    if (params?.status) q.append("status", params.status);

    const response = await apiFetch(
      `${API_BASE_URL}/utilities/holidays?${q.toString()}`,
      { headers: bearerHeaders(false) },
    );
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to fetch holidays"));
    }
    return response.json();
  },

  async getHolidayById(id: number): Promise<HolidaySingleResponse> {
    const response = await apiFetch(`${API_BASE_URL}/utilities/holidays/${id}`, {
      headers: bearerHeaders(false),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to fetch holiday"));
    }
    return response.json();
  },

  async createHoliday(data: HolidayFormData): Promise<HolidaySingleResponse> {
    const response = await apiFetch(`${API_BASE_URL}/utilities/holidays`, {
      method: "POST",
      headers: bearerHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to create holiday"));
    }
    return response.json();
  },

  async updateHoliday(
    id: number,
    data: Partial<HolidayFormData>,
  ): Promise<HolidaySingleResponse> {
    const response = await apiFetch(`${API_BASE_URL}/utilities/holidays/${id}`, {
      method: "PUT",
      headers: bearerHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to update holiday"));
    }
    return response.json();
  },

  async deleteHoliday(id: number): Promise<void> {
    const response = await apiFetch(`${API_BASE_URL}/utilities/holidays/${id}`, {
      method: "DELETE",
      headers: bearerHeaders(false),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to delete holiday"));
    }
  },
};
