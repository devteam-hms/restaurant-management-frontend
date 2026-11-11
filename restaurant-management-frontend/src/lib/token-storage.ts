/**
 * Token Storage Utility
 *
 * NOTE ON SECURITY ARCHITECTURE:
 * The backend REST API uses Bearer token authorization in headers (Authorization: Bearer <token>)
 * and does not issue HttpOnly Set-Cookie headers.
 * To provide the safest possible client-side storage, tokens are stored in Cookies
 * with SameSite=Lax and Secure attributes (when HTTPS), allowing both client-side
 * and Next.js server components / middleware to access tokens while maintaining compatibility
 * with standard browser environments.
 *
 * NOTE: Passwords are NEVER persisted. Keycloak client secrets are NEVER embedded.
 */

const ACCESS_TOKEN_KEY = "rms_access_token";
const REFRESH_TOKEN_KEY = "rms_refresh_token";
const USER_KEY = "rms_user";
const CURRENT_TENANT_ID_KEY = "rms_current_tenant_id";
const CURRENT_RESTAURANT_ID_KEY = "rms_current_restaurant_id";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

function setCookie(name: string, value: string, maxAgeSeconds: number = 86400 * 7): void {
  if (typeof document === "undefined") return;
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  const secureFlag = isSecure ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secureFlag}`;
}

function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export const TokenStorage = {
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return getCookie(ACCESS_TOKEN_KEY) || localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  setAccessToken(token: string, expiresInSeconds: number = 3600): void {
    if (typeof window === "undefined") return;
    setCookie(ACCESS_TOKEN_KEY, token, expiresInSeconds);
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return getCookie(REFRESH_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken(token: string, expiresInSeconds: number = 86400 * 7): void {
    if (typeof window === "undefined") return;
    setCookie(REFRESH_TOKEN_KEY, token, expiresInSeconds);
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  getUser(): any | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setUser(user: any): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {}
  },

  getCurrentTenantId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(CURRENT_TENANT_ID_KEY);
  },

  setCurrentTenantId(tenantId: string | null): void {
    if (typeof window === "undefined") return;
    if (tenantId) {
      localStorage.setItem(CURRENT_TENANT_ID_KEY, tenantId);
    } else {
      localStorage.removeItem(CURRENT_TENANT_ID_KEY);
    }
  },

  getCurrentRestaurantId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(CURRENT_RESTAURANT_ID_KEY);
  },

  setCurrentRestaurantId(restaurantId: string | null): void {
    if (typeof window === "undefined") return;
    if (restaurantId) {
      localStorage.setItem(CURRENT_RESTAURANT_ID_KEY, restaurantId);
    } else {
      localStorage.removeItem(CURRENT_RESTAURANT_ID_KEY);
    }
  },

  clearAll(): void {
    if (typeof window === "undefined") return;
    deleteCookie(ACCESS_TOKEN_KEY);
    deleteCookie(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(CURRENT_TENANT_ID_KEY);
    localStorage.removeItem(CURRENT_RESTAURANT_ID_KEY);
  },
};

