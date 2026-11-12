import { apiClient, extractErrorMessage } from './api';
import { PaginatedResponse } from '@/types/api';
import {
  BranchItem,
  BranchResponse,
  CreateBranchPayload,
  UpdateBranchPayload,
} from '@/types/branch';
import { INITIAL_BRANCHES } from './mockData';

let branchesCache = [...INITIAL_BRANCHES];

export const branchService = {
  /**
   * Retrieve paginated branches, optionally filtered by restaurant_id or tenant_id
   * GET /branches
   */
  async getBranches(params?: {
    page?: number;
    limit?: number;
    restaurant_id?: string;
    tenant_id?: string;
  }): Promise<PaginatedResponse<BranchItem>> {
    try {
      const response = await apiClient.get<PaginatedResponse<BranchItem>>(
        '/branches',
        {
          params: {
            page: params?.page ?? 1,
            limit: params?.limit ?? 10,
            ...(params?.restaurant_id
              ? { restaurant_id: params.restaurant_id }
              : {}),
            ...(params?.tenant_id ? { tenant_id: params.tenant_id } : {}),
          },
        }
      );
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        let filtered = branchesCache;
        if (params?.restaurant_id) {
          filtered = filtered.filter(b => b.restaurant_id === params.restaurant_id);
        }
        return {
          data: filtered,
          total: filtered.length,
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          total_pages: Math.ceil(filtered.length / (params?.limit ?? 10)) || 1,
        };
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Create a new branch under a restaurant
   * POST /branches
   */
  async createBranch(payload: CreateBranchPayload): Promise<BranchResponse> {
    try {
      const response = await apiClient.post<BranchResponse>('/branches', payload);
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        const newBranch: BranchItem = {
          branch_id: `branch-${Date.now()}`,
          restaurant_id: payload.restaurant_id,
          branch_name: payload.branch_name,
          address: payload.address,
          city: payload.city,
          state: payload.state,
          email: payload.email,
          phone: payload.phone,
          opening_hours: payload.opening_hours || '18:00 – 23:30',
          capacity: payload.capacity || 60,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        branchesCache.unshift(newBranch);
        return {
          id: newBranch.branch_id,
          restaurant_id: newBranch.restaurant_id,
          branch_name: newBranch.branch_name,
          address: newBranch.address,
          city: newBranch.city,
          state: newBranch.state,
          email: newBranch.email,
          phone: newBranch.phone || '',
          created_at: newBranch.created_at,
          updated_at: newBranch.updated_at,
        };
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Update branch details
   * PUT /branches/{branch_id}
   */
  async updateBranch(
    branchId: string,
    payload: UpdateBranchPayload
  ): Promise<BranchResponse> {
    try {
      const response = await apiClient.put<BranchResponse>(
        `/branches/${encodeURIComponent(branchId)}`,
        payload
      );
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        const idx = branchesCache.findIndex(b => b.branch_id === branchId);
        if (idx !== -1) {
          branchesCache[idx] = {
            ...branchesCache[idx],
            ...payload,
            updated_at: new Date().toISOString(),
          };
          const b = branchesCache[idx];
          return {
            id: b.branch_id,
            restaurant_id: b.restaurant_id,
            branch_name: b.branch_name,
            address: b.address,
            city: b.city,
            state: b.state,
            email: b.email,
            phone: b.phone || '',
            created_at: b.created_at,
            updated_at: b.updated_at,
          };
        }
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Delete branch
   * DELETE /branches/{branch_id}
   */
  async deleteBranch(
    branchId: string
  ): Promise<{ message: string; branch_id: string }> {
    try {
      const response = await apiClient.delete<{
        message: string;
        branch_id: string;
      }>(`/branches/${encodeURIComponent(branchId)}`);
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        branchesCache = branchesCache.filter(b => b.branch_id !== branchId);
        return { message: 'Branch removed successfully', branch_id: branchId };
      }
      throw new Error(extractErrorMessage(err));
    }
  },
};
