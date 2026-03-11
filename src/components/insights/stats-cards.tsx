"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { JournalEntry } from "@/types";

interface StatsCardsProps {
  entries: JournalEntry[];
}

export function StatsCards({ entries }: StatsCardsProps) {
  const stats = useMemo(() => {
    const withMood = entries.filter((e) => e.moodScore !== null);
    const avgMood = withMood.length > 0
      ? withMood.reduce((sum, e) => sum + (e.moodScore ?? 0), 0) / withMood.length
      : null;

    const avgEnergy = withMood.length > 0
      ? withMood.reduce((sum, e) => sum + (e.energyLevel ?? 0), 0) / withMood.length
      : null;

    // Streak: consecutive days with entries
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sortedDates = [...new Set(
      entries.map((e) => {
        const d = new Date(e.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    )].sort((a, b) => b - a);

    for (let i = 0; i < sortedDates.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      if (sortedDates[i] === expected.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    // Most common mood
    const moodCounts: Record<string, number> = {};
    for (const e of entries) {
      if (e.mood) moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    }
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      totalEntries: entries.length,
      avgMood,
      avgEnergy,
      streak,
      topMood: topMood?.[0] ?? "-",
    };
  }, [entries]);

  const moodLabel = (score: number | null) => {
    if (score === null) return "-";
    if (score >= 0.5) return "Otimo";
    if (score >= 0.1) return "Bom";
    if (score >= -0.1) return "Neutro";
    if (score >= -0.5) return "Baixo";
    return "Dificil";
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Entradas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.totalEntries}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Humor medio</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{moodLabel(stats.avgMood)}</p>
          {stats.avgMood !== null && (
            <p className="text-xs text-muted-foreground">{stats.avgMood.toFixed(2)}</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Sequencia</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.streak} dias</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Humor frequente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold capitalize">{stats.topMood}</p>
        </CardContent>
      </Card>
    </div>
  );
}
