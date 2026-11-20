import { apiClient, extractErrorMessage } from './api';
import { PaginatedResponse } from '@/types/api';
import {
  CreateRestaurantPayload,
  RestaurantItem,
  RestaurantResponse,
  UpdateRestaurantPayload,
} from '@/types/restaurant';
import { INITIAL_RESTAURANTS } from './mockData';

const RESTAURANT_METADATA_STORAGE_KEY = 'rms_restaurant_metadata';

export interface StoredRestaurantMeta {
  image?: string;
  cuisine?: string;
  address?: string;
}

export function getStoredRestaurantMetadata(): Record<string, StoredRestaurantMeta> {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(RESTAURANT_METADATA_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      console.warn('Could not read restaurant metadata from localStorage:', e);
    }
  }
  return {};
}

export function saveRestaurantMetadata(restaurantId: string, meta: StoredRestaurantMeta): void {
  if (!restaurantId) return;
  if (typeof window !== 'undefined') {
    try {
      const all = getStoredRestaurantMetadata();
      all[restaurantId] = {
        ...(all[restaurantId] || {}),
        ...meta,
      };
      localStorage.setItem(RESTAURANT_METADATA_STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn('Could not save restaurant metadata to localStorage:', e);
    }
  }
}

export function removeRestaurantMetadata(restaurantId: string): void {
  if (!restaurantId) return;
  if (typeof window !== 'undefined') {
    try {
      const all = getStoredRestaurantMetadata();
      delete all[restaurantId];
      localStorage.setItem(RESTAURANT_METADATA_STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn('Could not remove restaurant metadata from localStorage:', e);
    }
  }
}

let restaurantsCache = [...INITIAL_RESTAURANTS];

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85',
];

export const restaurantService = {
  /**
   * Retrieve paginated restaurants
   * GET /restaurants
   */
  async getRestaurants(params?: {
    page?: number;
    limit?: number;
    tenant_id?: string;
  }): Promise<PaginatedResponse<RestaurantItem>> {
    try {
      const response = await apiClient.get<PaginatedResponse<RestaurantItem>>(
        '/restaurants',
        {
          params: {
            page: params?.page ?? 1,
            limit: params?.limit ?? 50,
            ...(params?.tenant_id ? { tenant_id: params.tenant_id } : {}),
          },
        }
      );

      const storedMeta = getStoredRestaurantMetadata();

      const hydrated = (response.data.data || []).map((r, idx) => {
        const meta = storedMeta[r.restaurant_id] || storedMeta[(r as any).id] || {};
        return {
          ...r,
          restaurant_name: r.restaurant_name || (r as any).name || 'Fine Dining Restaurant',
          image: meta.image || r.image || DEFAULT_IMAGES[idx % DEFAULT_IMAGES.length],
          cuisine: meta.cuisine || r.cuisine || 'North Indian & Mughlai Delicacies',
          address: meta.address || r.address || 'Heritage Quarter, City Center',
          rating: r.rating || 4.9,
        };
      });

      const totalCount =
        (response.data as any).pagination?.total_records ??
        response.data.total ??
        hydrated.length;

      return {
        ...response.data,
        data: hydrated,
        total: totalCount,
      };
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        const storedMeta = getStoredRestaurantMetadata();
        let filtered = restaurantsCache.map((r, idx) => {
          const meta = storedMeta[r.restaurant_id] || storedMeta[(r as any).id] || {};
          return {
            ...r,
            image: meta.image || r.image || DEFAULT_IMAGES[idx % DEFAULT_IMAGES.length],
            cuisine: meta.cuisine || r.cuisine || 'North Indian & Mughlai Delicacies',
            address: meta.address || r.address || 'Heritage Quarter, City Center',
          };
        });
        if (params?.tenant_id) {
          filtered = filtered.filter(r => r.tenant_id === params.tenant_id);
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
   * Get single restaurant by ID
   */
  async getRestaurantById(restaurantId: string): Promise<RestaurantItem> {
    try {
      const res = await this.getRestaurants();
      const found = res.data.find(r => r.restaurant_id === restaurantId);
      if (found) return found;
      throw new Error('Restaurant not found');
    } catch (err: any) {
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Create a new restaurant under a tenant
   * POST /restaurants
   */
  async createRestaurant(
    payload: CreateRestaurantPayload
  ): Promise<RestaurantResponse> {
    try {
      const response = await apiClient.post<RestaurantResponse>(
        '/restaurants',
        {
          tenant_id: payload.tenant_id,
          name: payload.name,
          description: payload.description || undefined,
        }
      );
      const createdId = response.data.id || (response.data as any).restaurant_id;
      if (createdId && (payload.image || payload.cuisine || payload.address)) {
        saveRestaurantMetadata(createdId, {
          image: payload.image,
          cuisine: payload.cuisine,
          address: payload.address,
        });
      }
      return response.data;
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        const newRestaurant: RestaurantItem = {
          restaurant_id: `rest-${Date.now()}`,
          tenant_id: payload.tenant_id,
          restaurant_name: payload.name,
          description: payload.description,
          image: payload.image || DEFAULT_IMAGES[0],
          cuisine: payload.cuisine || 'North Indian & Mughlai',
          address: payload.address || 'Park Street, Kolkata, West Bengal 700016',
          rating: 4.9,
          total_branches: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        saveRestaurantMetadata(newRestaurant.restaurant_id, {
          image: payload.image,
          cuisine: payload.cuisine,
          address: payload.address,
        });
        restaurantsCache.unshift(newRestaurant);
        return {
          id: newRestaurant.restaurant_id,
          tenant_id: newRestaurant.tenant_id,
          name: newRestaurant.restaurant_name,
          description: newRestaurant.description,
          image: newRestaurant.image,
          cuisine: newRestaurant.cuisine,
          created_at: newRestaurant.created_at,
          updated_at: newRestaurant.updated_at,
        };
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Update restaurant information
   * PUT /restaurants/{restaurant_id}
   */
  async updateRestaurant(
    restaurantId: string,
    payload: UpdateRestaurantPayload
  ): Promise<RestaurantResponse> {
    try {
      const response = await apiClient.put<RestaurantResponse>(
        `/restaurants/${encodeURIComponent(restaurantId)}`,
        {
          restaurant_name: payload.restaurant_name,
          description: payload.description || undefined,
        }
      );
      saveRestaurantMetadata(restaurantId, {
        image: payload.image,
        cuisine: payload.cuisine,
      });
      return response.data;
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        const idx = restaurantsCache.findIndex(r => r.restaurant_id === restaurantId);
        if (idx !== -1) {
          restaurantsCache[idx] = {
            ...restaurantsCache[idx],
            ...payload,
            updated_at: new Date().toISOString(),
          };
          saveRestaurantMetadata(restaurantId, {
            image: payload.image,
            cuisine: payload.cuisine,
          });
          return {
            id: restaurantsCache[idx].restaurant_id,
            tenant_id: restaurantsCache[idx].tenant_id,
            name: restaurantsCache[idx].restaurant_name,
            description: restaurantsCache[idx].description,
            created_at: restaurantsCache[idx].created_at,
            updated_at: restaurantsCache[idx].updated_at,
          };
        }
      }
      throw new Error(extractErrorMessage(err));
    }
  },

  /**
   * Delete restaurant
   * DELETE /restaurants/{restaurant_id}
   */
  async deleteRestaurant(restaurantId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(
        `/restaurants/${encodeURIComponent(restaurantId)}`
      );
      removeRestaurantMetadata(restaurantId);
      return response.data;
    } catch (err: any) {
      const isNetworkErr = err?.code === 'ERR_NETWORK' || !err.response;
      const enableMock = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
      if (isNetworkErr && enableMock) {
        restaurantsCache = restaurantsCache.filter(r => r.restaurant_id !== restaurantId);
        removeRestaurantMetadata(restaurantId);
        return { message: 'Restaurant deleted successfully.' };
      }
      throw new Error(extractErrorMessage(err));
    }
  },
};
