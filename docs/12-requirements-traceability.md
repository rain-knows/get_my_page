# GetMyPage 需求规格与能力追溯表

> **文档版本**: v3.0.0 | **生成日期**: 2026-05-05 | **基准代码**: main 分支 (含本次修复)
> **覆盖范围**: 前端 + 后端 + 基础设施 全仓库
>
> **状态图例**: `已完成` `部分完成` `缺失` `桩代码`

---

## 第一部分：功能需求 — 完成与偏离总览

### 1. 用户认证域 (AUTH)

| 需求ID | 优先级 | 需求描述 | 状态 | 偏离说明 |
|--------|--------|---------|------|---------|
| FR-AUTH-001 | P0 | 用户注册，返回 token | `已完成` | — |
| FR-AUTH-002 | P0 | 用户名密码登录，返回双 token | `已完成` | — |
| FR-AUTH-003 | P0 | Refresh Token 刷新 access token | `部分完成` | **偏离**: 刷新后返回同一 refreshToken，无 token rotation；JWT 签名后不校验 Redis 黑名单 |
| FR-AUTH-004 | P1 | 登出后 token 写入 Redis 黑名单 | `部分完成` | **偏离**: AuthServiceImpl.logout() 仅有 `// TODO: 将 token 加入 Redis 黑名单` 注释，无实际黑名单写入；Controller 传 null 作为 token 占位 |
| FR-AUTH-005 | P0 | RBAC 角色控制 (USER/ADMIN) | `已完成` | — |

### 2. 文章读取域 (POST-READ)

| 需求ID | 优先级 | 需求描述 | 状态 | 偏离说明 |
|--------|--------|---------|------|---------|
| FR-POST-001 | P0 | 文章分页列表 (page/size, max 50) | `已完成` | — |
| FR-POST-002 | P0 | 按 slug 文章详情 (含 includeDraft) | `已完成` | — |
| FR-POST-003 | P0 | tiptap-json 内容渲染 (Novel 扩展集) | `已完成` | — |
| FR-POST-004 | P1 | 管理员 ?preview=local 本地草稿预览 | `已完成` | — |

### 3. 文章写入域 (POST-WRITE)

| 需求ID | 优先级 | 需求描述 | 状态 | 偏离说明 |
|--------|--------|---------|------|---------|
| FR-POST-010 | P0 | 管理员创建文章 (tiptap-json 校验) | `已完成` | **偏离**: 后端 API 完整但前端 `features/post/api.ts` 无 `createPost()` 函数，当前无前端入口调用此接口 |
| FR-POST-011 | P0 | 管理员更新文章 (baseUpdatedAt 冲突检测) | `已完成` | — |
| FR-POST-012 | P0 | 管理员删除文章 (逻辑删除 + 缓存/索引同步) | `已完成` | **偏离**: 后端完整但前端无调用入口（无删除按钮） |
| FR-POST-013 | P1 | 内容格式迁移 (旧格式 → tiptap-json) | `已完成` | `PostContentMigrationServiceImpl` + `AdminPostMigrationController` 已实现 |
| FR-POST-014 | P1 | 文章摘要自动提取 (tiptap-json → 140 字符) | `已完成` | `PostServiceImpl.resolveExcerpt()` 完整实现 |

### 4. 文章编辑域 (POST-EDIT) — 本次修复

| 需求ID | 优先级 | 需求描述 | 状态 | 偏离说明 |
|--------|--------|---------|------|---------|
| FR-EDIT-001 | P0 | 编辑页加载服务端内容 (服务端优先) | `已完成` | **本次修复**: 原逻辑为 localStorage 优先覆盖服务端，现改为服务端优先；**架构契约 §1.4 第 95 行需同步更新** |
| FR-EDIT-002 | P0 | 内容解析错误可见提示 | `已完成` | **本次修复**: 新增 `tryParsePostContent()` 与黄色警告条，覆盖内容为空/非 tiptap-json/JSON 解析失败三种场景 |
| FR-EDIT-003 | P0 | 编辑器"发布到服务器"按钮 | `已完成` | **本次修复**: `PostRichEditor` 新增 `onPublish` prop 与工具栏按钮 → `BlogArticleEditor.handlePublish()` → `updatePost()` |
| FR-EDIT-004 | P1 | 标题草稿 localStorage 持久化 | `已完成` | — |
| FR-EDIT-005 | P1 | 正文草稿 localStorage 自动保存 (500ms 防抖) | `已完成` | — |
| FR-EDIT-006 | P1 | 嵌入链接卡片 (GitHub/网易云/B站/URL 粘贴) | `已完成` | `EmbedController` (59L) + `EmbedServiceImpl` (683L) 完整实现 |
| FR-EDIT-007 | P1 | 代码块编辑 (CodeMirror 6, 11 语言, 行号) | `已完成` | `code-block/` 独立模块 (7 文件) |

