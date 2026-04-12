# Get My Page — 现代化博客平台

> 一套面向内容创作者与读者的现代化博客系统，追求极致性能、强 SEO 与高可维护性。

## ✨ 特性

| 特性 | 说明 |
|------|------|
| **极致性能** | 首屏加载 < 1s (SSR/SSG)，API P99 < 50ms，三级缓存策略 |
| **强 SEO** | 服务端渲染、JSON-LD 结构化数据、Open Graph + Twitter Card 完整覆盖 |
| **全文搜索** | Meilisearch 驱动的毫秒级搜索，支持容错拼写与高亮 |
| **容器化** | 全程 Docker Compose 编排，一键启动开发/生产环境 |
| **高并发** | Java 21 虚拟线程 + 多级缓存 (Caffeine → Redis → MySQL) |
| **现代前端** | Next.js 14 + Tailwind CSS v4 + shadcn/ui + MDX 自定义组件 |

---

## 🏗️ 架构总览

```
                    客户端 (Browser)
                         │ HTTPS
                         ▼
                   ┌───────────┐
                   │  Traefik  │  反向代理 + TLS 终端
                   └──┬─────┬──┘
                      │     │
              ┌───────▼─┐ ┌─▼────────┐
              │ Next.js │ │ Spring    │
              │ SSR/SSG │ │ Boot API  │
              │ :3000   │ │ :8080     │
              └─────────┘ └─┬────────┘
                            │
              ┌────┬──────┬──────────┬
              ▼    ▼      ▼          ▼
             MySQL Redis Meili-    MinIO
              8.0   7    search    (S3)
```

### 技术栈

**前端**: Next.js 14 · React 19 · TypeScript 5 · Tailwind CSS v4 · shadcn/ui · Motion · Zustand · SWR · MDX

**后端**: Spring Boot 3.5 · Java 21 (虚拟线程) · MyBatis-Plus · Spring Security · JWT · Flyway · SpringDoc

**基础设施**: MySQL 8.0 · Redis 7 · Meilisearch · MinIO · Docker · Traefik

---

## 🚀 快速开始

### 前置要求

- **Docker Engine** >= 24.0
- **Docker Compose** >= v2.20
- **Git** >= 2.40

### 一键启动

```bash
# 1. 克隆项目
git clone <repo-url> get_my_page
cd get_my_page

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，修改密码和密钥为实际值

# 3. 启动全部服务
docker compose up -d

# 4. 查看服务状态
docker compose ps
```

启动成功后可访问:

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 (Next.js) | http://localhost:3000 | 博客首页 |
| 后端 API | http://localhost:8080 | RESTful 接口 |
| Swagger 文档 | http://localhost:8080/swagger-ui.html | 在线 API 文档 |
| MinIO 控制台 | http://localhost:9001 | 对象存储管理 |
| Meilisearch | http://localhost:7700 | 搜索引擎 |

### 常用命令

项目提供了 Makefile，运行 `make help` 可以查看所有命令：

| 命令 | 说明 |
|------|------|
| `make help` | 查看所有可用命令 |
| `make init` | 初始化 `.env` 配置文件 |
| `make dev` | 启动前后端及依赖，并跟随日志 |
| `make up` | 后台启动全部服务 |
| `make down` | 停止全部服务 |
| `make clean` | 停止服务并删除数据卷 (数据会丢失) |
| `make logs` | 查看全部服务日志 |
| `make logs-be` | 查看后端日志 |
| `make logs-fe` | 查看前端日志 |
| `make restart-be` | 重启后端 |
| `make restart-fe` | 重启前端 |
| `make build` | 无缓存重新构建镜像 |
| `make sync-fe` | 手动同步前端依赖到容器 (`package*.json` 改动时可用) |
| `make rebuild-fe` | 重建并重启前端服务 |
| `make mysql-cli` | 进入 MySQL CLI |
| `make redis-cli` | 进入 Redis CLI |

---

## 📁 项目结构

```
get_my_page/
├── frontend/                  # Next.js 前端项目
│   ├── src/
│   │   ├── app/               # 路由层（仅页面/布局）
│   │   ├── components/        # 组件分层 (ui/blog/admin/shared)
│   │   ├── features/          # 业务模块（auth/post/search/upload）
│   │   ├── hooks/             # 通用 React Hooks
│   │   ├── lib/               # 基础能力封装（api-client/mdx/seo）
│   │   ├── stores/            # Zustand 状态仓库
│   │   ├── types/             # 跨模块公共类型
│   │   └── styles/            # 全局/共享样式资源
│   ├── public/                # 静态资源
│   ├── Dockerfile.dev         # 开发容器
│   └── Dockerfile             # 生产镜像（多阶段构建）
├── backend/                   # Spring Boot 后端项目
│   ├── src/main/java/
│   │   └── com/getmypage/blog/
│   │       ├── config/        # Spring 配置
│   │       ├── controller/    # REST 控制器
│   │       ├── service/       # 业务逻辑层
│   │       ├── mapper/        # MyBatis Mapper
│   │       ├── model/         # 实体与 DTO
│   │       ├── security/      # Spring Security & JWT
│   │       ├── event/         # 应用事件（如文章发布）
│   │       ├── infrastructure/ # 缓存/搜索/存储基础设施封装
│   │       ├── common/        # 常量/枚举/通用工具
│   │       └── exception/     # 全局异常处理
│   ├── src/main/resources/
│   │   └── db/migration/      # Flyway 迁移脚本
│   ├── pom.xml
│   ├── Dockerfile.dev         # 开发容器
│   └── Dockerfile             # 生产镜像（多阶段构建）
├── docker/                    # 基础设施配置
│   ├── mysql/conf.d/          # MySQL 自定义配置
│   ├── redis/                 # Redis 配置
│   └── traefik/               # 生产 Traefik 配置
├── docs/                      # 项目文档
├── docker-compose.yml         # 开发环境编排
├── docker-compose.prod.yml    # 生产环境编排
├── .env.example               # 环境变量模板
└── Makefile                   # 快捷命令
```

