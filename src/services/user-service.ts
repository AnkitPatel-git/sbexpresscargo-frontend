import { apiClient } from "@/lib/api-client";

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
  getProfile: () => apiClient<any>("/users/profile"),

  updateSelfProfile: (payload: ProfilePayload) =>
    apiClient<any>("/users/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    apiClient<any>("/users/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
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
    return apiClient<any>(`/users?${query.toString()}`);
  },

  listRoles: () => apiClient<any>("/users/roles"),

  onboardUser: (payload: any) =>
    apiClient<any>("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateUser: (id: number | string, payload: any) =>
    apiClient<any>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  changeUserStatus: (id: number | string, status: "ACTIVE" | "INACTIVE") =>
    apiClient<any>(`/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  listSessions: () => apiClient<any>("/users/sessions"),

  forceLogoff: (sessionId: number | string) =>
    apiClient<any>(`/users/sessions/${sessionId}/logoff`, {
      method: "POST",
    }),
};
