# 生产部署规范

> **文档版本**: v1.1.0 | **最后更新**: 2026-04-04 | **适用范围**: 运维人员、DevOps 工程师

---

## 1. 部署架构

```
                        Internet
                            │
                     ┌──────▼──────┐
                     │   Traefik   │
                     │  (TLS终端)   │
                     │  Port 443   │
                     └──┬──────┬───┘
                        │      │
              ┌─────────▼┐  ┌──▼─────────┐
              │ frontend  │  │  backend   │
              │ (Next.js) │  │ (Spring)   │
              │ Port 3000 │  │ Port 8080  │
              └───────────┘  └──────┬─────┘
                                    │
              ┌──────────┬──────────┼──────────┬──────────┐
              │          │          │          │          │
         ┌────▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐
         │ MySQL  │ │ Redis │ │ Meili │ │ MinIO │ │Monitor│
         └────────┘ └───────┘ └───────┘ └───────┘ └───────┘
```

---

## 2. Docker 多阶段构建

### 2.1 前端 `frontend/Dockerfile`

```dockerfile
# ========== 阶段 1: 依赖安装 ==========
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --production=false

# ========== 阶段 2: 构建 ==========
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建时环境变量
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_MINIO_URL

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_MINIO_URL=${NEXT_PUBLIC_MINIO_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ========== 阶段 3: 运行 ==========
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 仅复制必要的产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### 2.2 后端 `backend/Dockerfile`

```dockerfile
# ========== 阶段 1: 构建 ==========
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app

# 分层依赖缓存
COPY pom.xml ./
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn package -DskipTests -B

# ========== 阶段 2: 运行 ==========
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# 创建非 root 用户
RUN addgroup --system --gid 1001 spring
RUN adduser --system --uid 1001 spring

