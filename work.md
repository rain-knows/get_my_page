# 文章读取与编辑链路执行任务卡（给 Codex 投喂版）

> 用途：把复杂任务拆成可串行执行的小任务，降低单次上下文长度。  
> 使用方式：**每次只投喂一个 Task ID**，等待该任务完成并验收通过后，再投喂下一个。

---

## 0. 全局执行约束（每个任务都生效）

- 严格遵守 `AGENTS.md` 与 `docs/architecture-contract.md` 的分层约束。
- 不在 `frontend/src/app` 放业务逻辑；业务逻辑落 `frontend/src/features/*`。
- `frontend/src/components/ui` 仅放基础 UI 原子组件，不放业务组件。
- 涉及 UI 必须遵守 `docs/design.md` 与 Tailwind v4 canonical 写法。
- 后端公用逻辑放 `backend/src/main/java/com/getmypage/blog/common/*`，不新增 legacy `util/`。
- 所有新增/修改函数补齐函数级中文注释（目的/关键参数/返回或副作用）。
- 默认保持 API 向后兼容，除非任务明确要求 breaking change。



## 1. 任务卡清单（顺序执行）

### A1 - 后端契约收口

- **目标**：统一文章/搜索/上传/embed 的请求响应字段与错误语义。
- **允许修改**：
  - `backend/src/main/java/com/getmypage/blog/controller/**`
  - `backend/src/main/java/com/getmypage/blog/model/dto/**`
  - `backend/src/main/java/com/getmypage/blog/exception/**`
- **禁止修改**：
  - `frontend/**`
- **验收点**：
  - `contentFormat/excerpt/status/baseUpdatedAt` 语义清晰且一致。
  - 非管理员写接口返回 `40301`。
  - 冲突场景返回 `40901`。

### A2 - PostService 核心测试补齐

- **目标**：补齐文章读写与冲突/权限核心测试。
- **允许修改**：
  - `backend/src/test/java/com/getmypage/blog/service/post/**`
  - `backend/src/test/java/com/getmypage/blog/controller/post/**`
  - 必要时 `backend/src/main/java/com/getmypage/blog/service/post/**`
- **禁止修改**：
  - `frontend/**`
- **验收点**：
  - create/update/delete/list/detail 关键路径测试覆盖。
  - includeDraft + role 权限边界有测试。

### A3 - 缓存/搜索/存储一致性修正

- **目标**：实现与文档对齐：详情+列表版本缓存、Meili 降级、上传 key 规则。
- **允许修改**：
  - `backend/src/main/java/com/getmypage/blog/infrastructure/**`
  - `backend/src/main/java/com/getmypage/blog/event/**`
  - `backend/src/test/java/com/getmypage/blog/infrastructure/**`
- **禁止修改**：
  - `frontend/**`
- **验收点**：
  - 写操作触发详情失效 + 列表版本递增。
  - 草稿不进入公开检索。
  - 上传 key 为 `/articles/{yyyy}/{mm}/{postId}/{uuid}.{ext}`。

### B1 - 前端 Post/Search 数据层搭建

- **目标**：在 `features` 内建立 post/search 的 api/hooks/types。
- **允许修改**：
  - `frontend/src/features/post/**`
  - `frontend/src/features/search/**`
  - `frontend/src/lib/api-client.ts`
- **禁止修改**：
  - `frontend/src/components/ui/**`
- **验收点**：
  - 列表、详情、搜索 API 封装完成。
  - 路由层仅装配，不写业务请求逻辑。

### B2 - 博客列表与详情替换 mock

- **目标**：`/blog` 与 `/blog/[slug]` 改为真实接口渲染。
- **允许修改**：
  - `frontend/src/app/(blog)/**`
  - `frontend/src/features/post/**`
- **禁止修改**：
  - `backend/**`
- **验收点**：
  - 删除列表与详情 mock 数据依赖。
  - 兼容渲染 `mdx` 与 `tiptap-json`。

### B3 - 搜索页替换 mock

- **目标**：`/search` 接入真实 `GET /api/search`。
- **允许修改**：
  - `frontend/src/app/(blog)/search/**`
  - `frontend/src/features/search/**`
- **禁止修改**：
  - `backend/**`
- **验收点**：
  - 搜索结果页使用后端真实数据。
  - 空关键词、无结果、失败提示可用。

### C1 - 统一界面权限显隐 + 清理 admin 路由

- **目标**：管理员仅在文章详情页获得编辑入口，删除 `/admin` 页面。
- **允许修改**：
  - `frontend/src/app/**`
  - `frontend/src/features/post/**`
  - `README.md`（若需更新入口说明）
- **禁止修改**：
  - `backend/**`
- **验收点**：
  - 普通用户无编辑入口。
  - `frontend/src/app/admin/*` 删除且无残留跳转。

### C2 - Tiptap 核心编辑器接入

- **目标**：接入 StarterKit + Slash + 自定义节点（image/embed/divider）。
- **允许修改**：
  - `frontend/src/features/post/editor/**`
  - `frontend/src/features/post/components/**`
  - `frontend/src/features/post/types/**`
- **禁止修改**：
  - `frontend/src/components/ui/**`
- **验收点**：
  - 节点可插入、可保存、可回显。
  - 样式符合 `docs/design.md` + Tailwind v4。

### C3 - 上传与 Embed 联调

- **目标**：编辑器接入 `/api/files/upload` 与 `/api/embeds/*/resolve`。
- **允许修改**：
  - `frontend/src/features/post/**`
- **禁止修改**：
  - `backend/**`（除非发现阻断性契约缺陷）
- **验收点**：
  - 图片上传成功回填 URL。
  - GitHub / Spotify / 网易云 / Apple Music / Bilibili 可解析。
  - 失败时降级普通链接卡片。

### C4 - 自动保存/冲突检测/发布流程

- **目标**：自动保存、防抖、`baseUpdatedAt` 冲突提示、发布/草稿切换。
- **允许修改**：
  - `frontend/src/features/post/**`
- **禁止修改**：
  - `backend/**`
- **验收点**：
  - 自动保存可工作且有失败重试提示。
  - 冲突时不覆盖他人修改并给出提示。

### D1 - 文档同步（实施态）

- **目标**：文档从设计态更新为实施态，移除独立 admin 假设。
- **允许修改**：
  - `docs`
  - `README.md`
- **禁止修改**：
  - `frontend/**`
  - `backend/**`
- **验收点**：
  - 文档与实际代码行为一致。
  - 明确“统一用户界面 + 管理员能力显隐”。

### D2 - 全量验证与证据固化

- **目标**：执行门禁命令，记录成功/失败与阻塞原因。
- **允许修改**：
  - `docs/12-article-read-edit-execution.md`（补充验收记录）
  - 必要时修正少量测试/脚本
- **必须执行**：
  - `./backend/mvnw -f backend/pom.xml test`
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`
  - 必要时 `docker compose config`
- **验收点**：
  - 输出完整命令结果摘要。
  - 对环境阻塞项给出可复现信息与替代验证。


