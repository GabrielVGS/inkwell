"use client";

import { useState, useEffect } from "react";

interface Suggestion {
  title: string;
  description: string;
}

interface WritingSuggestionsProps {
  onSelect: (title: string) => void;
}

export function WritingSuggestions({ onSelect }: WritingSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/writing-suggestions")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSuggestions(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border/40 bg-card/20 px-4 py-3 animate-pulse"
          >
            <div className="h-4 w-2/3 bg-muted-foreground/10 rounded mb-2" />
            <div className="h-3 w-full bg-muted-foreground/10 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground/60">
        Sugestoes para hoje
      </p>
      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => onSelect(s.title)}
          className="w-full text-left rounded-lg border border-border/40 bg-card/20 px-4 py-3 hover:bg-card/50 hover:border-border/60 transition-all group"
        >
          <p className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
            {s.title}
          </p>
          <p className="text-xs text-muted-foreground/50 mt-0.5">{s.description}</p>
        </button>
      ))}
    </div>
  );
}
