// Cookie helpers — work in any browser context without external deps
function setCookie(name: string, value: string, days = 1) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/${secure}; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function removeCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; path=/`;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

import axios from "axios";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Attach JWT on every request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = getCookie("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

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
    const response = await apiClient.post("/api/auth/register", data);
    return response.data;
  },

  /**
   * Login and persist both cookies so:
   * - middleware reads them server-side (accessToken / user)
   * - AuthContext reads them on mount
   * Returns the full auth response so callers can call setUser() directly.
   */
  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await apiClient.post("/api/auth/login", data);
    const body: AuthResponse = response.data;

    if (body?.data?.accessToken) {
      setCookie("accessToken", body.data.accessToken, 1);
      setCookie("user", JSON.stringify(body.data.user), 1);
    }

    return body;
  },

  getProfile: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get("/api/auth/profile");
    return response.data;
  },

  logout: () => {
    removeCookie("accessToken");
    removeCookie("user");
  },

  getStoredUser: () => {
    const raw = getCookie("user");
    return raw ? JSON.parse(raw) : null;
  },

  isAuthenticated: () => {
    return !!getCookie("accessToken");
  },
};
