# GetMyPage UI Design System (Arknights Inspired)

## Overview
A complete visual overhaul shifting from a heavily textured "dark noise/terminal" aesthetic to a high-contrast, clean, geometric, and dynamic "industrial minimal" aesthetic inspired by Arknights.

## 核心设计理念 (Core Philosophy)
1. **高对比度极简 (High-Contrast Minimal)**: 大量使用纯色（白/黑/深灰）块面，辅以亮丽的主题高亮色（如工业黄/科技青）。
2. **锐利的几何图形 (Sharp Geometry)**: UI 元素避免大圆角，大量使用硬切角（Diagonal Cuts）、锐角边框与细线工业分割（1px/2px solid lines）。
3. **醒目的版式 (Bold Typography)**: 字体必须作为排版的核心与视觉焦点。英文使用无衬线粗体，全大写字母 (Uppercase) 进行点缀；中文选用硬朗的黑体。
4. **富有张力的微动效 (Dynamic Accents)**: 通过元素的平移、硬切、闪烁光标等实现动效，而非流体或粒子。

## 色彩规范 (Color Palette)

| 用途 | 颜色 | Hex | 描述 |
| --- | --- | --- | --- |
| **基础底色 Base** | Dark Space | `#0B0C10` | 极深的无彩色黑，作为宇宙/工业暗处背景 |
| **主面板面 Panel** | Obsidian | `#1A1B20` | 深灰色，用于卡片与主要承载区，与底色区分 |
| **高亮强调色 Accent** | Ark Yellow | `#FFCC00` | 阿米娅/罗德岛经典高明度工业黄，用于主按钮、进度条、强调文字 |
| **辅助强调色 Secondary**| Ark Blue | `#00C2FF` | 科技感青兰色，用于次要标签与悬浮状态 |
| **危险/警告 Danger** | Tactical Red | `#FF3333` | 战术红，用于报错与注销 |
| **主文本 Text Primary** | Pure White | `#FFFFFF` | 纯白高对比文本 |
| **次文本 Text Muted** | Silver Gray | `#8E9297` | 暗银灰，用于次要描述，低优先级状态 |
| **分割线 Borders** | Tech Line | `#FFFFFF20` | `rgba(255,255,255,0.12)` 或纯色 `#303338` |

## 字体规范 (Typography)
- **Primary / Sans**: *Montserrat* + *Noto Sans SC*（正文/UI 基础字族）
- **Headings**: *Oswald* + *Noto Sans SC*（标题/大写标签）
- **Monospace / Accents**: *JetBrains Mono* + *Fira Code*（工业编码指令，全大写）
- 字体通过 `frontend/src/app/layout.tsx` 中的 `next/font/google` 注入，不再使用本地 Geist 占位字体覆盖主题变量。
- 大量使用 `tracking-widest` 增加字间距。

## 动效参数 (Motion)
- 贝塞尔曲线规范：
  - `control`：编辑器/认证/首页加载相关组件使用 `cubic-bezier(0.2, 1, 0.2, 1)`（如 `InteractiveAuthShell`、`EndfieldLoadingScreen`、`KineticPageShell`）。
  - `display`：导航/展示/网格相关组件使用 `cubic-bezier(0.22, 1, 0.36, 1)`（如 `Navbar`、`Hero`、`FlowShowcase`、`ProjectGrid`）。
  - 时长令牌统一定义在 `globals.css`：`--gmp-motion-duration-fast`、`--gmp-motion-duration-enter`、`--gmp-motion-duration-panel`、`--gmp-motion-duration-slow`、`--gmp-motion-duration-loading`。
- Hover 时不使用模糊或柔和阴影，使用硬质纯色阴影 `.gmp-hard-shadow` / `.gmp-hard-shadow-accent` 或色块位移。
- **动效库状态**：`frontend/src/components/motion/tokens.ts` 为统一动效入口，集中定义双轨 easing、共享 duration 与 `motion/react` 过渡预设，业务组件不再内联硬编码 `ease` 数组。

## 具体化与可复现实现方案 (Concrete & Reproducible Implementations)

以下为基于 Tailwind CSS v4 与 React 的标准实现范式，所有新开发组件必须遵循这些模式构建。

### 1. 颜色与主题变量 (Colors & Theme Variables)
颜色统一通过 CSS 变量注入并在 Tailwind 中使用最新的动态取值语法。

