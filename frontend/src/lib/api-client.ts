import type { ApiResponse } from '@/types/api';

/**
 * 统一 API 请求客户端。
 * 自动处理 Token 注入、错误拦截和响应解析。
 */
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  }

  /**
   * 发起 GET 请求。
   */
  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(path, this.baseUrl || window.location.origin);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const res = await fetch(url.toString(), {
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(res);
  }

  /**
   * 发起 POST 请求。
   */
  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(res);
  }

  /**
   * 获取请求头（自动注入 Token）。
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // 客户端环境下读取 Token
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * 统一响应处理。
   */
  private async handleResponse<T>(res: Response): Promise<T> {
    const json: ApiResponse<T> = await res.json();

    if (json.code !== 200) {
      throw new ApiError(json.code, json.message || '请求失败');
    }

    return json.data;
  }
}

/**
 * API 业务异常。
 */
export class ApiError extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export const apiClient = new ApiClient();
