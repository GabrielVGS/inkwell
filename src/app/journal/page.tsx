"use client";

import { useState, useEffect, useCallback } from "react";
import { EntryEditor } from "@/components/journal/entry-editor";
import { EntryList } from "@/components/journal/entry-list";
import { ReflectionChat } from "@/components/journal/reflection-chat";
import type { JournalEntry, MoodAnalysis } from "@/types";

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    const res = await fetch("/api/entries");
    const data = await res.json();
    setEntries(data);
    setLoading(false);
  }, []);

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

  const previousEntries = selectedEntry
    ? entries.slice(0, 5).filter((e) => e.id !== selectedEntry.id)
    : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar: entry list */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Entradas recentes</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <EntryList
                entries={entries}
                selectedId={selectedEntry?.id}
                onSelect={setSelectedEntry}
              />
            )}
          </div>

          {/* Main: editor */}
          <div className="lg:col-span-5 order-1 lg:order-2 space-y-6">
            <EntryEditor onSave={handleSave} />

            {selectedEntry && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Entrada selecionada
                </h3>
                <div className="rounded-lg border p-4 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedEntry.content}
                </div>
              </div>
            )}
          </div>

          {/* Right: reflection chat */}
          <div className="lg:col-span-4 order-3">
            {selectedEntry ? (
              <ReflectionChat
                key={selectedEntry.id}
                entry={selectedEntry}
                previousEntries={previousEntries}
              />
            ) : (
              <div className="flex items-center justify-center h-[500px] border rounded-lg">
                <p className="text-sm text-muted-foreground text-center px-8">
                  Escreva uma entrada e salve para iniciar a reflexao com IA
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