### 5. 搜索域 (SEARCH)

| 需求ID | 优先级 | 需求描述 | 状态 | 偏离说明 |
|--------|--------|---------|------|---------|
| FR-SEARCH-001 | P0 | 关键词搜索 (Meilisearch + MySQL 降级) | `已完成` | — |
| FR-SEARCH-002 | P1 | 搜索索引自动同步 (发布/删除) | `已完成` | `PostPublishedListener` → `SearchClient.syncPublicPostIndex()` |
| FR-SEARCH-003 | P2 | 正文全文可搜索 (contentText 索引字段) | `已完成` | **本次修复**: `SearchClient.buildSearchDocument()` 新增 `contentText` 字段，从 tiptap-json 递归提取纯文本 |

### 6. 评论域 (COMMENT)

| 需求ID | 优先级 | 需求描述 | 状态 | 偏离说明 |
|--------|--------|---------|------|---------|
| FR-COMMENT-001 | P0 | 发表评论 (登录用户/游客) | `缺失` | **严重偏离**: 数据库 `comment` 表已建，`Comment.java` Entity 存在，但无 Controller/Service/Mapper/DTO，整个评论 API 未实现 |
| FR-COMMENT-002 | P0 | 树形评论读取 | `缺失` | 同上 |
| FR-COMMENT-003 | P1 | 评论删除 (本人/管理员) | `缺失` | 同上 |

### 7. 上传域 (UPLOAD)

| 需求ID | 优先级 | 需求描述 | 状态 | 偏离说明 |
|--------|--------|---------|------|---------|
| FR-UPLOAD-001 | P0 | 文件上传到 MinIO (大小/类型校验) | `已完成` | `FileController` (38L) + `FileServiceImpl` (206L) + `StorageClient` (216L) |
| FR-UPLOAD-002 | P1 | 上传认证透传 (/api/upload → /api/files/upload) | `已完成` | `frontend/src/app/api/upload/route.ts` (328L) |
| FR-UPLOAD-003 | P1 | 编辑器中图片粘贴/拖拽直插 | `已完成` | `PostRichEditor` 内 `handleEditorPaste` / `tryInsertDroppedImages` |

### 8. 运维域 (OPS)

| 需求ID | 优先级 | 需求描述 | 状态 | 偏离说明 |
|--------|--------|---------|------|---------|
| FR-OPS-001 | P0 | CI 质量门禁 (lint/build/test/smoke) | `已完成` | GitHub Actions 三段式 `.github/workflows/ci.yml` |
| FR-OPS-002 | P0 | Admin 全量索引重建 | `已完成` | `SearchServiceImpl.rebuildAllIndices()` 存在 (通过 `SearchController` Admin 端点) |
| FR-OPS-003 | P1 | 操作审计日志 (operation_log 表) | `缺失` | **严重偏离**: DDL 中 `operation_log` 表已定义，但无 Entity/Mapper/Service，无任何代码写入此表；README 仍将其列为已有功能 |

### 9. 分类/标签域 (CATEGORY/TAG)

| 需求ID | 优先级 | 需求描述 | 状态 | 偏离说明 |
|--------|--------|---------|------|---------|
| FR-CAT-001 | P1 | 分类 CRUD | `桩代码` | `Category.java` Entity + `CategoryMapper` 空壳存在，无 Controller/Service/DTO |
| FR-TAG-001 | P1 | 标签 CRUD | `桩代码` | `Tag.java` Entity + `TagMapper` 空壳存在，无 Controller/Service/DTO |
| FR-POST-004 | P1 | 文章关联分类/标签 | `缺失` | 后端 `post` 表有 `category_id` 字段和 `post_tag` 关联表，但 API 响应不含此信息 |

