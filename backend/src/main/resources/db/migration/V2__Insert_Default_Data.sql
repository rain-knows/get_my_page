-- =============================================================================
-- V2__Insert_Default_Data.sql
-- 初始化默认数据 — 管理员账户、分类、标签、系统配置、示例文章
-- =============================================================================

-- --------------------------------
-- 1. 默认管理员账户
-- 账号: admin  密码: admin123  (BCrypt Hash)
-- ⚠️ 上线前务必通过后台修改密码
-- --------------------------------
INSERT INTO `user` (`username`, `password`, `nickname`, `email`, `bio`, `role`, `status`)
VALUES (
    'admin',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi',
    '站长',
    'admin@getmypage.com',
    '这里是我的个人博客，记录技术与生活。',
    'ADMIN',
    1
);

-- --------------------------------
-- 2. 默认分类
-- --------------------------------
INSERT INTO `category` (`name`, `slug`, `description`, `sort_order`)
VALUES
    ('技术分享', 'tech',        '编程技术与工程实践',     10),
    ('生活随笔', 'life',        '日常所见所想',           5),
    ('开源项目', 'open-source', '我参与或维护的开源项目', 8);

-- --------------------------------
-- 3. 默认标签
-- --------------------------------
INSERT INTO `tag` (`name`, `slug`)
VALUES
    ('Next.js',     'nextjs'),
    ('Spring Boot', 'spring-boot'),
    ('MySQL',       'mysql'),
    ('Docker',      'docker'),
    ('架构设计',    'architecture');

-- --------------------------------
-- 4. 系统全局配置
-- 所有可控开关在此处统一初始化
-- --------------------------------
INSERT INTO `system_setting` (`config_key`, `config_value`, `config_desc`)
VALUES
    -- 评论模块：全局总开关（管理员不受限）
    ('global_comment_enabled', '1', '全站评论功能总开关: 0-关闭, 1-开启'),
    -- 评论模块：是否允许游客（未登录）发表评论
    ('guest_comment_enabled',  '1', '游客匿名评论开关: 0-仅登录用户可评论, 1-允许游客评论'),
    -- 站点基本信息
    ('site_title',             '我的博客',    '网站标题'),
    ('site_description',       '技术与生活',  '网站描述，用于 SEO Meta');

-- --------------------------------
-- 5. 示例文章
-- --------------------------------
INSERT INTO `post` (`title`, `slug`, `summary`, `content`, `category_id`, `author_id`, `status`, `allow_comment`, `is_top`)
VALUES (
    '欢迎来到全新的全栈博客系统',
    'welcome-to-new-blog',
    '这是博客系统初始化成功后自动生成的第一篇文章，如果你看到了这里，说明部署已经成功！',
    '# 🎉 部署成功！\n\n欢迎使用这套基于 **Next.js + Spring Boot + MySQL + Redis** 构建的全栈博客系统。\n\n## 功能概览\n\n- 📝 支持 Markdown / MDX 文章编写\n- 💬 评论系统（支持游客评论，可分级控制）\n- 🔐 管理员专属账号，游客身份浏览\n- 📊 操作日志与系统配置后台\n\n## 开始使用\n\n使用以下账号登录后台管理：\n\n```\n账号: admin\n密码: admin123\n```\n\n> ⚠️ **请在首次登录后立即修改密码！**\n\n---\n\n_快去删除这篇文章，写下属于你的第一篇创作吧！_',
    1,  -- 分类: 技术分享
    1,  -- 作者: admin (id=1)
    1,  -- 状态: 已发布
    1,  -- 允许评论
    1   -- 置顶
);

-- --------------------------------
-- 6. 为示例文章关联标签
-- --------------------------------
INSERT INTO `post_tag` (`post_id`, `tag_id`)
VALUES
    (1, 1),  -- Next.js
    (1, 2),  -- Spring Boot
    (1, 4);  -- Docker