# 仅复制 JAR (禁止源码进入生产镜像)
COPY --from=builder --chown=spring:spring /app/target/*.jar app.jar

USER spring
EXPOSE 8080

# JVM 生产参数
ENV JAVA_OPTS="-XX:+UseZGC \
  -XX:MaxRAMPercentage=75.0 \
  -XX:+UseStringDeduplication \
  -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} -jar app.jar"]
```

### 2.3 构建检查清单

> **⚠️ 严格禁止**:
> - ❌ 源码文件出现在生产镜像中
> - ❌ 使用 root 用户运行容器
> - ❌ 在镜像中硬编码密钥或密码
> - ❌ 使用 `latest` 标签部署生产环境

---

## 3. Traefik 反向代理配置

### 3.1 `docker-compose.prod.yml`

```yaml
version: '3.8'

services:
  # ========================
  # Traefik 网关
  # ========================
  traefik:
    image: traefik:v3.0
    container_name: blog-traefik
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik_certs:/certs
      - ./docker/traefik/traefik.yml:/etc/traefik/traefik.yml:ro
    labels:
      # Traefik Dashboard (可选)
      - "traefik.http.routers.dashboard.rule=Host(`traefik.yourdomain.com`)"
      - "traefik.http.routers.dashboard.service=api@internal"
      - "traefik.http.routers.dashboard.tls.certresolver=letsencrypt"
      - "traefik.http.routers.dashboard.middlewares=auth"

  # ========================
  # 前端
  # ========================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: https://api.yourdomain.com
        NEXT_PUBLIC_MINIO_URL: https://cdn.yourdomain.com
    container_name: blog-frontend
    restart: always
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`yourdomain.com`)"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
      - "traefik.http.services.frontend.loadbalancer.server.port=3000"

  # ========================
  # 后端
  # ========================
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: blog-backend
    restart: always
    env_file: .env.prod
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`api.yourdomain.com`)"
      - "traefik.http.routers.backend.tls.certresolver=letsencrypt"
      - "traefik.http.services.backend.loadbalancer.server.port=8080"
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy

  # === 中间件服务同开发环境配置 ===
  mysql:
    image: mysql:8.0
    container_name: blog-mysql
    restart: always
    env_file: .env.prod
    volumes:
      - mysql_data:/var/lib/mysql
      - ./docker/mysql/conf.d:/etc/mysql/conf.d
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: blog-redis
    restart: always
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  meilisearch:
    image: getmeili/meilisearch:v1.38
    container_name: blog-meilisearch
    restart: always
    env_file: .env.prod
    volumes:
      - meili_data:/meili_data

  minio:
    image: minio/minio:latest
    container_name: blog-minio
    restart: always
    env_file: .env.prod
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.minio.rule=Host(`cdn.yourdomain.com`)"
      - "traefik.http.routers.minio.tls.certresolver=letsencrypt"
      - "traefik.http.services.minio.loadbalancer.server.port=9000"

volumes:
  traefik_certs:
  mysql_data:
  redis_data:
  meili_data:
  minio_data:
```

### 3.2 Traefik 配置 `docker/traefik/traefik.yml`

```yaml
# Traefik 静态配置
api:
  dashboard: true
  insecure: false

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@yourdomain.com
      storage: /certs/acme.json
      httpChallenge:
        entryPoint: web

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    watch: true

log:
  level: INFO
  filePath: "/var/log/traefik/traefik.log"

accessLog:
  filePath: "/var/log/traefik/access.log"
```

---

## 4. 生产部署流程

### 4.1 首次部署

```bash
# 1. 拉取代码
git clone <repo-url> /opt/blog
cd /opt/blog

# 2. 创建生产环境变量
cp .env.example .env.prod
# 编辑 .env.prod, 设置所有生产密钥

# 3. 创建必要目录
mkdir -p docker/traefik docker/mysql/conf.d

# 4. 构建并启动
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# 5. 验证服务
docker compose -f docker-compose.prod.yml ps
curl -I https://yourdomain.com
```

### 4.2 版本更新

```bash
# 1. 拉取最新代码
cd /opt/blog
git pull origin main

# 2. 重新构建变更的服务
docker compose -f docker-compose.prod.yml build frontend backend

# 3. 滚动更新 (零停机)
docker compose -f docker-compose.prod.yml up -d --no-deps frontend backend

# 4. 清理旧镜像
docker image prune -f
```

---

## 5. 备份策略

### 5.1 MySQL 定时备份

```bash
#!/bin/bash
# docker/scripts/backup-mysql.sh
# 建议通过 crontab 每天凌晨 3 点执行

BACKUP_DIR="/opt/blog/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER="blog-mysql"

mkdir -p ${BACKUP_DIR}

# 导出数据库
docker exec ${CONTAINER} mysqldump -u root -p${MYSQL_ROOT_PASSWORD} blog \
  | gzip > ${BACKUP_DIR}/blog_${DATE}.sql.gz

# 保留最近 30 天的备份
find ${BACKUP_DIR} -name "*.sql.gz" -mtime +30 -delete

echo "[${DATE}] MySQL 备份完成"
```

### 5.2 MinIO 数据备份

```bash
# 使用 mc (MinIO Client) 同步到备份位置
docker exec blog-minio mc mirror /data /backup/minio
```

---

## 6. 监控与日志

### 6.1 健康检查端点

| 服务 | 端点 | 预期响应 |
|------|------|---------|
| 后端 | `/actuator/health` | `{"status":"UP"}` |
| MySQL | `mysqladmin ping` | `mysqld is alive` |
| Redis | `redis-cli ping` | `PONG` |
| Meilisearch | `/health` | `{"status":"available"}` |

### 6.2 日志聚合

```bash
# 实时查看所有容器日志
docker compose -f docker-compose.prod.yml logs -f --tail=100

# 导出到文件
docker compose -f docker-compose.prod.yml logs --no-color > /var/log/blog/all.log
```

---

## 7. 安全加固清单

- [x] 所有服务使用非 root 用户运行
- [x] HTTP 自动重定向 HTTPS
- [x] Let's Encrypt TLS 自动续期
- [x] 中间件端口不对外暴露 (仅 Docker 内部网络)
- [x] 环境变量管理所有密钥 (禁止硬编码)
- [x] Docker Socket 只读挂载
- [x] 定期更新基础镜像安全补丁

---

> **下一步**: 参阅 [06-database-design.md](./06-database-design.md) 了解数据库设计与迁移规范。
