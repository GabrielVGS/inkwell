# Project Improvements — Full Sweep Design

**Date**: 2026-03-11
**Scope**: Security, architecture, testing, and UI polish across the Inkwell reflective journal app
**Context**: Moderate-use app with real users. Local LLM (Ollama), PostgreSQL + pgvector, Next.js 16, React 19, LangGraph.

## Constraints & Decisions

- **LangGraph stays** — kept as foundation for future multi-step flows; clean up usage but don't remove
- **Testing**: Critical path only (~25 tests) — business logic units + API auth/validation integration tests
- **Language**: API/technical errors in English, UI-facing messages in Portuguese
- **No heavy infra**: Skip rate limiting, queue systems, caching, monitoring services for now

---

## Phase 1 — Security & Data Integrity

### 1.1 Authorization Fixes

**Problem**: `/api/reflections/[entryId]` GET and POST don't verify entry ownership — any authenticated user can access reflections for any entry by guessing the ID. `/api/entries/[id]` PATCH/DELETE silently no-op when the entry doesn't belong to the user (returns `{ ok: true }` regardless).

**Fix**:

- `GET /api/reflections/[entryId]`: call `getEntry(entryId, session.user.id)`, return 404 if not found, before fetching reflections
- `POST /api/reflections/[entryId]`: same ownership check before adding reflection
- `PATCH/DELETE /api/entries/[id]`: check affected row count after the DB operation, return 404 if 0 rows were affected

**Files**: `src/app/api/reflections/[entryId]/route.ts`, `src/app/api/entries/[id]/route.ts`

### 1.2 Input Validation with Zod

**Problem**: All API routes use raw `req.json()` with no validation. Malformed input causes silent failures or unexpected behavior.

**Fix**: Create `src/lib/validations.ts` with schemas:

```typescript
// Entry creation
entryCreateSchema = z.object({
  content: z.string().min(1).max(10000),
  analysis: moodAnalysisSchema.optional(),
});

// Reflection chat
reflectSchema = z.object({
  currentEntry: z.string().min(1),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .optional(),
});

// Monthly summary
monthlySummarySchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
});

// Entry update
entryUpdateSchema = z.object({
  content: z.string().min(1).max(10000),
});

// Mood analysis (used by /api/analyze)
analyzeSchema = z.object({
  content: z.string().min(1).max(10000),
});

// Query params (used manually)
// search: limit clamped to 1-50, query min 1 char
// mood-trends: days clamped to 1-90
```

Apply validation in each route, return 400 with Zod error messages on failure.

**Files**: `src/lib/validations.ts` (new), all API routes (including `/api/analyze`)

### 1.3 Error Handling & Logging

**Problem**: Empty `catch {}` blocks throughout. Client-side fetches don't check `res.ok`. AI failures are invisible.

**Fix**:

- Replace all empty `catch {}` with `catch (error) { console.error("context:", error) }` in:
  - `analysis-graph.ts` — JSON parsing fallback
  - `queries.ts` — embedding generation
  - `reflect/route.ts` — RAG and mood context fetches
- Add `if (!res.ok)` checks before `.json()` in:
  - `reflection-chat.tsx` — reflections load
  - `insights/page.tsx` — entries fetch
  - `journal/page.tsx` — entries fetch
- Standardize API errors: `{ error: "English message" }` for all routes. Specific Portuguese API errors to translate:
  - `monthly-summary/route.ts`: `"Sem entradas neste mes"` → `"No entries for this month"`
  - `reflect/route.ts` SSE error: `"Erro na reflexao"` → `"Reflection error"`
  - `summary/route.ts` SSE error: `"Erro ao gerar resumo"` → `"Summary generation error"`
  - `monthly-summary/route.ts` SSE error: `"Erro ao gerar resumo mensal"` → `"Monthly summary generation error"`

**Files**: `src/lib/ai/graphs/analysis-graph.ts`, `src/lib/db/queries.ts`, `src/app/api/reflect/route.ts`, `src/app/api/summary/route.ts`, `src/app/api/monthly-summary/route.ts`, client components

---

## Phase 2 — Architecture & Code Quality

### 2.1 Extract SSE Streaming Utility

**Problem**: Same ~20 lines of SSE streaming code duplicated in `/api/reflect`, `/api/summary`, `/api/monthly-summary`.

