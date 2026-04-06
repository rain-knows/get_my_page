# 博客系统 — 总体架构概览

> **文档版本**: v1.2.0  
> **最后更新**: 2026-04-06  
> **适用范围**: 全体开发人员、运维人员、架构评审人员

---

## 1. 系统定位

本系统是一套面向 **内容创作者** 与 **读者** 的现代化博客平台，核心目标为：

| 目标维度 | 具体指标 |
|---------|---------|
| **极致性能** | 首屏加载 < 1s (SSR/SSG)，API P99 < 50ms |
| **强 SEO** | 服务端渲染、结构化数据、Open Graph 完整覆盖 |
| **高可维护** | 容器化部署、数据库版本控制、自动化 CI/CD |
| **扩展能力** | MDX 自定义组件、插件化架构、多级缓存策略 |

---

## 2. 架构总览图

```
┌─────────────────────────────────────────────────────────────────────┐
│                        客户端 (Browser / App)                        │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ HTTPS
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Traefik (反向代理 / TLS 终端)                     │
│            自动 Let's Encrypt 证书 · Docker Label 服务发现              │
└──────────┬────────────────────────────────┬─────────────────────────┘
           │                                │
           ▼                                ▼
┌─────────────────────┐        ┌──────────────────────────┐
│   Next.js 前端容器    │        │  Spring Boot 后端容器       │
│   (SSR / SSG / ISR)  │        │  (RESTful API Server)     │
│   Port: 3000         │◄──────►│  Port: 8080               │
└─────────────────────┘        └────────┬─────────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           │                            │                            │
           ▼                            ▼                            ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   MySQL 8.0+     │      │   Redis 7.0+     │      │  Meilisearch     │
│   核心数据持久化   │      │   二级缓存/计数   │      │  全文检索引擎     │
└──────────────────┘      └──────────────────┘      └──────────────────┘
                                                             
                               ┌──────────────────┐
                               │   MinIO           │
                               │   对象存储 (S3)    │
                               └──────────────────┘
```

---

## 3. 技术栈全景

### 3.1 前端层

| 技术 | 版本 | 职责 |
|------|------|------|
| Next.js (App Router) | =16.2.2 | SSR/SSG/ISR 元框架 |
| React | =19.2.4 | 视图层框架 |
| TypeScript | =5.x | 强类型语言 |
| Tailwind CSS | =4.x | 原子化样式引擎 (CSS-first, Oxide 引擎) |
| shadcn/ui (CLI) | =4.x | 无头化 UI 组件库 |
| Motion (原 Framer Motion) | =12.x | 动画与过渡 |
| Zustand | =5.x | 全局 UI 状态管理 |
| SWR | =2.x | 客户端数据请求与缓存 |
| MDX | =3.x | 增强型 Markdown 内容引擎 |

### 3.2 后端层

| 技术 | 版本 | 职责 |
|------|------|------|
| Spring Boot | =3.5.13 | RESTful API 核心框架 |
| Java | =21 LTS | 虚拟线程高并发运行时 |
| Flyway | =10.20.x | 数据库结构迁移管控 (由 BOM 管理) |
| MyBatis-Plus | =3.5.16 | ORM / 数据持久化 |
| Caffeine | =3.x | JVM 本地一级缓存 |
| Spring Security | =6.5.x | RBAC 身份与权限 (由 BOM 管理) |
| JWT (jjwt) | =0.12.x | 无状态认证令牌 |
| SpringDoc | =2.x | OpenAPI 3.0 文档生成 |

### 3.3 基础设施层

| 技术 | 版本 | 职责 |
|------|------|------|
| MySQL | =8.0 | 关系型数据持久化 |
| Redis | =7-alpine | 分布式缓存与原子计数 |
| Meilisearch | =v1.38 | 全文搜索引擎 |
| MinIO | =latest | S3 兼容对象存储 |
| Docker | =27.x | 容器化封装 |
| Traefik | =3.x | 反向代理与自动 TLS |

---

## 4. 数据流转路径

### 4.1 读者访问文章（典型读路径）

