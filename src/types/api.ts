export interface PaginationMetadata {
  page: number;
  limit: number;
  total_records: number;
  total_pages: number;
  has_next?: boolean;
  has_previous?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination?: PaginationMetadata;
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

