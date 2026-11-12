import { apiClient, extractErrorMessage } from './api';
import { PaginatedResponse } from '@/types/api';
import {
  CreateRestaurantPayload,
  RestaurantItem,
  RestaurantResponse,
  UpdateRestaurantPayload,
} from '@/types/restaurant';
import { INITIAL_RESTAURANTS } from './mockData';

// In-memory cache for offline/demo resilience
let restaurantsCache = [...INITIAL_RESTAURANTS];

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
            limit: params?.limit ?? 10,
            ...(params?.tenant_id ? { tenant_id: params.tenant_id } : {}),
          },
        }
      );
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        return {
          data: restaurantsCache,
          total: restaurantsCache.length,
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          total_pages: Math.ceil(restaurantsCache.length / (params?.limit ?? 10)) || 1,
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
        payload
      );
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        const newRestaurant: RestaurantItem = {
          restaurant_id: `rest-${Date.now()}`,
          tenant_id: payload.tenant_id,
          restaurant_name: payload.name,
          description: payload.description,
          image: payload.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85',
          cuisine: payload.cuisine || 'North Indian & Mughlai',
          address: payload.address || 'Park Street, Kolkata, West Bengal 700016',
          rating: 4.9,
          total_branches: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
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
   * Update restaurant details
   * PUT /restaurants/{restaurant_id}
   */
  async updateRestaurant(
    restaurantId: string,
    payload: UpdateRestaurantPayload
  ): Promise<RestaurantResponse> {
    try {
      const response = await apiClient.put<RestaurantResponse>(
        `/restaurants/${encodeURIComponent(restaurantId)}`,
        payload
      );
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        const idx = restaurantsCache.findIndex(r => r.restaurant_id === restaurantId);
        if (idx !== -1) {
          restaurantsCache[idx] = {
            ...restaurantsCache[idx],
            restaurant_name: payload.restaurant_name || restaurantsCache[idx].restaurant_name,
            description: payload.description !== undefined ? payload.description : restaurantsCache[idx].description,
            image: payload.image || restaurantsCache[idx].image,
            cuisine: payload.cuisine || restaurantsCache[idx].cuisine,
            updated_at: new Date().toISOString(),
          };
          return {
            id: restaurantId,
            tenant_id: restaurantsCache[idx].tenant_id,
            name: restaurantsCache[idx].restaurant_name,
            description: restaurantsCache[idx].description,
            image: restaurantsCache[idx].image,
            cuisine: restaurantsCache[idx].cuisine,
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
  async deleteRestaurant(
    restaurantId: string
  ): Promise<{ message: string; restaurant_id: string }> {
    try {
      const response = await apiClient.delete<{
        message: string;
        restaurant_id: string;
      }>(`/restaurants/${encodeURIComponent(restaurantId)}`);
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        restaurantsCache = restaurantsCache.filter(r => r.restaurant_id !== restaurantId);
        return { message: 'Restaurant successfully removed', restaurant_id: restaurantId };
      }
      throw new Error(extractErrorMessage(err));
    }
  },
};

