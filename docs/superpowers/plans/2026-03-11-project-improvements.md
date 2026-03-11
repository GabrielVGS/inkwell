# Project Improvements Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix security holes, improve architecture, add critical-path tests, and polish UI across the Inkwell reflective journal app.

**Architecture:** Bottom-up approach — fix auth and validation foundations first, then refactor duplications and optimize queries, then add tests for the hardened code, then polish UI error handling and accessibility.

**Tech Stack:** Next.js 16, React 19, TypeScript, Drizzle ORM, PostgreSQL/pgvector, LangGraph, Ollama, Vitest, Zod

---

## Chunk 1: Security & Data Integrity

### Task 1: Add entry ownership check to reflections API

**Files:**

- Modify: `src/app/api/reflections/[entryId]/route.ts`

- [x] **Step 1: Add getEntry import and ownership check to GET handler**

In `src/app/api/reflections/[entryId]/route.ts`, add `getEntry` to the import and verify ownership before returning reflections:

```typescript
import { getReflections, addReflection, getEntry } from "@/lib/db/queries";
```

In the GET handler, after `const { entryId } = await params;` (line 12), add:

```typescript
const entry = await getEntry(entryId, session.user.id);
if (!entry) return Response.json({ error: "Not found" }, { status: 404 });
```

- [ ] **Step 2: Add ownership check to POST handler**

In the POST handler, after `const { entryId } = await params;` (line 24), add the same check:

```typescript
const entry = await getEntry(entryId, session.user.id);
if (!entry) return Response.json({ error: "Not found" }, { status: 404 });
```

- [ ] **Step 3: Verify the build passes**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/reflections/\[entryId\]/route.ts
git commit -m "fix(security): add entry ownership check to reflections API"
```

---

### Task 2: Fix silent no-op in entries PATCH/DELETE

**Files:**

- Modify: `src/app/api/entries/[id]/route.ts`
- Modify: `src/lib/db/queries.ts`

- [ ] **Step 1: Make updateEntryAnalysis return affected row count**

In `src/lib/db/queries.ts`, change `updateEntryAnalysis` (line 68) return type from `Promise<void>` to `Promise<number>` and capture the result:

```typescript
export async function updateEntryAnalysis(
  id: string,
  userId: string,
  analysis: MoodAnalysis,
): Promise<number> {
  const result = await db
    .update(entries)
    .set({
      mood: analysis.mood,
      moodScore: analysis.moodScore,
      energyLevel: analysis.energyLevel,
      tags: analysis.tags,
      updatedAt: new Date(),
    })
    .where(and(eq(entries.id, id), eq(entries.userId, userId)));
  return result.count;
}
```

- [ ] **Step 2: Make deleteEntry return affected row count**

Change `deleteEntry` (line 85) similarly:

```typescript
export async function deleteEntry(id: string, userId: string): Promise<number> {
  const result = await db
    .delete(entries)
    .where(and(eq(entries.id, id), eq(entries.userId, userId)));
  return result.count;
}
```

- [ ] **Step 3: Check row count in PATCH handler**

In `src/app/api/entries/[id]/route.ts`, update the PATCH handler (line 20):

```typescript
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { analysis } = await req.json();
  const count = await updateEntryAnalysis(id, session.user.id, analysis);
  if (count === 0) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
```

- [ ] **Step 4: Check row count in DELETE handler**

Update the DELETE handler (line 33):

```typescript
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const count = await deleteEntry(id, session.user.id);
  if (count === 0) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
```

- [ ] **Step 5: Verify build passes**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/entries/\[id\]/route.ts src/lib/db/queries.ts
git commit -m "fix(security): return 404 for PATCH/DELETE on non-owned entries"
```

---

### Task 3: Create Zod validation schemas

**Files:**

- Create: `src/lib/validations.ts`

- [ ] **Step 1: Create validations file with all schemas**

Create `src/lib/validations.ts`:

```typescript
import { z } from "zod";

export const moodAnalysisSchema = z.object({
  mood: z.string(),
  moodScore: z.number().min(-1).max(1),
  energyLevel: z.number().min(0).max(1),
  tags: z.array(z.string()),
});

export const entryCreateSchema = z.object({
  content: z.string().min(1).max(10000),
  analysis: moodAnalysisSchema.optional(),
});

export const entryUpdateSchema = z.object({
  analysis: moodAnalysisSchema,
});

export const analyzeSchema = z.object({
  content: z.string().min(1).max(10000),
});

export const reflectSchema = z.object({
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

export const monthlySummarySchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
});

export const reflectionCreateSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/validations.ts
git commit -m "feat: add Zod validation schemas for all API routes"
```

---

### Task 4: Apply validation to all API routes

**Files:**

- Modify: `src/app/api/entries/route.ts`
- Modify: `src/app/api/entries/[id]/route.ts`
- Modify: `src/app/api/analyze/route.ts`
- Modify: `src/app/api/reflect/route.ts`
- Modify: `src/app/api/reflections/[entryId]/route.ts`
- Modify: `src/app/api/monthly-summary/route.ts`
- Modify: `src/app/api/mood-trends/route.ts`
- Modify: `src/app/api/entries/search/route.ts`

