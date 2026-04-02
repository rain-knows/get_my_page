# 项目初始化文档（WSL）

本文目标：让你在一个全新目录里，按顺序完成博客系统初始化，先跑通基础设施，再接入前后端。

## 1. 前置环境

建议版本：

- Docker Desktop（开启 WSL2 集成）
- Docker Compose v2+
- Node.js 20+（建议 22）
- Java 21
- Maven 3.9+（或使用 Spring Boot 自带 `mvnw`）
- Git

快速检查：

```bash
docker -v
docker compose version
node -v
java -version
mvn -v
```

## 2. 初始化环境变量

在项目根目录执行：

```bash
cp .env.example .env
```

然后按需修改 `.env`（最少改密码和 JWT 密钥）。

## 3. 先启动 MySQL 和 Redis

```bash
docker compose up -d mysql redis
docker compose ps
```

验证：

```bash
docker compose logs -f mysql
docker compose logs -f redis
```

看到 `ready for connections` / `Ready to accept connections` 基本就绪。

## 4. 初始化前端（Nuxt 4）

在项目根目录执行：

```bash
npx nuxi@latest init frontend
cd frontend
corepack enable
pnpm install
pnpm add @pinia/nuxt @nuxt/ui
pnpm add -D @tailwindcss/postcss
```

如果 `nuxi init` 因网络无法访问 `raw.githubusercontent.com` 失败，可直接使用仓库内已有 `frontend/` 初始化文件，然后执行：

```bash
cd frontend
corepack enable
pnpm install
pnpm approve-builds --all
```

更新 `nuxt.config.ts`（示例）：

```ts
export default defineNuxtConfig({
  ssr: false,
  modules: ['@pinia/nuxt', '@nuxt/ui'],
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api',
    },
  },
})
```

新增 `postcss.config.mjs`：

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

本地启动前端：

```bash
pnpm dev --host 0.0.0.0 --port 3000
```

## 5. 初始化后端（Spring Boot）

方式一（推荐）：用 IDE 的 Spring Initializr 新建到 `backend/`。

建议基础依赖：

- Spring Web
- Spring Security
- Spring Validation
- Spring Data Redis
- MySQL Driver
- Lombok
- Actuator

方式二（命令行）：在浏览器打开 [start.spring.io](https://start.spring.io) 下载后解压到 `backend/`。

然后在 `backend/pom.xml` 增加 MyBatis-Plus 与 JWT 依赖（示例）：

```xml
<dependencies>
  <dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
    <version>3.5.12</version>
  </dependency>

  <dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.7</version>
  </dependency>
  <dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.7</version>
    <scope>runtime</scope>
  </dependency>
  <dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.7</version>
    <scope>runtime</scope>
  </dependency>
</dependencies>
```

新增 `backend/src/main/resources/application-dev.yml`（示例）：

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/${MYSQL_DATABASE:blog_db}?useUnicode=true&characterEncoding=UTF-8&serverTimezone=UTC
    username: ${MYSQL_USER:blog_user}
    password: ${MYSQL_PASSWORD:blog_password}
  data:
    redis:
      host: localhost
      port: 6379
      password: ${REDIS_PASSWORD:blog_redis_password}

mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true

app:
  jwt:
    secret: ${JWT_SECRET:change-me-in-env}
    expire-seconds: 7200
```

本地启动后端：

```bash
cd backend
./mvnw spring-boot:run
```

## 6. Docker Compose 使用方式

- `docker-compose.yml`：只含 MySQL、Redis，适合初始化阶段。
- `docker-compose.dev.yml`：增加前后端开发容器（需先初始化代码）。
- `docker-compose.prod.yml`：生产模板（镜像名称、端口、环境变量可按实际替换）。

示例：

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml --profile app up -d
```

## 7. 推荐下一步（初始化完成后）

1. 先做后端最小闭环：`auth/login` + JWT 生成/校验。
2. 前端建立 Pinia `auth` store，完成登录态持久化。
3. 增加数据库迁移工具（Flyway 或 Liquibase）管理表结构。
4. 补一个 `health` 页面 + `/actuator/health` 联调验证。
