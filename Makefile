.PHONY: dev build down up logs help clean

# 加载环境变量
ifneq (,$(wildcard ./.env))
    include .env
    export
endif

help: ## 显示帮助信息
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

init: ## 初始化 .env 文件
	cp .env.example .env
	@echo "已创建 .env 文件，请根据你的实际情况修改配置。"

up: ## 启动所有服务（后台运行）
	docker compose up -d

dev: ## 启动所有服务和数据库
	docker compose up -d
	docker compose logs -f frontend backend

down: ## 停止所有服务
	docker compose down

clean: ## 停止所有服务并删除数据卷（数据会丢失！）
	docker compose down -v

logs: ## 查看所有服务日志
	docker compose logs -f

logs-be: ## 查看后端服务日志
	docker compose logs -f backend

logs-fe: ## 查看前端服务日志
	docker compose logs -f frontend

restart-be: ## 重启后端服务
	docker compose restart backend

restart-fe: ## 重启前端服务
	docker compose restart frontend

build: ## 不使用缓存重新构建所有镜像
	docker compose build --no-cache

mysql-cli: ## 进入 MySQL 命令行
	docker exec -it blog-mysql mysql -u root -p$(MYSQL_ROOT_PASSWORD)

redis-cli: ## 进入 Redis 命令行
	docker exec -it blog-redis redis-cli
