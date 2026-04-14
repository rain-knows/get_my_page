# 10. MVP 需求规格说明（SRS）

> 文档版本：v1.0.0  
> 最后更新：2026-04-12  
> 文档状态：生效  
> 适用范围：`frontend` + `backend` + `docker` + `learn`

## 1. 文档目标

本文件作为项目当前阶段的唯一需求基线，用于回答三件事：
- 这阶段必须交付哪些功能（FR）。
- 这些功能要达到什么质量下限（NFR）。
- 如何通过命令与证据证明交付完成（AC + 追踪矩阵）。

## 2. MVP 目标与成功标准

### 2.1 目标

- 在学习 Spring Boot 的前提下，完成可演示的个人博客 MVP 闭环。
- 建立“需求 -> 实现 -> 验收 -> 复盘”的可追踪机制。
- 让 `docs` 约束与 `learn` 执行体系形成一一对应关系。

### 2.2 成功标准（KPI）

- 功能闭环：认证、文章、评论、搜索、上传、预发布 6 条主链路均可走通。
- 质量闭环：每条 P0 需求至少有 1 条成功路径 + 1 条失败路径验收。
- 文档闭环：每条 P0 需求可映射到明确的 Step 与证据目录。

## 3. 范围边界

### 3.1 In Scope（本期必须）

- 用户认证：注册、登录、刷新令牌、登出。
- 文章域：公开读取（列表/详情）与管理员写入（CRUD）。
- 评论域：游客/登录评论、树形读取、删除权限。
- 搜索域：关键词检索、结果高亮返回。
- 上传域：文件上传到对象存储并返回可访问地址。
- 预发布：基础回归、容器编排验证、最小发布手册。

### 3.2 Out of Scope（本期不做）

- 推荐系统、运营后台高级功能、插件市场。
- 全量线上运维平台（告警、APM、自动扩缩容）。
- 复杂商业化能力（支付、订阅、广告结算）。

## 4. 功能需求（FR）

| 需求ID | 优先级 | 需求描述 | 约束 | 验收方式 |
|---|---|---|---|---|
| FR-AUTH-001 | P0 | 支持用户注册并返回 token 信息 | 邮箱可选但唯一；密码需 8-64 位且包含字母+数字；遵循统一响应结构与错误码 | 调用注册接口成功/重复邮箱失败/弱密码失败 |
| FR-AUTH-002 | P0 | 支持用户名密码登录并返回 token | 错误密码不可返回 500 | 登录成功与错误密码双路径 |
| FR-AUTH-003 | P0 | 支持 refresh token 刷新 access token | 无效 refresh token 必须拒绝 | refresh 成功/无效失败 |
| FR-AUTH-004 | P1 | 支持登出后 token 撤销策略 | 需有黑名单或等效机制 | 登出后旧 token 不可继续访问 |
| FR-POST-001 | P0 | 提供文章分页列表查询 | 支持 page/size，限制上限 | 列表成功与分页越界 |
| FR-POST-002 | P0 | 提供按 slug 文章详情查询 | 不存在 slug 返回资源不存在 | 详情成功与不存在失败 |
| FR-POST-003 | P0 | 管理员可创建/更新/删除文章 | 必须有权限校验 | 管理员成功、未授权失败 |
| FR-POST-004 | P1 | 支持分类/标签关联维护 | 关联对象需合法 | 创建含标签文章并校验关联 |
| FR-COMMENT-001 | P0 | 支持文章评论写入（游客/登录） | 受系统开关与字段规则约束 | 游客成功、开关关闭失败 |
| FR-COMMENT-002 | P0 | 支持评论树形读取 | 返回结构可被前端直接渲染 | 树形结构与层级校验 |
| FR-COMMENT-003 | P1 | 支持评论删除权限（本人/管理员） | 非法删除必须拒绝 | 授权成功、越权失败 |
| FR-SEARCH-001 | P0 | 支持关键词搜索文章 | 响应含高亮字段 | 命中结果与无结果路径 |
| FR-SEARCH-002 | P1 | 支持内容变更后的索引更新 | 索引失败要可追踪 | 发布后可搜到、下线后不可搜 |
| FR-UPLOAD-001 | P0 | 支持上传文件并返回访问 URL | 校验大小与类型 | 上传成功、非法文件失败 |
| FR-OPS-001 | P0 | 提供预发布最小回归脚本与记录 | 覆盖核心业务链路 | 回归清单执行并归档 |

## 5. 非功能需求（NFR）

