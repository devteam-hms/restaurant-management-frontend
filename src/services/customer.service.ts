import { apiClient, extractErrorMessage } from './api';
import { CustomerProfile, UpdateCustomerProfilePayload } from '@/types/customer';
import { INITIAL_CUSTOMERS } from './mockData';

let customersCache = [...INITIAL_CUSTOMERS];

export const customerService = {
  /**
   * Get all registered customers (for Tenant Admin)
   * GET /customers
   */
  async getCustomers(): Promise<CustomerProfile[]> {
    try {
      const response = await apiClient.get<CustomerProfile[]>('/customers');
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        return customersCache;
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Get customer profile by ID (or currently logged-in customer profile)
   * GET /customers/{id}
   */
  async getProfile(customerId: string = 'cust-001'): Promise<CustomerProfile> {
    try {
      const response = await apiClient.get<CustomerProfile>(`/customers/${encodeURIComponent(customerId)}`);
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        const found = customersCache.find(c => c.id === customerId);
        return found || customersCache[0];
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Update personal details
   * PUT /customers/{id}
   */
  async updateProfile(customerId: string, payload: UpdateCustomerProfilePayload): Promise<CustomerProfile> {
    try {
      const response = await apiClient.put<CustomerProfile>(`/customers/${encodeURIComponent(customerId)}`, payload);
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        const idx = customersCache.findIndex(c => c.id === customerId);
        if (idx !== -1) {
          customersCache[idx] = {
            ...customersCache[idx],
            ...payload,
          };
          return customersCache[idx];
        }
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Upload / change profile picture
   * POST /customers/{id}/avatar
   */
  async uploadAvatar(customerId: string, avatarUrl: string): Promise<CustomerProfile> {
    try {
      const response = await apiClient.post<CustomerProfile>(`/customers/${encodeURIComponent(customerId)}/avatar`, {
        avatar: avatarUrl,
      });
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        const idx = customersCache.findIndex(c => c.id === customerId);
        if (idx !== -1) {
          customersCache[idx].avatar = avatarUrl;
          return customersCache[idx];
        }
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Remove profile picture
   * DELETE /customers/{id}/avatar
   */
  async removeAvatar(customerId: string): Promise<CustomerProfile> {
    try {
      const response = await apiClient.delete<CustomerProfile>(`/customers/${encodeURIComponent(customerId)}/avatar`);
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        const idx = customersCache.findIndex(c => c.id === customerId);
        if (idx !== -1) {
          delete customersCache[idx].avatar;
          return customersCache[idx];
        }
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Invite customer or staff member
   * POST /tenants/{tenant_id}/invitations
   */
  async inviteUser(tenantId: string, payload: { email: string; role: string; branch_id?: string }): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(
        `/tenants/${encodeURIComponent(tenantId)}/invitations`,
        payload
      );
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        return { message: `Invitation dispatched to ${payload.email} with role ${payload.role}.` };
      }
      throw new Error(extractErrorMessage(err));
    }
  },
};

