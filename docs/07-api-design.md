# API 接口设计规范

> **文档版本**: v1.1.0 | **最后更新**: 2026-04-04 | **适用范围**: 前后端开发人员

---

## 1. 基础约定

### 1.1 URL 规范

| 约定 | 规则 | 示例 |
|------|------|------|
| 基础路径 | 所有 API 以 `/api` 开头 | `/api/posts` |
| 资源命名 | 复数名词，小写连字符 | `/api/post-tags` |
| 版本控制 | 保留字段，暂不使用 | `/api/v1/posts` |
| 路径参数 | 资源标识使用路径参数 | `/api/posts/{id}` |
| 查询参数 | 过滤和分页使用查询参数 | `?page=1&size=10` |

### 1.2 HTTP 方法语义

| 方法 | 语义 | 幂等性 | 示例 |
|------|------|--------|------|
| GET | 读取资源 | 是 | `GET /api/posts` |
| POST | 创建资源 | 否 | `POST /api/posts` |
| PUT | 全量更新 | 是 | `PUT /api/posts/{id}` |
| PATCH | 部分更新 | 是 | `PATCH /api/posts/{id}` |
| DELETE | 删除资源 | 是 | `DELETE /api/posts/{id}` |

---

## 2. 统一响应格式

### 2.1 成功响应

```json
{
  "code": 200,
  "message": "操作成功",
  "data": { ... }
}
```

### 2.2 分页响应

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "records": [ ... ],
    "current": 1,
    "size": 10,
    "total": 128,
    "pages": 13
  }
}
```

### 2.3 错误响应

```json
{
  "code": 40001,
  "message": "用户名或密码错误",
  "data": null
}
```

---

## 3. 错误码体系

| 错误码 | HTTP Status | 说明 |
|--------|-------------|------|
| 200 | 200 | 操作成功 |
| 40001 | 400 | 参数校验失败 |
| 40101 | 401 | 未登录 / Token 无效 |
| 40102 | 401 | Token 已过期 |
| 40301 | 403 | 无权限访问 |
| 40401 | 404 | 资源不存在 |
| 40901 | 409 | 资源冲突（重复创建） |
| 50001 | 500 | 系统内部错误 |
| 50002 | 500 | 数据库操作失败 |
| 50003 | 500 | 外部服务调用失败 |

---

## 4. 接口清单

### 4.1 认证模块 `/api/auth`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | `/api/auth/login` | 公开 | 用户登录，返回 Token |
| POST | `/api/auth/register` | 公开 | 用户注册 |
| POST | `/api/auth/refresh` | 已登录 | 刷新 Access Token |
| POST | `/api/auth/logout` | 已登录 | 登出，Token 加入黑名单 |

#### 登录请求

```json
// POST /api/auth/login
{
  "username": "admin",
  "password": "password123"
}
```

#### 登录响应

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  }
}
```

---

### 4.2 文章模块 `/api/posts`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/posts` | 公开 | 文章列表（分页） |
| GET | `/api/posts/{slug}` | 公开 | 文章详情（通过 slug） |
| POST | `/api/posts` | ADMIN | 创建文章 |
| PUT | `/api/posts/{id}` | ADMIN | 更新文章 |
| DELETE | `/api/posts/{id}` | ADMIN | 删除文章 |
| POST | `/api/posts/{id}/like` | USER | 点赞/取消点赞 |

#### 文章列表查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | int | 否 | 1 | 页码 |
| size | int | 否 | 10 | 每页条数 (最大 50) |
| categoryId | long | 否 | - | 按分类筛选 |
| tagId | long | 否 | - | 按标签筛选 |
| sort | string | 否 | latest | latest / popular / views |

#### 创建文章请求

```json
// POST /api/posts
{
  "title": "Next.js 入门指南",
  "slug": "nextjs-getting-started",
  "summary": "从零开始学习 Next.js...",
  "content": "# 正文 MDX 内容...",
  "coverUrl": "https://cdn.example.com/cover.webp",
  "categoryId": 1,
  "tagIds": [1, 3, 5],
  "status": 1
}
```

---

### 4.3 分类模块 `/api/categories`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/categories` | 公开 | 查询所有分类 |
| POST | `/api/categories` | ADMIN | 创建分类 |
| PUT | `/api/categories/{id}` | ADMIN | 更新分类 |
| DELETE | `/api/categories/{id}` | ADMIN | 删除分类 |

### 4.4 标签模块 `/api/tags`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/tags` | 公开 | 查询所有标签 |
| POST | `/api/tags` | ADMIN | 创建标签 |
| DELETE | `/api/tags/{id}` | ADMIN | 删除标签 |

### 4.5 评论模块 `/api/comments`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/posts/{postId}/comments` | 公开 | 获取文章评论（树形） |
| POST | `/api/comments` | USER / 游客 | 发表评论（支持游客，受全局开关控制） |
| DELETE | `/api/comments/{id}` | ADMIN/本人 | 删除评论 |

#### 发表评论请求（游客）

```json
// POST /api/comments
{
  "targetType": "post",
  "targetId": 1,
  "content": "写得好！",
  "guestNickname": "匿名用户",
  "guestEmail": "guest@example.com"
}
```

#### 发表评论请求（已登录用户）

```json
// POST /api/comments
{
  "targetType": "post",
  "targetId": 1,
  "parentId": null,
  "content": "学到了！"
}
```

### 4.6 搜索模块 `/api/search`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/search?q={keyword}` | 公开 | 全文搜索文章 |

#### 搜索响应

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "hits": [
      {
        "id": 1,
        "title": "<em>Next.js</em> 入门指南",
        "summary": "从零开始学习 <em>Next.js</em>...",
        "slug": "nextjs-getting-started",
        "coverUrl": "...",
        "categoryName": "前端"
      }
    ],
    "estimatedTotalHits": 5,
    "processingTimeMs": 2
  }
}
```

### 4.7 文件上传 `/api/files`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | `/api/files/upload` | USER | 上传文件 (multipart/form-data) |

### 4.8 用户模块 `/api/users`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/users/me` | USER | 获取当前用户信息 |
| PUT | `/api/users/me` | USER | 更新当前用户信息 |

---

## 5. 认证方式

### 5.1 请求头

```
Authorization: Bearer <access_token>
```

### 5.2 认证流程

```
客户端 POST /api/auth/login → 获取 accessToken + refreshToken
                                          │
客户端请求 API → Header: Authorization: Bearer {accessToken}
                                          │
Token 过期 → POST /api/auth/refresh → 获取新 accessToken
```

---

## 6. 跨域配置 (CORS)

```java
/**
 * 跨域配置。
 * 开发环境允许 localhost:3000, 生产环境配置实际域名。
 */
@Override
public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**")
            .allowedOrigins(
                "http://localhost:3000",
                "https://yourdomain.com"
            )
            .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
}
```

---

> **下一步**: 参阅 [08-frontend-backend-integration.md](./08-frontend-backend-integration.md) 了解前后端联调规范。
