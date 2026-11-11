export interface CreateRestaurantPayload {
  tenant_id: string;
  name: string;
  description?: string | null;
}

export interface UpdateRestaurantPayload {
  restaurant_name?: string;
  description?: string | null;
}

export interface RestaurantItem {
  restaurant_id: string;
  tenant_id: string;
  restaurant_name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RestaurantResponse {
  id: string;
  tenant_id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

