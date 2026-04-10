# 11. 终末地灵感首页与认证系统设计规范（阶段一）

> 版本：v1.0.0  
> 更新时间：2026-04-10  
> 适用范围：`frontend` 首页（`/`）+ 登录（`/login`）+ 注册（`/register`）

## 1. 设计目标与原则

### 1.1 目标

- 在不修改后端认证接口契约前提下，重建主页面与认证页面视觉和交互体验。
- 形成“每次刷新显示加载页 -> 主首页”的双段式叙事入口。
- 登录与注册采用同一交互壳层，确保体验一致、状态清晰、反馈可追踪。
- 提供可工程化落地的设计规范，明确到组件、状态、动效参数、验收标准。

### 1.2 体验原则

- 信息高密度：减少装饰性内容，优先展示可执行入口与状态反馈。
- 视觉低噪声：背景动态存在但不压制文案和交互控件。
- 反馈前置：输入、提交、成功/失败都要在 300ms 内给出可感知反馈。
- 降级可用：`prefers-reduced-motion` 下仍可完整完成任务流程。

## 2. 视觉 DNA（Visual Language）

### 2.1 色彩系统

新增主题令牌（定义于 `frontend/src/app/globals.css`）：

- `--gmp-end-bg: #090b0f`：主背景。
- `--gmp-end-panel: rgba(6, 8, 11, 0.54)`：面板底色。
- `--gmp-end-accent: #f8e64f`：主强调黄。
- `--gmp-end-accent-soft: #ffe88a`：悬停高亮黄。
- `--gmp-end-danger: #cf1d12`：错误提示红。
- `--gmp-end-timing-fast/mid/slow`：180/280/420ms。

配色策略：

- 大面积使用近黑背景承载信息。
- 黄色用于行动按钮、状态点、关键标签。
- 红色仅用于冲击光效与错误态，不用于正文。

### 2.2 纹理与背景

- 工业网格：线性网格增强“系统界面”感。
- 地形/雷达纹理：使用 radial + repeating-radial 构建原创抽象地形层。
- 扫描线：加载页使用单条纵向扫描动画表达“系统启动”。
- 噪点层：低透明度网格叠层，提升层次但避免真实图片依赖。

### 2.3 字体与排版

- 沿用项目现有本地字体加载（layout 不改字体加载链路）。
- 标题：`font-heading`，用于主视觉标语与模块标题。
- 标签与系统信息：`font-mono` + 大写字距追踪。
- 正文：`font-sans`，正文行高 1.5+，移动端字号不低于 14px。

## 3. 页面蓝图与信息架构

### 3.1 首页阶段一结构

入口门控：`EntryExperienceGate`

- 每次浏览器刷新首页都先显示加载页。
- 加载完成后进入主页主场景。

页面结构：`HomeLandingSurface`

- 左导轨（Desktop）：章节编号、品牌锚点、状态位。
- 中央主画面：主标题、副文案、双 CTA、三段内容卡。
- 右侧行动区（Desktop）：Quick Access + Download Hub。
- 移动端：左导轨隐藏，中区与行动区顺序堆叠。

### 3.2 登录/注册结构

统一壳层：`InteractiveAuthShell`

- 顶栏：品牌入口 + 当前模式标记。
- 左侧情报区：根据输入焦点与提交状态联动文案。
- 右侧表单区：标题、描述、表单、底部切换链接。
- 登录与注册页面结构一致，仅字段集和文案不同。

## 4. 交互状态与动效规范

### 4.1 首页加载门控状态机

状态定义：

- `hydrated=false`：SSR/首帧阶段，渲染主页占位。
- `hydrated=true` 且 `isLoading=true`：显示加载页。
- `isLoading=false`：显示首页主场景。

进度算法：

- 前 86% 采用线性压缩（控制节奏稳定）。
- 尾段使用二次幂加速收束（制造完成感）。
- 总时长：
  - 普通模式：2520ms
  - reduced-motion：820ms

触发策略：

- 不使用 `sessionStorage/localStorage/cookie` 跳过加载。
- 每次浏览器刷新都会执行完整加载门控流程。

### 4.2 动效时序

首页：

- 加载页淡入：360ms
- 进度条刷新：220ms ease-out
- 加载切主页：220ms（reduced-motion 为 60ms）

认证页：

- 壳层初始进入：340ms
- 左侧视差：spring（stiffness 150 / damping 22）
- Hover 呼吸指示：1.8s 无限往复
- 提交按钮状态切换：即时切换 + 图标反馈

### 4.3 认证状态联动

焦点联动字段：

- `username`：身份验证通道
- `nickname`：公开身份配置
- `email`：通知路由节点
- `password`：安全防护层

提交状态：

- `idle`：默认说明
- `loading`：按钮锁定 + 旋转图标
- `success`：通过图标 + 220ms 后路由跳转
- `error`：左侧文案切换为失败说明 + 字段附近错误提示

### 4.4 reduced-motion 策略

