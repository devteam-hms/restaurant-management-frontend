import { AuthUser } from '@/types/auth';

const ACCESS_TOKEN_KEY = 'rms_access_token';
const REFRESH_TOKEN_KEY = 'rms_refresh_token';
const USER_KEY = 'rms_user';
const SELECTED_ROLE_TYPE_KEY = 'rms_selected_role_type';

export const TokenStorage = {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  setAccessToken(token: string, _expiresIn?: number): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken(token: string, _refreshExpiresIn?: number): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  getUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setUser(user: AuthUser): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getSelectedRoleType(): 'customer' | 'admin' | null {
    if (typeof window === 'undefined') return null;
    return (localStorage.getItem(SELECTED_ROLE_TYPE_KEY) as 'customer' | 'admin') || null;
  },

  setSelectedRoleType(type: 'customer' | 'admin'): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SELECTED_ROLE_TYPE_KEY, type);
  },

  clearAll(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SELECTED_ROLE_TYPE_KEY);
  },
};

