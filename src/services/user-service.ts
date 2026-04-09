import { apiClient } from "@/lib/api-client";

const USERS = "/utilities/users";

type ProfilePayload = {
  email?: string;
  username?: string;
  mobile?: string;
  profile?: {
    userGroup?: string;
    origin?: string;
    groupName?: string;
    birthDate?: string;
  };
};

export const userService = {
  getProfile: () => apiClient<any>(`${USERS}/profile`),

  updateSelfProfile: (payload: ProfilePayload) =>
    apiClient<any>(`${USERS}/profile`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    apiClient<any>(`${USERS}/change-password`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  logout: () =>
    apiClient<any>(`${USERS}/logout`, {
      method: "POST",
    }),

  listUsers: (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    roleId?: number;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));
    if (params.search) query.append("search", params.search);
    if (params.status) query.append("status", params.status);
    if (params.roleId) query.append("roleId", String(params.roleId));
    return apiClient<any>(`${USERS}?${query.toString()}`);
  },

  listRoles: () => apiClient<any>(`${USERS}/roles`),

  onboardUser: (payload: any) =>
    apiClient<any>(USERS, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateUser: (id: number | string, payload: any) =>
    apiClient<any>(`${USERS}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  changeUserStatus: (id: number | string, status: "ACTIVE" | "INACTIVE") =>
    apiClient<any>(`${USERS}/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  listSessions: () => apiClient<any>(`${USERS}/sessions`),

  forceLogoff: (sessionId: number | string) =>
    apiClient<any>(`${USERS}/sessions/${sessionId}/logoff`, {
      method: "POST",
    }),
};
