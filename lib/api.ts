import axios from 'axios';

// Centralized API client — all traffic goes through the API Gateway (port 5000)
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — attach JWT from cookie
api.interceptors.request.use(
    (config) => {
        if (typeof document !== 'undefined') {
            const cookies = document.cookie.split(';').reduce(
                (acc, c) => {
                    const [k, v] = c.trim().split('=');
                    acc[k] = v;
                    return acc;
                },
                {} as Record<string, string>,
            );
            const token = cookies['accessToken'];
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// Response interceptor — global 401 handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn('Unauthorized — redirecting to login...');
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    },
);

export default api;