**定义 (globals.css)**:
```css
:root {
  --gmp-bg-base: #0B0C10;
  --gmp-bg-elevated: #16171B;
  --gmp-bg-panel: #1A1B20;
  --gmp-line-soft: #303338;
  --gmp-line-strong: #4F535B;
  --gmp-text-primary: #FFFFFF;
  --gmp-text-secondary: #8E9297;
  --gmp-accent: #FFCC00;
}
```

### 完整令牌目录（实际 globals.css）

**基础面板令牌 (Base / Panel Tokens)**:

| 变量名 | 值 | 用途 |
|---|---|---|
| `--gmp-bg-base` | `#0B0C10` | 全局最深底色 |
| `--gmp-bg-elevated` | `#16171B` | 微浮层背景 |
| `--gmp-bg-panel` | `#1A1B20` | 卡片/面板主背景 |
| `--gmp-line-soft` | `#303338` | 弱分割线（1px border 默认色） |
| `--gmp-line-strong` | `#4F535B` | 强分割线（聚焦/强调 border 色） |
| `--gmp-text-primary` | `#FFFFFF` | 主文本色 |
| `--gmp-text-secondary` | `#8E9297` | 次要文本色/暗银灰 |
| `--gmp-accent` | `#FFCC00` | 主题高亮黄（Ark Yellow） |
| `--gmp-accent-dim` | `#D1A800` | 主题高亮黄暗淡变体 |
| `--gmp-accent-blue` | `#00C2FF` | 辅助科技青（Ark Blue） |
| `--gmp-text-gray-contrast` | `#a1a1aa` | 灰白对比文本（高亮区域用） |

**动效令牌 (Motion Tokens)**:

| 变量名 | 值 | 用途 |
|---|---|---|
| `--gmp-motion-duration-fast` | `180ms` | 快速 hover / 微位移动效 |
| `--gmp-motion-duration-fade` | `250ms` | 轻量 fade in/out |
| `--gmp-motion-duration-enter` | `240ms` | 展示模块进场 |
| `--gmp-motion-duration-panel` | `300ms` | 控制型面板进场 |
| `--gmp-motion-duration-slow` | `400ms` | 大块内容 reveal |
| `--gmp-motion-duration-loading` | `500ms` | 首页加载标题揭示 |
| `--gmp-motion-ease-control` | `cubic-bezier(0.2, 1, 0.2, 1)` | 认证/加载/控制型交互 |
| `--gmp-motion-ease-display` | `cubic-bezier(0.22, 1, 0.36, 1)` | 导航/展示/卡片 reveal |

**终末地灵感令牌 (Endfield Tokens)**:

| 变量名 | 值 | 用途 |
|---|---|---|
| `--gmp-end-bg` | `#0B0C10` | 首页深层背景 |
| `--gmp-end-panel` | `#1A1B20` | 首页面板/卡片背景 |
| `--gmp-end-accent` | `#FFCC00` | 首页强调色 |
| `--gmp-end-danger` | `#FF3333` | 首页警示/危险色（Tactical Red） |
| `--gmp-end-timing-fast` | `150ms` | 首页快速动效时长 |
| `--gmp-end-timing-mid` | `250ms` | 首页中速动效时长 |

**Novel 编辑器令牌 (Editor Tokens -- GitHub Dark Colorblind inspired)**:

| 变量名 | 值 | 用途 |
|---|---|---|
| `--gmp-novel-surface` | `#0d1117` | 编辑器底层画布 |
| `--gmp-novel-toolbar` | `#161b22` | 编辑器工具栏背景 |
| `--gmp-novel-toolbar-hover` | `#21262d` | 工具栏 hover 态 |
| `--gmp-novel-line` | `#30363d` | 编辑器内部分割线 |
| `--gmp-novel-line-strong` | `#484f58` | 编辑器内强分割线 |
| `--gmp-novel-text` | `#c9d1d9` | 编辑器正文色 |
| `--gmp-novel-text-muted` | `#8b949e` | 编辑器次要文本 |
| `--gmp-novel-text-strong` | `#f0f6fc` | 编辑器强调文本 |
| `--gmp-novel-link` | `#79c0ff` | 编辑器链接色 |
| `--gmp-novel-link-hover` | `#a5d6ff` | 编辑器链接 hover 色 |
| `--gmp-novel-accent` | `#1f6feb` | 编辑器主题蓝 |
| `--gmp-novel-accent-soft` | `#1f6feb33` | 编辑器主题蓝（半透明） |

**代码块令牌 (Code Block Tokens)**:

