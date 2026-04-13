# GetMyPage UI Design System (Arknights Inspired)

## Overview
A complete visual overhaul shifting from a heavily textured "dark noise/terminal" aesthetic to a high-contrast, clean, geometric, and dynamic "industrial minimal" aesthetic inspired by Arknights.

## 核心设计理念 (Core Philosophy)
1. **高对比度极简 (High-Contrast Minimal)**: 移除大量模糊、渐变、噪点。大量使用纯色（白/黑/深灰）块面，辅以亮丽的主题高亮色（如工业黄/科技青）。
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

## 关键 UI 组件重构指南

### 1. 启动区 (EndfieldLoadingScreen)
**现有**: 使用了噪点、光环和多个背景纹理。
**新设计**: 
- 全黑背景。
- 巨大的中心文本“终界起航”配合极高对比度的黄色进度条（硬切角缩放）。
- 取消背景粒子流，只保留极简 1px 网格底纹或纯黑。

### 2. 主页面板 (KineticPageShell)
**现有**: 三栏结构，两侧面板使用了玻璃拟态，背后是渐变动效。
**新设计**:
- 去除玻璃拟态 `backdrop-blur` 和透明块，改为实心黑结合边框。
- UI 引入切角来凸显科技感。
- 顶部/底部使用类似 HUD 或工程图纸的细线刻度和十字星点缀。

### 3. 主页内容区 (HomeLandingSurface)
**新设计**:
- 卡片完全扁平化设计，无阴影，仅使用边框。
- 采用斜向运动的亮色背景填充动画（Hover时）。
- 运用 CSS `clip-path` 创建带切角的特有元素效果。

### 4. 登录认证页 (InteractiveAuthShell)
**新设计**:
- 单个大型带有清晰切角的表单面板。
- 背景替换为大量不对称的锐化几何斜线阵列。
- 表单控件结合 Shadcn，覆写极简边框状态。
