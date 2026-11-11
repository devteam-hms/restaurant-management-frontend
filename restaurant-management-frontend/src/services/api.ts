import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { TokenStorage } from "@/lib/token-storage";
import { TokenResponse } from "@/types/auth";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Flag and queue to prevent multiple concurrent token refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: attach Bearer access token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = TokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: handle 401 token refresh & normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const url = originalRequest.url || "";

    // Do not attempt token refresh for login, refresh, or signup endpoints
    const isAuthEndpoint =
      url.includes("/auth/login") ||
      url.includes("/auth/refresh") ||
      url.includes("/tenants/signup");

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(apiClient(originalRequest));
            },
            reject: (err) => reject(err),
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = TokenStorage.getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        TokenStorage.clearAll();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<TokenResponse>(
          `${API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        if (data.access_token) {
          TokenStorage.setAccessToken(data.access_token, data.expires_in);
          if (data.refresh_token) {
            TokenStorage.setRefreshToken(
              data.refresh_token,
              data.refresh_expires_in || 604800
            );
          }
          if (data.user) {
            TokenStorage.setUser(data.user);
          }

          processQueue(null, data.access_token);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          }
          return apiClient(originalRequest);
        } else {
          throw new Error("No access token in refresh response");
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        TokenStorage.clearAll();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Extracts a user-friendly error message from FastAPI error responses.
 */
export function extractErrorMessage(error: any): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data) {
      if (typeof data.detail === "string") {
        return data.detail;
      }
      if (Array.isArray(data.detail)) {
        // FastAPI 422 validation errors array
        return data.detail
          .map((item: any) => {
            const loc = Array.isArray(item.loc)
              ? item.loc.filter((p: any) => p !== "body").join(".")
              : "";
            return loc ? `${loc}: ${item.msg}` : item.msg;
          })
          .join(", ");
      }
      if (typeof data.message === "string") {
        return data.message;
      }
    }

    if (error.response?.status === 401) {
      return "Invalid credentials or your session has expired. Please log in again.";
    }
    if (error.response?.status === 403) {
      return "Access denied: You do not have permission to perform this action.";
    }
    if (error.response?.status === 404) {
      return "The requested resource was not found.";
    }
    if (error.response?.status === 409) {
      return (
        data?.detail ||
        "Resource conflict: Dependent records exist or duplicate entry detected."
      );
    }
    if (error.response?.status === 502) {
      return "Identity provider error: Unable to communicate with Keycloak.";
    }
    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

