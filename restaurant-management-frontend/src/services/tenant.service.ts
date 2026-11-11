import { apiClient } from "@/services/api";
import { PaginatedResponse } from "@/types/api";
import {
  TenantItem,
  TenantSignupPayload,
  TenantSignupResponse,
  TenantUpdatePayload,
} from "@/types/tenant";

export const tenantService = {
  /**
   * Register a new business organization/tenant and initial owner
   * POST /tenants/signup
   */
  async signup(payload: TenantSignupPayload): Promise<TenantSignupResponse> {
    const response = await apiClient.post<TenantSignupResponse>(
      "/tenants/signup",
      payload
    );
    return response.data;
  },

  /**
   * Retrieve paginated tenants belonging to the authenticated user
   * GET /tenants
   */
  async getTenants(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<TenantItem>> {
    const response = await apiClient.get<PaginatedResponse<TenantItem>>("/tenants", {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Update tenant information
   * PUT /tenants/{tenant_id}
   */
  async updateTenant(
    tenantId: string,
    payload: TenantUpdatePayload
  ): Promise<TenantItem> {
    const response = await apiClient.put<TenantItem>(
      `/tenants/${encodeURIComponent(tenantId)}`,
      payload
    );
    return response.data;
  },

  /**
   * Delete / deactivate tenant
   * DELETE /tenants/{tenant_id}
   */
  async deleteTenant(
    tenantId: string
  ): Promise<{ message: string; tenant_id: string }> {
    const response = await apiClient.delete<{ message: string; tenant_id: string }>(
      `/tenants/${encodeURIComponent(tenantId)}`
    );
    return response.data;
  },
};