- [ ] **Step 1: Apply validation to POST /api/entries**

In `src/app/api/entries/route.ts`, replace the manual content check with Zod:

```typescript
import { getEntries, saveEntry } from "@/lib/db/queries";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { entryCreateSchema } from "@/lib/validations";

// GET stays the same

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = entryCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const entry = await saveEntry(session.user.id, parsed.data.content, parsed.data.analysis);
  return Response.json(entry, { status: 201 });
}
```

- [ ] **Step 2: Apply validation to PATCH /api/entries/[id]**

In `src/app/api/entries/[id]/route.ts`, add import and validate PATCH body:

```typescript
import { getEntry, updateEntryAnalysis, deleteEntry } from "@/lib/db/queries";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { entryUpdateSchema } from "@/lib/validations";
```

In the PATCH handler, replace `const { analysis } = await req.json();` with:

```typescript
const parsed = entryUpdateSchema.safeParse(await req.json());
if (!parsed.success) {
  return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
}
const count = await updateEntryAnalysis(id, session.user.id, parsed.data.analysis);
```

- [ ] **Step 3: Apply validation to POST /api/analyze**

In `src/app/api/analyze/route.ts`, replace the manual check:

```typescript
import { analyzeEntry } from "@/lib/ai/graphs/analysis-graph";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { analyzeSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = analyzeSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const analysis = await analyzeEntry(parsed.data.content);
    return Response.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    return Response.json(
      { mood: "indefinido", moodScore: 0, energyLevel: 0.5, tags: [] },
      { status: 200 },
    );
  }
}
```

- [ ] **Step 4: Apply validation to POST /api/reflect**

In `src/app/api/reflect/route.ts`, add import and replace manual check:

```typescript
import { reflectSchema } from "@/lib/validations";
```

Replace lines 10-16 with:

```typescript
const parsed = reflectSchema.safeParse(await req.json());
if (!parsed.success) {
  return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
}

const { currentEntry, messages } = parsed.data;
const conversationHistory = messages ?? [];
```

- [ ] **Step 5: Apply validation to POST /api/reflections/[entryId]**

In `src/app/api/reflections/[entryId]/route.ts`, add import and validate:

```typescript
import { reflectionCreateSchema } from "@/lib/validations";
```

In the POST handler, replace `const { role, content } = await req.json();` and the manual check with:

```typescript
const parsed = reflectionCreateSchema.safeParse(await req.json());
if (!parsed.success) {
  return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
}

const reflection = await addReflection(entryId, parsed.data.role, parsed.data.content);
```

- [ ] **Step 6: Apply validation to POST /api/monthly-summary**

In `src/app/api/monthly-summary/route.ts`, add import and validate:

```typescript
import { monthlySummarySchema } from "@/lib/validations";
```

Replace `const { year, month } = await req.json();` and the manual check (lines 10-14) with:

```typescript
const parsed = monthlySummarySchema.safeParse(await req.json());
if (!parsed.success) {
  return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
}
const { year, month } = parsed.data;
```

- [ ] **Step 7: Clamp query params in mood-trends and search**

In `src/app/api/mood-trends/route.ts`, clamp the `days` param:

```typescript
const days = Math.min(90, Math.max(1, parseInt(searchParams.get("days") ?? "14", 10)));
```

In `src/app/api/entries/search/route.ts`, validate query and clamp limit:

```typescript
const query = searchParams.get("query");
if (!query) return Response.json({ error: "query is required" }, { status: 400 });

const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "5", 10)));
```

- [ ] **Step 8: Verify build passes**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/app/api/
git commit -m "feat: apply Zod validation to all API routes"
```

---

### Task 5: Fix error handling and translate API errors

**Files:**

- Modify: `src/lib/ai/graphs/analysis-graph.ts`
- Modify: `src/lib/db/queries.ts`
- Modify: `src/app/api/reflect/route.ts`
- Modify: `src/app/api/summary/route.ts`
- Modify: `src/app/api/monthly-summary/route.ts`

- [ ] **Step 1: Add logging to analysis-graph catch block**

In `src/lib/ai/graphs/analysis-graph.ts`, replace the empty `catch` on line 59 with:

```typescript
  } catch (error) {
    console.error("Mood analysis JSON parsing failed:", error);
    return {
      analysis: {
        mood: "indefinido",
        moodScore: 0,
        energyLevel: 0.5,
        tags: [],
      },
    };
  }
```

- [ ] **Step 2: Add logging to embedding generation in queries.ts**

In `src/lib/db/queries.ts`, replace the empty `catch` on line 48 with:

```typescript
  } catch (error) {
    console.error("Embedding generation failed:", error);
  }
```

- [ ] **Step 3: Add logging to reflect route catch blocks**

In `src/app/api/reflect/route.ts`, replace `catch {` on line 31 with:

```typescript
  } catch (error) {
    console.error("RAG search failed:", error);
  }
```

Replace `catch {` on line 42 with:

```typescript
  } catch (error) {
    console.error("Mood trend fetch failed:", error);
  }
