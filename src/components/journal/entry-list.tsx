"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { JournalEntry } from "@/types";

interface EntryListProps {
  entries: JournalEntry[];
  selectedId?: string;
  onSelect: (entry: JournalEntry) => void;
}

function moodColor(score: number | null): string {
  if (score === null) return "bg-muted-foreground/20";
  if (score >= 0.5) return "bg-emerald-500/70";
  if (score >= 0.1) return "bg-emerald-400/50";
  if (score >= -0.1) return "bg-amber-400/50";
  if (score >= -0.5) return "bg-orange-400/60";
  return "bg-red-400/60";
}

function moodWidth(score: number | null): string {
  if (score === null) return "w-0";
  const normalized = (score + 1) / 2; // 0 to 1
  if (normalized >= 0.8) return "w-full";
  if (normalized >= 0.6) return "w-4/5";
  if (normalized >= 0.4) return "w-3/5";
  if (normalized >= 0.2) return "w-2/5";
  return "w-1/5";
}

export function EntryList({ entries, selectedId, onSelect }: EntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm italic text-muted-foreground/60">
          Nenhuma entrada ainda
        </p>
        <p className="text-xs text-muted-foreground/40 mt-1">
          Comece escrevendo sobre seu dia
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 stagger-children">
      {entries.map((entry) => {
        const date = new Date(entry.createdAt);
        const isSelected = entry.id === selectedId;

        return (
          <button
            key={entry.id}
            type="button"
            className={cn(
              "w-full text-left rounded-lg p-3.5 transition-all duration-200",
              "hover:bg-accent/60",
              isSelected
                ? "bg-accent/80 shadow-sm"
                : "bg-transparent"
            )}
            onClick={() => onSelect(entry)}
          >
            {/* Date + mood */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground/60">
                {date.toLocaleDateString("pt-BR", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </span>
              {entry.mood && (
                <span className="text-[11px] text-muted-foreground/70">
                  {entry.mood}
                </span>
              )}
            </div>

            {/* Content preview */}
            <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed mb-2.5">
              {entry.content}
            </p>

            {/* Mood bar */}
            <div className="w-full h-[3px] rounded-full bg-muted/60 overflow-hidden">
              <div
                className={cn(
                  "mood-bar",
                  moodColor(entry.moodScore),
                  moodWidth(entry.moodScore)
                )}
              />
            </div>

            {/* Tags */}
            {entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2.5">
                {entry.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] text-muted-foreground/50 tracking-wide"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
