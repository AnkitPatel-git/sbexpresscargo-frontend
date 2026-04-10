import { apiFetch } from "@/lib/api-fetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
const BASE = `${API_URL}/utilities/audit-logs`;

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}`,
});

/** Bruno: Utilities → Audit Logs (`/utilities/audit-logs`). */
export const auditLogService = {
  async listAuditLogs(params?: {
    page?: number;
    limit?: number;
    entityType?: string;
    entityId?: string;
    action?: string;
    performedById?: string;
  }) {
    const q = new URLSearchParams();
    if (params?.page) q.append("page", String(params.page));
    if (params?.limit) q.append("limit", String(params.limit));
    if (params?.entityType != null) q.append("entityType", params.entityType);
    if (params?.entityId != null) q.append("entityId", params.entityId);
    if (params?.action != null) q.append("action", params.action);
    if (params?.performedById != null) q.append("performedById", params.performedById);
    const response = await apiFetch(`${BASE}?${q.toString()}`, { headers: authHeader() });
    if (!response.ok) throw new Error("Failed to fetch audit logs");
    return response.json();
  },

  async getAuditLogById(id: number | string) {
    const response = await apiFetch(`${BASE}/${id}`, { headers: authHeader() });
    if (!response.ok) throw new Error("Failed to fetch audit log");
    return response.json();
  },
};
