export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const response = await fetch(input, init);

    if (response.status === 401) {
        const urlStr = typeof input === 'string' ? input : input.toString();
        
        // Don't intercept 401s for the login endpoint to allow proper error handling there
        const isLoginRequest =
            urlStr.includes('/utilities/users/login') || urlStr.includes('/users/login');
        if (!isLoginRequest && typeof window !== 'undefined') {
            if (window.location.pathname !== '/login') {
                // Clear local storage auth data
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
                
                // Clear js-cookie if possible by setting expiration to past
                document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                
                // Redirect to login page
                window.location.href = '/login';
            }
        }
    }

    return response;
}
