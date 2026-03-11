"use client";

import { useState, useEffect, useCallback } from "react";

import type { JournalEntry, MoodAnalysis } from "@/types";

import { EntryEditor } from "@/components/journal/entry-editor";
import { EntryList } from "@/components/journal/entry-list";
import { ReflectionChat } from "@/components/journal/reflection-chat";
import { WritingSuggestions } from "@/components/journal/writing-suggestions";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/entries");
      if (!res.ok) throw new Error(`Failed to fetch entries: ${res.status}`);
      const data = await res.json();
      setEntries(data.entries);
      setNextCursor(data.nextCursor);
      setError(false);
    } catch (err) {
      console.error("fetchEntries error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor) return;
    try {
      const res = await fetch(`/api/entries?cursor=${encodeURIComponent(nextCursor)}`);
      if (!res.ok) throw new Error(`Failed to load more entries: ${res.status}`);
      const data = await res.json();
      setEntries((prev) => [...prev, ...data.entries]);
      setNextCursor(data.nextCursor);
    } catch (err) {
      console.error("loadMore error:", err);
      setError(true);
    }
  }, [nextCursor]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleSave = useCallback(async (content: string, analysis: MoodAnalysis) => {
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, analysis }),
    });
    const entry: JournalEntry = await res.json();
    setEntries((prev) => [entry, ...prev]);
    setSelectedEntry(entry);
  }, []);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-8 animate-fade-up">
          <h1 className="font-display text-2xl italic tracking-tight">Diario</h1>
          <div className="rule mt-3" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar: entry list */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground/70 mb-4">
              Entradas recentes
            </p>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-lg bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : (
              <EntryList
                entries={entries}
                selectedId={selectedEntry?.id}
                onSelect={setSelectedEntry}
                onLoadMore={nextCursor ? loadMore : undefined}
              />
            )}
          </div>

          {/* Main: editor */}
          <div className="lg:col-span-5 order-1 lg:order-2 space-y-6">
            <ErrorBoundary>
              <EntryEditor onSave={handleSave} />
            </ErrorBoundary>

            {selectedEntry && (
              <div className="space-y-3 animate-fade-up">
                <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground/70">
                  Entrada selecionada
                </p>
                <div className="rounded-lg border border-border/60 p-5 text-sm leading-relaxed whitespace-pre-wrap bg-card/50">
                  {selectedEntry.content}
                </div>
              </div>
            )}
          </div>

          {/* Right: reflection chat */}
          <div className="lg:col-span-4 order-3">
            {selectedEntry ? (
              <ErrorBoundary>
                <ReflectionChat key={selectedEntry.id} entry={selectedEntry} />
              </ErrorBoundary>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center h-[200px] border border-dashed border-border/40 rounded-lg">
                  <div className="text-center px-8 space-y-3">
                    <div className="mx-auto w-8 h-px bg-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground italic">
                      Escreva uma entrada e salve para iniciar a reflexao com IA
                    </p>
                    <div className="mx-auto w-8 h-px bg-muted-foreground/20" />
                  </div>
                </div>
                <WritingSuggestions onSelect={() => {}} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
