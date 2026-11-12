import { apiClient, extractErrorMessage } from './api';
import { PaginatedResponse } from '@/types/api';
import {
  MenuItem,
  CreateMenuPayload,
  UpdateMenuPayload,
  GetMenusByBranchParams,
} from '@/types/menu';
import { INITIAL_MENUS } from './mockData';

let menusCache = [...INITIAL_MENUS];

export const menuService = {
  /**
   * Create a new menu item under a branch
   * POST /menus
   */
  async createMenu(payload: CreateMenuPayload): Promise<MenuItem> {
    try {
      const response = await apiClient.post<MenuItem>('/menus', payload);
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        const newMenu: MenuItem = {
          id: `menu-${Date.now()}`,
          branch_id: payload.branch_id,
          menu_name: payload.menu_name,
          image: payload.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
          short_description: payload.short_description,
          long_description: payload.long_description,
          price: payload.price,
          category: payload.category || 'Mains',
          is_signature: payload.is_signature ?? false,
          dietary_tags: payload.dietary_tags || [],
          status: payload.availability ? 1 : 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        menusCache.unshift(newMenu);
        return newMenu;
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Get all menus under a specific branch
   * GET /menus/branch/{branch_id}
   */
  async getMenusByBranch(
    branchId: string,
    params: GetMenusByBranchParams = {}
  ): Promise<PaginatedResponse<MenuItem>> {
    try {
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
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        // If branch has items, return them. If not, provide some default luxury items for that branch
        let items = menusCache.filter(m => m.branch_id === branchId);
        if (items.length === 0) {
          // Provide general menu items assigned to this branch
          items = menusCache.map(m => ({ ...m, branch_id: branchId }));
        }
        if (params.category && params.category !== 'All') {
          items = items.filter(m => m.category === params.category);
        }
        if (params.status !== undefined) {
          items = items.filter(m => m.status === params.status);
        }
        return {
          data: items,
          total: items.length,
          page: params.page || 1,
          limit: params.limit || 10,
          total_pages: Math.ceil(items.length / (params.limit || 10)) || 1,
        };
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Get a specific menu under a branch
   * GET /menus/branch/{branch_id}/{menu_id}
   */
  async getMenuUnderBranch(
    branchId: string,
    menuId: string
  ): Promise<MenuItem> {
    try {
      const response = await apiClient.get<MenuItem>(
        `/menus/branch/${encodeURIComponent(branchId)}/${encodeURIComponent(menuId)}`
      );
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        const item = menusCache.find(m => m.id === menuId);
        if (item) return item;
      }
      throw new Error(extractErrorMessage(err));
    }
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
    try {
      const response = await apiClient.put<MenuItem>(
        `/menus/branch/${encodeURIComponent(branchId)}/${encodeURIComponent(menuId)}`,
        payload
      );
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        const idx = menusCache.findIndex(m => m.id === menuId);
        if (idx !== -1) {
          menusCache[idx] = {
            ...menusCache[idx],
            ...payload,
            updated_at: new Date().toISOString(),
          };
          return menusCache[idx];
        }
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Delete a menu from a branch
   * DELETE /menus/branch/{branch_id}/{menu_id}
   */
  async deleteMenu(
    branchId: string,
    menuId: string
  ): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(
        `/menus/branch/${encodeURIComponent(branchId)}/${encodeURIComponent(menuId)}`
      );
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        menusCache = menusCache.filter(m => m.id !== menuId);
        return { message: 'Menu item deleted successfully' };
      }
      throw new Error(extractErrorMessage(err));
    }
  },
};

