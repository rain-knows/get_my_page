# 基础设施与中间件规范

> **文档版本**: v1.1.0 | **最后更新**: 2026-04-04 | **适用范围**: 后端开发人员、运维人员

---

## 1. MySQL — v8.0+

### 1.1 核心定位

关系型数据库，**核心数据落地层**。持久化存储用户、文章、分类、标签、评论等结构化数据。

### 1.2 Docker 部署配置

```yaml
# docker-compose.yml — MySQL 服务
mysql:
  image: mysql:8.0
  container_name: blog-mysql
  restart: unless-stopped
  environment:
    MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
    MYSQL_DATABASE: ${MYSQL_DB:-blog}
    MYSQL_USER: ${MYSQL_USER:-bloguser}
    MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    TZ: Asia/Shanghai
  ports:
    - "3306:3306"
  volumes:
    - mysql_data:/var/lib/mysql
    - ./docker/mysql/conf.d:/etc/mysql/conf.d  # 自定义配置
    - ./docker/mysql/init:/docker-entrypoint-initdb.d  # 初始化脚本
  command: >
    --character-set-server=utf8mb4
    --collation-server=utf8mb4_unicode_ci
    --default-authentication-plugin=caching_sha2_password
    --innodb-buffer-pool-size=256M
    --max-connections=200
  healthcheck:
    test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
    interval: 10s
    timeout: 5s
    retries: 5
```

### 1.3 自定义配置 `my.cnf`

```ini
[mysqld]
# 字符集
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# InnoDB 优化
innodb_buffer_pool_size = 256M
innodb_log_file_size = 64M
innodb_flush_log_at_trx_commit = 2

# 慢查询日志
slow_query_log = ON
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 1

# 连接
max_connections = 200
wait_timeout = 28800

[client]
default-character-set = utf8mb4
```

### 1.4 数据库设计规范

| 规范项 | 规则 |
|--------|------|
| 命名 | 表名小写下划线，如 `post_tag` |
| 主键 | BIGINT AUTO_INCREMENT |
| 时间 | `created_at` / `updated_at` DATETIME |
| 逻辑删除 | `deleted` TINYINT DEFAULT 0 |
| 索引 | 查询频繁字段必建索引，复合索引注意最左前缀 |
| 字符集 | 全库 utf8mb4 |

### 1.5 ER 模型（核心表）

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│   user   │     │   post   │     │ category │
│──────────│     │──────────│     │──────────│
│ id (PK)  │←────│ author_id│     │ id (PK)  │
│ username │     │ id (PK)  │────→│ name     │
│ password │     │ title    │     │ slug     │
│ nickname │     │ slug     │     │ sort     │
│ role     │     │ content  │     └──────────┘
└──────────┘     │ category │
                 │ status   │     ┌──────────┐
                 └────┬─────┘     │   tag    │
                      │           │──────────│
                 ┌────┴─────┐     │ id (PK)  │
                 │ post_tag │     │ name     │
                 │──────────│────→│ slug     │
                 │ post_id  │     └──────────┘
                 │ tag_id   │
                 └──────────┘
                      │
                 ┌────┴─────┐
                 │ comment  │
                 │──────────│
                 │ id (PK)  │
                 │ post_id  │
                 │ user_id  │
                 │ content  │
                 │ parent_id│ (自引用，支持嵌套评论)
                 └──────────┘
```

---

## 2. Redis — v7.0+

### 2.1 核心定位

**二级缓存与原子计数器**。存储常规查询缓存、Token 黑名单、文章阅读量/点赞数。

### 2.2 Docker 部署

```yaml
redis:
  image: redis:7-alpine
  container_name: blog-redis
  restart: unless-stopped
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
    - ./docker/redis/redis.conf:/usr/local/etc/redis/redis.conf
  command: redis-server /usr/local/etc/redis/redis.conf
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5
```

### 2.3 Key 命名规范

```
blog:{业务域}:{子域}:{标识}

示例:
├── blog:post:detail:{id}          # 文章详情缓存 (String, JSON)
├── blog:post:list:{page}:{size}   # 文章列表缓存 (String, JSON)
├── blog:post:view:{id}            # 文章阅读量 (String, 数值)
├── blog:post:like:{id}            # 文章点赞数 (String, 数值)
├── blog:user:liked:{userId}       # 用户点赞集合 (Set, postId)
├── blog:auth:blacklist:{jti}      # JWT 黑名单 (String, TTL)
└── blog:cache:category:all        # 分类列表缓存 (String, JSON)
```

### 2.4 缓存策略

| 数据类型 | TTL | 更新方式 |
|----------|-----|---------|
| 文章详情 | 30 分钟 | 写操作主动失效 |
| 文章列表 | 5 分钟 | 自然过期 |
| 分类/标签 | 1 小时 | 写操作主动失效 |
| 阅读量 | 永不过期 | INCR 原子递增，定期回写 MySQL |
| JWT 黑名单 | Token 剩余有效期 | 登出时写入 |

### 2.5 阅读量计数方案

```
用户阅读文章 → Redis INCR blog:post:view:{id}
                      │
                      └─ 定时任务 (每5分钟) → 批量回写 MySQL
                           UPDATE post SET view_count = {redis_value} WHERE id = {id}
