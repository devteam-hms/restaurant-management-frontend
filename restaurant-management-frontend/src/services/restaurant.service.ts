import { apiClient } from "@/services/api";
import { PaginatedResponse } from "@/types/api";
import {
  CreateRestaurantPayload,
  RestaurantItem,
  RestaurantResponse,
  UpdateRestaurantPayload,
} from "@/types/restaurant";

export const restaurantService = {
  /**
   * Retrieve paginated restaurants, optionally filtered by tenant_id
   * GET /restaurants
   */
  async getRestaurants(params?: {
    page?: number;
    limit?: number;
    tenant_id?: string;
  }): Promise<PaginatedResponse<RestaurantItem>> {
    const response = await apiClient.get<PaginatedResponse<RestaurantItem>>(
      "/restaurants",
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          ...(params?.tenant_id ? { tenant_id: params.tenant_id } : {}),
        },
      }
    );
    return response.data;
  },

  /**
   * Create a new restaurant under a tenant
   * POST /restaurants
   */
  async createRestaurant(
    payload: CreateRestaurantPayload
  ): Promise<RestaurantResponse> {
    const response = await apiClient.post<RestaurantResponse>(
      "/restaurants",
      payload
    );
    return response.data;
  },

  /**
   * Update restaurant details
   * PUT /restaurants/{restaurant_id}
   */
  async updateRestaurant(
    restaurantId: string,
    payload: UpdateRestaurantPayload
  ): Promise<RestaurantResponse> {
    const response = await apiClient.put<RestaurantResponse>(
      `/restaurants/${encodeURIComponent(restaurantId)}`,
      payload
    );
    return response.data;
  },

  /**
   * Delete restaurant (fails if dependent branches exist)
   * DELETE /restaurants/{restaurant_id}
   */
  async deleteRestaurant(
    restaurantId: string
  ): Promise<{ message: string; restaurant_id: string }> {
    const response = await apiClient.delete<{
      message: string;
      restaurant_id: string;
    }>(`/restaurants/${encodeURIComponent(restaurantId)}`);
    return response.data;
  },
};