| 需求ID | 优先级 | 要求 |
|---|---|---|
| NFR-PERF-001 | P0 | 常见 API 在本地开发环境应保持可接受响应（通常 < 300ms，复杂查询除外） |
| NFR-SEC-001 | P0 | 禁止明文存储密码，认证密钥不得写入代码仓库 |
| NFR-SEC-002 | P0 | 关键失败路径必须返回统一错误码，不泄漏堆栈细节到客户端 |
| NFR-MTN-001 | P0 | 遵守架构契约分层边界，避免越层调用 |
| NFR-OBS-001 | P1 | 关键链路日志需可定位模块、错误码、请求上下文 |
| NFR-QA-001 | P0 | 每个 P0 功能至少覆盖成功+失败两类验收场景 |

## 6. 验收标准（AC）

| 验收ID | 覆盖需求 | 验收命令示例 | 通过标准 |
|---|---|---|---|
| AC-AUTH-01 | FR-AUTH-001/002/003 | `curl -X POST /api/auth/register`、`/login`、`/refresh` | 注册成功返回统一结构；重复邮箱返回 40014；弱密码返回参数校验失败 |
| AC-POST-01 | FR-POST-001/002 | `curl /api/posts?page=1&size=10`、`curl /api/posts/{slug}` | 列表与详情可用，不存在返回错误 |
| AC-POST-02 | FR-POST-003 | `curl -X POST /api/posts`（带/不带管理员令牌） | 管理员成功，未授权失败 |
| AC-COMMENT-01 | FR-COMMENT-001/002 | `curl -X POST /api/comments`、`curl /api/posts/{id}/comments` | 评论可写可读，结构正确 |
| AC-SEARCH-01 | FR-SEARCH-001 | `curl /api/search?q=keyword` | 返回命中/无命中结构且可解析 |
| AC-UPLOAD-01 | FR-UPLOAD-001 | `curl -F file=@... /api/files/upload` | 成功返回 URL，非法输入失败 |
| AC-OPS-01 | FR-OPS-001 | `./backend/mvnw test`、`npm --prefix frontend run build`、`docker compose config` | 构建与编排校验通过 |

## 7. 需求追踪矩阵（需求 -> API -> Step -> 证据）

| 需求ID | 相关 API/入口 | Learn Step | 证据目录 |
|---|---|---|---|
| FR-AUTH-001 | `POST /api/auth/register` | `learn/S02-认证与安全链路` | `learn/S02-认证与安全链路/evidence/` |
| FR-AUTH-002 | `POST /api/auth/login` | `learn/S02-认证与安全链路` | `learn/S02-认证与安全链路/evidence/` |
| FR-AUTH-003 | `POST /api/auth/refresh` | `learn/S02-认证与安全链路` | `learn/S02-认证与安全链路/evidence/` |
| FR-POST-001 | `GET /api/posts` | `learn/S03-文章读取链路` | `learn/S03-文章读取链路/evidence/` |
| FR-POST-002 | `GET /api/posts/{slug}` | `learn/S03-文章读取链路` | `learn/S03-文章读取链路/evidence/` |
| FR-POST-003 | `POST/PUT/DELETE /api/posts` | `learn/S04-文章写入与管理链路` | `learn/S04-文章写入与管理链路/evidence/` |
| FR-COMMENT-001 | `POST /api/comments` | `learn/S05-评论域与树形结构` | `learn/S05-评论域与树形结构/evidence/` |
| FR-COMMENT-002 | `GET /api/posts/{postId}/comments` | `learn/S05-评论域与树形结构` | `learn/S05-评论域与树形结构/evidence/` |
| FR-SEARCH-001 | `GET /api/search?q=...` | `learn/S06-搜索索引与查询链路` | `learn/S06-搜索索引与查询链路/evidence/` |
| FR-UPLOAD-001 | `POST /api/files/upload` | `learn/S07-上传存储与资源治理` | `learn/S07-上传存储与资源治理/evidence/` |
| FR-OPS-001 | 回归脚本/编排校验 | `learn/S08-稳定性测试与预发布` | `learn/S08-稳定性测试与预发布/evidence/` |

## 8. 风险与依赖

### 8.1 外部依赖

- MySQL、Redis、Meilisearch、MinIO、Docker Compose。
- 依赖服务不可用时，至少要有明确错误与排查指引。

### 8.2 主要风险

- 需求与实现脱节：通过追踪矩阵强制绑定 Step 与证据。
- 仅完成成功路径：通过 AC 强制失败路径验收。
- 文档漂移：每次需求变更必须更新本文件与 `docs/00` 索引。

## 9. 版本记录

| 版本 | 日期 | 变更内容 |
|---|---|---|
| v1.0.0 | 2026-04-12 | 首次建立 MVP 需规基线，继承编号 `10` |
| v1.1.0 | 2026-04-14 | 补充注册链路失败路径：重复邮箱与弱密码验收标准 |
