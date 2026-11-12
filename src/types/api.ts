export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ApiErrorResponse {
  detail?: string | Array<{ loc: (string | number)[]; msg: string; type: string }>;
  message?: string;
  status_code?: number;
}

