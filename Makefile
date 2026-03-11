up:
	docker compose up -d

migrate:
	npm run db:migrate

setup:
	ollama pull nomic-embed-text

dev:
	npm run dev