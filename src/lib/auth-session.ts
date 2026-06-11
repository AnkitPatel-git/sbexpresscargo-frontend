import Cookies from "js-cookie";

export function isAuthFailureMessage(message: unknown): boolean {
    if (typeof message !== "string" || message === "") return false;
    return /session expired|session no longer valid|please login again|logged in on another device|unauthorized|invalid token|jwt expired/i.test(
        message,
    );
}

export function isLoginRequest(input: RequestInfo | URL): boolean {
    const urlStr = typeof input === "string" ? input : input.toString();
    return urlStr.includes("/utilities/users/login") || urlStr.includes("/users/login");
}

export async function responseIndicatesAuthFailure(response: Response): Promise<boolean> {
    if (response.status === 401) return true;
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return false;
    try {
        const body = (await response.clone().json()) as { success?: boolean; message?: string };
        return body.success === false && isAuthFailureMessage(body.message);
    } catch {
        return false;
    }
}

export function clearAuthSession(): void {
    if (typeof window === "undefined") return;
    Cookies.remove("accessToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
}

export function redirectToLogin(): void {
    if (typeof window === "undefined" || window.location.pathname === "/login") return;
    clearAuthSession();
    window.location.href = "/login";
}
