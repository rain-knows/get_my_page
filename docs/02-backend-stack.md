# 后端技术栈规范

> **文档版本**: v1.2.0 | **最后更新**: 2026-04-06 | **适用范围**: 后端开发人员

---

## 1. Spring Boot — v3.5.13

### 1.1 核心定位

Spring Boot 作为后端**核心骨架**，基于 Servlet 栈提供 RESTful API，内嵌 Tomcat 运行。

### 1.2 项目结构

```
backend/src/main/java/com/getmypage/blog/
├── BlogApplication.java          # 启动类
├── config/                       # 配置类
│   ├── WebMvcConfig.java         # CORS / 拦截器配置
│   ├── CacheConfig.java          # Caffeine 缓存配置
│   └── MybatisPlusConfig.java    # 分页插件 / 自动填充配置
├── controller/                   # REST 控制器
│   ├── auth/
│   │   └── AuthController.java   # 认证（登录/注册/刷新令牌）
│   └── UserController.java       # 用户信息
├── service/                      # 业务服务层
│   ├── auth/
│   │   ├── AuthService.java
│   │   └── impl/AuthServiceImpl.java
│   └── user/
│       ├── UserService.java
│       └── impl/UserServiceImpl.java
├── mapper/                       # MyBatis Mapper 接口
│   └── UserMapper.java
├── model/                        # 实体与 DTO
│   ├── entity/                   # 数据库实体
│   │   ├── User.java
│   │   └── ...
│   ├── dto/                      # 数据传输对象
│   │   ├── request/              # 请求 DTO
│   │   └── response/             # 响应 DTO
│   └── vo/                       # 视图对象
├── security/                     # Security & JWT
│   ├── SecurityConfig.java       # Spring Security 配置
│   └── auth/
│       ├── JwtTokenProvider.java
│       ├── JwtAuthenticationFilter.java
│       └── CustomUserDetailsService.java
├── event/                        # 应用事件
│   ├── PostPublishedEvent.java
│   └── PostPublishedListener.java
├── infrastructure/               # 基础设施封装
│   ├── cache/CacheFacade.java
│   ├── search/SearchClient.java
│   └── storage/StorageClient.java
├── common/                       # 通用层（替代 util）
│   ├── constant/
│   ├── enums/
│   └── util/
├── exception/                    # 全局异常处理
│   ├── GlobalExceptionHandler.java
│   ├── BizException.java         # 业务异常
│   └── ErrorCode.java            # 错误码枚举
```

### 1.3 关键配置 `application.yml`

```yaml
server:
  port: 8080
  tomcat:
    # 启用虚拟线程
    threads:
      virtual:
        enabled: true

spring:
  application:
    name: blog-backend

  # 数据源
  datasource:
    url: jdbc:mysql://${MYSQL_HOST:localhost}:3306/${MYSQL_DB:blog}?useSSL=false&serverTimezone=Asia/Shanghai
    username: ${MYSQL_USER:root}
    password: ${MYSQL_PASSWORD:root}
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5

  # Redis
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}
      lettuce:
        pool:
          max-active: 16
          max-idle: 8

  # Flyway
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true

  # Jackson
  jackson:
    date-format: yyyy-MM-dd HH:mm:ss
    time-zone: Asia/Shanghai
    serialization:
      write-dates-as-timestamps: false

# MyBatis-Plus
mybatis-plus:
  mapper-locations: classpath*:/mapper/**/*.xml
  global-config:
    db-config:
      id-type: auto
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.slf4j.Slf4jImpl

# 自定义配置
blog:
  jwt:
    secret: ${JWT_SECRET}
    access-expiration: 3600000      # 1小时
    refresh-expiration: 604800000   # 7天
  minio:
    endpoint: ${MINIO_ENDPOINT:http://localhost:9000}
    access-key: ${MINIO_ACCESS_KEY}
    secret-key: ${MINIO_SECRET_KEY}
    bucket: ${MINIO_BUCKET:blog-assets}
  meilisearch:
    host: ${MEILI_HOST:http://localhost:7700}
    api-key: ${MEILI_API_KEY}
```

---

## 2. Java 21 — 虚拟线程

### 2.1 启用方式

在 `application.yml` 中启用 Tomcat 虚拟线程：

```yaml
server:
  tomcat:
    threads:
      virtual:
        enabled: true
```

### 2.2 效果

- 每个 HTTP 请求分配一个虚拟线程，而非平台线程
- 在高并发 I/O 密集场景下吞吐量提升 5-10 倍
- 无需修改业务代码，框架层自动适配

### 2.3 注意事项

- 避免在虚拟线程内使用 `synchronized` 块 (改用 `ReentrantLock`)
- ThreadLocal 在虚拟线程中需谨慎使用
- 确认所有第三方库兼容虚拟线程

---

## 3. Flyway — v10.20.x (由 BOM 管理)

### 3.1 迁移脚本约定

| 约定项 | 规则 |
|--------|------|
| 存放目录 | `src/main/resources/db/migration/` |
| 命名格式 | `V{版本号}__{描述}.sql` |
| 版本号规则 | `V1__`, `V2__`, ... 递增 |
| 编码 | UTF-8 |

### 3.2 示例

