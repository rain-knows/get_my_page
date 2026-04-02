# 博客系统初始化指南

这个仓库当前用于搭建一个前后端分离博客系统（Nuxt 4 + Spring Boot）。

- 前端：Nuxt 4（Vue 3）+ Pinia + Tailwind + UI 组件
- 后端：Spring Boot + Spring Security + JWT + MyBatis-Plus + MySQL + Redis
- 部署：Docker + Docker Compose（后续可接 Nginx）

## 1. 快速开始

1. 复制环境变量模板：

```bash
cp .env.example .env
```

2. 先启动基础设施（MySQL + Redis）：

```bash
docker compose up -d mysql redis
```

3. 查看服务状态：

```bash
docker compose ps
```

4. 查看详细初始化步骤（含前后端脚手架命令）：

```bash
cat docs/project-init.md
```

## 2. 常用命令

启动基础设施：

```bash
docker compose up -d
```

停止并删除容器（保留数据卷）：

```bash
docker compose down
```

停止并删除容器 + 数据卷（危险操作，会清库）：

```bash
docker compose down -v
```

开发模式（在基础设施之外尝试容器内跑前后端，需先初始化代码）：

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml --profile app up -d
```

## 3. 目录说明

```text
.
├── backend/                  # Spring Boot 项目目录
├── frontend/                 # Nuxt 项目目录
├── docs/
│   └── project-init.md       # 详细初始化文档
├── .env.example              # 环境变量模板
├── docker-compose.yml        # 基础设施（MySQL + Redis）
├── docker-compose.dev.yml    # 开发模式扩展
└── docker-compose.prod.yml   # 生产模式模板
```
