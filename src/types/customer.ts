export interface CustomerProfileData {
  id?: string;
  customer_id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  profile_picture?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerProfileResponse {
  success: boolean;
  message: string;
  data: CustomerProfileData;
}

export interface CustomerProfile {
  id: string;
  customer_id?: string;
  first_name?: string;
  last_name?: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  loyalty_tier?: string;
  dining_preferences?: string[];
  total_orders?: number;
  total_spent?: number;
  member_since?: string;
  address?: string;
  city?: string;
  status?: string;
  role?: string;
  branch_id?: string;
  branch_name?: string;
  created_at?: string;
}

export interface UpdateCustomerProfilePayload {
  first_name?: string;
  last_name?: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  dining_preferences?: string[];
}
