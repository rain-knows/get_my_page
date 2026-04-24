# 11. Novel 官方 Demo 编辑器设计（编辑页阶段）

> **文档版本**: v4.2.0 | **最后更新**: 2026-04-24 | **适用范围**: 前端编辑能力
>
> **相关文档**:
> - `docs/architecture-contract.md`
> - `docs/design.md`
> - `README.md`

---

## 1. 目标与边界

- `/blog/{slug}/edit` 保持 **Novel 官方 `advanced-editor` 基线范式**，并落地工业深色视觉方案。
- 当前阶段重做编辑页，并让阅读页支持本地草稿预览；后端文章正文持久化暂不纳入范围。
- 编辑内容主存储为 `localStorage`（按 `slug` 隔离）。
- 图片上传接口保持官方调用入口 `/api/upload`，由前端路由转发到现有 MinIO 后端上传服务并透传鉴权头。
- AI 相关组件可保留源码参考，但不挂载到本阶段编辑器 UI。
- Slash 命令与编辑器交互文案统一中文。
- 链接、视频、音乐、GitHub 仓库统一走“导入链接卡片”解析器；删除 YouTube/Twitter 独立命令入口。
- 卡片面板支持“链接解析 / 上传图片”双模式，上传成功后直接生成 `embedLink` 卡片节点（非 `image` 节点）。
- PDF 上传仅保留代码结构（`uploadKind`/分支校验），本期 UI 不暴露 PDF 上传入口。

---

## 2. 实现落位

- 编辑器业务模块：`frontend/src/features/post/editor/novel-demo/*`
  - `content.ts`：官方默认演示文档（`Introducing Novel`）。
  - `extensions.ts`：官方 demo 基线扩展（StarterKit、CodeBlockLowlight、Twitter、Youtube、Math、ImageResizer、`embedLink` 兼容）。
  - `slash-items.tsx`：中文 slash 命令集合（文本/标题/列表/引用/代码/导入链接卡片）。
  - `embed-api.ts`：`POST /api/embeds/resolve` 调用封装。
  - `embed-link.ts`：链接卡片 attrs、上传卡片 attrs、插入策略、粘贴 URL 判定、异步回填逻辑。
  - `embed-link-extension.tsx`：`embedLink` 节点与卡片 NodeView 渲染（链接/上传双模式 + GitHub/网易云/B站平台专用模板）。
  - `upload.ts`：上传能力封装（认证头注入、错误分类、`uploadKind` 占位、`createImageUpload` 兼容导出）。
- 编辑器组件：`frontend/src/features/post/components/PostRichEditor.tsx`
  - 结构固定为 `EditorRoot + EditorContent + EditorCommand + EditorBubble + ImageResizer`。
  - 保存状态固定为 `Saved / Unsaved / Saving / Error`。
  - 编辑更新仅写入 localStorage（json/html/markdown）。
  - 粘贴规则：仅在“空段落 + 单一 URL”时自动转卡片，避免误伤普通粘贴。
  - Slash 命令列表开启 `loop` 循环导航，并隐藏右侧滚动条视觉（保留滚轮/触控板滚动）。
- 阅读组件：`frontend/src/features/post/components/BlogArticleReader.tsx`
  - 优先读取同 slug 的 localStorage 草稿标题与正文。
  - 本地草稿不存在时回退后端文章详情。
- 上传适配路由：`frontend/src/app/api/upload/route.ts`
  - 接收官方上传请求格式（`x-vercel-filename` + 二进制 body）。
  - 透传 `Authorization` 到后端 `POST /api/files/upload`（MinIO）。
  - 返回统一 `{ url }`；错误返回 `errorType + message + backendStatus/backendCode/backendMessage` 供前端分类提示。
- 代码块控制：`frontend/src/features/post/editor/novel-demo/code-block-with-controls.ts`
  - `codeBlock` 节点持久化 `lineNumbers` 属性。
  - 每个代码块右上角提供独立行号开关；不再使用编辑器顶部全局行号开关。
  - 行号使用真实 DOM gutter 渲染，编辑态与阅读态共用刷新逻辑，避免长代码块依赖 CSS `attr()` 文本截断。

---

## 3. 对外契约

- 编辑页行为（breaking）：
  - 不再以后端 `posts` 更新接口作为主保存路径。
  - 进入编辑页后内容来源优先 localStorage，不存在时加载官方默认内容。
- 上传契约：
  - 前端编辑器侧保持 `/api/upload` 不变。
  - `/api/upload` 内部转发后端 MinIO 上传并透传认证头，不影响编辑器调用方请求协议。
  - 后端上传链路确保博客资源桶具备公开只读策略，使返回的 MinIO 直链可被浏览器图片节点加载。
  - 上传错误按 `auth_failed` / `unsupported_type` / `backend_response_error` / `invalid_response` 分类返回。
  - 编辑器粘贴/拖拽图片时直接上传并插入 `image` 节点；导入链接卡片面板中的上传仍生成 `embedLink` 上传卡片。
- 链接卡片契约：
  - 前端通过 `/api/embeds/resolve` 解析链接，响应结构沿用后端 `EmbedResolveResponse`。
  - `embedLink` 节点 attrs 保存 `url/normalizedUrl/cardType/mediaType/provider/title/description/artist/videoId/coverUrl/domain/siteName/uploadKind/snapshot/resolved/pending/error`。
  - `github + github`、`music + netease`、`video + bilibili` 命中平台专用模板；其余走通用模板回退。
  - 网易云与 B 站卡片优先使用后端 `snapshot.embedUrl`，前端可回退从 URL 推导播放器 iframe。
  - 文章 `contentFormat` 继续固定为 `tiptap-json`，不引入新的正文格式。

---

## 4. 验收标准

- 打开 `/blog/{slug}/edit`，首次无缓存时展示官方默认文档内容。
- Slash 命令可插入：段落/标题/列表/引用/代码/导入链接卡片（中文命令项）。
- Bubble 菜单支持：加粗、斜体、删除线、行内代码、链接。
- 加粗表现一致：段落/列表/标题/链接文本均有明显加粗视觉；代码上下文按钮给出不可用反馈。
- 卡片面板上传可用：登录态上传图片成功后生成 `embedLink` 图片卡片；未登录/非法类型/后端异常有明确失败提示。
- 粘贴 URL 自动转卡片：满足空段落条件时立即插入基础卡片，并异步补全 OG 元数据。
- 平台模板可用：网易云音乐、B站视频分别展示可播放 iframe；GitHub 仓库命中专用卡片样式；解析失败保留 URL 降级卡片，不阻断编辑。
- Slash 菜单交互：键盘 `ArrowUp/ArrowDown` 支持首尾循环，且无右侧滚动条视觉。
- 保存状态正确：编辑后 `Unsaved -> Saving -> Saved`，刷新后可恢复。
- 响应式可用：`375/768/1024/1440` 视口下可正常编辑。
- `prefers-reduced-motion` 下无阻塞动画。

---

## 5. 后续阶段

- 阅读页协议对齐与数据库持久化回接（`posts`）。
- AI 菜单开启与服务端生成功能接入。
- 在保持官方行为一致基础上再进行品牌化外观强化。
