"use client";

import { useState, useEffect } from "react";

interface MoodTrend {
  avgScore: number;
  trend: "improving" | "declining" | "stable";
  recentMoods: { mood: string; moodScore: number; date: string }[];
}

export function MoodTrendCard() {
  const [trend, setTrend] = useState<MoodTrend | null>(null);

  useEffect(() => {
    fetch("/api/mood-trends?days=14")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch mood trends: ${res.status}`);
        return res.json();
      })
      .then(setTrend)
      .catch((err) => {
        console.error("Failed to load mood trends:", err);
      });
  }, []);

  if (!trend || trend.recentMoods.length < 3) return null;

  const trendLabel = {
    improving: "Melhorando",
    declining: "Em declinio",
    stable: "Estavel",
  }[trend.trend];

  const trendColor = {
    improving: "text-green-600 dark:text-green-400",
    declining: "text-red-500 dark:text-red-400",
    stable: "text-muted-foreground",
  }[trend.trend];

  const trendIcon = {
    improving: "↑",
    declining: "↓",
    stable: "→",
  }[trend.trend];

  return (
    <div className="rounded-lg border border-border/60 bg-card/30 px-5 py-4 animate-fade-up">
      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground/60 mb-3">
        Tendencia emocional (14 dias)
      </p>
      <div className="flex items-center gap-3 mb-3">
        <span className={`font-display text-xl ${trendColor}`}>
          {trendIcon} {trendLabel}
        </span>
        <span className="text-xs text-muted-foreground/50">
          Media: {trend.avgScore.toFixed(2)}
        </span>
      </div>
      <div className="flex items-end gap-[3px] h-10">
        {trend.recentMoods.map((m, i) => {
          const height = Math.max(10, ((m.moodScore + 1) / 2) * 100);
          const color = m.moodScore >= 0.3
            ? "bg-green-500/60"
            : m.moodScore >= -0.1
              ? "bg-yellow-500/50"
              : "bg-red-500/50";
          return (
            <div
              key={i}
              className={`flex-1 rounded-sm ${color} transition-all`}
              style={{ height: `${height}%` }}
              title={`${new Date(m.date).toLocaleDateString("pt-BR")}: ${m.mood} (${m.moodScore.toFixed(1)})`}
            />
          );
        })}
      </div>
    </div>
  );
}
