# 前端技术栈规范

> **文档版本**: v1.1.0 | **最后更新**: 2026-04-04 | **适用范围**: 前端开发人员

---

## 1. Next.js (App Router) — v14.0+

### 1.1 路由与渲染策略

| 页面 | 渲染模式 | 缓存 | 说明 |
|------|---------|------|------|
| 首页 | SSR | `revalidate: 60` | 每 60 秒增量更新 |
| 文章列表 | SSR + ISR | `revalidate: 300` | 5 分钟刷新 |
| 文章详情 | SSG + ISR | `revalidate: 3600` | 构建时预渲染热门文章 |
| 管理后台 | CSR | SWR 客户端缓存 | 无 SEO 需求 |

### 1.2 App Router 目录约定

```
src/app/
├── layout.tsx               # 根布局
├── page.tsx                 # 首页
├── loading.tsx              # 全局骨架屏
├── error.tsx                # 错误边界
├── not-found.tsx            # 404 页面
├── (blog)/                  # 博客路由组
│   ├── page.tsx             # 文章列表
│   └── [slug]/page.tsx      # 文章详情 (SSG + ISR)
├── (auth)/                  # 认证路由组
│   ├── login/page.tsx
│   └── register/page.tsx
├── admin/                   # 管理后台
│   ├── layout.tsx
│   ├── dashboard/page.tsx
│   ├── posts/               # 文章管理
│   └── settings/page.tsx
└── api/                     # Route Handlers (BFF)
    └── revalidate/route.ts
```

### 1.3 关键配置 `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'minio.yourdomain.com', pathname: '/blog-assets/**' },
    ],
  },
  experimental: {
    mdxRs: true,
    optimizePackageImports: ['motion', '@radix-ui/*'],
  },
  output: 'standalone', // Docker 优化
};
module.exports = nextConfig;
```

---

## 2. TypeScript — v5.0+

### 2.1 编译配置重点

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 2.2 类型定义规范

所有 API 接口必须显式定义类型：

```typescript
/** 通用 API 响应包装器 */
interface ApiResponse<T> { code: number; message: string; data: T; }

/** 分页响应结构 */
interface PaginatedData<T> {
  records: T[]; current: number; size: number; total: number; pages: number;
}

/** 文章摘要 DTO */
interface PostSummary {
  id: number; title: string; slug: string; summary: string;
  coverUrl: string; categoryName: string; tags: string[];
  viewCount: number; likeCount: number;
  createdAt: string; updatedAt: string;
}

/** 文章详情 DTO */
interface PostDetail extends PostSummary {
  content: string; author: AuthorInfo; isLiked: boolean;
}
```

---

## 3. Tailwind CSS — v4.0+

### 3.1 架构变化 (v4 重大重写)

Tailwind v4 采用全新的 **CSS-first** 配置模式，不再依赖 `tailwind.config.ts`：

| 对比项 | v3 (旧) | v4 (当前) |
|--------|---------|----------|
| 配置方式 | `tailwind.config.ts` (JS) | **`@theme` 指令 (CSS 文件内)** |
| 构建引擎 | JavaScript | **Rust Oxide 引擎** (2-10x 更快) |
| PostCSS | 必须依赖 | **不再需要** (内置 Lightning CSS) |
| 内容扫描 | 手动配置 `content` | **自动检测** 零配置 |
| 暗色模式 | `darkMode: ['class']` | **默认 `prefers-color-scheme`**，可用 `@variant` 自定义 |
| 颜色空间 | HSL | **OKLCH** (更大色域、更均匀感知) |
| 容器查询 | 需要插件 | **原生支持** |

### 3.2 CSS-first 配置示例

配置直接写在 `src/styles/globals.css` 中，不再需要 `tailwind.config.ts`：

```css
/* src/styles/globals.css */
@import "tailwindcss";
@import "@tailwindcss/typography";

