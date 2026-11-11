export interface CreateBranchPayload {
  restaurant_id: string;
  branch_name: string;
  address: string;
  city: string;
  state: string;
  email: string;
  phone: string;
}

export interface UpdateBranchPayload {
  branch_name?: string;
  address?: string;
  city?: string;
  state?: string;
  email?: string;
  phone?: string;
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
  created_at: string;
  updated_at: string;
}

