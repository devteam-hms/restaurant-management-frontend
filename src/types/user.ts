export interface UserItem {
  user_id: string;
  tenant_id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  branch_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  tenant_id?: string;
  role?: string;
}

