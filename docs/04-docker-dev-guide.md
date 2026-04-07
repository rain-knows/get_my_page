# 容器化开发环境指南

> **文档版本**: v1.1.0 | **最后更新**: 2026-04-04 | **适用范围**: 全体开发人员

---

## 1. 开发环境总览

整个开发流程 **全程容器化**，开发者只需安装 Docker 和 IDE 即可开始工作。

### 1.1 前置要求

| 工具 | 最低版本 | 说明 |
|------|---------|------|
| Docker Engine | 24.0+ | 容器运行时 |
| Docker Compose | v2.20+ | 多容器编排 |
| IDE | 任意 | 推荐 VSCode / IntelliJ IDEA |
| Git | 2.40+ | 版本控制 |

### 1.2 开发架构

```
开发者本机
├── IDE / 编辑器
│   ├── frontend/ 源码 → 挂载进 Next.js 容器 (热重载)
│   └── backend/ 源码  → 挂载进 Spring Boot 容器 (热重载)
│
└── Docker Compose (开发模式)
    ├── frontend   (Next.js dev server, port 3000)
    ├── backend    (Spring Boot dev, port 8080)
    ├── mysql      (port 3306)
    ├── redis      (port 6379)
    ├── meilisearch (port 7700)
    └── minio      (port 9000/9001)
```

---

## 2. 环境变量配置

### 2.1 `.env.example` 模板

```bash
# ================================
# 博客系统 - 环境变量配置模板
# 复制为 .env 并填写实际值
# ================================

# --- MySQL ---
MYSQL_ROOT_PASSWORD=root_password_change_me
MYSQL_DB=blog
MYSQL_USER=bloguser
MYSQL_PASSWORD=blog_password_change_me

# --- Redis ---
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# --- JWT ---
JWT_SECRET=your_jwt_secret_key_at_least_32_chars

# --- MinIO ---
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin_password_change_me
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin_password_change_me
MINIO_BUCKET=blog-assets

# --- Meilisearch ---
MEILI_MASTER_KEY=meili_master_key_change_me
MEILI_HOST=http://meilisearch:7700
MEILI_API_KEY=meili_master_key_change_me

# --- Next.js ---
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_MINIO_URL=http://localhost:9000
```

### 2.2 初始化步骤

```bash
# 1. 克隆项目
git clone <repo-url> get_my_page
cd get_my_page

# 2. 创建本地环境变量文件
cp .env.example .env
# 编辑 .env 填写实际密钥

# 3. 启动所有服务
docker compose up -d

# 4. 查看服务状态
docker compose ps

# 5. 查看日志
docker compose logs -f backend
docker compose logs -f frontend
```

---

## 3. Docker Compose 开发配置

### 3.1 `docker-compose.yml` (开发环境)

```yaml
version: '3.8'

services:
  # ========================
  # 前端 - Next.js 开发服务器
  # ========================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: blog-frontend-dev
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      # 源码挂载 (热重载)
      - ./frontend:/app
      # 排除 node_modules (使用容器内的)
      - /app/node_modules
      - /app/.next
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://localhost:8080/api
      - NEXT_PUBLIC_MINIO_URL=http://localhost:9000
    depends_on:
      backend:
        condition: service_healthy

  # ========================
  # 后端 - Spring Boot 开发服务器
  # ========================
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: blog-backend-dev
    restart: unless-stopped
    ports:
      - "8080:8080"
      - "5005:5005"  # 远程调试端口
    volumes:
      # 源码挂载
      - ./backend:/app
      # Maven 本地仓库缓存
      - maven_cache:/root/.m2
    environment:
      - SPRING_PROFILES_ACTIVE=dev
      - MYSQL_HOST=mysql
      - MYSQL_DB=${MYSQL_DB:-blog}
      - MYSQL_USER=${MYSQL_USER:-bloguser}
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - JWT_SECRET=${JWT_SECRET}
      - MINIO_ENDPOINT=http://minio:9000
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - MEILI_HOST=http://meilisearch:7700
      - MEILI_API_KEY=${MEILI_API_KEY}
      # 启用远程调试
      - JAVA_OPTS=-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 15s
      timeout: 5s
      retries: 10
      start_period: 30s

  # ========================
  # MySQL 8.0
  # ========================
  mysql:
    image: mysql:8.0
    container_name: blog-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DB:-blog}
      MYSQL_USER: ${MYSQL_USER:-bloguser}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
      TZ: Asia/Shanghai
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./docker/mysql/conf.d:/etc/mysql/conf.d
    command: >
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_unicode_ci
      --max-connections=200
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ========================
  # Redis 7
  # ========================
  redis:
    image: redis:7-alpine
    container_name: blog-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ========================
  # Meilisearch
  # ========================
  meilisearch:
    image: getmeili/meilisearch:v1.38
    container_name: blog-meilisearch
    restart: unless-stopped
    environment:
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
      MEILI_ENV: development
      MEILI_NO_ANALYTICS: true
    ports:
      - "7700:7700"
    volumes:
      - meili_data:/meili_data

  # ========================
  # MinIO
  # ========================
  minio:
    image: minio/minio:latest
    container_name: blog-minio
    restart: unless-stopped
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    ports:
      - "9000:9000"
      - "9001:9001"  # Web Console
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"

volumes:
  mysql_data:
  redis_data:
  meili_data:
  minio_data:
  maven_cache:
```

