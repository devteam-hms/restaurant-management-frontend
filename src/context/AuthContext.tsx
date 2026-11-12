import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, LoginPayload } from '@/types/auth';
import { TokenStorage } from '@/lib/token-storage';
import { authService } from '@/services/auth.service';
import { isTenantAdmin, isCustomerAuthorized } from '@/lib/permissions';
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
      const storedUser = TokenStorage.getUser();
      const token = TokenStorage.getAccessToken();
      const storedRoleType = TokenStorage.getSelectedRoleType();

      if (token && storedUser) {
        setUser(storedUser);
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

        // STRICT SECURITY REQUIREMENT:
        // Validate that actual Keycloak user roles match the requested portal
        if (roleType === 'admin') {
          if (!isTenantAdmin(authUser.roles)) {
            TokenStorage.clearAll();
            setUser(null);
            throw new Error(
              'Authorization Failed: You have selected the Tenant Admin Portal, but your authenticated Keycloak account is assigned role [' +
                authUser.roles.join(', ') +
                ']. Tenant Admin, Owner, or Manager privileges are required.'
            );
          }
        } else if (roleType === 'customer') {
          if (!isCustomerAuthorized(authUser.roles)) {
            TokenStorage.clearAll();
            setUser(null);
            throw new Error('Authorization Failed: Account not permitted in the dining portal.');
          }
        }

        setUser(authUser);
        setSelectedRoleType(roleType);
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

