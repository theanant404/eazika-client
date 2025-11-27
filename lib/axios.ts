import axios, { isAxiosError, type InternalAxiosRequestConfig } from "axios";
import { useUserStore } from "@/hooks/useUserStore";
import { API_BASE_URL } from "@/lib/utils/constants"; // CHANGED: Import from constants

declare module "axios" {
  export interface AxiosRequestConfig {
    requiresAuth?: boolean;
    _retry?: boolean;
  }
  export interface InternalAxiosRequestConfig {
    requiresAuth?: boolean;
    _retry?: boolean;
  }
}

// CHANGED: We removed process.env here and use the constant instead
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// --- REQUEST INTERCEPTOR ---
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.requiresAuth === false) return config;

    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    if (token) {
      if (typeof config.headers?.set === "function") {
        config.headers.set("Authorization", `Bearer ${token}`);
      } else {
        config.headers = {
          ...(config.headers as Record<string, unknown>),
          Authorization: `Bearer ${token}`,
        } as typeof config.headers;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- RESPONSE INTERCEPTOR ---
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; 

      try {
        // Use fresh axios call to avoid infinite loop in interceptors
        // CHANGED: Use API_BASE_URL constant
        const refreshToken = localStorage.getItem("refreshToken");
        const response = await axios.post(`${API_BASE_URL}/users/refresh`, {
            refreshToken: refreshToken
        }, {
            withCredentials: true
        });

        const { accessToken } = response.data.data;

        localStorage.setItem("accessToken", accessToken);
        useUserStore.getState().setAuthToken(accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);

      } catch (refreshError) {
        console.warn("Session expired. Refresh failed. Logging out...");
        const { logout } = useUserStore.getState();
        await logout();
        
        if (typeof window !== "undefined") {
            window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    if (error.response) {
      console.warn("API Error:", error.response.data?.message || error.response.statusText);
    } else if (error.request) {
      console.warn("Network Error: Backend unreachable.");
    } else {
      console.warn("Request Error:", error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
export { isAxiosError };