### 10. 点赞域 (LIKE)

| 需求ID | 优先级 | 需求描述 | 状态 | 偏离说明 |
|--------|--------|---------|------|---------|
| FR-LIKE-001 | P1 | 文章点赞/取消点赞 | `缺失` | **严重偏离**: `Post.java` 含 `likeCount` 字段，`types/api.ts` 含 `isLiked` 字段，但无 Controller/Service/数据表/前端调用，API 文档中列出的 `POST /api/posts/{id}/like` 未实现 |

---

## 第二部分：非功能需求 — 完成与偏离总览

| 需求ID | 优先级 | 类别 | 要求 | 状态 | 偏离说明 |
|--------|--------|------|------|------|---------|
| NFR-PERF-001 | P0 | 性能 | API < 300ms，首屏 < 1s | `部分完成` | 未做全量压测验证 |
| NFR-PERF-002 | P0 | 缓存 | 三级缓存 Caffeine → Redis → MySQL | `已完成` | `CacheFacade` (121L) + `CacheConfig` 已实现 |
| NFR-PERF-003 | P1 | 并发 | 虚拟线程 + Redis 原子计数 + 定时回写 | `部分完成` | 虚拟线程已启用；但阅读量/点赞的 Redis 计数器 + Cron 回写未确认实现 |
| NFR-SEC-001 | P0 | 安全 | BCrypt(12)；密钥不入仓库 | `已完成` | — |
| NFR-SEC-002 | P0 | 安全 | JWT 双 Token；登出黑名单；非 root | `部分完成` | **偏离**: 登出黑名单未实现 (同 FR-AUTH-004) |
| NFR-SEC-003 | P0 | 安全 | 统一错误码体系 | `已完成` | `ErrorCode` 枚举完整，`GlobalExceptionHandler` 统一处理 |
| NFR-MTN-001 | P0 | 可维护性 | 架构契约分层；函数级汉语注释 | `已完成` | — |
| NFR-MTN-002 | P0 | 可维护性 | 禁止 app 中写业务逻辑；禁止 ui 中放业务组件 | `已完成` | 经审计确认所有页面均为薄路由壳层，业务逻辑在 features/ 内 |
| NFR-MTN-003 | P1 | 可观测性 | 关键链路日志含模块/错误码/上下文 | `部分完成` | 有 log 但未体系化验证 |
| NFR-UI-001 | P0 | UI | Arknights 工业风；CSS 令牌；Tailwind v4 规范 | `已完成` | `design.md` 完整约束 + `globals.css` 令牌体系 |
| NFR-UI-002 | P0 | UI 动效 | 令牌化时长；prefers-reduced-motion | `已完成` | `tokens.ts` 双轨 easing + `globals.css` duration 令牌 |
| NFR-UI-003 | P0 | UI 首页 | 每次刷新显示加载页；EntryExperienceGate | `已完成` | — |
| NFR-UI-004 | P1 | UI 响应式 | 375/768/1024/1440 断点 | `部分完成` | 未逐断点走查验收 |
| NFR-UI-005 | P1 | UI 可访问性 | 按钮 ≥ 44px；显式 Label；密码显隐 | `部分完成` | 认证表单基本满足，全站未走查 |
| NFR-QA-001 | P0 | 质量 | 每个 P0 功能覆盖成功+失败验收 | `部分完成` | `SearchClientTest.java` 有测试；Post/Auth 缺少系统化测试覆盖 |

---

## 第三部分：API 端点 — 实现状态追溯

### 11. 认证模块 `/api/auth`

