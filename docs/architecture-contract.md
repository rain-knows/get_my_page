# 架构契约（Architecture Contract）

> 目的：给人类与 AI/Agent 提供单一真相（single source of truth），避免目录和分层随时间漂移。  
> 适用范围：`frontend/` + `backend/` 全仓库。

## 1. 前端分层契约

### 1.1 目录职责

- `frontend/src/app`：仅路由、页面、布局；不放业务请求逻辑与复杂状态编排。
- `frontend/src/components/ui`：仅基础 UI 原子组件（shadcn）；不放业务组件。
- `frontend/src/components/blog`：博客业务组件。
- `frontend/src/components/admin`：后台业务组件。
- `frontend/src/components/shared`：跨板块复用展示组件。
- `frontend/src/components/motion`：跨 feature 复用的动效令牌与过渡预设层，不承载业务状态。
- `frontend/src/features/*`：按业务域聚合 API、hooks、types 与业务逻辑（优先放这里）。
- `frontend/src/features/post/editor/novel-demo/*`：文章编辑器能力层（官方 demo 扩展、slash/bubble、`/api/upload` 桥接、默认内容与编解码）。
- `frontend/src/features/post/editor/code-block/*`：代码块编辑器独立模块（CodeMirror 6 编辑态封装、语言选择、行号开关、只读渲染）。遵守与 `novel-demo/*` 相同的分层规则：位于 `features/` 内，仅依赖 `@/lib` 与 `@/components/ui`。
- `frontend/src/hooks`：跨业务通用 hook（如 `use-debounce`）。
- `frontend/src/lib`：基础能力封装（如 `api-client`、`mdx`、`seo`），避免业务耦合。
- `frontend/src/types`：跨 feature 共享的公共类型，feature 私有类型应放在 feature 内。

### 1.2 依赖方向（必须）

- `app` -> `components` / `features` / `lib` / `stores` / `types`
- `features` -> `lib` / `stores` / `types` / `components`
- `components` 不得依赖具体路由页面（不得反向依赖 `app`）
- `components/ui` 不得依赖 `features/*`

### 1.3 禁止项

- 在 `app/**/page.tsx` 内直接写请求封装与业务 orchestration（应下沉到 `features/*`）。
- 在 `components/ui` 放 `Navbar`、`PostCard`、`Editor` 这类业务组件。
- 在业务 feature 内重复造编辑器扩展集合（命令菜单/上传粘贴拖拽/BubbleMenu）；应复用 `features/post/editor/novel-demo/*`。

### 1.4 设计语言工程契约（首页/认证）

> 目标：把“终末地灵感”的视觉方案变成可复现、可验收、可维护的工程标准，而不是一次性样式改动。

- 风格基线（必须）
  - 使用“黑 + 高亮黄 + 控制性红”的高对比工业风语义，不直接复用第三方版权角色/品牌素材。
  - 统一通过设计令牌驱动样式（如 `--gmp-end-*`），禁止在业务组件中散落硬编码色值。
  - 背景纹理采用可程序化复现方案（gradient/grid/noise/scanline），避免依赖不可追踪图片资产。
- 分层与复用（必须）
  - `app` 仅保留路由拼装；页面视觉编排与状态门控下沉到 `features/home/*`、`features/auth/*`。
  - 认证高交互壳层必须在 `features/auth/components/InteractiveAuthShell.tsx` 统一承载，登录/注册通过 props 配置差异。
  - `components/ui` 继续保持原子组件职责，不承载业务动效与业务语义。
- 动效与性能（必须）
  - 动效时序使用令牌化时长（快/中/慢），默认控制在 `180ms / 280ms / 420ms` 档位。
  - 优先 `transform/opacity`，避免 layout 抖动；页面需满足无明显卡顿与可中断交互。
  - 必须实现 `prefers-reduced-motion` 降级路径，降级后仍能完整完成主流程。
