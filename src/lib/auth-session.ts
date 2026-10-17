import Cookies from "js-cookie";

export function isAuthFailureMessage(message: unknown): boolean {
    if (typeof message !== "string" || message === "") return false;
    return /session expired|session no longer valid|please login again|logged in on another device|unauthorized|invalid token|jwt expired|invalid credentials|account is inactive|user not found|uses the customer login|uses the staff login/i.test(
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
    if (typeof window === "undefined") return;
    const path = window.location.pathname;
    let customer = path.startsWith("/customer") || Cookies.get("sbPortal") === "customer";
    try {
        const raw = localStorage.getItem("user");
        if (raw) {
            const parsed = JSON.parse(raw) as { role?: { identifier?: string } };
            if (parsed?.role?.identifier === "CUSTOMER") customer = true;
        }
    } catch {
        // Ignore a corrupt stored user and fall back to the path or portal cookie.
    }
    const target = customer ? "/customer/login" : "/login";
    clearAuthSession();
    if (path === target) return;
    window.location.href = target;
}
