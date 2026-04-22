# 11. Tiptap Notion-like 编辑器设计

> **文档版本**: v2.0.0 | **最后更新**: 2026-04-22 | **适用范围**: 前端开发、后端开发、产品设计
> 
> **相关文档**:
> - `docs/architecture-contract.md`
> - `docs/design.md`
> - `docs/06-database-design.md`
> - `docs/07-api-design.md`
> - `docs/09-data-storage-matrix.md`

---

## 1. 目标与范围

### 1.1 目标

在现有博客架构上新增一套 Notion-like 写作能力，使用 Tiptap 作为编辑器内核，首期满足以下能力：

- 基础写作块：段落、标题、列表、引用、代码块。
- 图片能力：上传、插入、尺寸和对齐、caption。
- 主题能力：明暗主题可切换，且与现有主题变量体系一致。
- 内容协议：前后端统一 `tiptap-json`，不再保留 `gmp-block-v1` 双读兼容。
- 运行时约束：前端编辑器与阅读渲染均直接使用 `npm novel`。

### 1.2 非目标（本期不做）

- 实时多人协作（CRDT/OT）。
- 富媒体全文离线包导出（PDF/Docx）。
- Notion 全量数据库导入导出（仅在后续扩展中给出方案）。

---

## 2. 架构定位与分层约束

### 2.1 前端分层落位

遵循 `docs/architecture-contract.md`：

- `frontend/src/app/*`: 仅路由装配，不放业务编排。
- `frontend/src/features/post/*`: 编辑器业务逻辑主落点（hooks、commands、schema、services）。
- `frontend/src/components/ui/*`: 仅基础 UI 原子组件，不放编辑器业务逻辑。
- `frontend/src/components/blog/*`: 编辑器容器和业务展示组件。
- `frontend/src/lib/*`: 无业务上下文的通用能力（序列化、降级渲染、安全过滤）。

### 2.2 后端分层落位

- `controller`: 提供 posts 和 embeds 相关接口。
- `service`: 保存内容、解析摘要、触发卡片元数据拉取与缓存。
- `infrastructure/storage`: 图片上传与访问 URL 管理。
- `infrastructure/cache`: GitHub/音乐卡片缓存与限流键。
- `infrastructure/search`: 内容变更后的索引更新。

### 2.3 Novel 运行时直连（Tiptap v2）

- 本次改造采用 **Novel 运行时直连方案**：编辑与阅读链路直接使用 `novel` 包的 `EditorRoot/EditorContent`。
- `frontend/src/features/post/components/PostRichEditor.tsx` 为当前文章编辑入口，使用 Novel 提供的扩展与上传能力。
- `frontend/src/features/post/components/PostContentRenderer.tsx` 使用同一 Novel/Tiptap 协议进行只读渲染，保证编辑预览与阅读一致。
- `frontend/src/features/editor/*` 仅保留页面骨架与通用布局模板，不再承载协议转换。
- 后端契约同步硬切：`contentFormat` 仅允许 `tiptap-json`，并强校验 `content.type=doc` + `content.content[]`。

---

## 3. 编辑器能力总览

## 3.1 核心功能矩阵

| 能力 | 本期状态 | 说明 |
|---|---|---|
| 基础文本块 | P0 | 段落、H1-H3、无序/有序列表、引用、代码块 |
| 图片插入 | P0 | 上传、插入、粘贴/拖拽上传 |
| 阅读一致性 | P0 | 编辑器与阅读器同走 Novel + tiptap-json |
| 卡片节点扩展 | P1 | 预留扩展点，后续追加 GitHub/音乐卡片 |
| AI 写作能力 | 关闭 | 一期关闭，仅保留扩展入口 |

### 3.2 编辑体验约束

- 命令响应目标：用户输入后 120ms 内显示菜单反馈。
- 卡片预览目标：缓存命中时 150ms 内出卡，未命中时展示 skeleton。
- 可访问性：所有工具栏图标按钮必须有 `aria-label`，支持键盘导航。

---

## 4. 内容模型设计（Tiptap JSON）

### 4.1 顶层文档结构

```json
{
  "type": "doc",
  "content": [
    { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "标题" }] },
    { "type": "paragraph", "content": [{ "type": "text", "text": "正文" }] }
  ]
}
```

### 4.2 扩展节点定义

| 节点类型 | attrs | 说明 |
|---|---|---|
| `image` | `src`, `alt`, `caption` | 图片块 |
| `horizontalRule` | - | 分割线 |
| `link`(mark) | `href`, `target`, `rel` | 行内链接 |

### 4.3 一次性硬切策略

本次为一次性硬切，不保留旧协议在线兼容：

1. 发布前执行批量迁移：`gmp-block-v1 -> tiptap-json`，输出失败清单（`postId/slug/reason`）。
2. 写入接口固定 `contentFormat = tiptap-json`，旧格式请求直接返回 40001。
3. 阅读与编辑链路统一按 tiptap-json 解析，不做双读或灰度。