| API 端点 | 方法 | 文档声明 | 实际状态 | 实现文件 | 偏离 |
|----------|------|---------|---------|---------|------|
| `/api/auth/register` | POST | 已定义 | `已完成` | `AuthController.java:34` → `AuthServiceImpl.java:82` | — |
| `/api/auth/login` | POST | 已定义 | `已完成` | `AuthController.java:28` → `AuthServiceImpl.java:35` | — |
| `/api/auth/refresh` | POST | 已定义 | `部分完成` | `AuthController.java:42` → `AuthServiceImpl.java:159` | 无 token rotation |
| `/api/auth/logout` | POST | 已定义 | `部分完成` | `AuthController.java:49` → `AuthServiceImpl.java:183` (TODO) | 未写入黑名单 |

### 12. 文章模块 `/api/posts`

| API 端点 | 方法 | 文档声明 | 实际状态 | 实现文件 | 偏离 |
|----------|------|---------|---------|---------|------|
| `/api/posts` | GET | 已定义 | `已完成` | `PostController.java:33` → `PostServiceImpl.java:50` | — |
| `/api/posts/{slug}` | GET | 已定义 | `已完成` | `PostController.java:47` → `PostServiceImpl.java:79` | — |
| `/api/posts` | POST | 已定义 | `已完成` | `PostController.java:60` → `PostServiceImpl.java:98` | 前端无调用入口 |
| `/api/posts/{id}` | PUT | 已定义 | `已完成` | `PostController.java:71` → `PostServiceImpl.java:131` | **本次修复后已接入前端** |
| `/api/posts/{id}` | DELETE | 已定义 | `已完成` | `PostController.java:84` → `PostServiceImpl.java:166` | 前端无调用入口 |
| `/api/posts/{id}/like` | POST | **文档列出** | `缺失` | 无 Controller/Service/表 | API 文档与实现不符 |
| `/api/admin/posts/migrate-content` | POST | 已定义 | `已完成` | `AdminPostMigrationController` | — |

### 13. 搜索模块 `/api/search`

| API 端点 | 方法 | 文档声明 | 实际状态 | 实现文件 | 偏离 |
|----------|------|---------|---------|---------|------|
| `/api/search?q=` | GET | 已定义 | `已完成` | `SearchController.java` → `SearchServiceImpl.java:36` | — |

### 14. 评论模块 `/api/comments` — 全域缺失

| API 端点 | 方法 | 文档声明 | 实际状态 | 偏离 |
|----------|------|---------|---------|------|
| `/api/posts/{postId}/comments` | GET | 已定义 | `缺失` | 无 Controller/Service/Mapper/DTO |
| `/api/comments` | POST | 已定义 | `缺失` | 同上 |
| `/api/comments/{id}` | DELETE | 已定义 | `缺失` | 同上 |

### 15. 上传模块 `/api/files`

| API 端点 | 方法 | 文档声明 | 实际状态 | 实现文件 | 偏离 |
|----------|------|---------|---------|---------|------|
| `/api/files/upload` | POST | 已定义 | `已完成` | `FileController.java` → `FileServiceImpl.java` → `StorageClient.java` | — |
| `/api/upload` (前端路由) | POST | 已定义 | `已完成` | `frontend/src/app/api/upload/route.ts` (328L) | — |

### 16. 分类/标签 `/api/categories` `/api/tags` — 全域桩代码

| API 端点 | 方法 | 文档声明 | 实际状态 | 偏离 |
|----------|------|---------|---------|------|
| `/api/categories` | GET/POST/PUT/DELETE | 已定义 | `桩代码` | Entity + 空 Mapper 存在，无 Controller/Service |
| `/api/tags` | GET/POST/DELETE | 已定义 | `桩代码` | Entity + 空 Mapper 存在，无 Controller/Service |

---

## 第四部分：数据实体 — 代码实现追溯

