export interface MenuItem {
  id: string;
  branch_id: string;
  menu_name: string;
  image: string;
  short_description: string;
  long_description: string;
  price: number;
  category?: string;
  is_signature?: boolean;
  dietary_tags?: string[];
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
  category?: string;
  availability: boolean;
  is_signature?: boolean;
  dietary_tags?: string[];
}

export interface UpdateMenuPayload {
  menu_name?: string;
  image?: string;
  short_description?: string;
  long_description?: string;
  price?: number;
  category?: string;
  status?: number;
  is_signature?: boolean;
  dietary_tags?: string[];
}

export interface GetMenusByBranchParams {
  page?: number;
  limit?: number;
  status?: number;
  category?: string;
}

