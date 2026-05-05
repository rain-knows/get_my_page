/** 通用 API 响应包装器 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/** 分页响应结构 */
export interface PaginatedData<T> {
  records: T[];
  current: number;
  size: number;
  total: number;
  pages: number;
}
