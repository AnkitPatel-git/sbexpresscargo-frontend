import type { ApiResponse, LoginResponseData, UtilityUser } from "@/types/utilities/user";
import { apiFetch } from "@/lib/api-fetch";
import { isAuthFailureMessage } from "@/lib/auth-session";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export async function apiClient<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await apiFetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
        throw new Error(
            `Server returned non-JSON response (${response.status}). Please check that the API server is running at ${BASE_URL}.`,
        );
    }

    const data = await response.json();

    const apiBody = data && typeof data === "object" ? (data as ApiResponse<unknown>) : null;
    const message = apiBody && typeof apiBody.message === "string" ? apiBody.message : "";

    const isAuthError =
        response.status === 401 || (apiBody?.success === false && isAuthFailureMessage(message));

    if (isAuthError) {
        throw new Error(message || "Session expired. Please login again.");
    }

    if (!response.ok || apiBody?.success === false) {
        throw new Error(message || "Something went wrong");
    }

    return data;
}

export const authApi = {
    login: (credentials: { email: string; password: string; platform: string }) =>
        apiClient<ApiResponse<LoginResponseData>>("/utilities/users/login", {
            method: "POST",
            body: JSON.stringify(credentials),
        }),
    forgotPassword: (payload: { email: string }) =>
        apiClient<ApiResponse<null>>("/utilities/users/forgot-password", {
            method: "POST",
            body: JSON.stringify(payload),
        }),
    resetPassword: (payload: { token: string; newPassword: string }) =>
        apiClient<ApiResponse<null>>("/utilities/users/reset-password", {
            method: "POST",
            body: JSON.stringify(payload),
        }),
    getProfile: () => apiClient<ApiResponse<UtilityUser>>("/utilities/users/profile"),
};
