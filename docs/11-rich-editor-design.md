# 11. Novel 官方 Demo 编辑器设计（编辑页阶段）

> **文档版本**: v4.3.0 | **最后更新**: 2026-04-27 | **适用范围**: 前端编辑能力
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
  - `extensions.ts`：官方 demo 基线扩展集合，`buildNovelBaseExtensions()` 共注册 20 个扩展/插件：StarterKit、Placeholder、TiptapLink、TiptapImage、UpdatedImage（含 UploadImagesPlugin）、TaskList、TaskItem、HorizontalRule、embedLinkExtension、AIHighlight、codeBlockLowlight（via `createCodeBlockWithControls`）、Youtube、Twitter、Mathematics、TiptapUnderline、HighlightExtension、TextStyle、Color、CustomKeymap、GlobalDragHandle。
  - `slash-items.tsx`：中文 slash 命令集合（文本/标题/列表/引用/代码/导入链接卡片）。
  - `embed-api.ts`：`POST /api/embeds/resolve` 调用封装。
  - `embed-link.ts`：链接卡片 attrs、上传卡片 attrs、插入策略、粘贴 URL 判定、异步回填逻辑。
  - `embed-link-extension.tsx`：`embedLink` 节点与卡片 NodeView 渲染（链接/上传双模式 + GitHub/网易云/B站平台专用模板）。
  - `upload.ts`：上传能力封装（认证头注入、错误分类、`uploadKind` 占位、`createImageUpload` 兼容导出）。
  - `storage.ts`：localStorage 读写封装（按 slug 隔离，支持 json/html/markdown 三种格式持久化与恢复）。
  - `codec.ts`：内容编解码工具（tiptap-json 序列化/反序列化、格式检测、资源 URL 规范化）。
  - `asset-url.ts`：MinIO 存储资源 URL 规范化处理，将后端 minio 地址转换为浏览器可访问的公开 URL。
  - `index.ts`：barrel 导出文件，聚合并重导出 `novel-demo/*` 全部公开符号与 `code-block/*` 公开符号，供外部消费者通过单一入口引用。
- 代码块编辑器模块：`frontend/src/features/post/editor/code-block/*`（共 7 个文件，新增独立模块）
  - `index.ts`：模块 barrel 导出（5 个子模块）。
  - `code-block.tsx`：React 代码块卡片容器，组合 toolbar 与 CodeMirror 编辑器，支持 `data-editable` 属性区分编辑态/阅读态。
  - `code-block-languages.ts`：支持语言列表（11 种），含 language label 映射、normalize 查询与 CodeMirror LanguageSupport 解析。
  - `code-block-toolbar.tsx`：语言选择器 + 行号开关工具栏 UI，集成 copy 按钮。
  - `code-block-viewer.tsx`：阅读态只读代码块渲染（复用 CodeMirror 只读视图）。
  - `code-editor.tsx`：CodeMirror 6 编辑态封装（via `@uiw/react-codemirror`）。
  - `code-editor-extensions.ts`：CodeMirror 扩展集合（行号、语法高亮、括号匹配、缩进、选中样式等），提供 `codeBlockEditorTheme` 与 `codeBlockHighlightStyle` 共享主题。
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
  - 内部引用 `@/features/post/editor/code-block/*`，通过 `CodeBlockToolbar` 渲染工具栏。
  - `codeBlock` 节点持久化 `lineNumbers` 属性。
  - 每个代码块右上角提供独立行号开关；不再使用编辑器顶部全局行号开关。
  - 行号使用真实 DOM gutter 渲染，编辑态与阅读态共用刷新逻辑，避免长代码块依赖 CSS `attr()` 文本截断。
- 左侧拖拽手柄：`GlobalDragHandle` 扩展（来自 Novel 扩展包）
  - 为每个段落左侧提供可拖拽重排的抓手图标，仅在 hover 当前段落时显示。
  - 视觉上使用 `--gmp-novel-*` 颜色令牌渲染，与编辑器深色主题一致。
  - CSS 由 `globals.css` 中 `.drag-handle` 类控制，包含 hover 高亮与 active 抓取态样式。

---

## 3. 对外契约

- 编辑页行为（breaking）：
  - 不再以后端 `posts` 更新接口作为主保存路径。
  - 进入编辑页后内容来源优先 localStorage，不存在时加载官方默认内容。
- 上传契约：
  - 前端编辑器侧保持 `/api/upload` 不变。
  - `/api/upload` 内部转发后端 MinIO 上传并透传认证头，不影响编辑器调用方请求协议。
  - 后端上传链路确保博客资源桶具备公开只读策略，使返回的 MinIO 直链可被浏览器图片节点加载。
  - 上传错误按 `auth_failed` / `unsupported_type` / `backend_response_error` / `invalid_response` / `network_error` 分类返回。
  - 上传代理支持多候选后端地址回退（Multi-candidate Fallback）：
    - 候选列表优先使用 `BACKEND_INTERNAL_API_URL`（或 `INTERNAL_API_URL`）容器内地址，其次 `NEXT_PUBLIC_API_URL` 外部地址。
    - 若外部地址为 loopback（localhost/127.0.0.1/0.0.0.0），自动推导 `http://backend:8080/api` 容器名地址作为额外候选。
    - 最后追加固定后备地址 `http://backend:8080/api` 与 `http://localhost:8080/api`（去重后依次尝试）。
    - 任一候选返回 `404/405` 时自动尝试下一个候选；返回其他错误状态则直接按错误类型响应。
    - 所有候选均失败时（网络错误或全部跳过），返回 `network_error` 类型错误。
  - 编辑器粘贴/拖拽图片时直接上传并插入 `image` 节点；导入链接卡片面板中的上传仍生成 `embedLink` 上传卡片。
- 链接卡片契约：
  - 前端通过 `/api/embeds/resolve` 解析链接，响应结构沿用后端 `EmbedResolveResponse`。
  - `embedLink` 节点 attrs 保存 `url/normalizedUrl/cardType/mediaType/provider/title/description/artist/videoId/coverUrl/domain/siteName/uploadKind/snapshot/resolved/pending/error`。
  - `github + github`、`music + netease`、`video + bilibili` 命中平台专用模板；其余走通用模板回退。
  - GitHub 仓库卡片支持 `owner/repo` 速记输入（如 `facebook/react`），后端自动补全为 `https://github.com/owner/repo` 后进行 OG 元数据解析。
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