> 应用固定为 dark 工业主题，代码块令牌在 `:root` 中维护单一深色真值源；`--gmp-novel-code-*` 继续作为编辑器兼容别名。

| 变量名 | `.dark` 值 | 用途 |
|---|---|---|
| `--gmp-code-bg` | `#0d1117` | 代码块背景 |
| `--gmp-code-toolbar` | `#161b22` | 代码块工具栏背景 |
| `--gmp-code-toolbar-hover` | `#21262d` | 工具栏 hover |
| `--gmp-code-gutter-bg` | `color-mix(in srgb, #161b22 86%, black 14%)` | 行号 gutter 背景 |
| `--gmp-code-border` | `#30363d` | 代码块边框 |
| `--gmp-code-border-strong` | `#484f58` | 代码块聚焦边框 |
| `--gmp-code-text` | `#c9d1d9` | 代码文本色 |
| `--gmp-code-text-strong` | `#f0f6fc` | 代码强调文本 |
| `--gmp-code-muted` | `#8b949e` | 代码块次要文本 |
| `--gmp-code-accent` | `#79c0ff` | 代码块强调色 |
| `--gmp-code-accent-soft` | `#1f6feb33` | 代码块强调色（透明） |
| `--gmp-code-caret` | `#f0f6fc` | 光标颜色 |
| `--gmp-code-selection` | `#264f78cc` | 选中文本高亮 |
| `--gmp-code-active-line` | `#161b2299` | 当前活动行背景 |
| `--gmp-code-active-gutter` | `#21262d` | 当前活动行 gutter |
| `--gmp-code-syntax-comment` | `#8b949e` | 语法高亮——注释 |
| `--gmp-code-syntax-keyword` | `#ffab70` | 语法高亮——关键字 |
| `--gmp-code-syntax-string` | `#a5d6ff` | 语法高亮——字符串 |
| `--gmp-code-syntax-number` | `#79c0ff` | 语法高亮——数字 |
| `--gmp-code-syntax-function` | `#79c0ff` | 语法高亮——函数 |
| `--gmp-code-syntax-type` | `#d2a8ff` | 语法高亮——类型 |
| `--gmp-code-syntax-variable` | `#c9d1d9` | 语法高亮——变量 |
| `--gmp-code-syntax-meta` | `#7ee787` | 语法高亮——元信息 |

**Novel 兼容别名令牌**:

| 变量名 | 映射 | 用途 |
|---|---|---|
| `--gmp-novel-code-bg` | `var(--gmp-code-bg)` | 编辑器内代码块背景 |
| `--gmp-novel-code-toolbar` | `var(--gmp-code-toolbar)` | 编辑器内代码工具栏背景 |
| `--gmp-novel-code-text` | `var(--gmp-code-text)` | 编辑器内代码文本 |
| `--gmp-novel-code-inline-bg` | `var(--gmp-code-toolbar-hover)` | 编辑器内行内代码背景 |
| `--gmp-novel-code-inline-text` | `var(--gmp-code-text)` | 编辑器内行内代码文本 |
| `--gmp-novel-code-border` | `var(--gmp-code-border)` | 编辑器内代码块边框 |

> **已知偏离**：代码块令牌在 `:root` 与 `.dark` 中各定义一次，分别使用浅色与深色主题值。当前无全局浅色/深色主题切换编排机制，`.dark` 下的深色值即为应用实际生效值。

**使用规范 (React/Tailwind v4)**:
- **必须使用括号语法**: `bg-(--gmp-bg-panel)`, `text-(--gmp-accent)`, `border-(--gmp-line-strong)`。
- **严禁使用旧版任意值**: 禁绝使用 `bg-[var(--gmp-bg-panel)]`。

### 2. 几何切角与背景纹理 (Geometry & Textures)
使用全局 Utility Class 实现 Arknights 风格的切角与工业背板。

**切角样式**:
- `.gmp-cut-corner-l` / `.gmp-cut-corner-r`: 左/右单侧切角 (12px)
- `.gmp-cut-corner-bl` / `.gmp-cut-corner-br`: 左下/右下侧单侧切角 (12px)
- `.gmp-cut-corner-double`: 双切角 (对角线，16px)

**背景纹理**:
- `.gmp-industrial-grid`: 工业方格网底 (50x50)
- `.gmp-industrial-dot-grid`: 点状阵列网底 (20x20)
- `.gmp-halftone-pattern`: 边缘虚化的点阵渐变半调纹理 (8x8)