---

## 5. 基础编辑功能设计

### 5.1 工具栏与快捷键

| 操作 | 快捷键 | 命令 |
|---|---|---|
| 粗体 | `Ctrl/Cmd + B` | `toggleBold()` |
| 斜体 | `Ctrl/Cmd + I` | `toggleItalic()` |
| 代码块 | `Ctrl/Cmd + Alt + C` | `toggleCodeBlock()` |
| 标题 2 | `Ctrl/Cmd + Alt + 2` | `setHeading(2)` |
| 插入图片 | `/image` | `insertImageBlock()` |

### 5.2 Slash 命令菜单

- 触发条件：输入 `/` 且当前块非代码块。
- 搜索策略：本地命令列表模糊匹配。
- 渲染策略：菜单固定宽度 + 键盘上下选择 + 回车确认。

### 5.3 自动保存

- 触发策略：编辑事件后 1200ms 防抖保存。
- 保存内容：`postId`, `content`, `title`, `updatedAt`, `draftVersion`。
- 冲突处理：服务器版本高于本地时提示冲突并支持覆盖或合并。

---

## 6. 图片能力设计

### 6.1 上传链路

1. 前端请求后端上传凭证（或直传签名 URL）。
2. 前端将文件二进制上传至 MinIO。
3. 上传成功后回填公开 URL 到 `imageBlock.src`。
4. 编辑器插入节点并展示图片预览。

### 6.2 图片块属性

| 字段 | 必填 | 说明 |
|---|---|---|
| `src` | 是 | 图片访问 URL |
| `alt` | 是 | 可访问性文本 |
| `caption` | 否 | 图注 |
| `width` | 否 | 展示宽度，单位 px |
| `height` | 否 | 展示高度，单位 px |
| `align` | 否 | `left` / `center` / `right` |

### 6.3 渲染与性能策略

- 前端统一通过 `next/image` 渲染。
- 优先输出 WebP/AVIF。
- 对编辑区中的大图使用懒加载与占位骨架。
- 图片节点删除后，资源清理采用异步引用扫描，不在主写路径同步删除。

### 6.4 安全约束

- 限制 MIME：`image/jpeg`, `image/png`, `image/webp`, `image/gif`。
- 限制大小：单图不超过 8MB（可配置）。
- 禁止 `data:` 协议直接落库。

---

## 7. 主题与暗色模式设计

### 7.1 主题来源

基于现有：

- `frontend/src/stores/use-theme-store.ts`
- `frontend/src/app/globals.css`

### 7.2 主题切换策略

- 支持三态：`light` / `dark` / `system`。
- 初次加载读取本地偏好；无偏好时跟随系统。
- 在 `html` 根节点设置主题 class，避免组件级重复判断。

### 7.3 Token 使用规范

- 所有颜色必须走 CSS 变量，不直接写死色值。
- Tailwind v4 变量语法必须使用 `text-(--token)`、`bg-(--token)`。
- 编辑器组件需适配 `prefers-reduced-motion`。

### 7.4 防闪与水合一致性

- SSR 输出初始主题脚本，优先设置根 class，再挂载 React。
- 避免先渲染深色再切浅色造成闪屏。

---

## 8. GitHub 卡片设计

### 8.1 输入与解析

支持输入：

- `https://github.com/owner/repo`
- `owner/repo`

解析后标准化为 `owner/repo`。

### 8.2 卡片字段

| 字段 | 说明 |
|---|---|
| `name` | 仓库名 |
| `owner` | 仓库 owner |
| `description` | 仓库描述 |
| `stars` | Star 数 |
| `forks` | Fork 数 |
| `language` | 主语言 |
| `updatedAt` | 最近更新时间 |
| `avatarUrl` | owner 头像 |

### 8.3 缓存策略（Redis）

- Key: `embed:github:{owner}:{repo}`
- TTL: 6 小时
- 刷新策略：读取 miss 后回源 GitHub API，并回填 Redis。
- 失败降级：保留链接卡片（显示仓库地址 + 打开按钮）。

### 8.4 限流与容错

- 服务端对同一 IP/用户进行分钟级限流。
- GitHub API 异常时返回降级卡片而非 500。

---

## 9. 音乐卡片设计

### 9.1 Provider 支持

首期支持：

- Spotify
- 网易云音乐
- Apple Music
- Bilibili 音频页（若链接符合规则）

### 9.2 统一协议

`embedMusic` 节点保持统一结构：

```json
{
  "type": "embedMusic",
  "attrs": {
    "provider": "spotify",
    "url": "https://open.spotify.com/track/xxx",
    "trackId": "xxx",
    "snapshot": {
      "title": "Song Title",
      "artist": "Artist",
      "coverUrl": "https://...",
      "durationMs": 192000
    },
    "snapshotAt": "2026-04-17T12:00:00Z"
  }
}
```

