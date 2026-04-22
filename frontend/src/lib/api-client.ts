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
   * 功能：发起 GET 请求并附加可选查询参数。
   * 关键参数：path 为接口路径；params 为查询参数对象（可选）。
   * 返回值/副作用：返回解析后的业务数据；副作用为触发网络请求。
   */
  async get<T>(path: string, params?: Record<string, QueryValue>): Promise<T> {
    const url = this.buildUrl(path);
    this.applyQueryParams(url, params);

    const res = await fetch(url.toString(), {
      headers: this.getHeaders(false),
    });

    return this.handleResponse<T>(res);
  }

  /**
   * 功能：发起 POST 请求并提交 JSON 请求体。
   * 关键参数：path 为接口路径；body 为请求体（可选）。
   * 返回值/副作用：返回解析后的业务数据；副作用为触发网络请求。
   */
  async post<T>(path: string, body?: unknown): Promise<T> {
    const url = this.buildUrl(path);
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: this.getHeaders(true),
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(res);
  }

  /**
   * 功能：发起 PUT 请求并提交 JSON 请求体。
   * 关键参数：path 为接口路径；body 为请求体（可选）。
   * 返回值/副作用：返回解析后的业务数据；副作用为触发网络请求。
   */
  async put<T>(path: string, body?: unknown): Promise<T> {
    const url = this.buildUrl(path);
    const res = await fetch(url.toString(), {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(res);
  }

  /**
   * 功能：发起 multipart/form-data POST 请求。
   * 关键参数：path 为接口路径；formData 为表单数据；params 为附加查询参数（可选）。
   * 返回值/副作用：返回解析后的业务数据；副作用为触发网络请求。
   */
  async postForm<T>(path: string, formData: FormData, params?: Record<string, QueryValue>): Promise<T> {
    const url = this.buildUrl(path);
    this.applyQueryParams(url, params);

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: this.getHeaders(false),
      body: formData,
    });

    return this.handleResponse<T>(res);
  }

  /**
   * 功能：构建完整请求地址，兼容浏览器与服务端运行环境。
   * 关键参数：path 为 API 路径（支持相对路径）。
   * 返回值/副作用：返回标准 URL 实例，无副作用。
   */
  private buildUrl(path: string): URL {
    if (this.isAbsoluteUrl(path)) {
      return new URL(path);
    }

    const normalizedPath = this.normalizePath(path);

    if (this.baseUrl) {
      return new URL(normalizedPath, this.normalizeBaseUrl(this.baseUrl));
    }

    if (typeof window !== 'undefined') {
      return new URL(normalizedPath, this.normalizeBaseUrl(window.location.origin));
    }

    throw new Error('缺少 NEXT_PUBLIC_API_URL，无法在服务端构建 API 请求地址');
  }

  /**
   * 功能：判断请求路径是否为绝对 URL，避免重复拼接基址。
   * 关键参数：path 为原始请求路径。
   * 返回值/副作用：返回布尔值表示是否绝对地址；无副作用。
   */
  private isAbsoluteUrl(path: string): boolean {
    return /^https?:\/\//i.test(path);
  }

  /**
   * 功能：归一化请求路径，去除前导斜杠以保留 baseUrl 中的 `/api` 前缀。
   * 关键参数：path 为原始请求路径。
   * 返回值/副作用：返回归一化后的路径字符串；无副作用。
   */
  private normalizePath(path: string): string {
    return path.replace(/^\/+/, '');
  }

  /**
   * 功能：归一化基址，确保 URL 拼接时始终以单个尾部斜杠结尾。
   * 关键参数：baseUrl 为原始 API 基址。
   * 返回值/副作用：返回标准化后的基址字符串；无副作用。
   */
  private normalizeBaseUrl(baseUrl: string): string {
    return `${baseUrl.replace(/\/+$/, '')}/`;
  }

  /**
   * 功能：将查询参数批量写入 URL，自动忽略 null/undefined。
   * 关键参数：url 为目标地址；params 为查询参数对象。
   * 返回值/副作用：无返回值；副作用为修改入参 url 的 searchParams。
   */
  private applyQueryParams(url: URL, params?: Record<string, QueryValue>): void {
    if (!params) {
      return;
    }

    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        url.searchParams.set(k, String(v));
      }
    });
  }

  /**
   * 功能：按请求类型构建请求头，并在客户端自动注入有效 Token。
   * 关键参数：includeJsonContentType 表示是否附加 `Content-Type: application/json`。
   * 返回值/副作用：返回请求头对象；当检测到过期 token 时会清理本地存储中的认证令牌。
   */
  private getHeaders(includeJsonContentType: boolean): HeadersInit {
    const headers: HeadersInit = {};
    if (includeJsonContentType) {
      headers['Content-Type'] = 'application/json';
    }

    const token = this.getValidAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * 功能：读取并校验本地 Access Token，仅在 token 有效时返回。
   * 关键参数：无。
   * 返回值/副作用：返回有效 token 或 null；副作用为在 token 过期时清理本地 access/refresh token。
   */
  private getValidAccessToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      return null;
    }

    if (this.isTokenExpired(token)) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return null;
    }

    return token;
  }

  /**
   * 功能：基于 JWT `exp` 字段判断 token 是否过期，防止携带失效凭证请求接口。
   * 关键参数：token 为待校验的 JWT 字符串。
   * 返回值/副作用：返回是否过期；无副作用（解析失败按过期处理）。
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payloadSegment = token.split('.')[1];
      if (!payloadSegment) {
        return true;
      }

      const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
      const payloadText = atob(padded);
      const payload = JSON.parse(payloadText) as { exp?: number };

      if (typeof payload.exp !== 'number') {
        return false;
      }

      const currentUnixSeconds = Math.floor(Date.now() / 1000);
      return payload.exp <= currentUnixSeconds;
    } catch {
      return true;
    }
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