**示例**:
```tsx
<div className="bg-(--gmp-bg-panel) gmp-cut-corner-br relative overflow-hidden p-6">
  {/* 必须配合低透明度才能作为点缀 */}
  <div className="absolute inset-0 gmp-industrial-dot-grid opacity-[0.04] pointer-events-none" />
  
  {/* 或者使用半调装饰卡片 */}
  <div className="absolute inset-0 gmp-halftone-pattern opacity-20 pointer-events-none" />
  Content
</div>
```

### 2.5 硬质阴影与面板辅助类 (Hard Shadows & Panel Helpers)

以下为已实装但未在早期文档中列出的全局 utility class：

**面板类**:
- `.gmp-panel-matte`：纯色面板（`background-color: var(--gmp-bg-panel)`）。
- `.gmp-panel-pure`：微浮层面板（`background-color: var(--gmp-bg-elevated)`）。

**边框与装饰线**:
- `.gmp-sharp-border`：1px 弱分割线边框（`border: 1px solid var(--gmp-line-soft)`）。
- `.gmp-sharp-border-accent`：1px 强调色边框（`border: 1px solid var(--gmp-accent)`）。
- `.gmp-tech-accent-b`：底部 2px 强调下划线（`border-bottom: 2px solid var(--gmp-accent)`）。
- `.gmp-tech-accent-l`：左侧 2px 强调左边线（`border-left: 2px solid var(--gmp-accent)`）。

**切角补充**:
- `.gmp-cut-corner-double-reverse`：反向双切角 16px，与 `.gmp-cut-corner-double` 形成对角线镜像。

**硬阴影**:
- `.gmp-hard-shadow`：硬质纯色阴影（`box-shadow: 4px 4px 0 0 var(--gmp-line-soft)`）。
- `.gmp-hard-shadow-accent`：硬质强调色阴影（`box-shadow: 4px 4px 0 0 var(--gmp-accent)`）。

**Hover 填充效果**:
- `.gmp-hover-fill`：hover 时从左侧滑入强调色填充块的交互效果。
  - 内部使用 `::before` 伪元素 + `--gmp-motion-duration-panel` / `--gmp-motion-ease-control` 过渡实现。
  - hover 后文字颜色自动反转为 `var(--gmp-bg-base)`。

**旧版背景层说明**:
- `.gmp-noise-overlay`、`.gmp-kinetic-bg`、`.gmp-fluid-scan`、`.gmp-parallax-geometry`、`.gmp-module-stage__aura` 已从 `globals.css` 清理，不再保留兼容占位类。

### 3. 版式排版规范 (Typography Patterns)

不同类型文本的特定组合范式：

- **一级大标题 (Hero/Title)**: 
  `font-heading text-4xl font-black text-white uppercase tracking-tight leading-[1.1]`
- **工业编码指令 (Data/ID/Labels)**:
  `font-mono text-[10px] md:text-xs font-bold tracking-[0.2em] md:tracking-widest uppercase text-(--gmp-accent)`
- **辅助说明文本 (Descriptions)**:
  `font-mono text-xs leading-relaxed text-(--gmp-text-secondary)`

### 4. 按钮与交互件标准态 (Interactive Elements)
避免使用圆角 (`rounded`)，组合硬派边框与悬浮颜色翻转。

**主按钮 (Accent Button)**:
```tsx
<button className="group relative inline-flex h-12 items-center justify-center gap-3 bg-(--gmp-bg-base) text-white border border-(--gmp-line-strong) px-6 font-heading text-xs font-black tracking-widest uppercase transition-all hover:bg-white hover:text-black hover:border-white gmp-cut-corner-br">
  <Terminal className="h-4 w-4 group-hover:text-(--gmp-accent)" />
  ACCESS MAIN DB
</button>
```

**次按钮 (Secondary Button)**:
```tsx
<button className="inline-flex h-12 items-center justify-center bg-(--gmp-bg-base) text-(--gmp-text-secondary) border border-(--gmp-line-strong) px-6 font-heading text-xs font-black tracking-widest uppercase transition-all hover:border-(--gmp-accent) hover:text-(--gmp-accent) gmp-cut-corner-l">
  INITIATE SEARCH
</button>
```

### 5. 状态点缀组件 (Status Indicators)
结合背景动画实现生命维持系统式的呼吸灯点缀。

```tsx
<div className="flex items-center gap-3">
  {/* 呼吸灯切角方块 */}
  <span className="flex items-center justify-center w-5 h-5 bg-(--gmp-accent) gmp-cut-corner-l">
    <span className="w-1.5 h-1.5 bg-black animate-ping" />
  </span>
  <span className="font-mono text-[10px] font-bold tracking-[0.3em] text-(--gmp-accent) uppercase">
    SYSTEM ONLINE
  </span>
</div>
```


