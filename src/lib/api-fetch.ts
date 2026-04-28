let healthCheckPromise: Promise<boolean> | null = null;

function isBrowser() {
    return typeof window !== 'undefined';
}

function isLoginRequest(input: RequestInfo | URL): boolean {
    const urlStr = typeof input === 'string' ? input : input.toString();
    return urlStr.includes('/utilities/users/login') || urlStr.includes('/users/login');
}

function isHealthRequest(input: RequestInfo | URL): boolean {
    const urlStr = typeof input === 'string' ? input : input.toString();
    return urlStr.includes('/health');
}

function healthUrlFrom(input: RequestInfo | URL): string {
    const raw = typeof input === 'string' ? input : input.toString();

    try {
        const url = new URL(raw, isBrowser() ? window.location.origin : 'http://localhost');
        const apiIndex = url.pathname.indexOf('/api/');
        url.pathname = apiIndex >= 0 ? `${url.pathname.slice(0, apiIndex)}/api/health` : '/api/health';
        url.search = '';
        url.hash = '';

        if (!/^https?:\/\//i.test(raw) && isBrowser()) {
            return `${url.pathname}${url.search}${url.hash}`;
        }
        return url.toString();
    } catch {
        return '/api/health';
    }
}

function redirectToLogin() {
    if (!isBrowser() || window.location.pathname === '/login') return;

    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = '/login';
}

async function checkHealth(input: RequestInfo | URL): Promise<boolean> {
    if (healthCheckPromise) return healthCheckPromise;

    healthCheckPromise = fetch(healthUrlFrom(input), {
        method: 'GET',
        cache: 'no-store',
    })
        .then((response) => response.ok)
        .catch(() => false)
        .finally(() => {
            healthCheckPromise = null;
        });

    return healthCheckPromise;
}

async function redirectIfHealthFails(input: RequestInfo | URL) {
    if (!isBrowser() || isLoginRequest(input) || isHealthRequest(input)) return;

    const healthy = await checkHealth(input);
    if (!healthy) redirectToLogin();
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let response: Response;
    try {
        response = await fetch(input, init);
    } catch (error) {
        await redirectIfHealthFails(input);
        throw error;
    }

    if (response.status === 401) {
        if (!isLoginRequest(input)) redirectToLogin();
        return response;
    }

    if (response.status >= 500) {
        await redirectIfHealthFails(input);
    }

    return response;
}
