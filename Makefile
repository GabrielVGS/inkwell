.PHONY: dev build lint db-up db-down db-reset db-setup db-push db-generate db-migrate db-studio setup

# Development
dev:
	npm run dev

build:
	npm run build

lint:
	npm run lint

# Database
db-up:
	docker compose up -d

db-down:
	docker compose down

db-reset:
	docker compose down -v
	docker compose up -d
	@sleep 2
	npm run db:setup
	npm run db:push

db-setup:
	npm run db:setup

db-push:
	npm run db:push

db-generate:
	npm run db:generate

db-migrate:
	npm run db:migrate

db-studio:
	npm run db:studio

# Full setup from scratch
setup:
	npm install
	docker compose up -d
	@sleep 2
	npm run db:setup
	npm run db:push
	ollama pull gemma3:4b
	ollama pull nomic-embed-text
	@echo "Done! Run 'make dev' to start."
