"use client";

import { useMemo } from "react";
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

    const moodCounts: Record<string, number> = {};
    for (const e of entries) {
      if (e.mood) moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    }
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      totalEntries: entries.length,
      avgMood,
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

  const items = [
    { label: "Entradas", value: String(stats.totalEntries), sub: null },
    {
      label: "Humor medio",
      value: moodLabel(stats.avgMood),
      sub: stats.avgMood !== null ? stats.avgMood.toFixed(2) : null,
    },
    { label: "Sequencia", value: `${stats.streak}`, sub: "dias" },
    { label: "Humor frequente", value: stats.topMood, sub: null },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-border/60 bg-card/30 px-4 py-4"
        >
          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground/60 mb-2">
            {item.label}
          </p>
          <p className="font-display text-2xl tracking-tight capitalize">
            {item.value}
          </p>
          {item.sub && (
            <p className="text-[11px] text-muted-foreground/50 mt-0.5">{item.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