```

- [ ] **Step 4: Translate Portuguese API error messages to English**

In `src/app/api/reflect/route.ts`, change line 63:
`"Erro na reflexao"` → `"Reflection error"`

In `src/app/api/summary/route.ts`, change line 27:
`"Erro ao gerar resumo"` → `"Summary generation error"`

In `src/app/api/monthly-summary/route.ts`, change line 19:
`"Sem entradas neste mes"` → `"No entries for this month"`

Change the SSE error on line 42:
`"Erro ao gerar resumo mensal"` → `"Monthly summary generation error"`

- [ ] **Step 5: Verify build passes**

Run: `npx next build 2>&1 | tail -5`

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/graphs/analysis-graph.ts src/lib/db/queries.ts src/app/api/reflect/route.ts src/app/api/summary/route.ts src/app/api/monthly-summary/route.ts
git commit -m "fix: add error logging and translate API errors to English"
```

---

## Chunk 2: Architecture & Code Quality

### Task 6: Create named constants

**Files:**

- Create: `src/lib/constants.ts`

- [ ] **Step 1: Create constants file**

Create `src/lib/constants.ts`:

```typescript
/** Standard lookback period for mood trend analysis */
export const MOOD_TREND_DAYS = 14;

/** Number of semantically similar entries to retrieve for RAG */
export const RAG_SIMILAR_LIMIT = 5;

/** Minimum score difference to consider a trend as improving/declining */
export const TREND_THRESHOLD = 0.15;

/** Maximum recent entries to scan for writing context */
export const WRITING_CONTEXT_LIMIT = 100;

/** Default page size for paginated entry list */
export const ENTRIES_PAGE_SIZE = 20;

/** Maximum character length for a journal entry */
export const ENTRIES_MAX_LENGTH = 10000;

/** Maximum entries to load for insights page (unpaginated) */
export const INSIGHTS_ENTRIES_CAP = 500;
```

- [ ] **Step 2: Replace magic numbers across codebase**

In `src/lib/db/queries.ts`:

- Line 168: replace `14` with `MOOD_TREND_DAYS` (import from constants)
- Line 199: replace `0.15` with `TREND_THRESHOLD`
- Line 247 (getWritingContext): add `.limit(WRITING_CONTEXT_LIMIT)` to the query (add import)

In `src/app/api/reflect/route.ts`:

- Line 21: replace `5` with `RAG_SIMILAR_LIMIT` (import from constants)
- Line 38: replace `14` with `MOOD_TREND_DAYS`

In `src/lib/validations.ts`:

- Replace `10000` with `ENTRIES_MAX_LENGTH` (import from constants)

- [ ] **Step 3: Verify build passes**

Run: `npx next build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add src/lib/constants.ts src/lib/db/queries.ts src/app/api/reflect/route.ts src/lib/validations.ts
git commit -m "refactor: extract magic numbers to named constants"
```

---

### Task 7: Delete dead code

**Files:**

- Delete: `src/lib/store.ts`

- [ ] **Step 1: Delete the unused localStorage store**

```bash
rm src/lib/store.ts
```

- [ ] **Step 2: Verify no imports reference it**

Run: `grep -r "lib/store" src/` — should return nothing.

- [ ] **Step 3: Commit**

```bash
git add -u src/lib/store.ts
git commit -m "chore: delete unused localStorage store"
```

---

### Task 8: Extract SSE streaming utility

**Files:**

- Create: `src/lib/utils/sse.ts`
- Modify: `src/app/api/reflect/route.ts`
- Modify: `src/app/api/summary/route.ts`
- Modify: `src/app/api/monthly-summary/route.ts`

- [ ] **Step 1: Create SSE utility**

Create `src/lib/utils/sse.ts`:

```typescript
export function createSSEResponse(
  generator: AsyncIterable<string>,
  errorMessage: string,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generator) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error(`SSE stream error (${errorMessage}):`, error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

- [ ] **Step 2: Refactor /api/reflect to use utility**

In `src/app/api/reflect/route.ts`, add import:

```typescript
import { createSSEResponse } from "@/lib/utils/sse";
```

Replace the entire `const encoder = ...` through `return new Response(stream, ...)` block (lines 46-77) with:

```typescript
return createSSEResponse(
  streamReflection(currentEntry, similarEntries, conversationHistory, moodContext),
  "Reflection error",
);
```

- [ ] **Step 3: Refactor /api/summary to use utility**

In `src/app/api/summary/route.ts`, add import and replace the stream block (lines 15-41) with:

```typescript
return createSSEResponse(streamWeeklySummary(entries), "Summary generation error");
```

- [ ] **Step 4: Refactor /api/monthly-summary to use utility**

In `src/app/api/monthly-summary/route.ts`, add import and replace the stream block (lines 22-56) with:

```typescript
return createSSEResponse(
  streamMonthlySummary(
    entries.map((e) => ({
      content: e.content,
      createdAt: e.createdAt,
      mood: e.mood,
      moodScore: e.moodScore,
      tags: e.tags,
    })),
  ),
  "Monthly summary generation error",
);
```

- [ ] **Step 5: Verify build passes**

Run: `npx next build 2>&1 | tail -5`

- [ ] **Step 6: Commit**

```bash
git add src/lib/utils/sse.ts src/app/api/reflect/route.ts src/app/api/summary/route.ts src/app/api/monthly-summary/route.ts
git commit -m "refactor: extract SSE streaming into reusable utility"
```

---

### Task 9: Clean up LangGraph reflection graph

**Files:**

- Modify: `src/lib/ai/graphs/reflection-graph.ts`

- [ ] **Step 1: Remove dead code and extract helper**

Rewrite `src/lib/ai/graphs/reflection-graph.ts` to keep only `streamReflection` with a shared `buildReflectionMessages` helper:

```typescript
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { getReflectionModel } from "../llm";
import { buildAdaptiveSystemPrompt, buildReflectionPrompt } from "../../prompts";

