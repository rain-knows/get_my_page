.PHONY: dev build down up logs help clean

# Load environment variables
ifneq (,$(wildcard ./.env))
    include .env
    export
endif

help: ## Show this help
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

init: ## Initialize copy of .env
	cp .env.example .env
	@echo ".env file created. Please update it with your own values."

up: ## Start all services in detached mode
	docker compose up -d

dev: ## Start backend and frontend along with dependencies
	docker compose up -d
	docker compose logs -f frontend backend

down: ## Stop all services
	docker compose down

clean: ## Stop all services and remove volumes (Data will be lost!)
	docker compose down -v

logs: ## Show logs of all services
	docker compose logs -f

logs-be: ## Show backend logs
	docker compose logs -f backend

logs-fe: ## Show frontend logs
	docker compose logs -f frontend

restart-be: ## Restart backend service
	docker compose restart backend

restart-fe: ## Restart frontend service
	docker compose restart frontend

build: ## Rebuild all images without cache
	docker compose build --no-cache

mysql-cli: ## Enter MySQL CLI container
	docker exec -it blog-mysql mysql -u root -p$(MYSQL_ROOT_PASSWORD)

redis-cli: ## Enter Redis CLI container
	docker exec -it blog-redis redis-cli
