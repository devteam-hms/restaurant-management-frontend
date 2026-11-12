import { apiClient, extractErrorMessage } from './api';
import { TenantItem, TenantUpdatePayload } from '@/types/tenant';
import { PaginatedResponse } from '@/types/api';

// Default isolated demo profile seed dictionary keyed strictly by tenant_id
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
      if (isNetworkErr) {
        return {
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          total_pages: 1,
        };
      }
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Fetch single tenant profile by tenant ID from GET /tenants/{tenant_id}
   */
  async getTenantById(tenantId: string): Promise<TenantItem> {
    if (!tenantId) {
      throw new Error('Tenant ID is required to fetch tenant profile');
    }

    try {
      // 1. Attempt single tenant endpoint GET /tenants/{tenant_id}
      const response = await apiClient.get<TenantItem>(`/tenants/${tenantId}`);
      return response.data;
    } catch (error: any) {
      const isNetworkErr = error?.code === 'ERR_NETWORK' || !error.response;
      if (isNetworkErr) {
        return this.getDemoTenant(tenantId);
      }

      // If backend single endpoint returned 404, fallback to GET /tenants listing
      if (error.response?.status === 404) {
        try {
          const listRes = await this.getTenants({ limit: 50 });
          const match = listRes.data.find((t: TenantItem) => t.tenant_id === tenantId);
          if (match) return match;
        } catch {
          // ignore fallback error and throw original
        }
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
      const response = await apiClient.put<TenantItem>(`/tenants/${tenantId}`, payload);
      return response.data;
    } catch (error: any) {
      const isNetworkErr = error?.code === 'ERR_NETWORK' || !error.response;
      if (isNetworkErr) {
        return this.updateDemoTenant(tenantId, payload);
      }
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Isolated demo tenant resolver: ensures Tenant A and Tenant B never share or leak state
   */
  getDemoTenant(tenantId: string): TenantItem {
    const key = getDemoTenantKey(tenantId);
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback to seed
        }
      }
    }

    const seed = DEMO_TENANT_DEFAULTS[tenantId] || {
      tenant_name: `${tenantId.replace('tenant-', '').toUpperCase()} Hospitality Group`,
      description: `Executive culinary and restaurant operations for enterprise ${tenantId}.`,
    };

    const newTenant: TenantItem = {
      tenant_id: tenantId,
      tenant_name: seed.tenant_name || `${tenantId} Dining Enterprise`,
      description: seed.description || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(key, JSON.stringify(newTenant));
    }

    return newTenant;
  },

  /**
   * Isolated demo tenant update: modifies only the specific tenant's session document
   */
  updateDemoTenant(tenantId: string, payload: TenantUpdatePayload): TenantItem {
    const current = this.getDemoTenant(tenantId);
    const updated: TenantItem = {
      ...current,
      ...(payload.tenant_name !== undefined ? { tenant_name: payload.tenant_name.trim() } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      updated_at: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(getDemoTenantKey(tenantId), JSON.stringify(updated));
    }

    return updated;
  },

  /**
   * Cleans up all tenant session data on logout to prevent cross-tenant leaks
   */
  clearAllTenantData(): void {
    if (typeof window === 'undefined') return;
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith('rms_demo_tenant_')) {
        sessionStorage.removeItem(k);
      }
    }
  },
};