**Fix**: Create `src/lib/utils/sse.ts`:

```typescript
export function createSSEStream(generator: AsyncGenerator<string>, errorMessage: string): Response;
```

Encapsulates: TextEncoder, ReadableStream setup, `data: JSON\n\n` formatting, `[DONE]` signal, error handling. Replace all 3 routes with one-liner calls.

**Files**: `src/lib/utils/sse.ts` (new), 3 API routes

### 2.2 Clean Up LangGraph Graphs

**Problem**: `getReflection()` and its dependencies (`reflectionGraph`, `workflow`, `reflect` node, `ReflectionState`) are dead code — only `streamReflection` is called from `/api/reflect`. The message-building logic is duplicated between `getReflection` and `streamReflection`.

**Fix**:

- Remove all dead code: `ReflectionState`, `reflect` node, `workflow`, `reflectionGraph`, and `getReflection()` — only `streamReflection` remains
- Extract shared `buildReflectionMessages()` helper for message construction (used by `streamReflection`, and available if `getReflection` is re-added later)
- In `analysis-graph.ts`: add `fallback: boolean` to return type so callers know when analysis defaulted

**Files**: `src/lib/ai/graphs/reflection-graph.ts`, `src/lib/ai/graphs/analysis-graph.ts`

### 2.3 Pagination on Entries

**Problem**: `GET /api/entries` returns all entries. EntryList loads everything.

**Fix**:

- Add cursor-based pagination to `GET /api/entries`: `?limit=20&cursor=<lastId>`
- Return `{ entries: JournalEntry[], nextCursor: string | null }`
- Add `getEntries()` overload in queries.ts with limit/cursor params
- Add `?all=true` bypass for insights page (capped at 500 entries)
- Update `EntryList` with "load more" button
- Update `journal/page.tsx` and `insights/page.tsx` to use new response shape

**Files**: `src/lib/db/queries.ts`, `src/app/api/entries/route.ts`, `src/components/journal/entry-list.tsx`, `src/app/journal/page.tsx`, `src/app/insights/page.tsx`

### 2.4 Optimize Queries

**Problem**: `getWritingContext()` fetches ALL user entries. `weeklySummaries` has no userId index.

**Fix**:

- Add `.limit(100)` to `getWritingContext()` query
- Add index on `weeklySummaries.userId` in schema (generate migration)

**Files**: `src/lib/db/queries.ts`, `src/lib/db/schema.ts`

### 2.5 Delete Dead Code

**Problem**: `src/lib/store.ts` contains localStorage-based entry management that is never imported.

**Fix**: Delete the file.

**Files**: `src/lib/store.ts` (delete)

### 2.6 Named Constants

**Problem**: Magic numbers scattered across codebase without explanation.

**Fix**: Create `src/lib/constants.ts`:

```typescript
export const MOOD_TREND_DAYS = 14;
export const RAG_SIMILAR_LIMIT = 5;
export const TREND_THRESHOLD = 0.15;
export const WRITING_CONTEXT_LIMIT = 100;
export const ENTRIES_PAGE_SIZE = 20;
export const ENTRIES_MAX_LENGTH = 10000;
export const INSIGHTS_ENTRIES_CAP = 500;
```

Replace hardcoded values across all files that reference these.

**Files**: `src/lib/constants.ts` (new), multiple files

---

## Phase 3 — Testing

### 3.1 Test Setup

- Add Vitest as dev dependency
- Create `vitest.config.ts` with TypeScript path aliases matching `tsconfig.json`
- Mock DB layer for all tests (no test database needed)
- Mock `auth.api.getSession()` for API integration tests

**Files**: `vitest.config.ts` (new), `package.json`

### 3.2 Unit Tests (~15 tests)

**`src/lib/__tests__/mood-trend.test.ts`** — test trend calculation logic:

- Returns "stable" for empty entries
- Returns "stable" for single entry
- Returns "improving" when second half scores > first half + threshold
- Returns "declining" when second half scores < first half - threshold
- Returns "stable" within threshold
- Correctly calculates average score
- Handles all-same-score entries

**`src/lib/__tests__/prompts.test.ts`**:

- `buildAdaptiveSystemPrompt()` returns base prompt with no context
- Appends declining tone for low avgScore
- Appends positive tone for high avgScore + improving trend
- Appends stable tone for stable trend
- `buildReflectionPrompt()` formats entry correctly
- Handles empty previousEntries array

