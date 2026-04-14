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
- **Primary / Headings**: *Montserrat*, *Oswald*, *Noto Sans SC* (粗体，高对比)
- **Monospace / Accents**: *JetBrains Mono*, *Fira Code* (工业编码指令，全大写)
- 大量使用 `tracking-widest` 增加字间距。

## 动效参数 (Motion)
- 匀速或极快弹性的贝塞尔曲线：`ease-[0.2,1,0.2,1]`。
- Hover 时不使用模糊或柔和阴影，使用硬质纯色阴影 `shadow-[4px_4px_0_var(--gmp-end-accent)]` 或色块位移。

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

**示例**:
```tsx
<div className="bg-(--gmp-bg-panel) gmp-cut-corner-br relative overflow-hidden p-6">
  {/* 必须配合低透明度才能作为点缀 */}
  <div className="absolute inset-0 gmp-industrial-dot-grid opacity-[0.04] pointer-events-none" />
  Content
</div>
```

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