type MoodContext = {
  avgScore: number;
  trend: "improving" | "declining" | "stable";
};
type PreviousEntry = {
  content: string;
  createdAt: string;
  mood: string | null;
};

function buildReflectionMessages(
  currentEntry: string,
  previousEntries: PreviousEntry[],
  conversationHistory: { role: string; content: string }[],
  moodContext?: MoodContext,
) {
  const systemPrompt = buildAdaptiveSystemPrompt(moodContext);
  const systemMessage = new SystemMessage(systemPrompt);

  const messages = conversationHistory.map((msg) =>
    msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content),
  );

  if (messages.length === 0) {
    messages.push(new HumanMessage(currentEntry));
  }

  // Enrich first message with RAG context
  if (messages.length === 1 && previousEntries?.length > 0) {
    const contextPrompt = buildReflectionPrompt(currentEntry, previousEntries);
    messages[0] = new HumanMessage(contextPrompt);
  }

  return { systemMessage, messages };
}

export async function* streamReflection(
  currentEntry: string,
  previousEntries: PreviousEntry[],
  conversationHistory: { role: string; content: string }[],
  moodContext?: MoodContext,
) {
  const model = getReflectionModel();
  const { systemMessage, messages } = buildReflectionMessages(
    currentEntry,
    previousEntries,
    conversationHistory,
    moodContext,
  );

  const stream = await model.stream([systemMessage, ...messages]);

  for await (const chunk of stream) {
    const content = typeof chunk.content === "string" ? chunk.content : "";
    if (content) {
      yield content;
    }
  }
}
```

- [ ] **Step 2: Verify build passes**

Run: `npx next build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/graphs/reflection-graph.ts
git commit -m "refactor: remove dead code from reflection graph, extract message builder"
```

---

### Task 10: Add fallback flag to analysis graph

**Files:**

- Modify: `src/lib/ai/graphs/analysis-graph.ts`

- [ ] **Step 1: Add fallback field to analysis return**

In `src/lib/ai/graphs/analysis-graph.ts`, update the `AnalysisState` (line 17) to include a `fallback` field:

```typescript
const AnalysisState = Annotation.Root({
  content: Annotation<string>,
  analysis: Annotation<MoodAnalysis | null>,
  fallback: Annotation<boolean>,
});
```

In the `analyzeMood` function, update the success return (line 58):

```typescript
return { analysis, fallback: false };
```

Update the catch block return:

```typescript
return {
  analysis: {
    mood: "indefinido",
    moodScore: 0,
    energyLevel: 0.5,
    tags: [],
  },
  fallback: true,
};
```

Update `analyzeEntry` (line 80) to return the fallback flag:

```typescript
export async function analyzeEntry(
  content: string,
): Promise<MoodAnalysis & { fallback?: boolean }> {
  const result = await analysisGraph.invoke({
    content,
    analysis: null,
    fallback: false,
  });
  return { ...result.analysis!, fallback: result.fallback || undefined };
}
```

- [ ] **Step 2: Verify build passes**

Run: `npx next build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/graphs/analysis-graph.ts
git commit -m "feat: add fallback flag to mood analysis results"
```

---

### Task 11: Optimize queries and add missing index

**Files:**

- Modify: `src/lib/db/queries.ts`
- Modify: `src/lib/db/schema.ts`

- [ ] **Step 1: Add limit to getWritingContext query**

In `src/lib/db/queries.ts`, in `getWritingContext()` (around line 233), add `.limit(WRITING_CONTEXT_LIMIT)` to the query (should already be done from Task 6 step 2, verify it's there).

- [ ] **Step 2: Add userId index to weeklySummaries table**

In `src/lib/db/schema.ts`, add an index callback to the `weeklySummaries` table definition. Find the table definition (around line 106) and add:

```typescript
export const weeklySummaries = pgTable(
  "weekly_summaries",
  {
    // ... existing columns unchanged ...
  },
  (table) => [index("weekly_summaries_user_id_idx").on(table.userId)],
);
```

- [ ] **Step 3: Generate and apply migration**

Run: `npx drizzle-kit generate`
Then: `npx drizzle-kit push`

- [ ] **Step 4: Verify build passes**

Run: `npx next build 2>&1 | tail -5`

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/schema.ts src/lib/db/queries.ts drizzle/
git commit -m "perf: add userId index to weeklySummaries, limit getWritingContext query"
```

