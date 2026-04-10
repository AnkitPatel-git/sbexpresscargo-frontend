import { apiFetch } from "@/lib/api-fetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
const BASE = `${API_URL}/utilities/roles`;

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}`,
});

/** Bruno: Utilities → Roles (`/utilities/roles`). */
export const roleService = {
  async listRoles(params?: { page?: number; limit?: number; search?: string }) {
    const q = new URLSearchParams();
    if (params?.page) q.append("page", String(params.page));
    if (params?.limit) q.append("limit", String(params.limit));
    if (params?.search) q.append("search", params.search);
    const response = await apiFetch(`${BASE}?${q.toString()}`, { headers: authHeader() });
    if (!response.ok) throw new Error("Failed to fetch roles");
    return response.json();
  },

  async getRoleById(id: number | string) {
    const response = await apiFetch(`${BASE}/${id}`, { headers: authHeader() });
    if (!response.ok) throw new Error("Failed to fetch role");
    return response.json();
  },

  async createRole(body: {
    name: string;
    identifier: string;
    description?: string;
    permissionIds?: number[];
  }) {
    const response = await apiFetch(BASE, {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Failed to create role");
    }
    return response.json();
  },

  async updateRole(
    id: number | string,
    body: Partial<{ name: string; identifier: string; description: string; permissionIds: number[] }>,
  ) {
    const response = await apiFetch(`${BASE}/${id}`, {
      method: "PATCH",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update role");
    }
    return response.json();
  },

  async deleteRole(id: number | string) {
    const response = await apiFetch(`${BASE}/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Failed to delete role");
    }
    return response.json();
  },
};