- 禁用光标追踪光斑与视差位移。
- 缩短加载时长到 820ms。
- 保留最小必要 fade 反馈，保证可读与状态可感知。

## 5. 组件规范（详细）

### 5.1 首页组件

`EntryExperienceGate`

- 职责：门控、进度驱动、刷新级触发控制。
- 输入：无。
- 输出：`EndfieldLoadingScreen` 或 `HomeLandingSurface`。

`EndfieldLoadingScreen`

- 输入：`progress: number`。
- UI 要点：标题区、系统标签、底部进度条。
- 可访问性：`role="status"` + `aria-live="polite"`。

`HomeLandingSurface`

- 输入：无（当前阶段静态内容）。
- UI 要点：左导轨 + 中央视觉 + 右行动区。
- CTA：`/register`、`/login`、`/search`。

### 5.2 认证组件

`InteractiveAuthShell`

- 输入：`mode/title/description/activeField/submitState/footer/children`。
- 关键行为：
  - 光标移动更新 `pointerX/pointerY`。
  - 根据 `activeField/submitState` 解析左侧提示。
  - 共享元素 ID：`auth-gmp-logo`、`auth-main-frame`。

`LoginForm`

- 字段：`username/password`。
- 提交流程：调用 `useAuthActions().login`。
- 成功：`submitState=success` 后跳转 `/`。

`RegisterForm`

- 字段：`username/nickname/email/password`。
- 提交流程：调用 `useAuthActions().register`。
- 成功：`submitState=success` 后跳转 `/`。

## 6. 响应式规范

### 6.1 断点策略

- 375：移动主目标，单列布局。
- 768：中屏开始增强间距与模块比例。
- 1024：认证页与首页进入双栏/三栏完整布局。
- 1440：保持最大内容宽度，不无限拉伸。

### 6.2 首页响应式

- `< md`：隐藏左导轨。
- `lg` 以上显示右行动区固定列（320px）。
- 主标题字号阶梯：`4xl -> 6xl -> 7xl`。

### 6.3 认证页响应式

- `< md`：壳层纵向堆叠，先信息区后表单区。
- `md+`：左右分栏，信息区维持视觉主导。
- 表单控件高度：统一 44px+（当前 11 Tailwind 单位）。

## 7. 可访问性规范

- 所有输入保持显式 `Label`。
- 错误信息位于表单附近，并使用 `role="alert"`。
- 输入焦点使用高对比边框与 ring。
- 图标按钮提供 `aria-label`（显示/隐藏密码）。
- 动效降级遵循系统 `prefers-reduced-motion`。

## 8. 工程映射（Design -> Code）

### 8.1 文件映射

首页：

- `frontend/src/app/page.tsx`：路由拼装入口。
- `frontend/src/features/home/HomePageExperience.tsx`：首页总入口。
- `frontend/src/features/home/components/EntryExperienceGate.tsx`：加载门控。
- `frontend/src/features/home/components/EndfieldLoadingScreen.tsx`：加载页。
- `frontend/src/features/home/components/HomeLandingSurface.tsx`：主首页。

认证：

- `frontend/src/app/(auth)/login/page.tsx`：登录路由拼装。
- `frontend/src/app/(auth)/register/page.tsx`：注册路由拼装。
- `frontend/src/features/auth/components/InteractiveAuthShell.tsx`：统一交互壳层。
- `frontend/src/features/auth/components/LoginForm.tsx`：登录表单。
- `frontend/src/features/auth/components/RegisterForm.tsx`：注册表单。

样式：

- `frontend/src/app/globals.css`：主题变量、背景纹理、关键动画。

### 8.2 状态来源映射

- `submitState`：`LoginForm/RegisterForm` 本地状态机。
- `activeField`：字段焦点 onFocus/onBlur。
- 认证请求状态：`useAuthActions`（保持原有逻辑）。
- 刷新触发标记：无持久化标记（刷新即触发加载）。

## 9. 验收清单

### 9.1 功能验收

- 每次刷新 `/` 均显示加载页，加载完成后进入首页。
- `/login` 与 `/register` 均可完成成功登录/注册并跳转 `/`。
- 登录注册失败时页面不会跳转，错误提示可见。

### 9.2 体验验收

- 页面无横向滚动（375/768/1024/1440）。
- CTA 可触达且点击反馈明确。
- 焦点切换可见且符合键盘导航顺序。
- reduced-motion 生效且流程完整。

### 9.3 工程验收

- `npm run lint` 通过。
- `npm run build` 通过。
- 无后端接口与 `features/auth/types.ts` 契约变更。

## 10. 后续迭代挂钩（阶段二建议）

- 接入可替换媒体资源位（主视觉图、视频、二维码真实资源）。
- 增加首页内容流真实数据源，替换当前静态文案。
- 登录注册加入可选二次验证流程（OTP / 邮件验证码）。
- 增加主题 A/B 开关（黄红冲击版 vs 冷黑金版）。
- 引入页面级性能预算监测（LCP、CLS、INP）。