```sql
-- V1__init_schema.sql
-- 初始化博客核心表结构

CREATE TABLE IF NOT EXISTS `user` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    `username`    VARCHAR(50)  NOT NULL COMMENT '用户名',
    `password`    VARCHAR(255) NOT NULL COMMENT '加密密码',
    `nickname`    VARCHAR(100) NOT NULL COMMENT '昵称',
    `avatar_url`  VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
    `email`       VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
    `bio`         VARCHAR(500) DEFAULT NULL COMMENT '个人简介',
    `role`        VARCHAR(20)  NOT NULL DEFAULT 'USER' COMMENT '角色',
    `status`      TINYINT      NOT NULL DEFAULT 1 COMMENT '状态: 0-禁用 1-正常',
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted`     TINYINT      NOT NULL DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

### 3.3 规范

- **禁止修改已执行的迁移脚本**
- 每次变更创建新的迁移版本
- DDL 和 DML 分开写入不同迁移文件
- 回滚策略：创建对应的 `U{版本号}__undo_{描述}.sql`

---

## 4. MyBatis-Plus — v3.5.16+

### 4.1 核心配置

```java
/**
 * MyBatis-Plus 全局配置。
 * 注册分页拦截器和自动填充处理器。
 */
@Configuration
@MapperScan("com.getmypage.blog.mapper")
public class MybatisPlusConfig {

    /**
     * 注册分页拦截器。
     * @return 拦截器实例。
     */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }
}
```

### 4.2 实体规范

```java
/**
 * 文章实体类。
 * 对应数据库 post 表。
 */
@Data
@TableName("post")
public class Post {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String title;
    private String slug;
    private String summary;
    private String content;       // MDX 原始内容
    private String coverUrl;
    private Long categoryId;
    private Long authorId;
    private Integer status;       // 0-草稿 1-已发布

    @TableLogic
    private Integer deleted;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
```

### 4.3 Mapper 规范

- 简单查询使用 `BaseMapper` 内置方法
- 复杂查询使用 `LambdaQueryWrapper` 或 XML 映射
- 禁止字符串拼接 SQL

---

## 5. Caffeine — v3.1+ (一级缓存)

### 5.1 缓存配置

```java
/**
 * Caffeine 本地缓存配置。
 * 定义不同业务场景的缓存策略。
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * 文章详情缓存。
     * 最大 500 条，写入后 10 分钟过期。
     */
    @Bean
    public CacheManager caffeineCacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager();
        manager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(500)
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .recordStats());
        return manager;
    }
}
```

### 5.2 缓存分层策略

```
请求 → Caffeine (L1, JVM内存, <1ms)
       ↓ MISS
       Redis (L2, 网络IO, <5ms)
       ↓ MISS
       MySQL (L3, 磁盘IO, <50ms)
       ↑ 回填 L2 & L1
```

### 5.3 缓存失效策略

- **写操作**: 立即清除相关 Caffeine + Redis 缓存
- **定时刷新**: 非关键数据使用 `expireAfterWrite` 自然过期
- **手动失效**: 管理后台提供 "清除缓存" 操作入口

---

## 6. Spring Security — v6.5.x (由 BOM 管理)

### 6.1 安全架构

```
请求 → JwtAuthenticationFilter
         │
         ├─ Token 有效 → SecurityContextHolder 设置认证信息
         │                    │
         │                    └─ RBAC 权限检查 → Controller
         │
         └─ Token 无效/缺失
              │
              ├─ 公开接口 → 允许匿名访问
              └─ 受保护接口 → 401 Unauthorized
```

### 6.2 接口权限矩阵

| 接口路径 | 方法 | 权限要求 |
|----------|------|---------|
| `/api/posts` | GET | 公开 |
| `/api/posts/{slug}` | GET | 公开 |
| `/api/posts` | POST | ADMIN |
| `/api/posts/{id}` | PUT/DELETE | ADMIN |
| `/api/auth/login` | POST | 公开 |
| `/api/auth/register` | POST | 公开 |
| `/api/admin/**` | ALL | ADMIN |
| `/api/user/profile` | GET/PUT | USER |

### 6.3 密码策略

- 使用 `BCryptPasswordEncoder` (强度因子 12)
- 密码最小长度 8 字符
- 禁止明文存储

---

## 7. JWT (jjwt) — v0.12+

### 7.1 Token 策略

| Token 类型 | 有效期 | 用途 |
|-----------|--------|------|
| Access Token | 1 小时 | API 请求认证 |
| Refresh Token | 7 天 | 刷新 Access Token |

### 7.2 Token 黑名单

- 用户主动登出时将 Token `jti` 写入 Redis 黑名单
- 黑名单 TTL = Token 剩余有效期
- `JwtAuthenticationFilter` 每次请求检查黑名单

---

## 8. SpringDoc — v2.3+

### 8.1 配置

```yaml
springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html
    tags-sorter: alpha
    operations-sorter: method
  group-configs:
    - group: public-api
      paths-to-match: /api/**
      paths-to-exclude: /api/admin/**
    - group: admin-api
      paths-to-match: /api/admin/**
```

### 8.2 注解规范

所有 Controller 方法必须使用 `@Operation` 注解标注中文说明。

---

## 9. 依赖版本 (pom.xml)

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.5.13</version>
</parent>

<properties>
    <java.version>21</java.version>
    <mybatis-plus.version>3.5.16</mybatis-plus.version>
    <jjwt.version>0.12.6</jjwt.version>
    <minio.version>8.5.14</minio.version>
    <springdoc.version>2.8.0</springdoc.version>
</properties>
```

---

> **下一步**: 参阅 [03-infrastructure.md](./03-infrastructure.md) 了解基础设施与中间件规范。