### 6. 半调点阵增强 (Halftone / Industrial Dots)
在纯色方块不足以提供足够的质感时，使用 CSS `radial-gradient` 生成静态防滑金属板质感的半调效果。
**核心原则与禁忌**:
- **禁止渐隐渐现交互**：半调图层必须是固定的、静态的底层组件风格化（`pointer-events-none`），严禁使用 `hover:opacity-100` 或结合 `transition` 进行变色或透明度补间交互。这会破坏点阵的“坚固”与“重工作用”质感，显得廉价。
- **层级管理**：作为背景层，`z-index: 0` 且置于文字与交互按钮底面，有时结合 `mix-blend-overlay` 融入底色，或者调节整体 `opacity` 达到克制但清晰的质感。

**核心 CSS 变体 (`globals.css`)**：
- `.gmp-halftone-btn`: 针对按钮的细密防滑纹高对比度点阵 (4x4px，配合 `mix-blend-overlay` 与底色如黄黑融合)。
- `.gmp-halftone-card`: 针对卡片与通用面板的稀疏防滑金属大点阵 (10x10px，用于深灰背景增加厚重感边界使用 `mask-image` 进行单角渐隐)。
- `.gmp-halftone-hero`: 针对首页 PRTS 巨幕级重工网底（使用极密 6x6 点阵，结合生硬对角 `linear-gradient` 切割，与警告斜线纹组合使用）。
- `.gmp-halftone-sidebar`: 针对主导航侧边栏垂直大跨度专用 (从左向右渐隐)。

**示例**：
```tsx
<div className="relative overflow-hidden border border-(--gmp-line-strong) bg-(--gmp-bg-panel) p-8">
  {/* 静态重工点阵，永远作为底物 */}
  <div className="absolute inset-0 gmp-halftone-card opacity-[0.35] pointer-events-none z-0" />
  
  <div className="relative z-10 w-full text-white">
    <h2 className="text-xl">SYSTEM RECORD</h2>
    <p className="text-(--gmp-text-secondary)">This is a static structural panel.</p>
  </div>
</div>
```

### 7. 编辑器子系统设计 (Editor Subsystem CSS)

#### 7.1 Novel 编辑器容器 (Novel Editor Container)

`.gmp-novel-editor.ProseMirror` 为编辑器主画布：
- 最小高度 `28rem`，文本色 `--gmp-novel-text`，行高 `1.75`。
- 背景为 36x36 工业方格网底（透明度 0.02）。
- 聚焦时无 outline；空段落 placeholder 使用 `::before` 伪元素显示，颜色 `--gmp-novel-text-muted`。
- 标题 (h1/h2/h3) 使用 `--gmp-novel-text` 色，`font-weight: 700`。
- 链接使用 `--gmp-novel-link`，hover 为 `--gmp-novel-link-hover`。
- 引用块（blockquote）左侧 4px `--gmp-novel-line-strong` 分割线 + `--gmp-novel-text-muted` 文本色。
- 内联代码与代码块使用 `--gmp-novel-code-*` 别名令牌。
- `.gmp-novel-view.ProseMirror` 为阅读态变体（`min-height: auto`）。
- `.gmp-editor-command-scroll` 隐藏滚动条视觉但保留滚动能力（`scrollbar-width: none`）。

#### 7.2 代码块卡片 (Code Block Card)

- `.gmp-code-block-card`：代码块容器卡片
  - 1px `--gmp-code-border` 边框，`--gmp-code-bg` 背景。
  - 聚焦时边框升级为 `--gmp-code-border-strong`。
  - 支持 `data-editable` 属性区分编辑态/阅读态。
- `.gmp-code-block-toolbar`：代码块顶部工具栏
  - flex 布局，最小高度 `2.25rem`，底部分割线。
  - 语言标签 `.gmp-code-block-language` 使用 `--gmp-code-muted` 色、等宽字体、`0.625rem`、全大写、`0.18em` 字间距。
  - 操作按钮组 `.gmp-code-block-actions` 默认 opacity 0.72，hover/focus-within 时升至 1。
