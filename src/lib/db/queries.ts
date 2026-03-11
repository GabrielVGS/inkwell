import { db } from "./index";
import { entries, reflections, weeklySummaries } from "./schema";
import { eq, desc, gte, lt, and, sql } from "drizzle-orm";
import { generateEmbedding } from "@/lib/ai/embeddings";
import type { JournalEntry, Reflection, WeeklySummary, MoodAnalysis } from "@/types";

// --- Entries ---

function rowToEntry(row: typeof entries.$inferSelect): JournalEntry {
  return {
    id: row.id,
    content: row.content,
    mood: row.mood,
    moodScore: row.moodScore,
    energyLevel: row.energyLevel,
    tags: (row.tags as string[]) ?? [],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getEntries(): Promise<JournalEntry[]> {
  const rows = await db
    .select()
    .from(entries)
    .orderBy(desc(entries.createdAt));
  return rows.map(rowToEntry);
}

export async function getEntry(id: string): Promise<JournalEntry | undefined> {
  const rows = await db
    .select()
    .from(entries)
    .where(eq(entries.id, id))
    .limit(1);
  return rows[0] ? rowToEntry(rows[0]) : undefined;
}

export async function saveEntry(
  content: string,
  analysis?: MoodAnalysis
): Promise<JournalEntry> {
  let embedding: number[] | undefined;
  try {
    embedding = await generateEmbedding(content);
  } catch {
    // Continue without embedding if Ollama is down
  }

  const [row] = await db
    .insert(entries)
    .values({
      content,
      mood: analysis?.mood ?? null,
      moodScore: analysis?.moodScore ?? null,
      energyLevel: analysis?.energyLevel ?? null,
      tags: analysis?.tags ?? [],
      embedding,
    })
    .returning();

  return rowToEntry(row);
}

export async function updateEntryAnalysis(
  id: string,
  analysis: MoodAnalysis
): Promise<void> {
  await db
    .update(entries)
    .set({
      mood: analysis.mood,
      moodScore: analysis.moodScore,
      energyLevel: analysis.energyLevel,
      tags: analysis.tags,
      updatedAt: new Date(),
    })
    .where(eq(entries.id, id));
}

export async function deleteEntry(id: string): Promise<void> {
  await db.delete(entries).where(eq(entries.id, id));
}

export async function getRecentEntries(limit: number = 5): Promise<JournalEntry[]> {
  const rows = await db
    .select()
    .from(entries)
    .orderBy(desc(entries.createdAt))
    .limit(limit);
  return rows.map(rowToEntry);
}

export async function getEntriesForWeek(weekStart: Date): Promise<JournalEntry[]> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const rows = await db
    .select()
    .from(entries)
    .where(and(gte(entries.createdAt, weekStart), lt(entries.createdAt, weekEnd)))
    .orderBy(desc(entries.createdAt));
  return rows.map(rowToEntry);
}

// Semantic search using pgvector
export async function searchSimilarEntries(
  query: string,
  limit: number = 5
): Promise<JournalEntry[]> {
  const queryEmbedding = await generateEmbedding(query);

  const rows = await db
    .select()
    .from(entries)
    .orderBy(sql`embedding <=> ${JSON.stringify(queryEmbedding)}::vector`)
    .limit(limit);

  return rows.map(rowToEntry);
}

// --- Reflections ---

function rowToReflection(row: typeof reflections.$inferSelect): Reflection {
  return {
    id: row.id,
    entryId: row.entryId,
    role: row.role,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getReflections(entryId: string): Promise<Reflection[]> {
  const rows = await db
    .select()
    .from(reflections)
    .where(eq(reflections.entryId, entryId))
    .orderBy(reflections.createdAt);
  return rows.map(rowToReflection);
}

export async function addReflection(
  entryId: string,
  role: "user" | "assistant",
  content: string
): Promise<Reflection> {
  const [row] = await db
    .insert(reflections)
    .values({ entryId, role, content })
    .returning();
  return rowToReflection(row);
}

// --- Summaries ---

function rowToSummary(row: typeof weeklySummaries.$inferSelect): WeeklySummary {
  return {
    id: row.id,
    periodStart: row.periodStart.toISOString(),
    periodEnd: row.periodEnd.toISOString(),
    content: row.content,
    themes: (row.themes as string[]) ?? [],
    moodTrend: row.moodTrend ?? { avgScore: 0, trend: "stable" },
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getSummaries(): Promise<WeeklySummary[]> {
  const rows = await db
    .select()
    .from(weeklySummaries)
    .orderBy(desc(weeklySummaries.createdAt));
  return rows.map(rowToSummary);
}

export async function saveSummary(
  summary: Omit<WeeklySummary, "id" | "createdAt">
): Promise<WeeklySummary> {
  const [row] = await db
    .insert(weeklySummaries)
    .values({
      periodStart: new Date(summary.periodStart),
      periodEnd: new Date(summary.periodEnd),
      content: summary.content,
      themes: summary.themes,
      moodTrend: summary.moodTrend,
    })
    .returning();
  return rowToSummary(row);
}
