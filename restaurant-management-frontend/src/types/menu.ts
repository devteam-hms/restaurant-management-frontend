export interface MenuItem {
  id: string;
  branch_id: string;
  menu_name: string;
  image: string;
  short_description: string;
  long_description: string;
  price: number;
  status: number; // 1 for Active/Available, 0 for Inactive/Unavailable
  created_at: string;
  updated_at: string;
}

export interface CreateMenuPayload {
  branch_id: string;
  menu_name: string;
  image: string;
  short_description: string;
  long_description: string;
  price: number;
  availability: boolean;
}

export interface UpdateMenuPayload {
  menu_name?: string;
  image?: string;
  short_description?: string;
  long_description?: string;
  price?: number;
  status?: number;
}

export interface GetMenusByBranchParams {
  page?: number;
  limit?: number;
  status?: number;
}

