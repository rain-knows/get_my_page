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
- `frontend/src/features/*`：按业务域聚合 API、hooks、types 与业务逻辑（优先放这里）。
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
- 架构变更必须同步更新本文档及相关 docs（至少 `README.md`、`docs/00/01/02`）。

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