---

### Task 12: Add cursor-based pagination to entries

**Files:**

- Modify: `src/lib/db/queries.ts`
- Modify: `src/app/api/entries/route.ts`
- Modify: `src/components/journal/entry-list.tsx`
- Modify: `src/app/journal/page.tsx`
- Modify: `src/app/insights/page.tsx`

- [ ] **Step 1: Add paginated getEntries to queries.ts**

In `src/lib/db/queries.ts`, modify `getEntries` to support pagination:

```typescript
export async function getEntries(
  userId: string,
  options?: { limit?: number; cursor?: string; all?: boolean },
): Promise<{ entries: JournalEntry[]; nextCursor: string | null }> {
  const limit = options?.all ? INSIGHTS_ENTRIES_CAP : (options?.limit ?? ENTRIES_PAGE_SIZE);

  let query = db
    .select()
    .from(entries)
    .where(
      options?.cursor
        ? and(eq(entries.userId, userId), lt(entries.id, options.cursor))
        : eq(entries.userId, userId),
    )
    .orderBy(desc(entries.createdAt))
    .limit(limit + 1);

  const rows = await query;

  const hasMore = rows.length > limit;
  const sliced = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : null;

  return {
    entries: sliced.map(rowToEntry),
    nextCursor,
  };
}
```

Import `ENTRIES_PAGE_SIZE` and `INSIGHTS_ENTRIES_CAP` from constants.

- [ ] **Step 2: Update GET /api/entries to support pagination**

In `src/app/api/entries/route.ts`, update the GET handler:

```typescript
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";
  const cursor = searchParams.get("cursor") ?? undefined;

  const result = await getEntries(session.user.id, { all, cursor });
  return Response.json(result);
}
```

- [ ] **Step 3: Update journal page to handle paginated response**

In `src/app/journal/page.tsx`, update `fetchEntries`:

```typescript
const fetchEntries = useCallback(async () => {
  const res = await fetch("/api/entries");
  const data = await res.json();
  setEntries(data.entries);
  setLoading(false);
}, []);
```

Add state and handler for loading more:

```typescript
const [nextCursor, setNextCursor] = useState<string | null>(null);

const fetchEntries = useCallback(async () => {
  const res = await fetch("/api/entries");
  const data = await res.json();
  setEntries(data.entries);
  setNextCursor(data.nextCursor);
  setLoading(false);
}, []);

const loadMore = useCallback(async () => {
  if (!nextCursor) return;
  const res = await fetch(`/api/entries?cursor=${nextCursor}`);
  const data = await res.json();
  setEntries((prev) => [...prev, ...data.entries]);
  setNextCursor(data.nextCursor);
}, [nextCursor]);
```

Pass `loadMore` and `nextCursor` to `EntryList`:

```typescript
<EntryList
  entries={entries}
  selectedId={selectedEntry?.id}
  onSelect={setSelectedEntry}
  onLoadMore={nextCursor ? loadMore : undefined}
/>
```

- [ ] **Step 4: Add "load more" to EntryList**

In `src/components/journal/entry-list.tsx`, add the `onLoadMore` prop to the interface and render a button at the bottom:

```typescript
interface EntryListProps {
  entries: JournalEntry[];
  selectedId?: string;
  onSelect: (entry: JournalEntry) => void;
  onLoadMore?: () => void;
}
```

After the entry list map, add:

```typescript
{onLoadMore && (
  <button
    onClick={onLoadMore}
    className="w-full py-2 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
  >
    Carregar mais
  </button>
)}
```

- [ ] **Step 5: Update insights page to fetch all entries**

In `src/app/insights/page.tsx`, update the fetch to use `?all=true`:

```typescript
useEffect(() => {
  fetch("/api/entries?all=true")
    .then((res) => res.json())
    .then((data) => setEntries(data.entries));
}, []);
```

- [ ] **Step 6: Verify build passes**

Run: `npx next build 2>&1 | tail -5`

- [ ] **Step 7: Commit**

```bash
git add src/lib/db/queries.ts src/app/api/entries/route.ts src/components/journal/entry-list.tsx src/app/journal/page.tsx src/app/insights/page.tsx
git commit -m "feat: add cursor-based pagination to entries list"
```

---

## Chunk 3: Testing

### Task 13: Set up Vitest

**Files:**

- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest
```

- [ ] **Step 2: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3: Add test script to package.json**

Add to `scripts` in `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: set up Vitest with path aliases"
```

---

### Task 14: Write unit tests for prompts

**Files:**

- Create: `src/lib/__tests__/prompts.test.ts`

- [ ] **Step 1: Write prompt tests**

Create `src/lib/__tests__/prompts.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  buildAdaptiveSystemPrompt,
  buildReflectionPrompt,
  REFLECTION_SYSTEM_PROMPT,
} from "../prompts";

