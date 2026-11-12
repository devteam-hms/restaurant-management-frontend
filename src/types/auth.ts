export interface AuthUser {
  id: string | null;
  keycloak_id: string;
  email: string | null;
  username: string | null;
  roles: string[];
  name?: string | null;
  avatar?: string | null;
  tenant_id?: string | null;
  branch_id?: string | null;
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

export type UserTypeSelection = 'customer' | 'admin';

export interface OwnerSignupPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface TenantSignupPayload {
  tenant_name: string;
  owner: OwnerSignupPayload;
}

export interface TenantSignupResponse {
  message: string;
  tenant_id: string;
  user_id: string;
}
