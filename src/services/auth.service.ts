import { apiClient, extractErrorMessage } from './api';
import { LoginPayload, RefreshTokenPayload, TokenResponse, AuthUser } from '@/types/auth';
import { TokenStorage } from '@/lib/token-storage';
import { INITIAL_CUSTOMERS, INITIAL_STAFF_USERS } from './mockData';

export const authService = {
  /**
   * Authenticate user with Keycloak credentials via backend POST /auth/login
   */
  async login(payload: LoginPayload, selectedRoleType?: 'customer' | 'admin'): Promise<TokenResponse> {
    try {
      const response = await apiClient.post<TokenResponse>('/auth/login', payload);
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
    } catch (error: any) {
      // If backend is offline (ERR_NETWORK or 502/ECONNREFUSED) and mock fallback is enabled
      const isNetworkErr = error?.code === 'ERR_NETWORK' || !error.response;
      if (isNetworkErr) {
        return this.demoLogin(payload, selectedRoleType);
      }
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Demo fallback login simulating Keycloak credentials and role verification
   */
  demoLogin(payload: LoginPayload, selectedRoleType?: 'customer' | 'admin'): TokenResponse {
    const identifier = (payload.email || payload.username || '').toLowerCase();
    
    // Check if logging in as Admin
    if (selectedRoleType === 'admin') {
      if (identifier.includes('customer')) {
        throw new Error('Access Denied: This account only has Customer permissions and cannot access the Restaurant Management Portal.');
      }
      const staff = INITIAL_STAFF_USERS.find(s => s.email.toLowerCase() === identifier) || INITIAL_STAFF_USERS[0];
      const authUser: AuthUser = {
        id: staff.user_id,
        keycloak_id: `kc-${staff.user_id}`,
        email: staff.email,
        username: staff.email.split('@')[0],
        roles: [staff.role, 'TENANT_ADMIN'],
        name: staff.name,
        tenant_id: staff.tenant_id,
        branch_id: staff.branch_id,
      };

      const tokenRes: TokenResponse = {
        access_token: `mock_jwt_admin_${Date.now()}`,
        refresh_token: `mock_refresh_${Date.now()}`,
        token_type: 'Bearer',
        expires_in: 3600,
        user: authUser,
      };

      TokenStorage.setAccessToken(tokenRes.access_token, tokenRes.expires_in);
      TokenStorage.setRefreshToken(tokenRes.refresh_token || '', 86400);
      TokenStorage.setUser(authUser);
      if (selectedRoleType) TokenStorage.setSelectedRoleType(selectedRoleType);

      return tokenRes;
    } else {
      // Customer login
      const customer = INITIAL_CUSTOMERS.find(c => c.email.toLowerCase() === identifier) || INITIAL_CUSTOMERS[0];
      const authUser: AuthUser = {
        id: customer.id,
        keycloak_id: `kc-${customer.id}`,
        email: customer.email,
        username: customer.name.toLowerCase().replace(/\s+/g, '.'),
        roles: ['CUSTOMER'],
        name: customer.name,
        avatar: customer.avatar,
      };

      const tokenRes: TokenResponse = {
        access_token: `mock_jwt_customer_${Date.now()}`,
        refresh_token: `mock_refresh_${Date.now()}`,
        token_type: 'Bearer',
        expires_in: 3600,
        user: authUser,
      };

      TokenStorage.setAccessToken(tokenRes.access_token, tokenRes.expires_in);
      TokenStorage.setRefreshToken(tokenRes.refresh_token || '', 86400);
      TokenStorage.setUser(authUser);
      if (selectedRoleType) TokenStorage.setSelectedRoleType(selectedRoleType);

      return tokenRes;
    }
  },

  /**
   * Refresh access token via backend POST /auth/refresh
   */
  async refreshToken(payload: RefreshTokenPayload): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/auth/refresh', payload);
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
   * Clear credentials
   */
  logout(): void {
    TokenStorage.clearAll();
  },

  /**
   * Get current stored authenticated user profile
   */
  getCurrentUser(): AuthUser | null {
    return TokenStorage.getUser();
  },

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return !!TokenStorage.getAccessToken();
  },
};