describe("buildAdaptiveSystemPrompt", () => {
  it("returns base prompt when no mood context", () => {
    const result = buildAdaptiveSystemPrompt();
    expect(result).toBe(REFLECTION_SYSTEM_PROMPT);
  });

  it("appends declining tone for low avgScore", () => {
    const result = buildAdaptiveSystemPrompt({
      avgScore: -0.5,
      trend: "declining",
    });
    expect(result).toContain(REFLECTION_SYSTEM_PROMPT);
    expect(result).toContain("CONTEXTO EMOCIONAL");
    expect(result).toContain("acolhimento");
  });

  it("appends positive tone for high avgScore and improving trend", () => {
    const result = buildAdaptiveSystemPrompt({
      avgScore: 0.6,
      trend: "improving",
    });
    expect(result).toContain("momento positivo");
  });

  it("appends stable tone for stable trend", () => {
    const result = buildAdaptiveSystemPrompt({
      avgScore: 0.1,
      trend: "stable",
    });
    expect(result).toContain("estável");
  });
});

describe("buildReflectionPrompt", () => {
  it("formats entry without previous entries", () => {
    const result = buildReflectionPrompt("Hoje foi um bom dia", []);
    expect(result).toContain("Hoje foi um bom dia");
  });

  it("includes previous entries context", () => {
    const result = buildReflectionPrompt("Hoje foi um bom dia", [
      {
        content: "Ontem chorei",
        createdAt: "2026-03-10T10:00:00Z",
        mood: "triste",
      },
    ]);
    expect(result).toContain("Ontem chorei");
    expect(result).toContain("triste");
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/lib/__tests__/prompts.test.ts`
Expected: All 6 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/lib/__tests__/prompts.test.ts
git commit -m "test: add unit tests for prompt building functions"
```

---

### Task 15: Write unit tests for SSE utility

**Files:**

- Create: `src/lib/utils/__tests__/sse.test.ts`

- [ ] **Step 1: Write SSE tests**

Create `src/lib/utils/__tests__/sse.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { createSSEResponse } from "../sse";

async function readSSE(response: Response): Promise<string[]> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) chunks.push(line.slice(6));
    }
  }
  return chunks;
}

describe("createSSEResponse", () => {
  it("produces valid SSE data format", async () => {
    async function* gen() {
      yield "hello";
      yield " world";
    }
    const response = createSSEResponse(gen(), "test error");
    const chunks = await readSSE(response);

    expect(chunks).toContain(JSON.stringify({ content: "hello" }));
    expect(chunks).toContain(JSON.stringify({ content: " world" }));
  });

  it("sends [DONE] at end", async () => {
    async function* gen() {
      yield "data";
    }
    const response = createSSEResponse(gen(), "test error");
    const chunks = await readSSE(response);

    expect(chunks[chunks.length - 1]).toBe("[DONE]");
  });

  it("handles generator errors gracefully", async () => {
    async function* gen() {
      yield "start";
      throw new Error("boom");
    }
    const response = createSSEResponse(gen(), "Stream failed");
    const chunks = await readSSE(response);

    expect(chunks[0]).toBe(JSON.stringify({ content: "start" }));
    const errorChunk = chunks.find((c) => c.includes("error"));
    expect(errorChunk).toBeDefined();
    expect(JSON.parse(errorChunk!).error).toBe("Stream failed");
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/lib/utils/__tests__/sse.test.ts`
Expected: All 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils/__tests__/sse.test.ts
git commit -m "test: add unit tests for SSE streaming utility"
```

---

### Task 16: Write unit tests for mood trend calculation

**Files:**

- Create: `src/lib/__tests__/mood-trend.test.ts`

- [ ] **Step 1: Extract trend calculation into a pure function**

To make `getMoodTrend` testable without mocking the DB, extract the calculation logic into a pure function in `src/lib/db/queries.ts`:

```typescript
export function calculateTrend(scores: number[]): {
  avgScore: number;
  trend: "improving" | "declining" | "stable";
} {
  if (scores.length === 0) return { avgScore: 0, trend: "stable" };

  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

  const mid = Math.floor(scores.length / 2);
  const firstHalf = scores.slice(0, mid || 1);
  const secondHalf = scores.slice(mid || 1);
  const avgFirst = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;

  const diff = avgSecond - avgFirst;
  const trend =
    diff > TREND_THRESHOLD ? "improving" : diff < -TREND_THRESHOLD ? "declining" : "stable";

  return { avgScore, trend };
}
```

Then use it inside `getMoodTrend`:

```typescript
const { avgScore, trend } = calculateTrend(scored.map((r) => r.moodScore!));
```

- [ ] **Step 2: Write the tests**

Create `src/lib/__tests__/mood-trend.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { calculateTrend } from "../db/queries";

describe("calculateTrend", () => {
  it("returns stable for empty array", () => {
    const result = calculateTrend([]);
    expect(result.trend).toBe("stable");
    expect(result.avgScore).toBe(0);
  });

  it("returns stable for single score", () => {
    const result = calculateTrend([0.5]);
    expect(result.trend).toBe("stable");
    expect(result.avgScore).toBe(0.5);
  });

  it("returns improving when second half is significantly higher", () => {
    const result = calculateTrend([-0.5, -0.3, 0.2, 0.5]);
    expect(result.trend).toBe("improving");
  });

  it("returns declining when second half is significantly lower", () => {
    const result = calculateTrend([0.5, 0.3, -0.2, -0.5]);
    expect(result.trend).toBe("declining");
  });

  it("returns stable within threshold", () => {
    const result = calculateTrend([0.1, 0.15, 0.12, 0.18]);
    expect(result.trend).toBe("stable");
  });

  it("correctly calculates average score", () => {
    const result = calculateTrend([0.2, 0.4, 0.6, 0.8]);
    expect(result.avgScore).toBe(0.5);
  });

  it("returns stable for all-same scores", () => {
    const result = calculateTrend([0.3, 0.3, 0.3, 0.3]);
    expect(result.trend).toBe("stable");
    expect(result.avgScore).toBe(0.3);
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/lib/__tests__/mood-trend.test.ts`
Expected: All 7 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/queries.ts src/lib/__tests__/mood-trend.test.ts
git commit -m "test: extract calculateTrend and add unit tests"
```

---

### Task 17: Write integration tests for API validation

**Files:**

- Create: `src/app/api/__tests__/entries.test.ts`
- Create: `src/app/api/__tests__/reflections.test.ts`
- Create: `src/app/api/__tests__/monthly-summary.test.ts`

- [ ] **Step 1: Write entries API tests**

Create `src/app/api/__tests__/entries.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../entries/route";

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Headers()),
}));

vi.mock("@/lib/db/queries", () => ({
  saveEntry: vi.fn(() => ({
    id: "1",
    content: "test",
    mood: null,
    moodScore: null,
    energyLevel: null,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })),
}));

import { auth } from "@/lib/auth";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/entries", () => {
  it("returns 401 without session", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as any);
    const req = new Request("http://localhost/api/entries", {
      method: "POST",
      body: JSON.stringify({ content: "test" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 with empty content", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "u1" },
    } as any);
    const req = new Request("http://localhost/api/entries", {
      method: "POST",
      body: JSON.stringify({ content: "" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 with content exceeding max length", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "u1" },
    } as any);
    const req = new Request("http://localhost/api/entries", {
      method: "POST",
      body: JSON.stringify({ content: "a".repeat(10001) }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates entry with valid input", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "u1" },
    } as any);
    const req = new Request("http://localhost/api/entries", {
      method: "POST",
      body: JSON.stringify({ content: "Today was good" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});
```

- [ ] **Step 2: Write reflections API tests**

Create `src/app/api/__tests__/reflections.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../reflections/[entryId]/route";

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Headers()),
}));

vi.mock("@/lib/db/queries", () => ({
  getEntry: vi.fn(),
  getReflections: vi.fn(() => []),
}));

import { auth } from "@/lib/auth";
import { getEntry } from "@/lib/db/queries";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/reflections/[entryId]", () => {
  const makeParams = (entryId: string) => ({
    params: Promise.resolve({ entryId }),
  });

  it("returns 401 without session", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as any);
    const res = await GET(new Request("http://localhost"), makeParams("e1") as any);
    expect(res.status).toBe(401);
  });

  it("returns 404 when entry doesn't belong to user", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "u1" },
    } as any);
    vi.mocked(getEntry).mockResolvedValue(undefined);
    const res = await GET(new Request("http://localhost"), makeParams("e1") as any);
    expect(res.status).toBe(404);
  });

  it("returns reflections for owned entry", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "u1" },
    } as any);
    vi.mocked(getEntry).mockResolvedValue({ id: "e1" } as any);
    const res = await GET(new Request("http://localhost"), makeParams("e1") as any);
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 3: Write monthly-summary API tests**

Create `src/app/api/__tests__/monthly-summary.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../monthly-summary/route";

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Headers()),
}));

vi.mock("@/lib/db/queries", () => ({
  getEntriesForMonth: vi.fn(() => []),
}));

vi.mock("@/lib/ai/graphs/monthly-summary-graph", () => ({
  streamMonthlySummary: vi.fn(),
}));

import { auth } from "@/lib/auth";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/monthly-summary", () => {
  it("returns 401 without session", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as any);
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ year: 2026, month: 3 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 with invalid month", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "u1" },
    } as any);
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ year: 2026, month: 13 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 with missing fields", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "u1" },
    } as any);
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ year: 2026 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: All ~26 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/__tests__/
git commit -m "test: add integration tests for API auth and validation"
```

---

## Chunk 4: UI Polish

### Task 18: Create error boundary component

**Files:**

- Create: `src/components/ui/error-boundary.tsx`

- [ ] **Step 1: Create error boundary**

Create `src/components/ui/error-boundary.tsx`:

```typescript
"use client";