---

## 4. 开发容器 Dockerfile

### 4.1 前端 `frontend/Dockerfile.dev`

```dockerfile
FROM node:20-alpine

WORKDIR /app

# 安装依赖
COPY package.json package-lock.json* ./
RUN npm ci

# 源码通过 volume 挂载
# 启动开发服务器
CMD ["npm", "run", "dev"]
```

### 4.2 后端 `backend/Dockerfile.dev`

```dockerfile
FROM maven:3.9-eclipse-temurin-21

WORKDIR /app

# 预下载依赖（利用缓存层）
COPY pom.xml ./
RUN mvn dependency:go-offline -B

# 源码通过 volume 挂载
# 启用 Spring Boot DevTools 热重载
CMD ["mvn", "spring-boot:run", \
     "-Dspring-boot.run.jvmArguments=${JAVA_OPTS}"]
```

---

## 5. 日常开发命令速查

| 操作 | 命令 |
|------|------|
| 启动全部服务 | `docker compose up -d` |
| 仅启动中间件 | `docker compose up -d mysql redis meilisearch minio` |
| 查看全部日志 | `docker compose logs -f` |
| 查看后端日志 | `docker compose logs -f backend` |
| 重启后端 | `docker compose restart backend` |
| 重建前端镜像 | `docker compose build --no-cache frontend` |
| 进入 MySQL CLI | `docker exec -it blog-mysql mysql -u root -p` |
| 进入 Redis CLI | `docker exec -it blog-redis redis-cli` |
| 停止全部服务 | `docker compose down` |
| 清理数据卷 | `docker compose down -v` |

---

## 6. IDE 调试配置

### 6.1 IntelliJ IDEA 远程调试 (后端)

1. `Run → Edit Configurations → + Remote JVM Debug`
2. Host: `localhost`, Port: `5005`
3. 启动 Docker 容器后连接即可断点调试

### 6.2 VSCode 前端调试

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js 调试",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "restart": true,
      "sourceMaps": true
    }
  ]
}
```

---

## 7. 常见问题排查

| 问题 | 排查方法 |
|------|---------|
| 前端热重载不生效 | 检查 volume 挂载是否正确，确认 `.next` 被排除 |
| 新增前端依赖后容器报 `module not found` | 重启前端触发自动依赖同步，或执行 `make sync-fe` |
| 后端启动失败 | `docker compose logs backend` 查看错误，通常是数据库连接问题 |
| MySQL 连接拒绝 | 等待 healthcheck 通过，或检查密码配置 |
| 端口冲突 | `lsof -i :3000` 检查占用进程 |
| Maven 依赖下载慢 | 配置阿里云镜像加速 |

---

> **下一步**: 参阅 [05-production-deploy.md](./05-production-deploy.md) 了解生产部署规范。
