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

/** 文章摘要 DTO */
export interface PostSummary {
  id: number;
  title: string;
  slug: string;
  summary: string;
  coverUrl: string;
  categoryName: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

/** 文章详情 DTO */
export interface PostDetail extends PostSummary {
  content: string;
  author: AuthorInfo;
  isLiked: boolean;
}

/** 作者信息 */
export interface AuthorInfo {
  id: number;
  username: string;
  nickname: string;
  avatarUrl: string;
}

/** 分类信息 */
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
}

/** 标签信息 */
export interface Tag {
  id: number;
  name: string;
  slug: string;
}

/** 登录请求 */
export interface LoginRequest {
  username: string;
  password: string;
}

/** 注册请求 */
export interface RegisterRequest {
  username: string;
  password: string;
  nickname: string;
  email?: string;
}

/** 登录响应 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: {
    id: number;
    username: string;
    nickname: string;
    avatarUrl: string;
    role: string;
  };
}
