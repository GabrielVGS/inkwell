"use client";

import { useMemo } from "react";
import type { JournalEntry } from "@/types";

interface TagCloudProps {
  entries: JournalEntry[];
}

export function TagCloud({ entries }: TagCloudProps) {
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of entries) {
      for (const tag of entry.tags) {
        counts[tag] = (counts[tag] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
  }, [entries]);

  if (tagCounts.length === 0) {
    return (
      <div className="rounded-lg border border-border/60 bg-card/30 overflow-hidden animate-fade-up">
        <div className="px-5 py-4 border-b border-border/40">
          <p className="font-display text-base italic">Temas frequentes</p>
        </div>
        <div className="px-5 py-12 text-center">
          <p className="text-sm italic text-muted-foreground/50">
            Temas aparecerao conforme voce escreve
          </p>
        </div>
      </div>
    );
  }

  const maxCount = tagCounts[0]?.[1] ?? 1;

  return (
    <div className="rounded-lg border border-border/60 bg-card/30 overflow-hidden animate-fade-up">
      <div className="px-5 py-4 border-b border-border/40">
        <p className="font-display text-base italic">Temas frequentes</p>
      </div>
      <div className="px-5 py-5">
        <div className="flex flex-wrap gap-x-3 gap-y-2.5">
          {tagCounts.map(([tag, count]) => {
            const intensity = Math.max(0.35, count / maxCount);
            const size = 0.75 + intensity * 0.35;
            return (
              <span
                key={tag}
                className="inline-flex items-baseline gap-1 transition-opacity hover:opacity-100"
                style={{ opacity: intensity }}
              >
                <span
                  className="text-foreground/80"
                  style={{ fontSize: `${size}rem` }}
                >
                  {tag}
                </span>
                <span className="text-[10px] text-muted-foreground/40 tabular-nums">
                  {count}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