| 数据实体 | MySQL 表 | Entity 类 | Mapper | DTO (请求/响应) | Service | Controller | 状态 |
|----------|---------|-----------|--------|----------------|---------|-----------|------|
| 用户 | `user` | `User.java` | `UserMapper.java` | `LoginRequest/RegisterRequest/UserResponse` | `AuthServiceImpl.java` (186L) | `AuthController.java` (62L) | `已完成` |
| 文章 | `post` | `Post.java` | `PostMapper.java` + XML (62L) | `PostCreateRequest/PostUpdateRequest`<br>`PostDetailResponse/PostListItemResponse` | `PostServiceImpl.java` (534L) | `PostController.java` (89L) | `已完成` |
| 分类 | `category` | `Category.java` (35L) | `CategoryMapper.java` (10L, 空壳) | **缺失** | **缺失** | **缺失** | `桩代码` |
| 标签 | `tag` | `Tag.java` (31L) | `TagMapper.java` (10L, 空壳) | **缺失** | **缺失** | **缺失** | `桩代码` |
| 文章-标签 | `post_tag` | 无独立 Entity | MyBatis-Plus 多对多 | — | — | — | `表已建/代码缺失` |
| 评论 | `comment` | `Comment.java` (58L) | **缺失** | **缺失** | **缺失** | **缺失** | `缺失` |
| 系统设置 | `system_setting` | `SystemSetting.java` | `SystemSettingMapper.java` | — | `SystemSettingServiceImpl.java` | — | `已完成` |
| 操作日志 | `operation_log` | **缺失** | **缺失** | **缺失** | **缺失** | **缺失** | `缺失` |
| 嵌入卡片 | N/A (无DB表) | — | — | `EmbedResolveRequest/EmbedResponse` | `EmbedServiceImpl.java` (683L) | `EmbedController.java` (59L) | `已完成` |

---

## 第五部分：架构契约 — 偏离清单

### 17. 需同步更新的架构契约条目

| 契约位置 | 当前文本 | 偏离说明 | 严重程度 | 建议操作 |
|----------|---------|---------|---------|---------|
| `architecture-contract.md` §1.4 第 95 行 | "编辑页首次进入时优先读取本地草稿，不存在时回退后端 posts 详情初始化" | **已过时**: 本次修复已将编辑页改为服务端优先策略，localStorage 仅作离线恢复兜底 | `中` | 更新为"编辑页首次进入以服务端数据为准；localStorage 草稿用于标题恢复与离线兜底" |
| `docs/11-rich-editor-design.md` §1 "编辑内容主存储为 localStorage" | 描述编辑仅保存到 localStorage | **已过时**: 本次修复新增了"发布到服务器"按钮，支持将编辑内容写回后端 | `中` | 补充"发布到服务器"持久化链路说明 |
| `docs/11-rich-editor-design.md` §3 | "不再以后端 posts 更新接口作为主保存路径" | **已过时**: 同上 | `中` | 补充编辑器可通过 PUT /api/posts/{id} 发布 |
| `docs/07-api-design.md` §4.2 | 列出 `POST /api/posts/{id}/like` | **未实现**: 无 Controller/Service/表 | `高` | 移除或标记为"计划中" |
| `docs/07-api-design.md` §4.3-4.4 | 列出 `/api/categories` `/api/tags` 全套 CRUD | **仅桩代码**: 无 Controller/Service | `高` | 移除未实现的端点或标记为"桩代码" |
| `README.md` 第 237 行 | 列出 `operation_log` 为"操作审计日志" | **未实现**: DDL 存在但无代码写入 | `高` | 移除或标记为"计划中" |
| `README.md` 第 183 行 | "前端根据 Swagger 文档定义 TypeScript 类型" | **偏离**: Swagger 可能列出来实现的端点 (like/categories/tags/comments) | `中` | 确保 Swagger 仅列出已实现的端点 |

### 18. 代码层面的已知偏离

| 偏离项 | 位置 | 严重程度 | 说明 |
|--------|------|---------|------|
| 废弃 PostDetail 类型 | `frontend/src/types/api.ts` | `低` | 含 author/tags/categoryName/isLiked 等后端不返回的字段，与 `features/post/types.ts` 中实际使用的类型重复且冲突 |
| 重复路由 | `(blog)/[slug]/` 和 `(blog)/blog/[slug]/` | `低` | 两组路由渲染相同组件，导航链接统一使用 `/blog/` 前缀，旧路由仅保留兼容 |
| 列表查询全列 SELECT | `PostMapper.xml` 所有查询 | `中` | LONGTEXT content 字段在 list/search 中总是被拉取后在 Java 层丢弃 |
| 前端无 createPost 调用 | `features/post/api.ts` | `中` | 后端 POST /api/posts 已实现但前端无 `createPost()` 函数，新建文章入口缺失 |
| 前端无 deletePost 调用 | `features/post/api.ts` | `中` | 后端 DELETE /api/posts/{id} 已实现但前端无调用 |