- `.gmp-code-block-editor`：CodeMirror 编辑区容器
  - `.cm-editor` 透明背景，继承 `--gmp-code-text` 色。
  - `.cm-scroller` 行高 `1.75rem`。
  - `.cm-content` 白色空格 `pre`，caret 使用 `--gmp-code-caret`。
  - `.cm-gutters` 使用 `--gmp-code-gutter-bg` 背景 + `--gmp-code-muted` 行号色。
  - `.cm-lineNumbers .cm-gutterElement` 最小宽 `2.8rem`，右对齐。
  - 选中文本使用 `--gmp-code-selection`，语法高亮使用 `--gmp-code-syntax-*` 系列令牌。
  - `::selection` 伪元素覆盖为 `--gmp-code-selection` 背景 + `--gmp-code-text-strong` 文本色。

#### 7.3 嵌入链接卡片 (Embed Link Card)

- `.gmp-embed-link-card`：卡片外层容器（margin `0.75rem 0`）。
- `.gmp-embed-link-shell`：卡片内容壳层，支持 `data-content-only` 属性切换为无边框透明模式。
- `.gmp-embed-link-control`：控制面板（触发按钮 + 可展开面板）。
  - `.gmp-embed-link-trigger`：触发按钮（leading icon + copy text + chevron 指示器）。
  - `.gmp-embed-link-panel`：可展开面板，内含 tab 切换（链接解析 / 上传图片）。
- `.gmp-embed-link-input-wrapper`：链接输入区，含输入框 + 解析/上传 action 按钮。
  - `.gmp-embed-link-action`：操作图标按钮，hover 时边框与图标变为 `--gmp-novel-accent`。
- `.gmp-embed-link-upload-panel` + `.gmp-embed-link-upload-button` + `.gmp-embed-link-upload-hint`：上传面板相关组件。
- `.gmp-embed-link-body`：卡片元数据主体
  - `data-pending` 控制待解析状态边框高亮。
  - `data-hover-actions` 控制在顶部显示悬浮操作菜单（复制链接、刷新、删除）。
  - `data-player-only` 控制纯播放器模式（无边框、无内边距）。
- `.gmp-embed-link-hover-actions`：悬浮操作菜单
  - 默认 opacity 0，hover/focus-within 时滑入显示。
  - `.gmp-embed-link-hover-action`：操作按钮，含 hover 危险色菜单项。
- `.gmp-embed-link-player`：播放器 iframe 容器
  - `[data-provider='netease']`：固定高度 106px。
  - `[data-provider='bilibili']`：16:9 aspect-ratio。
- 元数据元素：`.gmp-embed-link-title`、`.gmp-embed-link-description`、`.gmp-embed-link-provider-tag`、`.gmp-embed-link-cover-wrapper`、`.gmp-embed-link-cover`、`.gmp-embed-link-url`、`.gmp-embed-link-hint`。
- 响应式：在 `max-width: 640px` 下卡片改为垂直堆叠布局，播放器与封面全宽。

#### 7.4 全局拖拽手柄 (Global Drag Handle)

- 使用者为 Novel `GlobalDragHandle` 扩展组件。
- CSS 类 `.drag-handle`：
  - `position: fixed`，`z-index: 45`。
  - 1px `--gmp-novel-line` 边框 + `--gmp-novel-toolbar` 背景。
  - 默认 `grab` 光标，active 时 `grabbing`。
  - hover 时边框与颜色升级为 `--gmp-novel-accent`。
  - `::before` 伪元素生成 4x4 点阵装饰图标。
  - `.hide` 变体：opacity 0 + 左移 0.375rem（隐藏态）。

> **已知偏离**：当前编辑器子系统 CSS 均以原生 class 选择器在 `globals.css` 中定义，尚未建立与基础面板令牌的完整映射。代码块模块的浅色/深色双主题定义在 `:root` 与 `.dark` 中分别存在，但无全局主题切换机制。

---

## 已知偏离与待统一事项 (Known Deviations & Unification Backlog)

本轮已完成此前的设计收口项，当前无额外记录中的待统一偏离。实际代码基线为：

1. **动效双轨已令牌化**：`control` / `display` easing 与共享 transition 预设统一维护在 `frontend/src/components/motion/tokens.ts`。
2. **展示面板已回归正式 utility 组合**：首页 `Navbar`、`Hero`、`FlowShowcase` 不再使用未定义的 `industrial-panel` 或大圆角类。
3. **字体与代码块主题已与规范一致**：Google 字体经 `next/font/google` 注入，代码块令牌固定为单一 dark palette。
4. **冗余兼容层已清理**：旧背景层占位类与 `framer-motion` 依赖均已移除。
