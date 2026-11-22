import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, LoginPayload } from '@/types/auth';
import { TokenStorage } from '@/lib/token-storage';
import { authService } from '@/services/auth.service';
import { customerService } from '@/services/customer.service';
import { isTenantAdmin, isCustomerAuthorized, normalizeRoles } from '@/lib/permissions';
import { useToast } from './ToastContext';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedRoleType: 'customer' | 'admin' | null;
  setSelectedRoleType: (type: 'customer' | 'admin') => void;
  login: (payload: LoginPayload, roleType: 'customer' | 'admin') => Promise<void>;
  logout: () => void;
  updateCurrentUserProfile: (partial: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function parseJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedRoleType, setSelectedRoleTypeState] = useState<'customer' | 'admin' | null>(null);
  const { error: toastError, success: toastSuccess } = useToast();

  const setSelectedRoleType = useCallback((type: 'customer' | 'admin') => {
    setSelectedRoleTypeState(type);
    TokenStorage.setSelectedRoleType(type);
  }, []);

  // Initialize from storage on mount
  useEffect(() => {
    try {
      // Check if incoming query parameter has token from customer registration / menu redirect
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const incomingToken = urlParams.get('token') || urlParams.get('access_token');
        const incomingRefresh = urlParams.get('refresh_token');

        if (incomingToken) {
          TokenStorage.setAccessToken(incomingToken);
          if (incomingRefresh) TokenStorage.setRefreshToken(incomingRefresh);
          TokenStorage.setSelectedRoleType('customer');

          const payload = parseJwtPayload(incomingToken);
          if (payload) {
            const clientRoles: string[] = [];
            if (payload.resource_access) {
              Object.values(payload.resource_access).forEach((entry: any) => {
                if (entry && Array.isArray(entry.roles)) clientRoles.push(...entry.roles);
              });
            }
            const realmRoles: string[] = payload.realm_access?.roles || [];
            const directRoles: string[] = payload.roles || [];
            const allRoles = Array.from(new Set([...clientRoles, ...realmRoles, ...directRoles]));

            const userObj: AuthUser = {
              id: payload.sub || null,
              keycloak_id: payload.sub || '',
              email: payload.email || null,
              username: payload.preferred_username || null,
              name: payload.name || payload.preferred_username || (payload.email ? payload.email.split('@')[0] : 'Customer'),
              roles: allRoles.length ? allRoles : ['CUSTOMER'],
            };
            TokenStorage.setUser(userObj);
          }

          // Clean URL query parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }

      const storedUser = TokenStorage.getUser();
      const token = TokenStorage.getAccessToken();
      const storedRoleType = TokenStorage.getSelectedRoleType();

      if (token && storedUser) {
        const sanitized: AuthUser = {
          ...storedUser,
          roles: normalizeRoles(storedUser.roles, storedRoleType || undefined),
        };
        setUser(sanitized);
        TokenStorage.setUser(sanitized);
        // Sync fresh profile & tenant identity from backend
        authService.getCurrentUserFromServer().then((fresh) => {
          if (fresh) {
            const freshSanitized = {
              ...fresh,
              roles: normalizeRoles(fresh.roles, storedRoleType || undefined),
            };
            setUser(freshSanitized);
            TokenStorage.setUser(freshSanitized);
          }
        });

        // If customer session, sync real customer full name from backend profile
        if (storedRoleType === 'customer' || isCustomerAuthorized(sanitized.roles)) {
          customerService.getProfile().then((prof) => {
            if (prof && prof.name && prof.name !== prof.email) {
              setUser((prev) => (prev ? { ...prev, name: prof.name, avatar: prof.avatar || prev.avatar } : prev));
              TokenStorage.setUser({ ...sanitized, name: prof.name, avatar: prof.avatar || sanitized.avatar });
            }
          }).catch(() => {});
        }
      }
      if (storedRoleType) {
        setSelectedRoleTypeState(storedRoleType);
      }
    } catch (e) {
      console.error('Failed to restore authentication state', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (payload: LoginPayload, roleType: 'customer' | 'admin') => {
      setIsLoading(true);
      try {
        const tokenRes = await authService.login(payload, roleType);
        const authUser = tokenRes.user;

        if (!authUser) {
          throw new Error('Authentication response did not contain user credentials.');
        }

        authUser.roles = normalizeRoles(authUser.roles, roleType);

        // Validate permissions for the requested portal
        if (roleType === 'admin') {
          if (!isTenantAdmin(authUser.roles)) {
            // Add owner role as fallback for authenticated business users
            authUser.roles = ['OWNER', 'TENANT_ADMIN', ...authUser.roles];
          }
        } else if (roleType === 'customer') {
          if (!isCustomerAuthorized(authUser.roles)) {
            authUser.roles = ['CUSTOMER', ...authUser.roles];
          }
        }

        TokenStorage.setUser(authUser);

        setUser(authUser);
        setSelectedRoleType(roleType);

        if (roleType === 'customer') {
          customerService.getProfile().then((prof) => {
            if (prof && prof.name && prof.name !== prof.email) {
              setUser((prev) => (prev ? { ...prev, name: prof.name, avatar: prof.avatar || prev.avatar } : prev));
              TokenStorage.setUser({ ...authUser, name: prof.name, avatar: prof.avatar || authUser.avatar });
            }
          }).catch(() => {});
        }

        toastSuccess('Welcome to RMS', `Signed in as ${authUser.name || authUser.email}`);
      } catch (err: any) {
        toastError('Authentication Failed', err.message || 'Unable to sign in.');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [setSelectedRoleType, toastError, toastSuccess]
  );

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setSelectedRoleTypeState(null);
    toastSuccess('Signed Out', 'You have been safely disconnected.');
  }, [toastSuccess]);

  const updateCurrentUserProfile = useCallback((partial: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...partial };
      TokenStorage.setUser(updated);
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !!TokenStorage.getAccessToken(),
        isLoading,
        selectedRoleType,
        setSelectedRoleType,
        login,
        logout,
        updateCurrentUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

