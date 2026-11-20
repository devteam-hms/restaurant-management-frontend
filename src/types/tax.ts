export interface TaxConfigItem {
  id: string;
  name: string;
  tax_percentage: number;
  description?: string;
  is_active: boolean;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTaxConfigPayload {
  name: string;
  tax_percentage: number;
  description?: string;
  is_active?: boolean;
}

export interface UpdateTaxConfigPayload {
  name?: string;
  tax_percentage?: number;
  description?: string;
  is_active?: boolean;
}

