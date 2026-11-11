import { apiClient } from "@/services/api";
import { LoginPayload, RefreshTokenPayload, TokenResponse } from "@/types/auth";
import { TokenStorage } from "@/lib/token-storage";

export const authService = {
  /**
   * Authenticate user with Keycloak credentials via backend POST /auth/login
   */
  async login(payload: LoginPayload): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>("/auth/login", payload);
    const data = response.data;

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
    }
    return data;
  },

  /**
   * Refresh access token via backend POST /auth/refresh
   */
  async refreshToken(payload: RefreshTokenPayload): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>("/auth/refresh", payload);
    const data = response.data;

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
    }
    return data;
  },

  /**
   * Clear local credentials
   */
  logout(): void {
    TokenStorage.clearAll();
  },

  /**
   * Get current stored authenticated user profile
   */
  getCurrentUser() {
    return TokenStorage.getUser();
  },

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return !!TokenStorage.getAccessToken();
  },
};

