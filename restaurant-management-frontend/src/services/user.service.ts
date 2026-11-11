import { apiClient } from "@/services/api";
import { PaginatedResponse } from "@/types/api";
import { GetUsersParams, UserItem } from "@/types/user";

export const userService = {
  /**
   * Retrieve paginated user information
   * GET /users
   */
  async getUsers(params: GetUsersParams = {}): Promise<PaginatedResponse<UserItem>> {
    const response = await apiClient.get<PaginatedResponse<UserItem>>("/users", {
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        tenant_id: params.tenant_id,
        role: params.role,
      },
    });
    return response.data;
  },

  /**
   * Delete a user across MongoDB and Keycloak
   * DELETE /users/{user_id}
   */
  async deleteUser(userId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/users/${encodeURIComponent(userId)}`
    );
    return response.data;
  },
};

