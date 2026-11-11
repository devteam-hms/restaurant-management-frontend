import { apiClient } from "@/services/api";
import { PaginatedResponse } from "@/types/api";
import {
  MenuItem,
  CreateMenuPayload,
  UpdateMenuPayload,
  GetMenusByBranchParams,
} from "@/types/menu";

export const menuService = {
  /**
   * Create a new menu item under a branch
   * POST /menus
   */
  async createMenu(payload: CreateMenuPayload): Promise<MenuItem> {
    const response = await apiClient.post<MenuItem>("/menus", payload);
    return response.data;
  },

  /**
   * Get all menus under a specific branch
   * GET /menus/branch/{branch_id}
   */
  async getMenusByBranch(
    branchId: string,
    params: GetMenusByBranchParams = {}
  ): Promise<PaginatedResponse<MenuItem>> {
    const response = await apiClient.get<PaginatedResponse<MenuItem>>(
      `/menus/branch/${encodeURIComponent(branchId)}`,
      {
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          status: params.status,
        },
      }
    );
    return response.data;
  },

  /**
   * Get a specific menu under a branch
   * GET /menus/branch/{branch_id}/{menu_id}
   */
  async getMenuUnderBranch(
    branchId: string,
    menuId: string
  ): Promise<MenuItem> {
    const response = await apiClient.get<MenuItem>(
      `/menus/branch/${encodeURIComponent(branchId)}/${encodeURIComponent(menuId)}`
    );
    return response.data;
  },

  /**
   * Update menu details under a branch
   * PUT /menus/branch/{branch_id}/{menu_id}
   */
  async updateMenu(
    branchId: string,
    menuId: string,
    payload: UpdateMenuPayload
  ): Promise<MenuItem> {
    const response = await apiClient.put<MenuItem>(
      `/menus/branch/${encodeURIComponent(branchId)}/${encodeURIComponent(menuId)}`,
      payload
    );
    return response.data;
  },

  /**
   * Delete a menu from a branch
   * DELETE /menus/branch/{branch_id}/{menu_id}
   */
  async deleteMenu(
    branchId: string,
    menuId: string
  ): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/menus/branch/${encodeURIComponent(branchId)}/${encodeURIComponent(menuId)}`
    );
    return response.data;
  },
};

