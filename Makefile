# Alert Eye Electronics — code management
#
# Node packages: pnpm   |   Local database: Docker (Postgres)
#
# This app is a single Next.js process that serves BOTH the storefront
# ("frontend") and the Payload admin + API ("backend"). `make dev` brings the
# whole local stack up: database + the frontend/backend dev server.

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
SHELL       := /bin/bash
PKG         := pnpm
DB_NAME     := alert-eye-db
DB_IMAGE    := postgres:18-alpine
DB_PORT     := 5433
DB_USER     := alerteye
DB_PASSWORD := alerteye_dev
DB_DATABASE := alerteye

# Preferred dev port. `make dev` auto-hops to the next free port if it's taken,
# and reclaims it from a stale dev server started in this repo.
PORT        ?= 3000

# Colours
CYAN  := \033[36m
BOLD  := \033[1m
RESET := \033[0m

.DEFAULT_GOAL := help
.PHONY: help dev stop install build start lint typecheck check test \
        seed migrate migrate-create types importmap \
        db-up db-down db-reset db-logs db-shell reset clean nuke

# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------
help: ## Show this help
	@printf "$(BOLD)Alert Eye Electronics$(RESET)\n\n"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| sort \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-16s$(RESET) %s\n", $$1, $$2}'

# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
dev: install db-up ## Spin up the frontend + backend app (DB + dev server, auto free port)
	@PORT=$(PORT) bash scripts/dev.sh

stop: ## Stop any dev server started from this repo
	@pids=$$(lsof -iTCP -sTCP:LISTEN -t 2>/dev/null | while read p; do \
		[ "$$(lsof -a -p $$p -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -1)" = "$(CURDIR)" ] && echo $$p; \
	done | sort -u); \
	if [ -n "$$pids" ]; then echo "Stopping $$pids"; kill $$pids 2>/dev/null || true; else echo "no dev server running"; fi

start: ## Run the production build (build first)
	@$(PKG) start

build: ## Production build (runs generate:importmap via prebuild)
	@$(PKG) build

# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------
install: ## Install Node packages (pnpm)
	@$(PKG) install

# ---------------------------------------------------------------------------
# Quality
# ---------------------------------------------------------------------------
check: typecheck lint ## Run typecheck + lint

typecheck: ## TypeScript check (no emit)
	@$(PKG) exec tsc --noEmit

lint: ## Lint with Next/ESLint
	@$(PKG) run lint

test: ## End-to-end order/payment/stock smoke test (needs DB up)
	@$(PKG) exec tsx src/seed/smoke.ts

# ---------------------------------------------------------------------------
# Payload / data
# ---------------------------------------------------------------------------
seed: db-up ## Load demo catalogue + admin user
	@$(PKG) run seed

migrate: ## Apply Payload database migrations
	@$(PKG) run migrate

migrate-create: ## Create a new Payload migration from schema changes
	@$(PKG) run migrate:create

types: ## Regenerate src/payload-types.ts
	@$(PKG) run generate:types

importmap: ## Regenerate the admin import map
	@$(PKG) run generate:importmap

# ---------------------------------------------------------------------------
# Database (Docker)
# ---------------------------------------------------------------------------
db-up: ## Start the local Postgres container (creates it if missing)
	@if [ -z "$$(docker ps -q -f name=^/$(DB_NAME)$$)" ]; then \
		if [ -n "$$(docker ps -aq -f name=^/$(DB_NAME)$$)" ]; then \
			echo "Starting existing $(DB_NAME)…"; docker start $(DB_NAME) >/dev/null; \
		else \
			echo "Creating $(DB_NAME)…"; \
			docker run -d --name $(DB_NAME) \
				-e POSTGRES_DB=$(DB_DATABASE) \
				-e POSTGRES_USER=$(DB_USER) \
				-e POSTGRES_PASSWORD=$(DB_PASSWORD) \
				-p $(DB_PORT):5432 $(DB_IMAGE) >/dev/null; \
		fi; \
		printf "Waiting for Postgres"; \
		until docker exec $(DB_NAME) pg_isready -q -U $(DB_USER) 2>/dev/null; do printf "."; sleep 1; done; \
		printf " ready\n"; \
	else \
		echo "$(DB_NAME) already running"; \
	fi

db-down: ## Stop the local Postgres container
	@docker stop $(DB_NAME) >/dev/null 2>&1 && echo "stopped $(DB_NAME)" || echo "$(DB_NAME) not running"

db-reset: ## Destroy and recreate the database, then seed
	@docker rm -f $(DB_NAME) >/dev/null 2>&1 || true
	@$(MAKE) db-up
	@$(PKG) run seed

db-logs: ## Tail Postgres logs
	@docker logs -f $(DB_NAME)

db-shell: ## Open a psql shell on the local database
	@docker exec -it $(DB_NAME) psql -U $(DB_USER) -d $(DB_DATABASE)

# ---------------------------------------------------------------------------
# Housekeeping
# ---------------------------------------------------------------------------
reset: ## Clear build caches
	@rm -rf .next
	@echo "cleared .next"

clean: reset ## reset + remove generated importmap
	@git checkout -- "src/app/(payload)/admin/importMap.js" 2>/dev/null || true

nuke: ## Remove node_modules, caches and the DB container
	@rm -rf .next node_modules
	@docker rm -f $(DB_NAME) >/dev/null 2>&1 || true
	@echo "removed node_modules, .next and $(DB_NAME)"
