import type { JournalEntry, Reflection, WeeklySummary } from "@/types";

const ENTRIES_KEY = "reflective-journal:entries";
const REFLECTIONS_KEY = "reflective-journal:reflections";
const SUMMARIES_KEY = "reflective-journal:summaries";

function generateId(): string {
  return crypto.randomUUID();
}

// --- Entries ---

export function getEntries(): JournalEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(ENTRIES_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as JournalEntry[];
}

export function getEntry(id: string): JournalEntry | undefined {
  return getEntries().find((e) => e.id === id);
}

export function saveEntry(
  content: string,
  analysis?: { mood: string; moodScore: number; energyLevel: number; tags: string[] }
): JournalEntry {
  const entries = getEntries();
  const now = new Date().toISOString();
  const entry: JournalEntry = {
    id: generateId(),
    content,
    mood: analysis?.mood ?? null,
    moodScore: analysis?.moodScore ?? null,
    energyLevel: analysis?.energyLevel ?? null,
    tags: analysis?.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };
  entries.unshift(entry);
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  return entry;
}

export function updateEntryAnalysis(
  id: string,
  analysis: { mood: string; moodScore: number; energyLevel: number; tags: string[] }
): void {
  const entries = getEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return;
  entries[idx] = {
    ...entries[idx],
    mood: analysis.mood,
    moodScore: analysis.moodScore,
    energyLevel: analysis.energyLevel,
    tags: analysis.tags,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function deleteEntry(id: string): void {
  const entries = getEntries().filter((e) => e.id !== id);
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  const reflections = getReflections(id);
  if (reflections.length > 0) {
    const allReflections = getAllReflections().filter((r) => r.entryId !== id);
    localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(allReflections));
  }
}

// --- Reflections ---

function getAllReflections(): Reflection[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(REFLECTIONS_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as Reflection[];
}

export function getReflections(entryId: string): Reflection[] {
  return getAllReflections().filter((r) => r.entryId === entryId);
}

export function addReflection(entryId: string, role: "user" | "assistant", content: string): Reflection {
  const reflections = getAllReflections();
  const reflection: Reflection = {
    id: generateId(),
    entryId,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
  reflections.push(reflection);
  localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(reflections));
  return reflection;
}

// --- Summaries ---

export function getSummaries(): WeeklySummary[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(SUMMARIES_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as WeeklySummary[];
}

export function saveSummary(summary: Omit<WeeklySummary, "id" | "createdAt">): WeeklySummary {
  const summaries = getSummaries();
  const newSummary: WeeklySummary = {
    ...summary,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  summaries.unshift(newSummary);
  localStorage.setItem(SUMMARIES_KEY, JSON.stringify(summaries));
  return newSummary;
}

// --- Helpers ---

export function getEntriesForWeek(weekStart: Date): JournalEntry[] {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return getEntries().filter((e) => {
    const d = new Date(e.createdAt);
    return d >= weekStart && d < weekEnd;
  });
}

export function getRecentEntries(limit: number = 5): JournalEntry[] {
  return getEntries().slice(0, limit);
}