import React from "react";
import { Button } from "./button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <p className="text-sm text-muted-foreground italic mb-3">
            Algo deu errado
          </p>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => this.setState({ hasError: false })}
          >
            Tentar novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/error-boundary.tsx
git commit -m "feat: add reusable ErrorBoundary component"
```

---

### Task 19: Wrap key components with error boundaries

**Files:**

- Modify: `src/app/journal/page.tsx`
- Modify: `src/app/insights/page.tsx`

- [ ] **Step 1: Wrap journal page components**

In `src/app/journal/page.tsx`, add import:

```typescript
import { ErrorBoundary } from "@/components/ui/error-boundary";
```

Wrap `<EntryEditor>`:

```typescript
<ErrorBoundary>
  <EntryEditor onSave={handleSave} />
</ErrorBoundary>
```

Wrap `<ReflectionChat>`:

```typescript
<ErrorBoundary>
  <ReflectionChat key={selectedEntry.id} entry={selectedEntry} />
</ErrorBoundary>
```

- [ ] **Step 2: Wrap insights page components**

In `src/app/insights/page.tsx`, add import:

```typescript
import { ErrorBoundary } from "@/components/ui/error-boundary";
```

Wrap `<MoodChart>` and `<TagCloud>`:

```typescript
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <ErrorBoundary><MoodChart entries={entries} /></ErrorBoundary>
  <ErrorBoundary><TagCloud entries={entries} /></ErrorBoundary>
