"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    return null;
  }

  const maxCount = tagCounts[0]?.[1] ?? 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Temas frequentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {tagCounts.map(([tag, count]) => {
            const intensity = Math.max(0.4, count / maxCount);
            return (
              <Badge
                key={tag}
                variant="secondary"
                className="text-sm"
                style={{ opacity: intensity, fontSize: `${0.75 + intensity * 0.5}rem` }}
              >
                {tag} <span className="ml-1 opacity-60">({count})</span>
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
