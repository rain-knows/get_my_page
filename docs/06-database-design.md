# 数据库设计与迁移规范

> **文档版本**: v1.2.0 | **最后更新**: 2026-04-06 | **适用范围**: 后端开发人员

---

## 1. ER 模型总览

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│     user     │     │     post     │     │   category   │
│──────────────│     │──────────────│     │──────────────│
│ id       PK  │◄───┐│ id       PK  │    ┌│ id       PK  │
│ username     │    ││ title        │    ││ name         │
│ password     │    ││ slug     UK  │    ││ slug     UK  │
│ nickname     │    ││ summary      │    ││ description  │
│ avatar_url   │    ││ content      │    ││ sort_order   │
│ email    UK  │    ││ cover_url    │    ││ created_at   │
│ bio          │    ││ category_id FK│───┘│ updated_at   │
│ role         │    ││ author_id  FK│───┘ │ deleted      │
│ status       │    ││ status       │     └──────────────┘
│ created_at   │    ││ view_count   │
│ updated_at   │    ││ like_count   │     ┌──────────────┐
│ deleted      │    ││ is_top       │     │     tag      │
└──────────────┘    ││ created_at   │     │──────────────│
                    ││ updated_at   │    ┌│ id       PK  │
┌──────────────┐    ││ deleted      │    ││ name         │
│   comment    │    │└──────┬───────┘    ││ slug     UK  │
│──────────────│    │       │            ││ created_at   │
│ id       PK  │    │  ┌────▼─────┐      ││ updated_at   │
│ target_type  │    │  │ post_tag │      ││ deleted      │
│ target_id    │    │  │──────────│      │└──────────────┘
│ user_id   FK │───┐  │ post_id  │──────┘
│ guest_nick   │   │  │ tag_id   │
│ guest_email  │   │  └──────────┘
│ parent_id FK │   │
│ root_id   FK │   │
│ content      │   │
│ ip_address   │   │
│ user_agent   │   │ ┌──────────────────┐
│ status       │   │ │  system_setting  │
│ created_at   │   │ │──────────────────│
│ updated_at   │   │ │ id          PK   │
│ deleted      │   │ │ config_key  UK   │
└──────────────┘   │ │ config_value     │
       ▲           │ │ config_desc      │
       └───────────┘ │ created_at       │
    (自引用)         │ updated_at       │
                     └──────────────────┘