- 首页加载门控策略（强制）
  - 首页首屏加载采用门控组件（`EntryExperienceGate`）统一管理。
  - **每次浏览器刷新首页都必须显示加载页**，不使用 `sessionStorage/localStorage/cookie` 跳过加载。
  - 加载阶段结束后再展示主首页，且加载组件与主首页组件职责分离（`EndfieldLoadingScreen` vs `HomeLandingSurface`）。
- 可访问性与交互反馈（必须）
  - 认证表单保留显式 `Label`、字段就近错误提示、密码显隐可访问标签与可见焦点。
  - 所有关键按钮触控尺寸不低于 44px，高风险操作与提交状态必须有明确反馈。
- 验收与文档同步（必须）
  - 视觉与交互改造需同步更新设计规范文档（当前基线：`docs/10-mvp-requirements-spec.md`）。
  - 验收至少覆盖：`375/768/1024/1440` 响应式、键盘导航、reduced-motion、生效的加载门控。

## 2. 后端分层契约

### 2.1 目录职责

- `controller`：HTTP 入站层（参数接收、调用应用服务、返回 DTO）。
- `service`：业务服务层（按子域聚合，如 `auth/`、`user/`）。
- `mapper`：数据访问接口（MyBatis）。
- `model/entity|dto|vo`：数据模型层。
- `security`：认证鉴权相关组件。
- `event`：应用事件与监听器。
- `infrastructure/cache|search|storage`：基础设施外部系统封装。
- `common/constant|enums|util`：通用能力层（替代 legacy `util`）。
- `exception`：统一异常与错误码。

### 2.2 依赖方向（必须）

- `controller` -> `service`
- `service` -> `mapper` / `infrastructure` / `event` / `common`
- `security` 可依赖 `service` / `mapper` / `common`
- `infrastructure` 不得反向依赖 `controller`

### 2.3 禁止项

- 新增代码进入 legacy `backend/.../util`（已废弃）。
- 在 `controller` 里堆积业务逻辑与跨系统调用编排。

## 3. 兼容性与变更规则

- 默认保持对外 API（路径、响应结构、错误码）兼容。
- 若必须 breaking change：在 PR/变更说明中显式声明迁移策略。
- 架构变更必须同步更新本文档及相关 docs（至少 `README.md`、`docs/11-rich-editor-design.md`、`docs/design.md`）。
- 当前生效的显式 breaking change（2026-04-22）：文章内容协议硬切为 `tiptap-json`，不再保留 `gmp-block-v1` 双读兼容。
- 当前生效的编辑阶段策略（2026-04-23）：`/blog/{slug}/edit` 采用 Novel 官方 demo localStorage 模式；编辑页首次进入时优先读取本地草稿，不存在时回退后端 `posts` 详情初始化，但暂不将编辑内容写回 `posts` 接口。

## 4. Agent 执行规范

- 开始实现前先读取：`AGENTS.md` + 本文档。
- 代码完成后执行可用校验（lint/build/test）。
- 若环境限制导致无法运行校验，必须在结果中明确说明阻塞点与替代验证方式。

## 5. 公用代码规范（新增）

### 5.1 函数级汉语注释（强制）

- 所有新增或修改的函数/方法必须添加**函数级汉语注释**。
- 注释至少说明：`功能目的`、`关键参数`、`返回值/副作用`。
- 前端 `React` 组件函数、hooks、工具函数；后端 controller/service/mapper/infrastructure 方法均适用。
- 仅做“显而易见赋值”这类无信息注释不算合规。

### 5.2 建议项（推荐执行）

- 命名建议：变量/函数命名表达业务语义，避免 `data1`、`tmp`、`doSomething`。
- 边界建议：业务逻辑放 `features`/`service`，页面与 controller 只做组装和编排。
- 错误处理建议：统一错误出口，避免吞异常；错误信息包含可排查上下文。
- 测试建议：新增核心逻辑至少补一条对应测试或最小回归验证步骤。
- 文档建议：涉及架构、目录、接口契约变更时，同步更新 `README.md` 与相关 `docs/*`。
