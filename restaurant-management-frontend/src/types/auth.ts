export interface AuthUser {
  id: string | null;
  keycloak_id: string;
  email: string | null;
  username: string | null;
  roles: string[];
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string | null;
  token_type: string;
  expires_in: number;
  refresh_expires_in?: number | null;
  scope?: string | null;
  user?: AuthUser | null;
}

export interface LoginPayload {
  email?: string;
  username?: string;
  password: string;
}

export interface RefreshTokenPayload {
  refresh_token: string;
}