┌──────────────────┐
│  operation_log   │
│──────────────────│
│ id          PK   │
│ module           │
│ action           │
│ user_id     FK   │
│ description      │
│ request_params   │
│ result_data      │
│ execution_ms     │
│ ip_address       │
│ created_at       │
└──────────────────┘
```

---

## 2. 表结构详细定义

### 2.1 用户表 `user`

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 用户 ID |
| username | VARCHAR(50) | NOT NULL, UNIQUE | 用户名（登录用） |
| password | VARCHAR(255) | NOT NULL | BCrypt 加密密码 |
| nickname | VARCHAR(100) | NOT NULL | 显示昵称 |
| avatar_url | VARCHAR(500) | NULLABLE | 头像 URL (MinIO) |
| email | VARCHAR(100) | UNIQUE | 邮箱 |
| bio | VARCHAR(500) | NULLABLE | 个人简介 |
| role | VARCHAR(20) | NOT NULL, DEFAULT 'USER' | 角色: USER / ADMIN |
| status | TINYINT | NOT NULL, DEFAULT 1 | 0-禁用 1-正常 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |
| deleted | TINYINT | NOT NULL, DEFAULT 0 | 逻辑删除 |

### 2.2 文章表 `post`

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 文章 ID |
| title | VARCHAR(200) | NOT NULL | 标题 |
| slug | VARCHAR(200) | NOT NULL, UNIQUE | URL 友好标识 |
| summary | VARCHAR(500) | NOT NULL | 摘要 |
| content | LONGTEXT | NOT NULL | MDX 正文内容 |
| cover_url | VARCHAR(500) | NULLABLE | 封面图 URL |
| category_id | BIGINT | FK → category.id | 所属分类 |
| author_id | BIGINT | FK → user.id | 作者 |
| status | TINYINT | NOT NULL, DEFAULT 0 | 0-草稿 1-已发布 |
| allow_comment | TINYINT | NOT NULL, DEFAULT 1 | 是否允许评论: 0-关闭 1-开启 |
| view_count | INT | NOT NULL, DEFAULT 0 | 浏览次数（Redis 定期回写） |
| like_count | INT | NOT NULL, DEFAULT 0 | 点赞数（Redis 定期回写） |
| is_top | TINYINT | NOT NULL, DEFAULT 0 | 是否置顶 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |
| deleted | TINYINT | NOT NULL, DEFAULT 0 | 逻辑删除 |

### 2.3 分类表 `category`

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 分类 ID |
| name | VARCHAR(50) | NOT NULL | 分类名 |
| slug | VARCHAR(50) | NOT NULL, UNIQUE | URL 标识 |
| description | VARCHAR(200) | NULLABLE | 分类描述 |
| sort_order | INT | NOT NULL, DEFAULT 0 | 排序权重 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |
| deleted | TINYINT | NOT NULL, DEFAULT 0 | 逻辑删除 |

### 2.4 标签表 `tag`

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 标签 ID |
| name | VARCHAR(50) | NOT NULL | 标签名 |
| slug | VARCHAR(50) | NOT NULL, UNIQUE | URL 标识 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |
| deleted | TINYINT | NOT NULL, DEFAULT 0 | 逻辑删除 |

### 2.5 文章-标签关联表 `post_tag`

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| post_id | BIGINT | PK, FK → post.id | 文章 ID |
| tag_id | BIGINT | PK, FK → tag.id | 标签 ID |

### 2.6 评论表 `comment`

> **设计原则**：已登录用户 `user_id` 有值，`guest_*` 字段为 NULL；游客用户 `user_id` 为 NULL，`guest_nickname` / `guest_email` 由前端提交。后端在写入时根据全局开关 & 文章开关 & 管理员豁免来决定是否允许写入。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 评论 ID |
| target_type | VARCHAR(20) | NOT NULL | 目标类型 (post, page) |
| target_id | BIGINT | NOT NULL | 目标内容的 ID |
| user_id | BIGINT | FK → user.id, DEFAULT NULL | 注册用户 ID（游客留空） |
| guest_nickname | VARCHAR(100) | DEFAULT NULL | 游客昵称（游客必填） |
| guest_email | VARCHAR(100) | DEFAULT NULL | 游客邮箱（可选） |
| parent_id | BIGINT | FK → comment.id, NULLABLE | 直接父评论 ID |
| root_id | BIGINT | FK → comment.id, NULLABLE | 根评论 ID（楼层 ID，层级汇总用） |
| content | TEXT | NOT NULL | 评论正文 (utf8mb4) |
| ip_address | VARCHAR(45) | NULLABLE | 提交者 IP 地址 |
| user_agent | VARCHAR(255) | NULLABLE | 提交者 User-Agent |
| status | TINYINT | NOT NULL, DEFAULT 1 | 0-待审 1-正常 2-屏蔽 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |
| deleted | TINYINT | NOT NULL, DEFAULT 0 | 逻辑删除 |

### 2.7 系统配置表 `system_setting`

> 存储全局功能开关与可配置参数，管理员可在后台动态修改。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 配置 ID |
| config_key | VARCHAR(100) | NOT NULL, UNIQUE | 配置键名 |
| config_value | VARCHAR(500) | NOT NULL | 配置值 |
| config_desc | VARCHAR(255) | NULLABLE | 配置说明 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

**初始配置项**（由 `V2__Insert_Default_Data.sql` 写入）：

| config_key | 默认值 | 说明 |
|------------|--------|------|
| global_comment_enabled | 1 | 全站评论功能总开关: 0-关闭, 1-开启 |
| guest_comment_enabled | 1 | 游客匿名评论开关: 0-仅登录用户, 1-允许游客 |
| site_title | 我的博客 | 网站标题 |
| site_description | 技术与生活 | 网站描述，用于 SEO Meta |

### 2.8 操作日志表 `operation_log`

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 日志 ID |
| module | VARCHAR(50) | NOT NULL | 所属模块 (Post, User, etc.) |
| action | VARCHAR(100) | NOT NULL | 操作描述 (Create, Update, Delete) |
| user_id | BIGINT | FK → user.id, NULLABLE | 触发者 ID |
| description | VARCHAR(255) | NULLABLE | 操作梗概 |
| request_params | JSON | NULLABLE | 原始请求参数 |
| result_data | JSON | NULLABLE | 操作结果信息 |
| execution_ms | INT | NOT NULL, DEFAULT 0 | 执行耗时 (ms) |
| ip_address | VARCHAR(45) | NULLABLE | 操作 IP |
| created_at | DATETIME | NOT NULL | 记录时间 |

---

## 3. 索引设计

```sql
-- 文章表索引
CREATE INDEX idx_category    ON post(category_id);
CREATE INDEX idx_author      ON post(author_id);
CREATE INDEX idx_status_time ON post(status, created_at DESC);
-- slug 已有 UNIQUE 约束 (uk_slug)，无需额外索引

