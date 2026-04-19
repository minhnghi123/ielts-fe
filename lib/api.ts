import axios from 'axios';

/**
 * Central API client — all traffic goes through the API Gateway (port 5000).
 * All domain API modules (auth, tests, analytics, attempts) should import
 * this shared instance instead of creating their own.
 */
const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    timeout: 30_000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── Request Interceptor ─────────────────────────────────────────────────────
// Attach JWT from cookie before every request
apiClient.interceptors.request.use(
    (config) => {
        if (typeof document !== 'undefined') {
            const token = document.cookie
                .split(';')
                .reduce((acc, c) => {
                    const [k, v] = c.trim().split('=');
                    acc[k] = decodeURIComponent(v ?? '');
                    return acc;
                }, {} as Record<string, string>)['accessToken'];

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// ── Response Interceptor ────────────────────────────────────────────────────
// Global 401 handling — redirect to login
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                // Clear stale cookies and redirect
                document.cookie = 'accessToken=; Max-Age=0; path=/';
                document.cookie = 'user=; Max-Age=0; path=/';
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    },
);

export default apiClient;
