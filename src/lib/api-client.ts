
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiClient<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }

    return data;
}

export const authApi = {
    login: (credentials: any) =>
        apiClient<any>('/users/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        }),
    getProfile: () => apiClient<any>('/users/profile'),
};
