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

export interface TenantItem {
  tenant_id: string;
  tenant_name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantUpdatePayload {
  tenant_name?: string;
  description?: string | null;
}