### 9.3 缓存策略（Redis）

- Key: `embed:music:{provider}:{trackId}`
- TTL: 24 小时
- 降级策略：仅展示链接和平台图标。

### 9.4 安全白名单

- 仅允许白名单域名被嵌入。
- 非白名单链接自动降级为普通外链。
- 禁止任意 iframe 参数透传。

---

## 10. 后端接口设计增量

> 当前接口基线见 `docs/07-api-design.md`，以下为增量建议。

### 10.1 文章写入接口

- `POST /api/posts`
- `PUT /api/posts/{id}`

请求体新增建议字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `contentFormat` | string | 仅 `tiptap-json` |
| `content` | string | 正文内容（tiptap JSON 字符串） |
| `excerpt` | string | 可选摘要（为空时后端提取） |

### 10.2 Embeds 解析接口（建议新增）

- `POST /api/embeds/github/resolve`
- `POST /api/embeds/music/resolve`

职责：

- 标准化输入链接。
- 拉取并缓存 snapshot。
- 返回可直接写入节点 attrs 的结构。

---

## 11. 存储策略（MySQL + Redis + MinIO）

### 11.1 MySQL

- `post.content`: 保存 Tiptap JSON 字符串（唯一格式）。
- 可选新增：`post.content_format`。
- 可选新增：`post.excerpt`（用于列表摘要）。

### 11.2 Redis

- 卡片缓存：`embed:github:*`、`embed:music:*`。
- 编辑草稿暂存：`editor:draft:{postId}:{userId}`（短 TTL）。
- 限流计数：`ratelimit:embed:{userId}`。

### 11.3 MinIO

- 图片对象路径建议：`/articles/{yyyy}/{mm}/{postId}/{uuid}.{ext}`。
- MySQL 仅保存 URL，不保存二进制。

---

## 12. 搜索与索引策略

- 从 Tiptap JSON 提取纯文本用于搜索字段。
- 卡片节点抽取可检索字段：
  - GitHub: `repo`, `description`, `language`
  - 音乐: `title`, `artist`, `provider`
- 索引更新采用异步任务，失败可重试。

---

## 13. 里程碑计划

### M1（P0 基线）

- Tiptap 编辑器接入。
- 基础文本块与 Slash 命令。
- 图片上传与图片块。
- 明暗模式切换可用。

### M2（扩展卡片）

- GitHub 卡片解析 + 缓存。
- 音乐卡片解析 + 缓存。
- 卡片渲染降级链路。

### M3（稳定性）

- 自动保存与冲突处理。
- 搜索索引增强。
- 可观测性（解析失败率、上传失败率、保存耗时）。

---

## 14. 验收标准

| 验收ID | 目标 | 通过标准 |
|---|---|---|
| AC-EDITOR-01 | 基础编辑 | 可创建并保存含标题/列表/代码块文章 |
| AC-EDITOR-02 | 图片块 | 上传后可显示、可编辑 caption、可持久化 |
| AC-EDITOR-03 | 主题切换 | light/dark/system 切换无闪屏，刷新后保持一致 |
| AC-EDITOR-04 | 协议硬切 | 写接口仅接受 `contentFormat=tiptap-json`，旧格式返回 40001 |
| AC-EDITOR-05 | 数据迁移 | 发布窗口内完成全量迁移并产出失败清单 |
| AC-EDITOR-06 | 阅读一致性 | 迁移后旧文可在阅读页按 tiptap-json 正常渲染 |

---

## 15. 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| 内容格式迁移不完整 | 历史文章显示异常 | 发布前全量迁移演练 + 失败清单阻断发布 + DB 备份回滚 |
| 第三方 API 速率限制 | 卡片加载失败 | Redis 缓存 + 降级显示 |
| 图片上传链路失败 | 编辑中断 | 前端重试 + 临时占位块 |
| 主题闪屏 | 用户体验下降 | SSR 初始主题注入 + Hydration 对齐 |

---

## 16. 后续增强建议

1. AI 写作助手（改写、续写、摘要、标题生成）保持关闭，待二期按扩展点接入并补齐审计日志。
2. Notion 导入导出适配层（先支持常见块，复杂块降级为 callout）。
3. 自定义卡片市场（Bilibili、YouTube、Figma、X 链接卡片）。
4. 文章模板系统（技术文档模板、周报模板、发布清单模板）。
5. 引用图谱（反向链接、提及关系、知识卡片）。

---

## 17. 实施检查清单

- [ ] 前端编辑器落在 `features/post`，未污染 `app` 与 `components/ui`。
- [ ] 样式使用 Tailwind v4 变量语法，不使用旧版变量包裹写法。
- [ ] 图片仅存对象存储 URL，不把二进制写入数据库。
- [ ] `contentFormat` 写入/读取仅为 `tiptap-json`，无 `gmp-block-v1` 在线兼容分支。
- [ ] P0 验收用例（成功/失败路径）均可复现。
