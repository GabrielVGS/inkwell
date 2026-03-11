"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { JournalEntry } from "@/types";

interface EntryListProps {
  entries: JournalEntry[];
  selectedId?: string;
  onSelect: (entry: JournalEntry) => void;
}

function moodColor(score: number | null): string {
  if (score === null) return "bg-gray-200";
  if (score >= 0.5) return "bg-emerald-400";
  if (score >= 0.1) return "bg-emerald-200";
  if (score >= -0.1) return "bg-yellow-200";
  if (score >= -0.5) return "bg-orange-300";
  return "bg-red-400";
}

export function EntryList({ entries, selectedId, onSelect }: EntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">Nenhuma entrada ainda</p>
        <p className="text-sm mt-1">Comece escrevendo sobre seu dia</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const date = new Date(entry.createdAt);
        const isSelected = entry.id === selectedId;

        return (
          <Card
            key={entry.id}
            className={`cursor-pointer transition-colors hover:bg-accent/50 ${
              isSelected ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => onSelect(entry)}
          >
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {date.toLocaleDateString("pt-BR", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${moodColor(entry.moodScore)}`} />
                  {entry.mood && (
                    <Badge variant="secondary" className="text-xs">
                      {entry.mood}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {entry.content}
              </p>
              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {entry.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
