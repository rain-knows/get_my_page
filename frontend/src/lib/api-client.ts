import type { ApiResponse } from '@/types/api';

type QueryValue = string | number | boolean | null | undefined;

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
  async get<T>(path: string, params?: Record<string, QueryValue>): Promise<T> {
    const url = this.buildUrl(path);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          url.searchParams.set(k, String(v));
        }
      });
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
   * 功能：构建完整请求地址，兼容浏览器与服务端运行环境。
   * 关键参数：path 为 API 路径（支持相对路径）。
   * 返回值/副作用：返回标准 URL 实例，无副作用。
   */
  private buildUrl(path: string): URL {
    if (this.baseUrl) {
      return new URL(path, this.baseUrl);
    }

    if (typeof window !== 'undefined') {
      return new URL(path, window.location.origin);
    }

    throw new Error('缺少 NEXT_PUBLIC_API_URL，无法在服务端构建 API 请求地址');
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