</div>
```

- [ ] **Step 3: Verify build passes**

Run: `npx next build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add src/app/journal/page.tsx src/app/insights/page.tsx
git commit -m "feat: wrap key components with ErrorBoundary"
```

---

### Task 20: Fix unhandled promises and add response status checks

**Files:**

- Modify: `src/app/journal/page.tsx`
- Modify: `src/app/insights/page.tsx`
- Modify: `src/components/insights/mood-trend-card.tsx`
- Modify: `src/components/journal/reflection-chat.tsx`
- Modify: `src/components/journal/entry-editor.tsx`

- [ ] **Step 1: Fix journal page fetches**

In `src/app/journal/page.tsx`, add error state:

```typescript
const [error, setError] = useState(false);
```

Update `fetchEntries`:

```typescript
const fetchEntries = useCallback(async () => {
  try {
    const res = await fetch("/api/entries");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setEntries(data.entries);
    setNextCursor(data.nextCursor);
  } catch (error) {
    console.error("Failed to load entries:", error);
    setError(true);
  } finally {
    setLoading(false);
  }
}, []);
```

- [ ] **Step 2: Fix insights page fetch**

In `src/app/insights/page.tsx`, add error state and update the useEffect:

```typescript
const [fetchError, setFetchError] = useState(false);

useEffect(() => {
  fetch("/api/entries?all=true")
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => setEntries(data.entries))
    .catch((error) => {
      console.error("Failed to load entries:", error);
      setFetchError(true);
    });
}, []);
```

Show error state in the UI when `fetchError` is true.

- [ ] **Step 3: Fix mood-trend-card fetch**

In `src/components/insights/mood-trend-card.tsx`, add `res.ok` check and logging:

```typescript
useEffect(() => {
  fetch("/api/mood-trends?days=14")
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(setTrend)
    .catch((error) => {
      console.error("Failed to load mood trend:", error);
    });
}, []);
```

- [ ] **Step 4: Fix reflection-chat fetch**

In `src/components/journal/reflection-chat.tsx`, add `res.ok` check in the reflections load useEffect:

```typescript
const res = await fetch(`/api/reflections/${entry.id}`);
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const reflections = await res.json();
```

- [ ] **Step 5: Fix entry-editor analyze call**

In `src/components/journal/entry-editor.tsx`, add `res.ok` check in `handleSave`:

```typescript
const res = await fetch("/api/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ content }),
});
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const moodAnalysis: MoodAnalysis = await res.json();
```

- [ ] **Step 6: Verify build passes**

Run: `npx next build 2>&1 | tail -5`

- [ ] **Step 7: Commit**

```bash
git add src/app/journal/page.tsx src/app/insights/page.tsx src/components/insights/mood-trend-card.tsx src/components/journal/reflection-chat.tsx src/components/journal/entry-editor.tsx
git commit -m "fix: add error handling and response status checks to all client fetches"
```

---

### Task 21: Add basic accessibility attributes

**Files:**

- Modify: `src/components/insights/monthly-summary.tsx`
- Modify: `src/components/insights/mood-chart.tsx`
- Modify: `src/components/journal/reflection-chat.tsx`

- [ ] **Step 1: Add aria labels to monthly summary navigation**

In `src/components/insights/monthly-summary.tsx`, add `aria-label` to the navigation buttons:

Previous month button: `aria-label="Mes anterior"`
Next month button: `aria-label="Proximo mes"`

- [ ] **Step 2: Add aria labels to mood chart view toggle**

In `src/components/insights/mood-chart.tsx`, add `aria-label` to the toggle buttons:

"Por dia" button: `aria-label="Visualizar por dia"`
"Por entrada" button: `aria-label="Visualizar por entrada"`

- [ ] **Step 3: Add loading and live region attributes to reflection chat**

In `src/components/journal/reflection-chat.tsx`, add `role="status" aria-label="Carregando..."` to the loading dots container.

Add `aria-live="polite"` to the messages container.

- [ ] **Step 4: Verify build passes**

Run: `npx next build 2>&1 | tail -5`

- [ ] **Step 5: Run all tests one final time**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/insights/monthly-summary.tsx src/components/insights/mood-chart.tsx src/components/journal/reflection-chat.tsx
git commit -m "a11y: add aria labels and live regions to interactive components"
```