---

## 🔧 开发指南

### IDE 调试

**后端 (IntelliJ IDEA)**:
1. `Run → Edit Configurations → + Remote JVM Debug`
2. 设置 Host: `localhost`, Port: `5005`
3. 启动 Docker 后连接即可断点调试

**前端 (VSCode)**:
- 使用 `.vscode/launch.json` 配置，attach 到 Node.js 调试端口

### 开发工作流

```
1. 后端定义 API → SpringDoc 自动生成 Swagger 文档
2. 前端根据 Swagger 文档定义 TypeScript 类型
3. 前端实现 API 调用层 (ApiClient + SWR)
4. 联调测试 → 修复问题
5. 集成测试通过 → 合并代码
```

详见 [08-frontend-backend-integration.md](docs/08-frontend-backend-integration.md)

### CI 质量门禁

当前仓库默认使用 GitHub Actions 三段式门禁（全部通过才允许合并）：

1. `frontend-quality`: `npm ci` + `npm run lint` + `npm run build`
2. `backend-quality`: `./mvnw -B test`
3. `docker-smoke`: `docker compose config` + 生产镜像构建 smoke test

同一分支重复推送会自动取消旧流水线（`concurrency.cancel-in-progress: true`），避免无效排队。

### 分层约束

- `frontend/src/app` 仅放页面与布局，不放业务请求逻辑
- `frontend/src/components/ui` 仅放 shadcn 原子组件，不放业务组件
- 业务 hooks/types 优先放 `frontend/src/features/*`
- 后端 `common` 作为通用层，替代旧 `util`

---

## 🌐 生产部署

生产环境使用 Traefik 作为反向代理，支持自动 HTTPS:

```bash
# 1. 创建生产环境变量
cp .env.example .env.prod
# 编辑 .env.prod，设置所有生产密钥

# 2. 构建并启动
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# 3. 版本更新 (零停机滚动更新)
git pull origin main
docker compose -f docker-compose.prod.yml build frontend backend
docker compose -f docker-compose.prod.yml up -d --no-deps frontend backend
```

详见 [05-production-deploy.md](docs/05-production-deploy.md)

---

## 🗄️ 数据库

### 核心表

| 表 | 说明 |
|----|------|
| `user` | 用户 (支持 USER / ADMIN 角色) |
| `post` | 文章 (MDX 内容，支持草稿/发布状态) |
| `category` | 分类 |
| `tag` | 标签 |
| `post_tag` | 文章-标签关联 |
| `comment` | 评论 (支持嵌套回复) |
| `operation_log` | 操作审计日志 |

数据库结构通过 **Flyway** 管理版本化迁移脚本，详见 [06-database-design.md](docs/06-database-design.md)

### 缓存策略

```
请求 → Caffeine L1 (JVM 内存, <1ms)
       ↓ MISS
       Redis L2 (网络 IO, <5ms)
       ↓ MISS
       MySQL L3 (磁盘 IO, <50ms)
       ↑ 回填 L2 & L1
```

阅读量/点赞数通过 Redis `INCR` 原子计数，定时任务每 5 分钟回写 MySQL。

---

## 🔐 认证与安全

| 机制 | 说明 |
|------|------|
| **JWT** | Access Token (1h) + Refresh Token (7d) |
| **Token 黑名单** | 登出时写入 Redis，TTL = Token 剩余有效期 |
| **密码** | BCrypt (强度因子 12) |
| **RBAC** | 基于角色的权限控制 (USER / ADMIN) |
| **容器安全** | 非 root 用户运行，无硬编码密钥 |

---

## 📚 完整文档

| 文档 | 内容 |
|------|------|
| [00-架构概览](docs/00-architecture-overview.md) | 系统定位、架构图、技术栈全景 |
| [架构契约](docs/architecture-contract.md) | 前后端分层职责、依赖方向、禁止项（Agent 首读） |
| [01-前端技术栈](docs/01-frontend-stack.md) | Next.js、Tailwind v4、shadcn/ui、MDX |
| [02-后端技术栈](docs/02-backend-stack.md) | Spring Boot、MyBatis-Plus、Security |
| [03-基础设施](docs/03-infrastructure.md) | MySQL、Redis、Meilisearch、MinIO |
| [04-Docker 开发](docs/04-docker-dev-guide.md) | 容器化开发、热重载、IDE 调试 |
| [05-生产部署](docs/05-production-deploy.md) | 多阶段构建、Traefik、备份、监控 |
| [06-数据库设计](docs/06-database-design.md) | ER 模型、索引、Flyway 迁移规范 |
| [07-API 设计](docs/07-api-design.md) | RESTful 约定、错误码、接口清单 |
| [08-前后端联调](docs/08-frontend-backend-integration.md) | 接口对接、跨域、环境变量 |
| [09-数据存储矩阵](docs/09-data-storage-matrix.md) | 各类数据的存储选型与读写策略 |
| [10-MVP需规说明](docs/10-mvp-requirements-spec.md) | MVP 功能需求、非功能需求、验收与追踪矩阵 |

---

## 📄 License

暂无 (All Rights Reserved)