```
浏览器请求 → Traefik → Next.js (SSR)
                          │
                          ├─ 1. 调用 Spring Boot API 获取文章数据
                          │       │
                          │       ├─ Caffeine L1 缓存命中? → 直接返回
                          │       ├─ Redis L2 缓存命中? → 回填 L1 → 返回
                          │       └─ MySQL 查询 → 回填 L2 & L1 → 返回
                          │
                          ├─ 2. Redis INCR 文章阅读计数
                          │
                          └─ 3. SSR 渲染 HTML → 返回浏览器
```

### 4.2 管理员发布文章（典型写路径）

```
管理后台提交 → Traefik → Spring Boot API
                            │
                            ├─ 1. Spring Security JWT 鉴权
                            ├─ 2. MyBatis-Plus 写入 MySQL
                            ├─ 3. 失效 Caffeine & Redis 相关缓存
                            ├─ 4. MinIO 上传封面图/插图
                            └─ 5. Meilisearch 增量索引更新
```

### 4.3 读者搜索文章

```
搜索请求 → Next.js 客户端组件 (SWR)
              │
              └─ Spring Boot → Meilisearch 查询
                                   │
                                   └─ 返回高亮结果 + 容错建议
```

---

## 5. 模块划分

```
get_my_page/
├── docs/                    # 项目文档
├── frontend/                # Next.js 前端项目
│   ├── src/
│   │   ├── app/             # App Router 页面与布局
│   │   ├── components/      # 可复用 UI 组件
│   │   ├── lib/             # 工具函数与 API 封装
│   │   ├── stores/          # Zustand 状态仓库
│   │   ├── types/           # TypeScript 类型定义
│   │   └── styles/          # 全局样式与 Tailwind 配置
│   ├── public/              # 静态资源
│   ├── next.config.js
│   ├── tsconfig.json
│   └── Dockerfile
├── backend/                 # Spring Boot 后端项目
│   ├── src/main/java/
│   │   └── com/getmypage/blog/
│   │       ├── config/      # Spring 配置类
│   │       ├── controller/  # REST 控制器
│   │       ├── service/     # 业务服务层
│   │       ├── mapper/      # MyBatis Mapper 接口
│   │       ├── model/       # 实体与 DTO
│   │       ├── security/    # Security & JWT 组件
│   │       └── util/        # 工具类
│   ├── src/main/resources/
│   │   ├── db/migration/    # Flyway 迁移脚本
│   │   └── application.yml
│   ├── pom.xml
│   └── Dockerfile
├── docker-compose.yml       # 开发环境编排
├── docker-compose.prod.yml  # 生产环境编排
└── .env.example             # 环境变量模板
```

---

## 6. 环境规划

| 环境 | 用途 | 前端渲染模式 | 数据库 | 特点 |
|------|------|-------------|--------|------|
| **local** | 本地开发 | SSR (dev server) | Docker MySQL | 热重载、DEBUG 日志 |
| **staging** | 集成测试 | SSR | Docker MySQL | 模拟生产环境 |
| **production** | 线上生产 | SSR + ISR | Docker MySQL (主从) | Traefik TLS、多级缓存 |

---

## 7. 文档索引

| 文档编号 | 文档名称 | 主要内容 |
|---------|---------|---------|
| 00 | 总体架构概览 (本文) | 系统定位、架构图、技术栈全景 |
| 01 | 前端技术栈规范 | Next.js、TypeScript、Tailwind CSS 等前端技术细节 |
| 02 | 后端技术栈规范 | Spring Boot、MyBatis-Plus、Spring Security 等后端技术细节 |
| 03 | 基础设施与中间件规范 | MySQL、Redis、Meilisearch、MinIO 配置与使用 |
| 04 | 容器化开发环境指南 | Docker Compose 开发、调试、热重载 |
| 05 | 生产部署规范 | Docker 多阶段构建、Traefik 配置、监控与日志 |
| 06 | 数据库设计与迁移规范 | ER 模型、Flyway 迁移脚本编写规范 |
| 07 | API 接口设计规范 | RESTful 约定、错误码、分页与认证 |
| 08 | 前后端联调规范 | 接口对接、跨域配置、环境变量 |

---

> **下一步**: 请参阅 [01-frontend-stack.md](./01-frontend-stack.md) 了解前端技术栈详细规范。
