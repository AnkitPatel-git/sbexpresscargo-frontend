import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  ListUsersParams,
  MessageResponse,
  PaginatedResponse,
  SessionRecord,
  UpdateSelfProfilePayload,
  UserRole,
  UtilityUser,
} from "@/types/utilities/user";

const USERS = "/utilities/users";
type UserMutationPayload = Record<string, unknown>;

export const userService = {
  getProfile: () => apiClient<ApiResponse<UtilityUser>>(`${USERS}/profile`),

  updateSelfProfile: (payload: UpdateSelfProfilePayload) =>
    apiClient<ApiResponse<UtilityUser>>(`${USERS}/profile`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    apiClient<MessageResponse>(`${USERS}/change-password`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  logout: () =>
    apiClient<MessageResponse>(`${USERS}/logout`, {
      method: "POST",
    }),

  listUsers: (params: ListUsersParams = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));
    query.append("search", params.search ?? "");
    if (params.username) query.append("username", params.username);
    if (params.email) query.append("email", params.email);
    if (params.mobile) query.append("mobile", params.mobile);
    if (params.status) query.append("status", params.status);
    if (params.roleId) query.append("roleId", String(params.roleId));
    return apiClient<PaginatedResponse<UtilityUser>>(`${USERS}?${query.toString()}`);
  },

  listRoles: () => apiClient<ApiResponse<UserRole[]>>(`${USERS}/roles`),

  onboardUser: (payload: UserMutationPayload) =>
    apiClient<ApiResponse<UtilityUser>>(USERS, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateUser: (id: number | string, payload: UserMutationPayload) =>
    apiClient<ApiResponse<UtilityUser>>(`${USERS}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  changeUserStatus: (id: number | string, status: ListUsersParams["status"]) =>
    apiClient<ApiResponse<UtilityUser>>(`${USERS}/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  listSessions: () => apiClient<PaginatedResponse<SessionRecord>>(`${USERS}/sessions`),

  forceLogoff: (sessionId: number | string) =>
    apiClient<MessageResponse>(`${USERS}/sessions/${sessionId}/logoff`, {
      method: "POST",
    }),
};
