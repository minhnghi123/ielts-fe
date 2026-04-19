import apiClient from '@/lib/api';

// ─── Cookie Helpers ───────────────────────────────────────────────────────────

function setCookie(name: string, value: string, days = 1) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/${secure}; SameSite=Lax`;
}

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(
        new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'),
    );
    return match ? decodeURIComponent(match[1]) : null;
}

function removeCookie(name: string) {
    document.cookie = `${name}=; Max-Age=0; path=/`;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface RegisterDto {
    email: string;
    password: string;
    confirmPassword: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface AuthResponse {
    statusCode: number;
    message: string;
    data: {
        accessToken: string;
        user: {
            id: string;
            email: string;
            role: string;
            profileId: string;
        };
    };
}

export interface RegisterResponse {
    statusCode: number;
    message: string;
    data: {
        id: string;
        email: string;
        status: string;
        createdAt: string;
    };
}

export interface ProfileResponse {
    statusCode: number;
    message: string;
    data: {
        id: string;
        email: string;
        role: string;
        profileId: string;
    };
}

// ─── API ───────────────────────────────────────────────────────────────────────

export const authApi = {
    register: async (data: RegisterDto): Promise<RegisterResponse> => {
        const response = await apiClient.post('/api/auth/register', data);
        return response.data;
    },

    /**
     * Login and persist both cookies so:
     * - middleware reads them server-side (accessToken / user)
     * - Zustand auth store reads them on mount
     */
    login: async (data: LoginDto): Promise<AuthResponse> => {
        const response = await apiClient.post('/api/auth/login', data);
        const body: AuthResponse = response.data;

        if (body?.data?.accessToken) {
            setCookie('accessToken', body.data.accessToken, 1);
            setCookie('user', JSON.stringify(body.data.user), 1);
        }

        return body;
    },

    google: async (accessToken: string): Promise<AuthResponse> => {
        const response = await apiClient.post('/api/auth/google', { access_token: accessToken });
        const body: AuthResponse = response.data;

        if (body?.data?.accessToken) {
            setCookie('accessToken', body.data.accessToken, 1);
            setCookie('user', JSON.stringify(body.data.user), 1);
        }

        return body;
    },

    getProfile: async (): Promise<ProfileResponse> => {
        const response = await apiClient.get('/api/auth/profile');
        return response.data;
    },

    logout: () => {
        removeCookie('accessToken');
        removeCookie('user');
    },

    getStoredUser: () => {
        const raw = getCookie('user');
        return raw ? JSON.parse(raw) : null;
    },

    updateStoredUser: (user: any) => {
        setCookie('user', JSON.stringify(user), 1);
    },

    isAuthenticated: () => {
        return !!getCookie('accessToken');
    },
};