/* 品牌色系 — 使用 OKLCH 颜色空间 */
@theme {
  --color-primary: oklch(0.65 0.24 265);
  --color-primary-foreground: oklch(0.98 0.01 265);
  --color-secondary: oklch(0.75 0.12 200);
  --color-accent: oklch(0.70 0.20 330);
  --color-background: oklch(0.99 0.005 265);
  --color-foreground: oklch(0.15 0.02 265);
  --color-muted: oklch(0.92 0.01 265);
  --color-muted-foreground: oklch(0.55 0.02 265);
  --color-destructive: oklch(0.55 0.22 27);
  --color-border: oklch(0.88 0.01 265);
  --color-ring: oklch(0.65 0.24 265);

  /* 字体 */
  --font-sans: 'Inter', 'Noto Sans SC', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* 自定义动画 */
  --animate-fade-in: fade-in 0.3s ease-out;
  --animate-slide-in-right: slide-in-right 0.3s ease-out;

  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes slide-in-right {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
}

/* 暗色模式（配合 shadcn/ui 的 class 切换） */
@variant dark (&:where(.dark, .dark *));

.dark {
  --color-background: oklch(0.15 0.02 265);
  --color-foreground: oklch(0.95 0.01 265);
  --color-muted: oklch(0.25 0.02 265);
  --color-muted-foreground: oklch(0.65 0.01 265);
  --color-border: oklch(0.30 0.02 265);
}
```

### 3.3 编写规范

- 禁止内联样式，所有样式通过 Tailwind 类名实现
- 重复样式使用 `cn()` 工具函数合并
- 移动端优先 (mobile-first) 设计
- 所有组件必须适配 `dark:` 变体
- 渐变语法使用新版 `bg-linear-*`、`bg-radial`、`bg-conic`

---

## 4. shadcn/ui — CLI v4.1+

### 4.1 定位

- 代码生成工具，组件直接复制到 `src/components/ui/`
- 基于 Radix UI 无障碍原语，完全可修改
- 安装方式: `npx shadcn@latest add <component>`

### 4.2 组件目录约定

```
src/components/
├── ui/           # shadcn/ui 基础组件 (button, dialog, input, skeleton, toast...)
├── blog/         # 博客业务组件 (post-card, post-list, toc, search-dialog...)
├── layout/       # 布局组件 (header, footer, sidebar, theme-toggle)
└── shared/       # 通用组件 (seo-head, loading-skeleton, error-boundary)
```

---

## 5. Motion (原 Framer Motion) — v12.0+

> ℹ️ **品牌变更**: Framer Motion 已更名为 **Motion**，包名从 `framer-motion` 改为 `motion`，导入路径为 `motion/react`。

### 5.1 使用场景

| 场景 | 实现方式 |
|------|---------|
| 页面切换 | `AnimatePresence` + `motion.div` |
| 列表渐入 | `staggerChildren` 交错动画 |
| 微交互 | `whileHover` / `whileTap` 弹簧动画 |
| 骨架屏 | `motion.div` + `animate` 脉冲动画 |

### 5.2 导入方式

```typescript
// 新版导入路径
import { motion, AnimatePresence } from 'motion/react';
// ✘ 旧版 (framer-motion) 已停止积极开发，禁止使用
```

### 5.3 性能规范

- 使用 `LazyMotion` + `domAnimation` 按需加载
- 仅使用 `transform` 和 `opacity` 触发 GPU 加速
- 首屏内容禁止阻塞性动画

---

## 6. Zustand — v5.0+

### 6.1 定位

**仅管理全局 UI 状态**，服务端数据由 SWR 管理。

### 6.2 v5 重要变更

- 必须使用命名导入: `import { create } from 'zustand'`
- 使用 React 原生 `useSyncExternalStore`
- selector 返回新引用时需使用 `useShallow` (从 `zustand/react/shallow` 导入)
- `persist` 中间件不再自动存储初始状态

### 6.3 Store 划分

| Store | 职责 | 持久化 |
|-------|------|--------|
| `use-theme-store` | 主题切换 (light/dark/system) | localStorage |
| `use-sidebar-store` | 侧边栏折叠状态 | 否 |
| `use-toast-store` | 全局通知消息队列 | 否 |

---

## 7. SWR — v2.4+

### 7.1 定位

客户端组件的数据获取、缓存和重验证。服务端数据使用 Next.js 原生 `fetch` + 缓存。

### 7.2 全局配置

```typescript
// lib/swr-config.tsx — SWR 全局配置
{
  fetcher: (url) => fetch(url).then(res => res.json()),
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  errorRetryCount: 3,
}
```

---

## 8. MDX — v3.0+

### 8.1 处理管线

```
原始 MDX → remark 插件 (gfm, math, toc) → rehype 插件 (pretty-code, katex, slug) → React 组件
```

### 8.2 插件清单

| 插件 | 作用 |
|------|------|
| `remark-gfm` | GitHub 风味 Markdown |
| `remark-math` | 数学公式识别 |
| `rehype-pretty-code` | Shiki 代码高亮 |
| `rehype-katex` | LaTeX 公式渲染 |
| `rehype-slug` | 标题自动 ID |
| `rehype-autolink-headings` | 标题锚点链接 |

### 8.3 自定义组件

支持在 MDX 文章中直接使用 React 组件 (`Callout`, `CodeBlock`, `ImageZoom` 等)。

---

## 9. SEO 策略

- 每个页面导出 `generateMetadata` (Next.js Metadata API)
- 文章页注入 `Article` JSON-LD 结构化数据
- Open Graph + Twitter Card 完整覆盖
- `sitemap.xml` + `robots.txt` 自动生成

---

## 10. 核心依赖版本

```
next: ^14.0.0  |  react: ^18.2.0  |  typescript: ^5.0.0
tailwindcss: ^4.0.0  |  motion: ^12.0.0  |  zustand: ^5.0.0
swr: ^2.4.0  |  @next/mdx: ^14.0.0  |  shiki: ^1.0.0
```

---

> **下一步**: 参阅 [02-backend-stack.md](./02-backend-stack.md) 了解后端技术栈详细规范。
