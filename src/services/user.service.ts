import { apiClient, extractErrorMessage } from './api';
import { PaginatedResponse } from '@/types/api';
import { GetUsersParams, UserItem } from '@/types/user';

export const userService = {
  /**
   * Retrieve paginated user information
   * GET /users
   */
  async getUsers(params: GetUsersParams = {}): Promise<PaginatedResponse<UserItem>> {
    try {
      const response = await apiClient.get<PaginatedResponse<UserItem>>('/users', {
        params: {
          page: params.page || 1,
          limit: params.limit || 50,
          tenant_id: params.tenant_id,
          role: params.role,
        },
      });
      return response.data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Change user assigned branch
   * PUT /users/{user_id}/branch
   */
  async updateUserBranch(userId: string, branchId: string): Promise<UserItem> {
    try {
      const response = await apiClient.put<UserItem>(
        `/users/${encodeURIComponent(userId)}/branch`,
        { branch_id: branchId }
      );
      return response.data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Delete a user across MongoDB and Keycloak
   * DELETE /users/{user_id}
   */
  async deleteUser(userId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(
        `/users/${encodeURIComponent(userId)}`
      );
      return response.data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err));
    }
  },
};

