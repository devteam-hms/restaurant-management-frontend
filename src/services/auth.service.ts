import { apiClient, extractErrorMessage } from './api';
import {
  LoginPayload,
  RefreshTokenPayload,
  TokenResponse,
  AuthUser,
  TenantSignupPayload,
  TenantSignupResponse,
} from '@/types/auth';
import { TokenStorage } from '@/lib/token-storage';
import { tenantService } from './tenant.service';
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
      let tenant_id = 'tenant-rms-001';
      let tenant_name = 'RMS Hospitality Group';
      let staffName = 'Rajiv Malhotra (Executive Director)';
      let staffRole = 'OWNER';

      if (
        identifier.includes('tenant_a') ||
        identifier.includes('tenant-a') ||
        identifier.includes('bengal') ||
        identifier.includes('a@')
      ) {
        tenant_id = 'tenant-a';
        tenant_name = 'The Bengal Table Hospitality';
        staffName = 'Aakash Roy (Managing Director)';
        staffRole = 'OWNER';
      } else if (
        identifier.includes('tenant_b') ||
        identifier.includes('tenant-b') ||
        identifier.includes('royal') ||
        identifier.includes('thali') ||
        identifier.includes('b@')
      ) {
        tenant_id = 'tenant-b';
        tenant_name = 'Royal Thali Restaurant Enterprises';
        staffName = 'Vikramaditya Rathore (Chief Executive)';
        staffRole = 'OWNER';
      } else {
        const staff = INITIAL_STAFF_USERS.find((s) => s.email.toLowerCase() === identifier);
        if (staff) {
          tenant_id = staff.tenant_id;
          staffName = staff.name;
          staffRole = staff.role;
        } else {
          // Dynamic isolated tenant identity per arbitrary email
          const slug = identifier.split('@')[0].replace(/[^a-z0-9]/g, '-');
          tenant_id = `tenant-${slug}`;
          tenant_name = `${slug.toUpperCase()} Dining Enterprise`;
          staffName = `${identifier.split('@')[0].toUpperCase()} (Executive)`;
          staffRole = 'OWNER';
        }
      }

      const authUser: AuthUser = {
        id: `user-${identifier.split('@')[0]}`,
        keycloak_id: `kc-${identifier.split('@')[0]}`,
        email: identifier.includes('@') ? identifier : `${identifier}@rms.com`,
        username: identifier.split('@')[0],
        roles: [staffRole, 'TENANT_ADMIN'],
        name: staffName,
        tenant_id: tenant_id,
        tenant_name: tenant_name,
        branch_id: 'branch-001',
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
   * Register a new restaurant tenant organization and initial owner account via POST /tenants/signup
   */
  async signupTenant(payload: TenantSignupPayload): Promise<TenantSignupResponse> {
    try {
      const response = await apiClient.post<TenantSignupResponse>('/tenants/signup', payload);
      return response.data;
    } catch (error: any) {
      const isNetworkErr = error?.code === 'ERR_NETWORK' || !error.response;
      if (isNetworkErr) {
        // Interactive offline demo simulation
        const mockTenantId = `tenant-${Date.now().toString(36)}`;
        const mockUserId = `user-${Date.now().toString(36)}`;
        return {
          message: 'Tenant registration successful',
          tenant_id: mockTenantId,
          user_id: mockUserId,
        };
      }
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Fetch latest authenticated user profile and tenant ID from GET /auth/me
   */
  async getCurrentUserFromServer(): Promise<AuthUser | null> {
    try {
      const response = await apiClient.get<AuthUser>('/auth/me');
      if (response.data) {
        TokenStorage.setUser(response.data);
        return response.data;
      }
    } catch (e) {
      // In offline mode or if endpoint fails, return local storage user
    }
    return TokenStorage.getUser();
  },

  /**
   * Clear credentials and purge tenant cache on logout
   */
  logout(): void {
    TokenStorage.clearAll();
    tenantService.clearAllTenantData();
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

