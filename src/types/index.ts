export interface JournalEntry {
  id: string;
  content: string;
  mood: string | null;
  moodScore: number | null;
  energyLevel: number | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Reflection {
  id: string;
  entryId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface WeeklySummary {
  id: string;
  periodStart: string;
  periodEnd: string;
  content: string;
  themes: string[];
  moodTrend: {
    avgScore: number;
    trend: "improving" | "declining" | "stable";
  };
  createdAt: string;
}

export interface MoodAnalysis {
  mood: string;
  moodScore: number;
  energyLevel: number;
  tags: string[];
}
