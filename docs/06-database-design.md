# 数据库设计与迁移规范

> **文档版本**: v1.1.0 | **最后更新**: 2026-04-04 | **适用范围**: 后端开发人员

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
│ post_id  FK  │────┘  │ post_tag │      ││ deleted      │
│ user_id  FK  │───┐   │──────────│      │└──────────────┘
│ parent_id FK │   │   │ post_id  │──────┘
│ content      │   │   │ tag_id   │
│ status       │   │   └──────────┘
│ created_at   │   │
│ updated_at   │   │
│ deleted      │   │
└──────────────┘   │
       ▲           │
       └───────────┘ (自引用: parent_id → comment.id)
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
| view_count | INT | NOT NULL, DEFAULT 0 | 阅读量（Redis 定期回写） |
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

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 评论 ID |
| post_id | BIGINT | FK → post.id, NOT NULL | 所属文章 |
| user_id | BIGINT | FK → user.id, NOT NULL | 评论者 |
| parent_id | BIGINT | FK → comment.id, NULLABLE | 父评论 (嵌套回复) |
| content | TEXT | NOT NULL | 评论内容 |
| status | TINYINT | NOT NULL, DEFAULT 1 | 0-隐藏 1-显示 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |
| deleted | TINYINT | NOT NULL, DEFAULT 0 | 逻辑删除 |

---

## 3. 索引设计

```sql
-- 文章表索引
CREATE INDEX idx_post_category ON post(category_id);
CREATE INDEX idx_post_author ON post(author_id);
CREATE INDEX idx_post_status_created ON post(status, created_at DESC);
CREATE INDEX idx_post_slug ON post(slug);

-- 评论表索引
CREATE INDEX idx_comment_post ON comment(post_id, created_at);
CREATE INDEX idx_comment_user ON comment(user_id);
CREATE INDEX idx_comment_parent ON comment(parent_id);

-- 文章标签关联索引
CREATE INDEX idx_post_tag_tag ON post_tag(tag_id);
```

---

## 4. Flyway 迁移规范

### 4.1 文件命名

```
src/main/resources/db/migration/
├── V1__create_user_table.sql
├── V2__create_category_table.sql
├── V3__create_tag_table.sql
├── V4__create_post_table.sql
├── V5__create_post_tag_table.sql
├── V6__create_comment_table.sql
├── V7__insert_default_admin.sql
└── V8__add_post_indexes.sql
```

### 4.2 编写规则

| 规则 | 说明 |
|------|------|
| 幂等性 | 使用 `IF NOT EXISTS` / `IF EXISTS` |
| 原子性 | 每个迁移文件完成一个独立变更 |
| 不可变 | 已执行的迁移禁止修改 |
| 编码 | UTF-8，统一 UNIX 换行符 |
| 注释 | 每条 SQL 必须有中文注释 |

### 4.3 迁移示例

```sql
-- V1__create_user_table.sql
-- 创建用户表，存储系统账号信息

CREATE TABLE IF NOT EXISTS `user` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    `username`    VARCHAR(50)  NOT NULL COMMENT '用户名',
    `password`    VARCHAR(255) NOT NULL COMMENT '加密密码(BCrypt)',
    `nickname`    VARCHAR(100) NOT NULL COMMENT '显示昵称',
    `avatar_url`  VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
    `email`       VARCHAR(100) DEFAULT NULL COMMENT '邮箱地址',
    `bio`         VARCHAR(500) DEFAULT NULL COMMENT '个人简介',
    `role`        VARCHAR(20)  NOT NULL DEFAULT 'USER' COMMENT '角色:USER/ADMIN',
    `status`      TINYINT      NOT NULL DEFAULT 1 COMMENT '状态:0禁用1正常',
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`     TINYINT      NOT NULL DEFAULT 0 COMMENT '逻辑删除:0正常1删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
```

---

> **下一步**: 参阅 [07-api-design.md](./07-api-design.md) 了解 API 接口设计规范。