```

---

## 3. Meilisearch — v1.38+

### 3.1 核心定位

**全文搜索引擎**。承担全站文章搜索，提供毫秒级响应、容错拼写和实时高亮。

### 3.2 Docker 部署

```yaml
meilisearch:
  image: getmeili/meilisearch:v1.38
  container_name: blog-meilisearch
  restart: unless-stopped
  environment:
    MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
    MEILI_ENV: production
    MEILI_NO_ANALYTICS: true
  ports:
    - "7700:7700"
  volumes:
    - meili_data:/meili_data
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:7700/health"]
    interval: 10s
    timeout: 5s
    retries: 5
```

### 3.3 索引配置

```json
{
  "uid": "posts",
  "primaryKey": "id",
  "searchableAttributes": [
    "title",
    "summary",
    "content",
    "categoryName",
    "tags"
  ],
  "filterableAttributes": [
    "categoryName",
    "tags",
    "status",
    "createdAt"
  ],
  "sortableAttributes": [
    "createdAt",
    "viewCount",
    "likeCount"
  ],
  "displayedAttributes": [
    "id", "title", "slug", "summary",
    "coverUrl", "categoryName", "tags",
    "createdAt"
  ]
}
```

### 3.4 数据同步策略

| 事件 | 同步方式 |
|------|---------|
| 文章发布 | 实时新增文档到 Meilisearch |
| 文章更新 | 实时更新文档 (PUT /indexes/posts/documents) |
| 文章删除 | 实时删除文档 (DELETE /indexes/posts/documents/{id}) |
| 全量重建 | 管理后台手动触发，全表导出到 Meilisearch |

---

## 4. MinIO — RELEASE.2026-03+

### 4.1 核心定位

**S3 兼容对象存储**。统一管理用户头像、文章封面图、内容插图等二进制文件。

### 4.2 Docker 部署

```yaml
minio:
  image: minio/minio:latest
  container_name: blog-minio
  restart: unless-stopped
  environment:
    MINIO_ROOT_USER: ${MINIO_ROOT_USER}
    MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
  ports:
    - "9000:9000"   # S3 API
    - "9001:9001"   # Web Console
  volumes:
    - minio_data:/data
  command: server /data --console-address ":9001"
  healthcheck:
    test: ["CMD", "mc", "ready", "local"]
    interval: 10s
    timeout: 5s
    retries: 5
```

### 4.3 Bucket 规划

| Bucket 名 | 用途 | 访问策略 |
|-----------|------|---------|
| `blog-assets` | 文章封面图、内容插图 | 公开读 |
| `user-avatars` | 用户头像 | 公开读 |
| `blog-backups` | 数据库备份文件 | 私有 |

### 4.4 上传规范

- 文件命名: `{年月日}/{UUID}.{ext}` (如 `20260404/a1b2c3d4.webp`)
- 图片限制: 单文件 ≤ 10MB
- 允许格式: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`
- 上传后返回完整访问 URL

### 4.5 Spring Boot 集成

```java
/**
 * MinIO 客户端配置。
 */
@Configuration
public class MinioConfig {

    @Value("${blog.minio.endpoint}")
    private String endpoint;

    @Value("${blog.minio.access-key}")
    private String accessKey;

    @Value("${blog.minio.secret-key}")
    private String secretKey;

    /**
     * 创建 MinIO 客户端 Bean。
     * @return MinioClient 实例。
     */
    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
    }
}
```

---

## 5. 中间件交互总览

```
                    Spring Boot
                        │
          ┌─────────────┼─────────────┐
          │             │             │
     ┌────▼────┐   ┌───▼───┐   ┌────▼────┐
     │Caffeine │   │ Redis │   │ MySQL  │
     │ (L1)    │   │ (L2)  │   │ (L3)   │
     │ JVM内存  │   │ 网络   │   │ 持久化  │
     └─────────┘   └───────┘   └────────┘
          
          ┌─────────────┼─────────────┐
          │                           │
     ┌────▼────┐                ┌────▼────┐
     │Meili    │                │ MinIO  │
     │search   │                │ (S3)   │
     │ 全文检索 │                │ 文件存储 │
     └─────────┘                └────────┘
```

---

> **下一步**: 参阅 [04-docker-dev-guide.md](./04-docker-dev-guide.md) 了解容器化开发环境指南。
