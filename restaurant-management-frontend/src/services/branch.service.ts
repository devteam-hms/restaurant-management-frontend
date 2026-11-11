import { apiClient } from "@/services/api";
import { PaginatedResponse } from "@/types/api";
import {
  BranchItem,
  BranchResponse,
  CreateBranchPayload,
  UpdateBranchPayload,
} from "@/types/branch";

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
    const response = await apiClient.get<PaginatedResponse<BranchItem>>(
      "/branches",
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
  },

  /**
   * Create a new branch under a restaurant
   * POST /branches
   */
  async createBranch(payload: CreateBranchPayload): Promise<BranchResponse> {
    const response = await apiClient.post<BranchResponse>("/branches", payload);
    return response.data;
  },

  /**
   * Update branch details
   * PUT /branches/{branch_id}
   */
  async updateBranch(
    branchId: string,
    payload: UpdateBranchPayload
  ): Promise<BranchResponse> {
    const response = await apiClient.put<BranchResponse>(
      `/branches/${encodeURIComponent(branchId)}`,
      payload
    );
    return response.data;
  },

  /**
   * Delete branch (fails if dependent users are assigned)
   * DELETE /branches/{branch_id}
   */
  async deleteBranch(
    branchId: string
  ): Promise<{ message: string; branch_id: string }> {
    const response = await apiClient.delete<{
      message: string;
      branch_id: string;
    }>(`/branches/${encodeURIComponent(branchId)}`);
    return response.data;
  },
};

