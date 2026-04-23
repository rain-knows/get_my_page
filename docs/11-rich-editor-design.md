# 11. Novel 官方 Demo 编辑器设计（编辑页阶段）

> **文档版本**: v4.0.0 | **最后更新**: 2026-04-23 | **适用范围**: 前端编辑能力
>
> **相关文档**:
> - `docs/architecture-contract.md`
> - `docs/design.md`
> - `README.md`

---

## 1. 目标与边界

- `/blog/{slug}/edit` 重构为 **Novel 官方 `advanced-editor` 基线范式**。
- 当前阶段重做编辑页，并让阅读页支持本地草稿预览；后端文章正文持久化暂不纳入范围。
- 编辑内容主存储为 `localStorage`（按 `slug` 隔离）。
- 图片上传接口保持官方调用入口 `/api/upload`，由前端路由转发到现有 MinIO 后端上传服务。
- AI 相关组件可保留源码参考，但不挂载到本阶段编辑器 UI。

---

## 2. 实现落位

- 编辑器业务模块：`frontend/src/features/post/editor/novel-demo/*`
  - `content.ts`：官方默认演示文档（`Introducing Novel`）。
  - `extensions.ts`：官方 demo 基线扩展（StarterKit、CodeBlockLowlight、Twitter、Youtube、Math、ImageResizer 兼容）。
  - `slash-items.tsx`：官方风格 slash 命令集合（文本/标题/列表/引用/代码/图片/Youtube/Twitter）。
  - `upload.ts`：`createImageUpload` 封装，调用 `/api/upload`。
- 编辑器组件：`frontend/src/features/post/components/PostRichEditor.tsx`
  - 结构固定为 `EditorRoot + EditorContent + EditorCommand + EditorBubble + ImageResizer`。
  - 保存状态固定为 `Saved / Unsaved / Saving / Error`。
  - 编辑更新仅写入 localStorage（json/html/markdown）。
- 阅读组件：`frontend/src/features/post/components/BlogArticleReader.tsx`
  - 优先读取同 slug 的 localStorage 草稿标题与正文。
  - 本地草稿不存在时回退后端文章详情。
- 上传适配路由：`frontend/src/app/api/upload/route.ts`
  - 接收官方上传请求格式（`x-vercel-filename` + 二进制 body）。
  - 转发到后端 `POST /api/files/upload`（MinIO）。
  - 返回统一 `{ url }`。

---

## 3. 对外契约

- 编辑页行为（breaking）：
  - 不再以后端 `posts` 更新接口作为主保存路径。
  - 进入编辑页后内容来源优先 localStorage，不存在时加载官方默认内容。
- 上传契约：
  - 前端编辑器侧保持 `/api/upload` 不变。
  - `/api/upload` 内部转发后端 MinIO 上传，不影响编辑器调用方。

---

## 4. 验收标准

- 打开 `/blog/{slug}/edit`，首次无缓存时展示官方默认文档内容。
- Slash 命令可插入：段落/标题/列表/引用/代码/图片/Youtube/Twitter。
- Bubble 菜单支持：加粗、斜体、删除线、行内代码、链接。
- 图片上传可用：选择/粘贴/拖拽均可触发 `/api/upload` 并插入图片。
- 保存状态正确：编辑后 `Unsaved -> Saving -> Saved`，刷新后可恢复。
- 响应式可用：`375/768/1024/1440` 视口下可正常编辑。
- `prefers-reduced-motion` 下无阻塞动画。

---

## 5. 后续阶段

- 阅读页协议对齐与数据库持久化回接（`posts`）。
- AI 菜单开启与服务端生成功能接入。
- 在保持官方行为一致基础上再进行品牌化外观强化。