**`src/lib/utils/__tests__/sse.test.ts`**:

- Produces valid SSE data format
- Sends [DONE] at end
- Handles generator errors gracefully

### 3.3 Integration Tests (~10 tests)

**`src/app/api/__tests__/entries.test.ts`**:

- Returns 401 without session
- Returns 400 with empty content
- Returns 400 with content exceeding max length
- Creates entry successfully with valid input

**`src/app/api/__tests__/reflections.test.ts`**:

- Returns 401 without session
- Returns 404 when entry doesn't belong to user
- Returns reflections for owned entry

**`src/app/api/__tests__/monthly-summary.test.ts`**:

- Returns 400 with invalid month (0, 13)
- Returns 400 with missing year/month
- Returns 400 with non-numeric values

---

## Phase 4 — UI Polish

### 4.1 Error Boundaries

Create `src/components/ui/error-boundary.tsx` — React class component with:

- Fallback UI: "Algo deu errado" + retry button
- `onReset` callback to clear error state
- Wrap `ReflectionChat`, `MoodChart`, `EntryEditor`

**Files**: `src/components/ui/error-boundary.tsx` (new), `src/app/journal/page.tsx`, `src/app/insights/page.tsx`

### 4.2 Fix Unhandled Promises & Response Status Checks

> Note: This combines promise error handling (`.catch()`) and response status checks (`if (!res.ok)`) into a single pass per file since they affect the same fetch calls.

Add `.catch()` with error state **and** `if (!res.ok)` guards to useEffect/event fetches in:

- `insights/page.tsx` — entries fetch: show "Erro ao carregar entradas" instead of empty page
- `mood-trend-card.tsx` — trend fetch: already gracefully hidden when null, just add logging
- `journal/page.tsx` — entries fetch + entry save: show error state on failure
- `reflection-chat.tsx` — reflections load: handle failed fetch gracefully
- `entry-editor.tsx` — analyze call: show fallback instead of crash

**Files**: `src/app/insights/page.tsx`, `src/components/insights/mood-trend-card.tsx`, `src/app/journal/page.tsx`, `src/components/journal/reflection-chat.tsx`, `src/components/journal/entry-editor.tsx`

### 4.3 Basic Accessibility

- `aria-label` on icon-only buttons: month navigation arrows in `MonthlySummary`, view toggle in `MoodChart`
- `role="status" aria-label="Carregando..."` on: reflection chat loading dots, skeleton loaders
- `aria-live="polite"` on: summary streaming content, reflection chat message area

**Files**: `src/components/insights/monthly-summary.tsx`, `src/components/insights/mood-chart.tsx`, `src/components/journal/reflection-chat.tsx`

---

## Execution Order

```
Phase 1.1 (auth) → 1.2 (validation) → 1.3 (error handling)
    ↓
Phase 2.6 (constants) → 2.5 (dead code) → 2.1 (SSE util) → 2.2 (graphs) → 2.4 (queries) → 2.3 (pagination)
    ↓
Phase 3.1 (test setup) → 3.2 (unit tests) → 3.3 (integration tests)
    ↓
Phase 4.1 (error boundaries) → 4.2 (promises + status checks) → 4.3 (a11y)
```

## Files Summary

**New files (7)**:

- `src/lib/validations.ts`
- `src/lib/constants.ts`
- `src/lib/utils/sse.ts`
- `src/components/ui/error-boundary.tsx`
- `vitest.config.ts`
- `src/lib/__tests__/mood-trend.test.ts`, `prompts.test.ts`
- `src/app/api/__tests__/entries.test.ts`, `reflections.test.ts`, `monthly-summary.test.ts`
- `src/lib/utils/__tests__/sse.test.ts`

**Modified files (~22)**:

- All API routes (10): entries, entries/[id], reflections/[entryId], reflect, analyze, summary, monthly-summary, mood-trends, entries/search, writing-suggestions
- Components (6): reflection-chat, entry-editor, mood-chart, monthly-summary, mood-trend-card, entry-list
- Pages (2): journal/page, insights/page
- Lib (4): queries.ts, prompts.ts, reflection-graph.ts, analysis-graph.ts

**Deleted files (1)**:

- `src/lib/store.ts`
