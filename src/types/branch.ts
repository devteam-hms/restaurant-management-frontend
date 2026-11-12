export interface CreateBranchPayload {
  restaurant_id: string;
  branch_name: string;
  address: string;
  city: string;
  state: string;
  email: string;
  phone: string;
  opening_hours?: string;
  capacity?: number;
}

export interface UpdateBranchPayload {
  branch_name?: string;
  address?: string;
  city?: string;
  state?: string;
  email?: string;
  phone?: string;
  opening_hours?: string;
  capacity?: number;
}

export interface BranchItem {
  branch_id: string;
  restaurant_id: string;
  branch_name: string;
  address: string;
  city: string;
  state: string;
  email: string;
  phone?: string;
  opening_hours?: string;
  capacity?: number;
  restaurant_name?: string;
  created_at: string;
  updated_at: string;
}

export interface BranchResponse {
  id: string;
  restaurant_id: string;
  branch_name: string;
  address: string;
  city: string;
  state: string;
  email: string;
  phone: string;
  opening_hours?: string;
  created_at: string;
  updated_at: string;
}

