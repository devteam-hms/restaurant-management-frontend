import { apiClient, extractErrorMessage } from './api';
import { TenantItem, TenantUpdatePayload } from '@/types/tenant';
import { PaginatedResponse } from '@/types/api';
import { TokenStorage } from '@/lib/token-storage';

const DEMO_TENANT_DEFAULTS: Record<string, Partial<TenantItem>> = {
  'tenant-rms-001': {
    tenant_name: 'RMS Hospitality Group',
    description:
      'Premier luxury hospitality group orchestrating high-end fine dining and Michelin-inspired Indian regional concepts.',
  },
  'tenant-a': {
    tenant_name: 'The Bengal Table Hospitality',
    description:
      'Artisanal heritage culinary enterprise specializing in authentic Bengali slow-cooking, Awadhi dum delicacies, and colonial banquets.',
  },
  'tenant-b': {
    tenant_name: 'Royal Thali Restaurant Enterprises',
    description:
      'Grand multi-course traditional Indian thali house celebrating royal recipes from Gujarat, Rajasthan, and Western India.',
  },
};

function getDemoTenantKey(tenantId: string): string {
  return `rms_demo_tenant_${tenantId}`;
}

export const tenantService = {
  /**
   * Fetch paginated tenants belonging to the authenticated user from GET /tenants
   */
  async getTenants(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<TenantItem>> {
    try {
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const response = await apiClient.get<PaginatedResponse<TenantItem>>('/tenants', {
        params: { page, limit },
      });
      return response.data;
    } catch (error: any) {
      const isNetworkErr = error?.code === 'ERR_NETWORK' || !error.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        const storedId = TokenStorage.getCurrentTenantId() || 'tenant-rms-001';
        const demo = this.getDemoTenant(storedId);
        return {
          data: [demo],
          total: 1,
          page: 1,
          limit: 10,
          total_pages: 1,
        };
      }
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Fetch single tenant profile by tenant ID.
   * Since the backend router provides paginated GET /tenants, we query GET /tenants and match by tenant_id.
   */
  async getTenantById(tenantId: string): Promise<TenantItem> {
    if (!tenantId) {
      throw new Error('Tenant ID is required to fetch tenant profile');
    }

    try {
      const listRes = await this.getTenants({ limit: 50 });
      const match = listRes.data.find((t: TenantItem) => t.tenant_id === tenantId);
      if (match) return match;
      if (listRes.data.length > 0) return listRes.data[0];
      throw new Error(`Tenant '${tenantId}' not found`);
    } catch (error: any) {
      const isNetworkErr = error?.code === 'ERR_NETWORK' || !error.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        return this.getDemoTenant(tenantId);
      }
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Update tenant organization profile via PUT /tenants/{tenant_id}
   */
  async updateTenant(tenantId: string, payload: TenantUpdatePayload): Promise<TenantItem> {
    if (!tenantId) {
      throw new Error('Tenant ID is required to update tenant profile');
    }

    try {
      const response = await apiClient.put<TenantItem>(`/tenants/${encodeURIComponent(tenantId)}`, {
        tenant_name: payload.tenant_name,
        description: payload.description,
      });
      return response.data;
    } catch (error: any) {
      const isNetworkErr = error?.code === 'ERR_NETWORK' || !error.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        const current = this.getDemoTenant(tenantId);
        const updated: TenantItem = {
          ...current,
          ...payload,
          updated_at: new Date().toISOString(),
        };
        this.saveDemoTenant(updated);
        return updated;
      }
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Delete tenant organization via DELETE /tenants/{tenant_id}
   */
  async deleteTenant(tenantId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/tenants/${encodeURIComponent(tenantId)}`);
    return response.data;
  },

  /**
   * Demo tenant retrieval fallback
   */
  getDemoTenant(tenantId: string): TenantItem {
    const defaults = DEMO_TENANT_DEFAULTS[tenantId] || {
      tenant_name: 'RMS Dining Enterprise',
      description: 'Enterprise multi-branch restaurant hospitality group.',
    };

    if (typeof window !== 'undefined') {
      try {
        const key = getDemoTenantKey(tenantId);
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn('Could not read demo tenant from localStorage', e);
      }
    }

    return {
      tenant_id: tenantId,
      tenant_name: defaults.tenant_name || 'RMS Dining Enterprise',
      description: defaults.description || 'Enterprise multi-branch restaurant hospitality group.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  saveDemoTenant(tenant: TenantItem): void {
    if (typeof window === 'undefined') return;
    try {
      const key = getDemoTenantKey(tenant.tenant_id);
      localStorage.setItem(key, JSON.stringify(tenant));
    } catch (e) {
      console.warn('Could not save demo tenant to localStorage', e);
    }
  },

  clearAllTenantData(): void {
    if (typeof window === 'undefined') return;
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('rms_demo_tenant_')) {
          localStorage.removeItem(k);
        }
      });
      TokenStorage.setCurrentTenantId(null);
      TokenStorage.setCurrentRestaurantId(null);
    } catch (e) {
      console.warn('Could not clear tenant localStorage data', e);
    }
  },
};
