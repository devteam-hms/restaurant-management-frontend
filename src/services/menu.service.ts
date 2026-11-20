import { apiClient, extractErrorMessage } from './api';
import { PaginatedResponse } from '@/types/api';
import {
  MenuItem,
  CreateMenuPayload,
  UpdateMenuPayload,
  GetMenusByBranchParams,
} from '@/types/menu';
import { INITIAL_MENUS } from './mockData';

const MENUS_STORAGE_KEY = 'rms_menus_cache';

function getStoredMenus(): MenuItem[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(MENUS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read menus from localStorage:', e);
    }
  }
  return [...INITIAL_MENUS];
}

function saveMenus(menus: MenuItem[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(MENUS_STORAGE_KEY, JSON.stringify(menus));
    } catch (e) {
      console.warn('Could not save menus to localStorage:', e);
    }
  }
}

let menusCache = getStoredMenus();

export const menuService = {
  /**
   * Create a new menu item under a branch
   * POST /menus
   */
  async createMenu(payload: CreateMenuPayload): Promise<MenuItem> {
    try {
      const response = await apiClient.post<MenuItem>('/menus', {
        branch_id: payload.branch_id,
        menu_name: payload.menu_name,
        image: payload.image,
        short_description: payload.short_description,
        long_description: payload.long_description || payload.short_description,
        price: Number(payload.price),
        availability: Boolean(payload.availability),
      });
      return response.data;
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        const newMenu: MenuItem = {
          id: `menu-${Date.now()}`,
          branch_id: payload.branch_id,
          menu_name: payload.menu_name,
          image: payload.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
          short_description: payload.short_description,
          long_description: payload.long_description || payload.short_description,
          price: payload.price,
          category: payload.category || 'Mains',
          is_signature: payload.is_signature ?? false,
          dietary_tags: payload.dietary_tags || [],
          status: payload.availability ? 1 : 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        menusCache.unshift(newMenu);
        saveMenus(menusCache);
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
            limit: params.limit || 50,
            ...(params.status !== undefined ? { status: params.status } : {}),
          },
        }
      );
      if (response.data && Array.isArray(response.data.data)) {
        const otherBranchItems = menusCache.filter(m => m.branch_id !== branchId);
        menusCache = [...otherBranchItems, ...response.data.data];
        saveMenus(menusCache);
      }
      return response.data;
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        let items = menusCache.filter(m => m.branch_id === branchId);
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
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        const found = menusCache.find(m => m.id === menuId);
        if (found) return found;
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Update a menu item under a branch
   * PUT /menus/branch/{branch_id}/{menu_id}
   */
  async updateMenu(
    arg1: string,
    arg2: string | UpdateMenuPayload,
    arg3?: UpdateMenuPayload
  ): Promise<MenuItem> {
    let branchId: string | undefined;
    let menuId: string;
    let payload: UpdateMenuPayload;

    if (typeof arg2 === 'string') {
      branchId = arg1;
      menuId = arg2;
      payload = arg3 || {};
    } else {
      menuId = arg1;
      payload = arg2 || {};
      branchId = (payload as any).branch_id;
    }

    if (!branchId) {
      const found = menusCache.find((m) => m.id === menuId);
      branchId = found?.branch_id;
    }

    const endpoint = branchId
      ? `/menus/branch/${encodeURIComponent(branchId)}/${encodeURIComponent(menuId)}`
      : `/menus/${encodeURIComponent(menuId)}`;

    try {
      const response = await apiClient.put<MenuItem>(
        endpoint,
        {
          menu_name: payload.menu_name,
          image: payload.image,
          short_description: payload.short_description,
          long_description: payload.long_description,
          price: payload.price !== undefined ? Number(payload.price) : undefined,
          status: payload.status,
        }
      );
      return response.data;
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        const idx = menusCache.findIndex(m => m.id === menuId);
        if (idx !== -1) {
          menusCache[idx] = {
            ...menusCache[idx],
            ...payload,
            updated_at: new Date().toISOString(),
          };
          saveMenus(menusCache);
          return menusCache[idx];
        }
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Delete a menu item from a branch
   * DELETE /menus/branch/{branch_id}/{menu_id}
   */
  async deleteMenu(arg1: string, arg2?: string): Promise<{ message: string }> {
    let branchId: string | undefined;
    let menuId: string;

    if (arg2) {
      branchId = arg1;
      menuId = arg2;
    } else {
      menuId = arg1;
      const found = menusCache.find((m) => m.id === menuId);
      branchId = found?.branch_id;
    }

    const endpoint = branchId
      ? `/menus/branch/${encodeURIComponent(branchId)}/${encodeURIComponent(menuId)}`
      : `/menus/${encodeURIComponent(menuId)}`;

    try {
      const response = await apiClient.delete<{ message: string }>(endpoint);
      return response.data;
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        menusCache = menusCache.filter(m => m.id !== menuId);
        saveMenus(menusCache);
        return { message: 'Menu item deleted successfully.' };
      }
      throw new Error(extractErrorMessage(err));
    }
  },
};