-- 评论表索引
CREATE INDEX idx_target  ON comment(target_type, target_id);
CREATE INDEX idx_user    ON comment(user_id);
CREATE INDEX idx_parent  ON comment(parent_id);
CREATE INDEX idx_root    ON comment(root_id);

-- 文章标签关联索引
CREATE INDEX idx_tag ON post_tag(tag_id);
-- (post_id, tag_id) 已作为联合主键

-- 用户表
-- username (uk_username) 和 email (uk_email) 已有 UNIQUE 约束

-- 分类表 / 标签表
-- slug (uk_slug) 已有 UNIQUE 约束

-- 系统配置表
-- config_key (uk_config_key) 已有 UNIQUE 约束
```

---

## 4. Flyway 迁移规范

### 4.1 当前迁移文件列表

```
src/main/resources/db/migration/
├── V1__Initial_Schema.sql         -- 建表: user, category, tag, post, post_tag, comment, system_setting, operation_log
└── V2__Insert_Default_Data.sql    -- 初始化数据: 管理员、分类、标签、系统配置、示例文章
```

### 4.2 编写规则

| 规则 | 说明 |
|------|------|
| 幂等性 | 使用 `IF NOT EXISTS` / `IF EXISTS` |
| 原子性 | 每个迁移文件完成一个独立变更 |
| 不可变 | 已执行的迁移禁止修改 |
| 编码 | UTF-8，统一 UNIX 换行符 |
| 注释 | 每条 SQL 必须有中文注释 |

### 4.3 V1 建表脚本要点

- 所有表使用 `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
- 公共审计字段：`created_at`、`updated_at`、`deleted`
- 逻辑删除统一使用 `deleted TINYINT NOT NULL DEFAULT 0`
- `ON UPDATE CURRENT_TIMESTAMP` 自动维护 `updated_at`

### 4.4 V2 默认数据说明

`V2__Insert_Default_Data.sql` 负责初始化系统基础数据：

| 数据类型 | 内容 |
|----------|------|
| **管理员账户** | 账号: `admin` / 密码: `admin123` (BCrypt)，**上线前务必修改** |
| **默认分类** | 技术分享 (tech)、生活随笔 (life)、开源项目 (open-source) |
| **默认标签** | Next.js、Spring Boot、MySQL、Docker、架构设计 |
| **系统配置** | global_comment_enabled=1, guest_comment_enabled=1, site_title, site_description |
| **示例文章** | 欢迎文章，关联 Next.js / Spring Boot / Docker 标签 |

---

> **下一步**: 参阅 [07-api-design.md](./07-api-design.md) 了解 API 接口设计规范。