---

## 第六部分：本次修复变更追溯

| 变更文件 | 变更类型 | 修复的问题 | 影响的需求 | 代码行变化 |
|----------|---------|-----------|-----------|-----------|
| `BlogArticleEditor.tsx` | 逻辑重构 + 功能新增 | ① localStorage 优先→服务端优先 ② 新增内容解析错误提示 ③ 新增发布回调 | FR-EDIT-001, FR-EDIT-002, FR-EDIT-003 | +117 / -17 |
| `PostRichEditor.tsx` | 功能新增 | ① 新增 `onPublish` prop 与 `publishing` 状态 ② 新增"发布到服务器"按钮 ③ 通过 `onCreate` 持有编辑器实例引用 ④ Tailwind 规范修正 (max-w-screen-lg → max-w-5xl) | FR-EDIT-003 | +25 / -2 |
| `SearchClient.java` | 功能增强 | ① 新增 `contentText` 字段到 Meilisearch 文档 ② 新增 `extractContentPlainText()` 递归纯文本提取 ③ 注入 ObjectMapper | FR-SEARCH-003 | +52 / -5 |
| `SearchClientTest.java` | 测试适配 | SearchClient 构造函数新增 ObjectMapper 参数 | — | +10 / -5 |

---

## 第七部分：汇总统计

### 19. 功能需求完成度

| 域 | 总需求数 | 已完成 | 部分完成 | 缺失/桩代码 | 完成率 |
|----|---------|--------|---------|------------|--------|
| 认证 (AUTH) | 5 | 3 | 2 | 0 | 60% |
| 文章读取 (POST-READ) | 4 | 4 | 0 | 0 | 100% |
| 文章写入 (POST-WRITE) | 5 | 5 | 0 | 0 | 100% |
| 文章编辑 (POST-EDIT) | 7 | 7 | 0 | 0 | 100% |
| 搜索 (SEARCH) | 3 | 3 | 0 | 0 | 100% |
| 评论 (COMMENT) | 3 | 0 | 0 | 3 | 0% |
| 上传 (UPLOAD) | 3 | 3 | 0 | 0 | 100% |
| 运维 (OPS) | 3 | 2 | 0 | 1 | 67% |
| 分类/标签 | 3 | 0 | 0 | 3 | 0% |
| 点赞 | 1 | 0 | 0 | 1 | 0% |
| **合计** | **37** | **27** | **2** | **8** | **73%** |

### 20. 非功能需求完成度

| 类别 | 总需求数 | 已完成 | 部分完成 | 完成率 |
|------|---------|--------|---------|--------|
| 性能 | 3 | 1 | 2 | 33% |
| 安全 | 3 | 2 | 1 | 67% |
| 可维护性 | 3 | 2 | 1 | 67% |
| UI 设计 | 5 | 3 | 2 | 60% |
| 质量 | 1 | 0 | 1 | 0% |
| **合计** | **15** | **8** | **7** | **53%** |

### 21. P0 需求缺口（需优先处理）

| 优先级 | 需求ID | 缺口描述 | 影响 |
|--------|--------|---------|------|
| **P0** | FR-COMMENT-001 | 评论写入完全缺失 | 博客缺少核心互动能力 |
| **P0** | FR-COMMENT-002 | 评论读取完全缺失 | 同上 |
| **P0** | FR-AUTH-004 | 登出黑名单未实现 | 安全风险：登出后 token 仍可用 |
| **P0** | FR-OPS-003 | 操作审计日志缺失 | 无操作追溯能力 |

---

> **维护约定**: 每次需求变更、API 新增/修改、架构调整后应同步更新本文档。架构契约 `architecture-contract.md` 与编辑器设计文档 `11-rich-editor-design.md` 中描述编辑页 localStorage 策略的条目需尽快对本修复做同步更新。
