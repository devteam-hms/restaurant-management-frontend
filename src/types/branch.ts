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
  public_menu_code?: string | null;
  qr_status?: string | null;
  qr_generated_at?: string | null;
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
  public_menu_code?: string | null;
  qr_status?: string | null;
  qr_generated_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BranchQRDetails {
  branch_id: string;
  branch_name: string;
  public_menu_code: string | null;
  menu_url: string | null;
  qr_status: string | null;
  qr_generated_at?: string | null;
  qr_preview_url?: string | null;
}

export interface BranchQRResponse {
  success: boolean;
  message?: string;
  data: BranchQRDetails;
}

