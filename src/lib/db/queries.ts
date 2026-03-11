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

export async function getEntries(userId: string): Promise<JournalEntry[]> {
  const rows = await db
    .select()
    .from(entries)
    .where(eq(entries.userId, userId))
    .orderBy(desc(entries.createdAt));
  return rows.map(rowToEntry);
}

export async function getEntry(id: string, userId: string): Promise<JournalEntry | undefined> {
  const rows = await db
    .select()
    .from(entries)
    .where(and(eq(entries.id, id), eq(entries.userId, userId)))
    .limit(1);
  return rows[0] ? rowToEntry(rows[0]) : undefined;
}

export async function saveEntry(
  userId: string,
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
      userId,
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
  userId: string,
  analysis: MoodAnalysis
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

export async function deleteEntry(id: string, userId: string): Promise<number> {
  const result = await db.delete(entries).where(and(eq(entries.id, id), eq(entries.userId, userId)));
  return result.count;
}

export async function getRecentEntries(userId: string, limit: number = 5): Promise<JournalEntry[]> {
  const rows = await db
    .select()
    .from(entries)
    .where(eq(entries.userId, userId))
    .orderBy(desc(entries.createdAt))
    .limit(limit);
  return rows.map(rowToEntry);
}

export async function getEntriesForWeek(userId: string, weekStart: Date): Promise<JournalEntry[]> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const rows = await db
    .select()
    .from(entries)
    .where(and(
      eq(entries.userId, userId),
      gte(entries.createdAt, weekStart),
      lt(entries.createdAt, weekEnd)
    ))
    .orderBy(desc(entries.createdAt));
  return rows.map(rowToEntry);
}

// Semantic search using pgvector
export async function searchSimilarEntries(
  userId: string,
  query: string,
  limit: number = 5
): Promise<JournalEntry[]> {
  const queryEmbedding = await generateEmbedding(query);

  const rows = await db
    .select()
    .from(entries)
    .where(eq(entries.userId, userId))
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

// --- Mood trends ---

export async function getMoodTrend(
  userId: string,
  days: number = 14
): Promise<{ avgScore: number; trend: "improving" | "declining" | "stable"; recentMoods: { mood: string; moodScore: number; date: string }[] }> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({
      mood: entries.mood,
      moodScore: entries.moodScore,
      createdAt: entries.createdAt,
    })
    .from(entries)
    .where(and(eq(entries.userId, userId), gte(entries.createdAt, since)))
    .orderBy(entries.createdAt);

  const scored = rows.filter((r) => r.moodScore !== null);
  if (scored.length === 0) {
    return { avgScore: 0, trend: "stable", recentMoods: [] };
  }

  const avgScore = scored.reduce((sum, r) => sum + r.moodScore!, 0) / scored.length;

  // Compare first half vs second half to determine trend
  const mid = Math.floor(scored.length / 2);
  const firstHalf = scored.slice(0, mid || 1);
  const secondHalf = scored.slice(mid || 1);
  const avgFirst = firstHalf.reduce((s, r) => s + r.moodScore!, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((s, r) => s + r.moodScore!, 0) / secondHalf.length;

  const diff = avgSecond - avgFirst;
  const trend = diff > 0.15 ? "improving" : diff < -0.15 ? "declining" : "stable";

  return {
    avgScore,
    trend,
    recentMoods: scored.map((r) => ({
      mood: r.mood ?? "indefinido",
      moodScore: r.moodScore!,
      date: r.createdAt.toISOString(),
    })),
  };
}

// --- Entries for month ---

export async function getEntriesForMonth(userId: string, year: number, month: number): Promise<JournalEntry[]> {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const rows = await db
    .select()
    .from(entries)
    .where(and(eq(entries.userId, userId), gte(entries.createdAt, start), lt(entries.createdAt, end)))
    .orderBy(entries.createdAt);
  return rows.map(rowToEntry);
}

// --- Writing suggestions data ---

export async function getWritingContext(userId: string): Promise<{
  recentTags: string[];
  daysSinceLastEntry: number;
  totalEntries: number;
  commonMoods: string[];
}> {
  const allEntries = await db
    .select({ tags: entries.tags, mood: entries.mood, createdAt: entries.createdAt })
    .from(entries)
    .where(eq(entries.userId, userId))
    .orderBy(desc(entries.createdAt));

  const totalEntries = allEntries.length;
  const daysSinceLastEntry = allEntries.length > 0
    ? Math.floor((Date.now() - allEntries[0].createdAt.getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  // Aggregate tags from last 30 entries
  const tagCounts = new Map<string, number>();
  const moodCounts = new Map<string, number>();
  for (const row of allEntries.slice(0, 30)) {
    for (const tag of (row.tags as string[]) ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
    if (row.mood) {
      moodCounts.set(row.mood, (moodCounts.get(row.mood) ?? 0) + 1);
    }
  }

  const recentTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  const commonMoods = [...moodCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([mood]) => mood);

  return { recentTags, daysSinceLastEntry, totalEntries, commonMoods };
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

export async function getSummaries(userId: string): Promise<WeeklySummary[]> {
  const rows = await db
    .select()
    .from(weeklySummaries)
    .where(eq(weeklySummaries.userId, userId))
    .orderBy(desc(weeklySummaries.createdAt));
  return rows.map(rowToSummary);
}

export async function saveSummary(
  userId: string,
  summary: Omit<WeeklySummary, "id" | "createdAt">
): Promise<WeeklySummary> {
  const [row] = await db
    .insert(weeklySummaries)
    .values({
      userId,
      periodStart: new Date(summary.periodStart),
      periodEnd: new Date(summary.periodEnd),
      content: summary.content,
      themes: summary.themes,
      moodTrend: summary.moodTrend,
    })
    .returning();
  return rowToSummary(row);
}
