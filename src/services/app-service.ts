import { apiFetch } from "@/lib/api-fetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

/** Bruno App → GET `{{baseUrl}}/` (health / info). */
export const appService = {
  async getHealth(): Promise<unknown> {
    const response = await apiFetch(`${API_URL}/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}` },
    });
    if (!response.ok) throw new Error("Failed to fetch API health");
    return response.json();
  },
};
