import axios from "axios";

// Client-side only cookie handling
const getCookies = () => {
  if (typeof window !== "undefined") {
    return require("js-cookie").default;
  }
  return null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add interceptor to include token in requests
apiClient.interceptors.request.use((config) => {
  const Cookies = getCookies();
  if (Cookies) {
    const token = Cookies.get("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

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

export const authApi = {
  register: async (data: RegisterDto): Promise<RegisterResponse> => {
    const response = await apiClient.post("/auth/register", data);
    return response.data;
  },

  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/login", data);

    const Cookies = getCookies();
    if (response.data.data.accessToken && Cookies) {
      Cookies.set("accessToken", response.data.data.accessToken, {
        expires: 1,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      Cookies.set("user", JSON.stringify(response.data.data.user), {
        expires: 1,
      });
    }
    return response.data;
  },

  getProfile: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get("/auth/profile");
    return response.data;
  },

  logout: () => {
    const Cookies = getCookies();
    if (Cookies) {
      Cookies.remove("accessToken");
      Cookies.remove("user");
    }
  },

  getStoredUser: () => {
    const Cookies = getCookies();
    if (Cookies) {
      const user = Cookies.get("user");
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  isAuthenticated: () => {
    const Cookies = getCookies();
    return Cookies ? !!Cookies.get("accessToken") : false;
  },
};
