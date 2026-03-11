<p align="center">
  <img src="logo.png" width="280" alt="Inkwell" />
</p>

<h1 align="center">Inkwell</h1>

<p align="center">
  <em>Diario pessoal com reflexao guiada por IA</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/LangChain-LangGraph-blue?logo=langchain" alt="LangChain" />
  <img src="https://img.shields.io/badge/Ollama-local%20AI-green" alt="Ollama" />
  <img src="https://img.shields.io/badge/PostgreSQL-pgvector-336791?logo=postgresql" alt="PostgreSQL" />
</p>

---

Inkwell e um diario reflexivo onde voce escreve livremente sobre seu dia e a IA faz perguntas reflexivas, identifica padroes emocionais e conecta suas experiencias ao longo do tempo. Tudo roda localmente com modelos de IA via Ollama.

## Screenshots

<p align="center">
  <em>Landing page</em>
</p>

<img src="docs/screenshots/landing.png" width="100%" alt="Landing" />

<p align="center">
  <em>Diario — editor, lista de entradas e chat de reflexao</em>
</p>

<img src="docs/screenshots/journal.png" width="100%" alt="Journal" />

<p align="center">
  <em>Insights — graficos de humor, temas frequentes e resumo semanal</em>
</p>

<img src="docs/screenshots/insights.png" width="100%" alt="Insights" />

## Como funciona

1. **Escreva** livremente sobre seu dia no editor
2. **Analise automatica** — a IA identifica humor, nivel de energia e temas
3. **Reflexao guiada** — um chat com IA faz perguntas empaticas sobre o que voce escreveu
4. **Padroes** — acompanhe graficos de humor, temas recorrentes e sequencia de escrita
5. **Resumo semanal** — a IA gera uma analise reflexiva das suas entradas recentes
6. **Busca semantica** — encontre entradas similares usando embeddings via pgvector

## Stack

| Camada         | Tecnologia                                                |
| -------------- | --------------------------------------------------------- |
| Frontend       | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Recharts |
| IA             | LangChain.js, LangGraph.js, Ollama (local)                |
| Banco de dados | PostgreSQL 17, pgvector, Drizzle ORM                      |
| Autenticacao   | Better Auth (email/senha, sessoes)                        |
| Embeddings     | nomic-embed-text via Ollama (768 dim)                     |

## Requisitos

- Node.js 20+
- Docker (para PostgreSQL + pgvector)
- [Ollama](https://ollama.ai) instalado e rodando

## Setup

```bash
# Clone o repositorio
git clone https://github.com/GabrielVGS/inkwell.git
cd inkwell

# Setup completo (instala deps, sobe banco, baixa modelos)
make setup

# Ou passo a passo:
npm install
make db-up          # Sobe PostgreSQL com pgvector
npm run db:setup    # Habilita extensao pgvector
npm run db:push     # Aplica schema no banco
ollama pull gemma3:4b
ollama pull nomic-embed-text
```

## Configuracao

Crie um `.env.local` na raiz:

```env
# PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inkwell

# Better Auth
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:4b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
# OLLAMA_SUMMARY_MODEL=gemma3:12b  # opcional, modelo maior para resumos
```

## Uso

```bash
# Desenvolvimento
make dev

# Build de producao
make build

# Drizzle Studio (explorar banco)
make db-studio

# Resetar banco (apaga tudo e recria)
make db-reset
```

## Comandos Make

| Comando          | Descricao                          |
| ---------------- | ---------------------------------- |
| `make setup`     | Setup completo do zero             |
| `make dev`       | Inicia servidor de desenvolvimento |
| `make build`     | Build de producao                  |
| `make lint`      | Executa ESLint                     |
| `make format`    | Formata codigo com Prettier        |
| `make typecheck` | Verifica tipos com TypeScript      |
| `make knip`      | Detecta codigo morto               |
| `make check`     | Executa todas as verificacoes      |
| `make db-up`     | Sobe PostgreSQL via Docker         |
| `make db-down`   | Para PostgreSQL                    |
| `make db-reset`  | Recria banco do zero               |
| `make db-push`   | Aplica schema no banco             |
| `make db-studio` | Abre Drizzle Studio                |

## Development Tooling

O projeto inclui ferramentas de desenvolvimento automatizadas:

| Ferramenta     | Proposito                 | Comando                                   |
| -------------- | ------------------------- | ----------------------------------------- |
| **Prettier**   | Formatacao de codigo      | `npm run format` / `npm run format:check` |
| **ESLint**     | Linting + import ordering | `npm run lint`                            |
| **TypeScript** | Verificacao de tipos      | `npm run typecheck`                       |
| **Knip**       | Deteccao de codigo morto  | `npm run knip`                            |
| **Vitest**     | Testes unitarios          | `npm run test`                            |

### Pre-commit hooks

Ao commitar, **Husky** + **lint-staged** executam automaticamente:

- ESLint (com auto-fix) + Prettier em arquivos `.ts`, `.tsx`, `.mts`
- Prettier em arquivos `.json`, `.md`, `.css`, `.mjs`

### CI (GitHub Actions)

O workflow `.github/workflows/ci.yml` roda em push/PR para `main`:

1. Prettier — verificacao de formatacao
2. ESLint — linting
3. TypeScript — verificacao de tipos
4. Knip — codigo morto
5. Vitest — testes unitarios

Para rodar todas as verificacoes localmente: `npm run check` ou `make check`.

## Disclaimer

Este projeto é fornecido apenas para fins educacionais e de auto-reflexao.  
As analises e perguntas geradas pela IA nao constituem aconselhamento psicologico, medico ou terapeutico profissional.

Inkwell nao substitui acompanhamento com psicologos, psiquiatras ou outros profissionais de saude mental.  
Se voce estiver enfrentando dificuldades emocionais significativas, procure ajuda profissional qualificada.

Todo o processamento de IA neste projeto é projetado para rodar localmente, mas a seguranca e privacidade dos dados dependem da configuracao e ambiente onde o sistema esta sendo executado.

## Licenca

MIT

##

<p align="center">
  feito por Gabriel Viana ✨
</p>
