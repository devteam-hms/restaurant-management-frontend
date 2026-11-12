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

