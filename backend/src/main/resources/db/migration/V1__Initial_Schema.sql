-- =============================================================================
-- V1__Initial_Schema.sql
-- 数据库初始化脚本 — 建表
-- 覆盖范围：用户、分类、标签、文章、文章-标签关联、评论、操作日志、系统配置
-- =============================================================================

-- --------------------------------
-- 1. 用户表
-- --------------------------------
CREATE TABLE IF NOT EXISTS `user` (
    `id`          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    `username`    VARCHAR(50)      NOT NULL                COMMENT '用户名（唯一）',
    `password`    VARCHAR(255)     NOT NULL                COMMENT '加密密码 (BCrypt)',
    `nickname`    VARCHAR(100)     NOT NULL                COMMENT '显示昵称',
    `avatar_url`  VARCHAR(500)     DEFAULT NULL            COMMENT '头像 URL',
    `email`       VARCHAR(100)     DEFAULT NULL            COMMENT '邮箱',
    `bio`         VARCHAR(500)     DEFAULT NULL            COMMENT '个人介绍',
    `role`        VARCHAR(20)      NOT NULL DEFAULT 'USER' COMMENT '角色: USER | ADMIN',
    `status`      TINYINT          NOT NULL DEFAULT 1      COMMENT '状态: 0-禁用, 1-正常',
    `created_at`  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP                    COMMENT '创建时间',
    `updated_at`  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`     TINYINT          NOT NULL DEFAULT 0      COMMENT '逻辑删除: 0-未删除, 1-已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    UNIQUE KEY `uk_email`    (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- --------------------------------
-- 2. 分类表
-- --------------------------------
CREATE TABLE IF NOT EXISTS `category` (
    `id`          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '分类ID',
    `name`        VARCHAR(50)      NOT NULL                COMMENT '分类名称',
    `slug`        VARCHAR(50)      NOT NULL                COMMENT 'URL 别名',
    `description` VARCHAR(200)     DEFAULT NULL            COMMENT '分类描述',
    `sort_order`  INT              NOT NULL DEFAULT 0      COMMENT '排序权重（越大越靠前）',
    `created_at`  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP                    COMMENT '创建时间',
    `updated_at`  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`     TINYINT          NOT NULL DEFAULT 0      COMMENT '逻辑删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- --------------------------------
-- 3. 标签表
-- --------------------------------
CREATE TABLE IF NOT EXISTS `tag` (
    `id`          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '标签ID',
    `name`        VARCHAR(50)      NOT NULL                COMMENT '标签名称',
    `slug`        VARCHAR(50)      NOT NULL                COMMENT 'URL 别名',
    `created_at`  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP                    COMMENT '创建时间',
    `updated_at`  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`     TINYINT          NOT NULL DEFAULT 0      COMMENT '逻辑删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签表';

-- --------------------------------
-- 4. 文章表
-- --------------------------------
CREATE TABLE IF NOT EXISTS `post` (
    `id`            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '文章ID',
    `title`         VARCHAR(200)     NOT NULL                COMMENT '文章标题',
    `slug`          VARCHAR(200)     NOT NULL                COMMENT 'URL 别名',
    `summary`       VARCHAR(500)     NOT NULL                COMMENT '文章摘要',
    `content`       LONGTEXT         NOT NULL                COMMENT '正文内容 (MDX/Markdown)',
    `cover_url`     VARCHAR(500)     DEFAULT NULL            COMMENT '封面图 URL',
    `category_id`   BIGINT UNSIGNED  DEFAULT NULL            COMMENT '关联分类ID',
    `author_id`     BIGINT UNSIGNED  NOT NULL                COMMENT '作者ID (关联 user.id)',
    `status`        TINYINT          NOT NULL DEFAULT 0      COMMENT '发布状态: 0-草稿, 1-已发布',
    `allow_comment` TINYINT          NOT NULL DEFAULT 1      COMMENT '是否允许评论: 0-关闭, 1-开启',
    `view_count`    INT              NOT NULL DEFAULT 0      COMMENT '浏览次数',
    `like_count`    INT              NOT NULL DEFAULT 0      COMMENT '点赞数',
    `is_top`        TINYINT          NOT NULL DEFAULT 0      COMMENT '是否置顶: 0-否, 1-是',
    `created_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP                    COMMENT '创建时间',
    `updated_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`       TINYINT          NOT NULL DEFAULT 0      COMMENT '逻辑删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_slug` (`slug`),
    INDEX `idx_category`   (`category_id`),
    INDEX `idx_author`     (`author_id`),
    INDEX `idx_status_time`(`status`, `created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章表';

-- --------------------------------
-- 5. 文章-标签关联表
-- --------------------------------
CREATE TABLE IF NOT EXISTS `post_tag` (
    `post_id` BIGINT UNSIGNED NOT NULL COMMENT '文章ID',
    `tag_id`  BIGINT UNSIGNED NOT NULL COMMENT '标签ID',
    PRIMARY KEY (`post_id`, `tag_id`),
    INDEX `idx_tag` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章-标签关联表';

-- --------------------------------
-- 6. 评论表
-- 设计原则：
--   • 已登录用户：user_id 有值，guest_* 字段为 NULL
--   • 游客用户：user_id 为 NULL，guest_nickname / guest_email 由前端提交
--   • 后端在写入时根据全局开关 & 文章开关 & 管理员豁免来决定是否允许写入
-- --------------------------------
CREATE TABLE IF NOT EXISTS `comment` (
    `id`             BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '评论ID',
    `target_type`    VARCHAR(20)      NOT NULL                COMMENT '目标类型: post | page',
    `target_id`      BIGINT UNSIGNED  NOT NULL                COMMENT '目标内容ID',
    `user_id`        BIGINT UNSIGNED  DEFAULT NULL            COMMENT '注册用户ID（游客留空）',
    `guest_nickname` VARCHAR(100)     DEFAULT NULL            COMMENT '游客昵称（游客必填）',
    `guest_email`    VARCHAR(100)     DEFAULT NULL            COMMENT '游客邮箱（可选）',
    `parent_id`      BIGINT UNSIGNED  DEFAULT NULL            COMMENT '父评论ID（二级评论）',
    `root_id`        BIGINT UNSIGNED  DEFAULT NULL            COMMENT '根评论ID（楼层ID）',
    `content`        TEXT             NOT NULL                COMMENT '评论正文',
    `ip_address`     VARCHAR(45)      DEFAULT NULL            COMMENT '提交者 IP 地址',
    `user_agent`     VARCHAR(255)     DEFAULT NULL            COMMENT '提交者 User-Agent',
    `status`         TINYINT          NOT NULL DEFAULT 1      COMMENT '审核状态: 0-待审, 1-正常, 2-屏蔽',
    `created_at`     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP                    COMMENT '创建时间',
    `updated_at`     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`        TINYINT          NOT NULL DEFAULT 0      COMMENT '逻辑删除',
    PRIMARY KEY (`id`),
    INDEX `idx_target` (`target_type`, `target_id`),
    INDEX `idx_user`   (`user_id`),
    INDEX `idx_parent` (`parent_id`),
    INDEX `idx_root`   (`root_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- --------------------------------
-- 7. 系统配置表
-- 存储全局功能开关与可配置参数，管理员可在后台动态修改
-- --------------------------------
CREATE TABLE IF NOT EXISTS `system_setting` (
    `id`           BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '配置ID',
    `config_key`   VARCHAR(100)     NOT NULL                COMMENT '配置键名（唯一）',
    `config_value` VARCHAR(500)     NOT NULL                COMMENT '配置值',
    `config_desc`  VARCHAR(255)     DEFAULT NULL            COMMENT '配置说明',
    `created_at`   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP                    COMMENT '创建时间',
    `updated_at`   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- --------------------------------
-- 8. 操作日志表
-- --------------------------------
CREATE TABLE IF NOT EXISTS `operation_log` (
    `id`             BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '日志ID',
    `module`         VARCHAR(50)      NOT NULL                COMMENT '功能模块名称',
    `action`         VARCHAR(100)     NOT NULL                COMMENT '操作名称',
    `user_id`        BIGINT UNSIGNED  DEFAULT NULL            COMMENT '操作用户ID（未登录时为NULL）',
    `description`    VARCHAR(255)     DEFAULT NULL            COMMENT '操作描述',
    `request_params` JSON             DEFAULT NULL            COMMENT '请求参数（JSON）',
    `result_data`    JSON             DEFAULT NULL            COMMENT '响应结果（JSON）',
    `execution_ms`   INT              NOT NULL DEFAULT 0      COMMENT '接口执行耗时(ms)',
    `ip_address`     VARCHAR(45)      DEFAULT NULL            COMMENT '操作者 IP 地址',
    `created_at`     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    INDEX `idx_user_time`     (`user_id`, `created_at`),
    INDEX `idx_module_action` (`module`, `action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';
