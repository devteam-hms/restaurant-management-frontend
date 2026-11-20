export interface CreateRestaurantPayload {
  tenant_id: string;
  name: string;
  description?: string | null;
  image?: string;
  cuisine?: string;
  address?: string;
  rating?: number;
}

export interface UpdateRestaurantPayload {
  restaurant_name?: string;
  description?: string | null;
  image?: string;
  cuisine?: string;
}

export interface RestaurantItem {
  restaurant_id: string;
  tenant_id: string;
  restaurant_name: string;
  description?: string | null;
  image?: string;
  cuisine?: string;
  address?: string;
  rating?: number;
  total_branches?: number;
  created_at: string;
  updated_at: string;
}

export interface RestaurantResponse {
  id: string;
  tenant_id: string;
  name: string;
  description?: string | null;
  image?: string;
  cuisine?: string;
  created_at: string;
  updated_at: string;
}

