# 前后端联调规范

> **文档版本**: v1.1.0 | **最后更新**: 2026-04-04 | **适用范围**: 全体开发人员

---

## 1. 联调流程

```
1. 后端定义 API → SpringDoc 自动生成 Swagger 文档
2. 前端根据 Swagger 文档定义 TypeScript 类型
3. 前端实现 API 调用层
4. 联调测试 → 修复问题
5. 集成测试通过 → 合并代码
```

---

## 2. 接口对接约定

### 2.1 API 基础 URL

| 环境 | 前端变量 | 值 |
|------|---------|-----|
| 本地开发 | `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api` |
| 生产环境 | `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com/api` |

### 2.2 前端 API 封装

```typescript
// lib/api-client.ts

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
   *
   * @template T 响应数据类型。
   * @param path API 路径 (不含 baseUrl)。
   * @param params 查询参数。
   * @returns 响应数据。
   * @throws 当 API 返回非 200 状态码时抛出业务异常。
   */
  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(path, this.baseUrl);
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
   *
   * @template T 响应数据类型。
   * @param path API 路径。
   * @param body 请求体。
   * @returns 响应数据。
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
    const json = await res.json();

    if (json.code !== 200) {
      // Token 过期时自动刷新
      if (json.code === 40102) {
        // 触发 Token 刷新逻辑
      }
      throw new Error(json.message || '请求失败');
    }

    return json.data;
  }
}

export const apiClient = new ApiClient();
```

---

## 3. 服务端数据获取 (SSR/SSG)

### 3.1 Server Component 中的数据获取

```typescript
// app/(blog)/[slug]/page.tsx

/**
 * 在服务端获取文章详情。
 * 使用 Next.js 内置 fetch 缓存机制。
 *
 * @param slug 文章 URL 标识。
 * @returns 文章详情数据。
 */
async function getPost(slug: string): Promise<PostDetail> {
  // 服务端直接调后端内网地址
  const res = await fetch(
    `${process.env.BACKEND_INTERNAL_URL}/api/posts/${slug}`,
    {
      next: { revalidate: 3600 }, // ISR: 1小时重新验证
    }
  );

  if (!res.ok) throw new Error('文章不存在');

  const json = await res.json();
  return json.data;
}
```

### 3.2 容器间通信

```
┌─────────────────┐         ┌──────────────────┐
│  Next.js 容器    │ ──────→ │  Spring Boot 容器  │
│  (SSR 请求)      │  HTTP   │  (blog-backend)   │
└─────────────────┘         └──────────────────┘
       │
       │  环境变量:
       │  BACKEND_INTERNAL_URL=http://backend:8080
       │  (Docker 内部网络，无需经过 Traefik)
```

**关键点**: 
- 服务端渲染使用 Docker 内部网络直连后端 (`http://backend:8080`)
- 客户端浏览器请求经过 Traefik (`https://api.yourdomain.com`)

---

## 4. 客户端数据获取 (SWR)

```typescript
// features/post/hooks/use-posts.ts
import useSWR from 'swr';

/**
 * 获取文章列表（客户端组件使用）。
 */
export function usePosts(page: number = 1) {
  return useSWR(`/api/posts?page=${page}&size=10`);
}

// features/search/hooks/use-search.ts
import useSWR from 'swr';

/**
 * 搜索文章（客户端组件使用，带防抖）。
 *
 * @param query 搜索关键词。
 */
export function useSearch(query: string) {
  return useSWR(
    query.length >= 2 ? `/api/search?q=${encodeURIComponent(query)}` : null
  );
}
```

---

## 5. 环境变量矩阵

### 5.1 前端环境变量

| 变量名 | 开发环境 | 生产环境 | 说明 |
|--------|---------|---------|------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api` | `https://api.yourdomain.com/api` | 浏览器端 API 地址 |
| `NEXT_PUBLIC_MINIO_URL` | `http://localhost:9000` | `https://cdn.yourdomain.com` | 静态资源地址 |
| `BACKEND_INTERNAL_URL` | `http://backend:8080` | `http://backend:8080` | SSR 内网直连地址 |

### 5.2 前端 `.env.local` (开发)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_MINIO_URL=http://localhost:9000
BACKEND_INTERNAL_URL=http://backend:8080
```

---

## 6. 跨域处理

### 6.1 开发环境

后端 `WebMvcConfig` 配置 CORS 允许 `http://localhost:3000`。

### 6.2 生产环境

Traefik 统一管理域名路由，前后端同域名不同子域 (同 TLD)，按需配置 CORS 响应头。

---

## 7. 联调 Checklist

- [ ] 后端 Swagger 文档地址可访问: `http://localhost:8080/swagger-ui.html`
- [ ] 前端 TypeScript 类型与 Swagger 一致
- [ ] CORS 配置正确，浏览器无跨域报错
- [ ] Token 认证流程走通（登录 → 请求 → 刷新 → 登出）
- [ ] 分页参数 `page` / `size` 的含义前后端一致
- [ ] 时间格式统一为 `yyyy-MM-dd HH:mm:ss`
- [ ] 文件上传到 MinIO 后 URL 前端可正常访问
- [ ] 搜索接口高亮标记 `<em>` 前端正确渲染

---

## 8. Swagger 在线调试

开发环境访问:
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/api-docs`

SpringDoc 配置了两个 API 分组:
- **public-api**: 公开接口 (`/api/**` 排除 `/api/admin/**`)
- **admin-api**: 管理接口 (`/api/admin/**`)

---

> **文档索引**: 返回 [00-architecture-overview.md](./00-architecture-overview.md) 查看完整文档目录。
